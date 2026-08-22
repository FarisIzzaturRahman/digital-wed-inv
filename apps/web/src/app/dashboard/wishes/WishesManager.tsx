"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleWishApprovalAction, deleteWishAction } from "./actions";
import { 
  CheckCircle, Trash2, Heart, Check, EyeOff, AlertCircle
} from "lucide-react";

export function WishesManager({
  wishes
}: {
  wishes: any[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "approved" | "hidden">("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleToggleApproval = async (wishId: string, currentStatus: boolean) => {
    if (actionLoadingId) return; // Prevent double-click
    setActionLoadingId(wishId);
    const res = await toggleWishApprovalAction(wishId);
    setActionLoadingId(null);
    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ 
        type: "success", 
        text: `Status ucapan berhasil ${!currentStatus ? "ditampilkan" : "disembunyikan"}.` 
      });
      router.refresh();
    }
  };

  const handleDelete = async (wishId: string, name: string) => {
    if (actionLoadingId) return; // Prevent double-click
    if (!confirm(`Hapus permanen ucapan dari "${name}"?`)) return;
    setActionLoadingId(wishId + "-del");
    const res = await deleteWishAction(wishId);
    setActionLoadingId(null);
    if (res && res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Ucapan dari "${name}" berhasil dihapus.` });
      router.refresh();
    }
  };

  // Filtered list
  const filteredWishes = wishes.filter((w) => {
    if (filter === "approved") return w.isApproved;
    if (filter === "hidden") return !w.isApproved;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Alert Banner */}
      {message && (
        <div className={`p-4 rounded-2xl flex justify-between items-center border text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Semua ({wishes.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === "approved" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Ditampilkan ({wishes.filter(w => w.isApproved).length})
          </button>
          <button
            onClick={() => setFilter("hidden")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === "hidden" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Disembunyikan ({wishes.filter(w => !w.isApproved).length})
          </button>
        </div>
      </div>

      {/* Wishes List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWishes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center italic text-slate-400 sm:col-span-2 lg:col-span-3">
            Belum ada ucapan dalam kategori ini.
          </div>
        ) : (
          filteredWishes.map((w) => (
            <div 
              key={w.id} 
              className={`bg-white p-6 rounded-2xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                !w.isApproved ? "border-red-200 bg-red-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{w.name}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(w.createdAt).toLocaleDateString("id-ID", { 
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    <Heart size={10} className="text-pink-600 fill-current" />
                    <span>{w.likes}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed font-sans">{w.message}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                {/* Moderation Status */}
                <span className={`font-bold text-[9px] uppercase px-2 py-0.5 rounded-full ${
                  w.isApproved ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {w.isApproved ? "Ditampilkan" : "Disembunyikan"}
                </span>

                {/* Controls */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleApproval(w.id, w.isApproved)}
                    disabled={!!actionLoadingId}
                    title={w.isApproved ? "Sembunyikan ucapan" : "Tampilkan ucapan"}
                    className={`p-1.5 border rounded-lg transition disabled:opacity-50 ${
                      w.isApproved 
                        ? "text-red-600 border-red-200 hover:bg-red-50" 
                        : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {actionLoadingId === w.id ? <span className="block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (w.isApproved ? <EyeOff size={14} /> : <Check size={14} />)}
                  </button>
                  <button
                    onClick={() => handleDelete(w.id, w.name)}
                    disabled={!!actionLoadingId}
                    title="Hapus permanen"
                    className="p-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {actionLoadingId === w.id + "-del" ? <span className="block w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
