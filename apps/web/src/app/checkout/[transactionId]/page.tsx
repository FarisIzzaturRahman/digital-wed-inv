import React from "react";
import { db } from "db";
import { transactions, invitations } from "db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckoutButton } from "./CheckoutButton";
import { QrCode, ArrowLeft, Heart } from "lucide-react";
import { createHash, timingSafeEqual } from "crypto";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { transactionId } = await params;
  const { token = "" } = await searchParams;
  
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  const suppliedToken = Buffer.from(token);
  const expectedToken = Buffer.from(tx?.idempotencyKey || "");
  const validToken =
    suppliedToken.length === expectedToken.length &&
    suppliedToken.length > 0 &&
    timingSafeEqual(suppliedToken, expectedToken);

  if (!tx || !validToken) {
    notFound();
  }

  // Load invitation slug for redirect
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.id, tx.invitationId),
  });

  const redirectUrl = invite ? `/${invite.slug}?payment=success` : "/";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-150 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative">
          <div className="flex justify-center items-center gap-1.5 text-lg font-serif font-bold">
            <Heart className="text-pink-500 fill-current" size={20} />
            <span>SuratDigital Gateway</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">SIMULATED CHECKOUT GATEWAY</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Nominal Transfer</span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              Rp {Number(tx.amount).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-slate-500">Ref: <span className="font-mono">{tx.gatewayRef}</span></p>
          </div>

          {/* Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Pengirim:</span>
              <span className="font-bold text-slate-800">{tx.senderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode Bayar:</span>
              <span className="font-bold text-slate-800 uppercase">{tx.method}</span>
            </div>
            {tx.message && (
              <div className="border-t border-slate-200/60 pt-2 text-left">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pesan Doa:</span>
                <span className="text-slate-650 italic">&quot;{tx.message}&quot;</span>
              </div>
            )}
          </div>

          {/* QRIS / VA visual instruction */}
          {tx.method === "qris" ? (
            <div className="flex flex-col items-center p-4 bg-pink-50/20 border border-pink-100 rounded-2xl space-y-3">
              <div className="p-3 bg-white border border-pink-200 rounded-xl">
                <QrCode size={120} className="text-slate-800" />
              </div>
              <p className="text-[10px] text-pink-700 font-bold text-center">
                Pindai kode QRIS di atas dengan aplikasi dompet digital Anda (Gopay, OVO, ShopeePay, m-Banking).
              </p>
            </div>
          ) : (
            <div className="p-5 border border-slate-200 rounded-2xl space-y-2 text-left bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Nomor Virtual Account</span>
              <p className="text-lg font-bold font-mono text-slate-800 tracking-wider">
                8808 - {createHash("sha256").update(tx.gatewayRef).digest("hex").slice(0, 10)}
              </p>
              <p className="text-[10px] text-slate-500">
                Silakan lakukan transfer dari ATM atau m-Banking sesuai nominal di atas menggunakan nomor rekening virtual.
              </p>
            </div>
          )}

          {/* Simulator button */}
          <div className="space-y-3 pt-2">
            <CheckoutButton 
              transactionId={tx.id}
              checkoutToken={token}
              redirectUrl={redirectUrl} 
            />
            
            <a 
              href={redirectUrl}
              className="w-full py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} />
              Kembali ke Undangan
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
