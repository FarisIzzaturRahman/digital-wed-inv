import React from "react";
import { db } from "db";
import { auditLogs } from "db";
import { desc } from "drizzle-orm";
import { User, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    with: {
      user: true
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-[#2E3A35]">Audit System Logs</h1>
        <p className="text-xs text-slate-550">
          Daftar aktivitas sensitif administratif dan keamanan yang dilakukan oleh superadmin dan sistem.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#ECE7DF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#2E3A35] font-bold border-b border-[#ECE7DF]">
                <th className="p-4 w-44">Waktu</th>
                <th className="p-4 w-36">Aksi Keamanan</th>
                <th className="p-4 w-48">Diperbuat Oleh</th>
                <th className="p-4">Detail Perubahan / Rincian</th>
                <th className="p-4 w-36 text-right">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center italic text-slate-450">Belum ada aktivitas terekam.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-[#E8F0EA] text-[#2E3A35] border border-[#6B8F71]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        <span>{log.user?.email || "System"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 leading-normal font-sans">
                      {log.details}
                    </td>
                    <td className="p-4 text-right text-slate-500">
                      <div className="flex items-center gap-1 justify-end">
                        <Globe size={11} className="text-slate-450" />
                        <span>{log.ipAddress || "—"}</span>
                      </div>
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
