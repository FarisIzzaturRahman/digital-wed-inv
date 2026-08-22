import { db } from "db";
import { subscriptions } from "db";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { normalizeTemplateId } from "shared";

export interface PlanFeatures {
  guestLimit: number;
  eventLimit: number;
  templates: string[];
  hasMusic: boolean;
  hasEnvelopes: boolean;
  hasStories: boolean;
  watermark: boolean;
  isMultiInvitation?: boolean;
}

export interface PlanInfo {
  name: string;
  price: number;
  features: PlanFeatures;
  status: string;
  expiresAt: Date | null;
}

const DEFAULT_FREE_FEATURES: PlanFeatures = {
  guestLimit: 50,
  eventLimit: 1,
  templates: ["classic-gold"],
  hasMusic: false,
  hasEnvelopes: false,
  hasStories: false,
  watermark: true
};

export async function getTenantPlan(tenantId: string): Promise<PlanInfo> {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, "active"),
        or(
          isNull(subscriptions.expiresAt),
          gt(subscriptions.expiresAt, new Date())
        )
      ),
      with: {
        plan: true
      }
    });

    if (sub && sub.plan) {
      const configuredFeatures = (sub.plan.features || {}) as Partial<PlanFeatures>;
      return {
        name: sub.plan.name,
        price: sub.plan.price,
        features: {
          ...DEFAULT_FREE_FEATURES,
          ...configuredFeatures,
          templates: (configuredFeatures.templates || DEFAULT_FREE_FEATURES.templates)
            .map(normalizeTemplateId),
        },
        status: sub.status,
        expiresAt: sub.expiresAt
      };
    }
  } catch (error) {
    console.error("Error fetching tenant plan:", error);
  }

  // Fallback to Free Trial
  return {
    name: "Free Trial",
    price: 0,
    features: DEFAULT_FREE_FEATURES,
    status: "active",
    expiresAt: null
  };
}
