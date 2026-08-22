"use client";

import React, { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { unlockInvitationAction } from "./actions";

export function InvitationAccessGate({ invitationId }: { invitationId: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await unlockInvitationAction(invitationId, pin);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-6 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-lg text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <LockKeyhole size={24} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-serif font-bold text-slate-900">Undangan Privat</h1>
          <p className="text-xs text-slate-500">
            Masukkan PIN 6 digit yang diberikan oleh pemilik undangan.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center tracking-[0.6em] font-mono focus:outline-none focus:border-slate-900"
            aria-label="PIN undangan"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full rounded-xl bg-slate-900 text-white py-3 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Buka Undangan
          </button>
        </form>
      </div>
    </main>
  );
}
