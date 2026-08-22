import React from "react";
import { db } from "db";
import { plans } from "db";
import { asc } from "drizzle-orm";
import { PlanEditor } from "./PlanEditor";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plansList = await db.query.plans.findMany({
    orderBy: [asc(plans.price)],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-[#2E3A35]">Konfigurasi Paket & Pricing</h1>
        <p className="text-xs text-slate-550">
          Kelola harga paket produk undangan digital Anda secara dinamis. Perubahan harga akan langsung tercermin pada halaman upgrade produk.
        </p>
      </div>

      <PlanEditor plansData={plansList} />
    </div>
  );
}
