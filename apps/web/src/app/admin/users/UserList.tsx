"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserSuspension, changeUserPlan, impersonateUserAction } from "../actions";
import { 
  Search, ShieldAlert, UserCheck, Settings, ExternalLink, AlertCircle, CheckCircle
} from "lucide-react";

export function UserList({
  usersData,
  plansData
}: {
  usersData: any[];
  plansData: any[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // States for Plan Override Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState("");
  const [overridePlanId, setOverridePlanId] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter users
  const filteredUsers = usersData.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSuspend = async (userId: string, isCurrentlySuspended: boolean) => {
    const actionText = isCurrentlySuspended ? "mengaktifkan kembali" : "menangguhkan (suspend)";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} user ini?`)) return;

    setLoading(true);
    const res = await toggleUserSuspension(userId, !isCurrentlySuspended);
    setLoading(false);

    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ 
        type: "success", 
        text: `Status user berhasil diubah menjadi ${!isCurrentlySuspended ? "DITANGGUHKAN" : "AKTIF"}.` 
      });
      router.refresh();
    }
  };

  const handleOpenPlanOverride = (tenantId: string, tenantName: string, currentPlanId: string) => {
    setSelectedTenantId(tenantId);
    setSelectedTenantName(tenantName);
    setOverridePlanId(currentPlanId || plansData[0]?.id || "");
    setShowPlanModal(true);
  };

  const handleSavePlanOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !overridePlanId) return;

    setLoading(true);
    const res = await changeUserPlan(selectedTenantId, overridePlanId);
    setLoading(false);

    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ 
        type: "success", 
        text: `Paket subscription untuk "${selectedTenantName}" berhasil diubah.` 
      });
      setShowPlanModal(false);
      router.refresh();
    }
  };

  const handleImpersonate = async (userId: string, email: string) => {
    if (!confirm(`Impersonate akun: ${email}?\n\nSesi admin Anda akan digantikan dengan sesi akun user tersebut.`)) return;

    setLoading(true);
    const res = await impersonateUserAction(userId);
    setLoading(false);

    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Impersonasi berhasil. Mengarahkan..." });
      // Redirect to tenant dashboard
      window.location.href = "/dashboard";
    }
  };

  const getUserActivePlan = (u: any) => {
    const tenant = u.tenants?.[0];
    if (!tenant) return { name: "No Tenant", id: "" };
    
    const activeSub = tenant.subscriptions?.find((s: any) => s.status === "active");
    if (activeSub && activeSub.plan) {
      return {
        name: activeSub.plan.name,
        id: activeSub.plan.id,
        expiresAt: activeSub.expiresAt
      };
    }
    
    return { name: "Free Trial", id: "" };
  };

  return (
    <div className="space-y-6">
      {/* Search and message */}
      {message && (
        <div className={`p-4 rounded-2xl flex justify-between items-center border text-xs font-semibold ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Top Filter and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-[#ECE7DF] shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari pengguna berdasarkan nama/email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-[#6B8F71]"
          />
        </div>
        
        <div className="text-xs text-slate-550">
          Menampilkan <span className="font-bold text-[#2E3A35]">{filteredUsers.length}</span> dari {usersData.length} Pengguna
        </div>
      </div>

      {/* User Datatable */}
      <div className="bg-white rounded-2xl border border-[#ECE7DF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#2E3A35] font-bold border-b border-[#ECE7DF]">
                <th className="p-4">Nama Pengguna</th>
                <th className="p-4">Email</th>
                <th className="p-4">Paket SaaS</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center italic text-slate-450">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuspended = u.role === "suspended";
                  const plan = getUserActivePlan(u);
                  const tenant = u.tenants?.[0];
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <span className="text-[9px] text-slate-400 font-mono block">ID: {u.id}</span>
                      </td>
                      <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          plan.name.includes("Premium") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          plan.name.includes("Starter") ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          plan.name.includes("Business") ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {plan.name}
                        </span>
                        {plan.expiresAt && (
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Exp: {new Date(plan.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                          isSuspended 
                            ? "bg-red-50 text-red-700 border border-red-200" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {isSuspended ? "Suspended" : "Aktif"}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2 items-center">
                        {/* Impersonate */}
                        <button
                          onClick={() => handleImpersonate(u.id, u.email)}
                          disabled={loading || isSuspended}
                          title="Impersonate Akun"
                          className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40"
                        >
                          <ExternalLink size={13} />
                          <span className="text-[10px] font-bold">Masuk</span>
                        </button>

                        {/* Change Plan Manual */}
                        <button
                          onClick={() => handleOpenPlanOverride(tenant?.id, tenant?.name, plan.id)}
                          disabled={loading || !tenant}
                          title="Ubah Paket Subscription"
                          className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40"
                        >
                          <Settings size={13} />
                          <span className="text-[10px] font-bold">Paket</span>
                        </button>

                        {/* Toggle Suspend */}
                        <button
                          onClick={() => handleToggleSuspend(u.id, isSuspended)}
                          disabled={loading}
                          title={isSuspended ? "Aktifkan Akun" : "Suspend Akun"}
                          className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                            isSuspended 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                              : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {isSuspended ? <UserCheck size={13} /> : <ShieldAlert size={13} />}
                          <span className="text-[10px] font-bold">{isSuspended ? "Aktifkan" : "Suspend"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl relative">
            <button 
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>
            <h3 className="text-base font-bold font-serif text-[#2E3A35] mb-2">
              Ubah Paket Secara Manual
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 leading-normal">
              Override paket aktif untuk tenant **{selectedTenantName}**. Perubahan ini akan segera memperbarui akses fitur di dashboard mereka.
            </p>

            <form onSubmit={handleSavePlanOverride} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Pilih Paket Lisensi</label>
                <select
                  required
                  value={overridePlanId}
                  onChange={(e) => setOverridePlanId(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-[#6B8F71]"
                >
                  <option value="">-- Pilih Paket --</option>
                  {plansData.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Rp {p.price.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan Paket"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
