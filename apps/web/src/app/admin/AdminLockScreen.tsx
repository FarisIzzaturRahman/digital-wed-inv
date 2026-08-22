"use client";

import React, { useState } from "react";
import { verifyAdmin2FA } from "./actions";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export function AdminLockScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode keamanan.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyAdmin2FA(code);
    setLoading(false);

    if (res && res.error) {
      setError(res.error);
    } else {
      // Refresh current page
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-[#ECE7DF] shadow-xl max-w-md w-full space-y-6 text-center">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 bg-[#E8F0EA] text-[#6B8F71] rounded-2xl flex items-center justify-center">
          <ShieldCheck size={32} />
        </div>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-serif text-[#2E3A35]">Verifikasi Keamanan Admin</h1>
          <p className="text-xs text-slate-500">
            Konsol Superadmin dilindungi dengan Otentikasi Dua Faktor (2FA) wajib.
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#ECE7DF] text-left space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#6B8F71] block">Authenticator App</span>
          <p className="text-[10px] text-slate-600 leading-normal">
            Masukkan kode 6 digit yang sedang aktif pada aplikasi autentikator administrator.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Kode Keamanan 2FA</label>
            <input 
              type="text"
              maxLength={6}
              pattern="\d{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="0 0 0 0 0 0"
              className="w-full tracking-[0.75em] text-center font-mono font-bold text-lg border border-[#ECE7DF] p-3 rounded-xl focus:outline-none focus:border-[#6B8F71] bg-[#FAF7F2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Memverifikasi...
              </>
            ) : (
              "Verifikasi & Masuk Konsol"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
