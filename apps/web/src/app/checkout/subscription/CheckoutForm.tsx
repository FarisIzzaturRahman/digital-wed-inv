"use client";

import React, { useState } from "react";
import { processMockSubscription } from "../actions";
import { CreditCard, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export function CheckoutForm({
  plan
}: {
  plan: any;
}) {
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "failed">("paid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await processMockSubscription(plan.id, paymentStatus);
    setLoading(false);

    if (res && res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[#ECE7DF] shadow-xl text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto w-16 h-16 bg-[#E8F0EA] text-[#6B8F71] rounded-2xl flex items-center justify-center">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold font-serif text-[#2E3A35]">Pembayaran Berhasil!</h2>
        <p className="text-xs text-slate-500">
          Akun Anda telah ditingkatkan ke paket **{plan.name}**. Anda akan dialihkan ke dashboard dalam beberapa detik...
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start max-w-4xl mx-auto">
      {/* Checkout details */}
      <div className="bg-white p-6 rounded-3xl border border-[#ECE7DF] shadow-sm space-y-4 text-left">
        <div>
          <span className="text-[9px] uppercase font-bold text-[#6B8F71]">Checkout Undangan</span>
          <h2 className="text-lg font-bold font-serif text-[#2E3A35]">{plan.name}</h2>
        </div>
        
        <div className="py-2 border-y border-[#ECE7DF] flex justify-between items-center text-xs">
          <span className="text-slate-500">Biaya Upgrade:</span>
          <span className="font-bold text-slate-800">Rp {plan.price.toLocaleString("id-ID")}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ringkasan Fitur</span>
          <ul className="text-[10px] text-slate-500 space-y-1">
            <li>• Tamu: {plan.features.guestLimit >= 1000000 ? "Tanpa Batas" : `${plan.features.guestLimit} Tamu`}</li>
            <li>• Acara: {plan.features.eventLimit} Acara</li>
            <li>• Backsound Musik: {plan.features.hasMusic ? "Aktif" : "Tidak"}</li>
            <li>• Kado Amplop Digital: {plan.features.hasEnvelopes ? "Aktif" : "Tidak"}</li>
          </ul>
        </div>

        <Link 
          href="/dashboard/upgrade"
          className="text-[10px] font-bold text-slate-500 hover:text-[#2E3A35] flex items-center gap-1 mt-4 transition"
        >
          <ArrowLeft size={12} />
          Kembali pilih paket
        </Link>
      </div>

      {/* Payment Gateway Sandbox Form */}
      <div className="bg-white p-8 rounded-3xl border border-[#ECE7DF] shadow-md md:col-span-2 space-y-6 text-left">
        <div className="flex justify-between items-center border-b border-[#ECE7DF] pb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#6B8F71]" />
            <h3 className="text-sm font-bold font-serif text-[#2E3A35]">Simulated Payment Gateway Sandbox</h3>
          </div>
          <span className="text-[8px] font-mono font-bold text-[#6B8F71] bg-[#E8F0EA] px-2 py-0.5 rounded border border-[#6B8F71]/30">TESTING MODE</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <XCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sandbox status choice */}
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#ECE7DF] space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#6B8F71] block">Pilih Status Simulasi</span>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition text-xs font-semibold ${
                paymentStatus === "paid" 
                  ? "bg-white border-[#6B8F71] text-[#2E3A35]" 
                  : "border-[#ECE7DF] text-slate-400 bg-slate-50/50 hover:bg-slate-50"
              }`}>
                <input 
                  type="radio" 
                  name="sandboxStatus"
                  value="paid"
                  checked={paymentStatus === "paid"}
                  onChange={() => setPaymentStatus("paid")}
                  className="accent-[#6B8F71]"
                />
                Simulasi Sukses (Paid)
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition text-xs font-semibold ${
                paymentStatus === "failed" 
                  ? "bg-white border-red-500 text-red-700" 
                  : "border-[#ECE7DF] text-slate-400 bg-slate-50/50 hover:bg-slate-50"
              }`}>
                <input 
                  type="radio" 
                  name="sandboxStatus"
                  value="failed"
                  checked={paymentStatus === "failed"}
                  onChange={() => setPaymentStatus("failed")}
                  className="accent-red-500"
                />
                Simulasi Gagal (Failed)
              </label>
            </div>
          </div>

          {/* Credit card inputs */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Pemegang Kartu</label>
              <input 
                type="text" 
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Rian Adiputra"
                className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#6B8F71] bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Nomor Kartu Kredit / Debit</label>
              <input 
                type="text" 
                required
                maxLength={16}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="4111 2222 3333 4444"
                className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#6B8F71] bg-slate-50 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Masa Berlaku (MM/YY)</label>
                <input 
                  type="text" 
                  required
                  placeholder="12/28"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#6B8F71] bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">CVV / CVC</label>
                <input 
                  type="password" 
                  required
                  maxLength={3}
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#6B8F71] bg-slate-50 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Memproses Pembayaran...
              </>
            ) : (
              `Bayar Rp ${plan.price.toLocaleString("id-ID")}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
