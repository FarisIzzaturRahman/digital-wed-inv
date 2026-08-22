"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePlanPrice } from "../actions";
import { Edit3, CheckCircle, AlertCircle } from "lucide-react";

export function PlanEditor({
  plansData
}: {
  plansData: any[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(plansData);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartEdit = (planId: string, currentPrice: number) => {
    setEditingPlanId(planId);
    setTempPrice(currentPrice);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
  };

  const handleSavePrice = async (planId: string) => {
    if (tempPrice < 0) return;
    setLoading(true);
    const res = await updatePlanPrice(planId, tempPrice);
    setLoading(false);

    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Harga paket berhasil diperbarui!" });
      setPlans(plans.map((p) => p.id === planId ? { ...p, price: tempPrice } : p));
      setEditingPlanId(null);
      router.refresh();
    }
  };

  const renderFeaturesList = (features: any) => {
    if (!features) return null;
    return (
      <ul className="space-y-1.5 text-[10px] text-slate-650 mt-4 border-t border-[#ECE7DF] pt-3 text-left">
        <li className="flex justify-between">
          <span className="text-slate-450">Batas Tamu:</span>
          <span className="font-semibold text-slate-800">
            {features.guestLimit >= 1000000 ? "Tanpa Batas" : `${features.guestLimit} Tamu`}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-450">Batas Acara:</span>
          <span className="font-semibold text-slate-800">{features.eventLimit} Acara</span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-450">Backsound Music:</span>
          <span className="font-semibold text-slate-800">{features.hasMusic ? "Tersedia" : "Tidak"}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-450">Kado / Amplop Online:</span>
          <span className="font-semibold text-slate-800">{features.hasEnvelopes ? "Tersedia" : "Tidak"}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-450">Watermark:</span>
          <span className="font-semibold text-slate-800">{features.watermark ? "Aktif" : "Bebas Watermark"}</span>
        </li>
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Alert */}
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

      {/* Plans Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isEditing = editingPlanId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-3xl border border-[#ECE7DF] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold tracking-widest text-[#6B8F71] uppercase">PAkET</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase ${
                    p.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-serif text-[#2E3A35]">{p.name}</h3>

                {/* Price section */}
                <div className="py-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">Rp</span>
                        <input 
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(Number(e.target.value))}
                          className="w-full border border-slate-200 px-2 py-1 rounded-lg text-xs bg-slate-50 font-bold focus:outline-none focus:border-[#6B8F71]"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSavePrice(p.id)}
                          disabled={loading}
                          className="px-2 py-1 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded text-[9px] transition"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 border border-slate-200 text-slate-500 rounded text-[9px] hover:bg-slate-50 transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl font-black text-[#2E3A35]">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[9px] text-slate-400 block">sekali bayar</span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(p.id, p.price)}
                        title="Edit Harga Paket"
                        className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {renderFeaturesList(p.features)}
              </div>

              <div className="pt-4 mt-4 border-t border-[#FAF7F2] text-[9px] text-slate-400 font-mono">
                Terakhir diupdate: {new Date(p.updatedAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
