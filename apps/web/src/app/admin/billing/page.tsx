import React from "react";
import { db } from "db";
import { subscriptionInvoices } from "db";
import { desc } from "drizzle-orm";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  // Query all invoices
  const invoices = await db.query.subscriptionInvoices.findMany({
    orderBy: [desc(subscriptionInvoices.createdAt)],
    with: {
      tenant: true,
      subscription: {
        with: {
          plan: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-[#2E3A35]">Billing & Invoices</h1>
        <p className="text-xs text-slate-550">
          Riwayat transaksi subscription SaaS dan status verifikasi dari simulated payment gateway.
        </p>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white rounded-2xl border border-[#ECE7DF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#2E3A35] font-bold border-b border-[#ECE7DF]">
                <th className="p-4">Tanggal Transaksi</th>
                <th className="p-4">Tenant / Pemilik</th>
                <th className="p-4">Paket Dipilih</th>
                <th className="p-4">Jumlah Pembayaran</th>
                <th className="p-4">Ref Gateway</th>
                <th className="p-4 text-right">Status Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center italic text-slate-450">Belum ada transaksi terekam.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(inv.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{inv.tenant?.name || "No Tenant"}</div>
                      <span className="text-[9px] text-slate-400 font-mono block">Tenant ID: {inv.tenantId}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-700">
                        {inv.subscription?.plan?.name || "Free Trial"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      Rp {inv.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{inv.gatewayRef || "—"}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        inv.status === "failed" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {inv.status === "paid" ? (
                          <>
                            <CheckCircle2 size={10} />
                            Lunas
                          </>
                        ) : inv.status === "failed" ? (
                          <>
                            <XCircle size={10} />
                            Gagal
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
