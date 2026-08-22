import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "db";
import { plans } from "db";
import { eq } from "drizzle-orm";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logout");
  }

  // Resolve searchParams safely for Next.js 14/15 compatibility
  const resolvedParams = await searchParams;
  const planId = resolvedParams?.planId;

  if (!planId) {
    redirect("/dashboard/upgrade");
  }

  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, planId),
  });

  if (!plan || !plan.isActive || plan.price <= 0) {
    redirect("/dashboard/upgrade");
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-16 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-serif text-[#2E3A35]">
            Checkout Upgrade Layanan
          </h1>
          <p className="text-xs text-slate-550 max-w-md mx-auto">
            Selesaikan transaksi Anda melalui payment gateway simulasi untuk mengaktifkan fitur premium secara instan.
          </p>
        </div>

        <CheckoutForm plan={plan} />
      </div>
    </div>
  );
}
