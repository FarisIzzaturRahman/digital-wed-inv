"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { simulatePaymentAction } from "./actions";

export function CheckoutButton({
  transactionId,
  checkoutToken,
  redirectUrl
}: {
  transactionId: string;
  checkoutToken: string;
  redirectUrl: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const result = await simulatePaymentAction(transactionId, checkoutToken);

      if (result.success) {
        setDone(true);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1500);
      } else {
        alert(result.error || "Gagal mengirim simulasi pembayaran.");
      }
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSimulate}
      disabled={loading || done}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:bg-emerald-750"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Memproses Pembayaran...</span>
        </>
      ) : done ? (
        <>
          <CheckCircle2 size={14} />
          <span>Lunas! Dialihkan ke Undangan...</span>
        </>
      ) : (
        <span>Simulasikan Pembayaran Sukses (Bayar)</span>
      )}
    </button>
  );
}
