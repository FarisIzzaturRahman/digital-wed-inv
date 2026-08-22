"use server";

import { db, subscriptions, subscriptionInvoices, tenants, plans, auditLogs } from "db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function processMockSubscription(planId: string, status: "paid" | "failed") {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PAYMENT_SIMULATION_ENABLED !== "true"
  ) {
    return { error: "Payment gateway simulasi tidak tersedia." };
  }

  try {
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId)
    });

    if (!plan || !plan.isActive || plan.price <= 0) {
      return { error: "Paket tidak tersedia untuk checkout." };
    }

    const gatewayRef = `gw_mock_${Math.floor(Math.random() * 1000000)}`;

    if (status === "paid") {
      // 1. Create or update subscription
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.tenantId, user.tenantId)
      });

      let subId = "";
      if (existingSub) {
        const extensionBase = Math.max(
          Date.now(),
          existingSub.expiresAt?.getTime() || 0
        );
        await db.update(subscriptions)
          .set({
            planId: plan.id,
            status: "active",
            expiresAt: new Date(extensionBase + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, existingSub.id));
        subId = existingSub.id;
      } else {
        const [newSub] = await db.insert(subscriptions).values({
          tenantId: user.tenantId,
          planId: plan.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).returning();
        subId = newSub.id;
      }

      // 2. Sync plan field in tenants table — use a robust slug-like normalization
      const cleanPlanName = plan.name
        .toLowerCase()
        .replace(/free trial/i, "free")
        .replace(/starter.*$/i, "starter")
        .replace(/premium.*$/i, "premium")
        .replace(/business.*$/i, "business")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      await db.update(tenants)
        .set({ plan: cleanPlanName })
        .where(eq(tenants.id, user.tenantId));

      // 3. Create paid invoice
      await db.insert(subscriptionInvoices).values({
        tenantId: user.tenantId,
        subscriptionId: subId,
        amount: plan.price,
        status: "paid",
        gatewayRef,
      });

      // 4. Record audit log
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "subscribe",
        details: `User subscribed to plan ${plan.name} (Amount: Rp ${plan.price}).`,
        ipAddress: "127.0.0.1",
      });

      revalidatePath("/dashboard");
      return { success: true };
    } else {
      // Failed payment
      await db.insert(subscriptionInvoices).values({
        tenantId: user.tenantId,
        amount: plan.price,
        status: "failed",
        gatewayRef,
      });

      await db.insert(auditLogs).values({
        userId: user.id,
        action: "subscribe_fail",
        details: `Failed subscription attempt to plan ${plan.name} (Amount: Rp ${plan.price}).`,
        ipAddress: "127.0.0.1",
      });

      return { error: "Pembayaran gagal diproses oleh payment gateway simulasi." };
    }
  } catch (error: any) {
    console.error("Subscription process error:", error);
    return { error: "Terjadi kesalahan internal saat memproses subscription." };
  }
}
