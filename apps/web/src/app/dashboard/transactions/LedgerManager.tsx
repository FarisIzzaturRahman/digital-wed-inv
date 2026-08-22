"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePaymentAccountAction, withdrawFundsAction } from "./actions";
import { 
  Building2, CreditCard, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";

export function LedgerManager({
  invitation,
  account,
  transactions: initialTxs,
  disbursements: initialPayouts,
  planInfo
}: {
  invitation: any;
  account: any;
  transactions: any[];
  disbursements: any[];
  planInfo: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bank Form State
  const [holderName, setHolderName] = useState(account?.holderName || "");
  const [bankCode, setBankCode] = useState(account?.bankCode || "bca");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || "");

  // Calc balances
  const paidTxs = initialTxs.filter(t => t.status === "paid");
  const totalIncome = paidTxs.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const completedPayouts = initialPayouts.filter(p => p.status === "completed");
  const totalWithdrawn = completedPayouts.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPayoutFees = completedPayouts.reduce((acc, curr) => acc + Number(curr.fee), 0);
  const availableBalance = totalIncome - totalWithdrawn - totalPayoutFees;

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName || !accountNumber) return;
    setLoading(true);
    setMessage(null);

    const res = await savePaymentAccountAction({
      holderName,
      bankCode,
      accountNumber,
      invitationId: invitation.id
    });

    setLoading(false);
    if ("error" in res) {
      setMessage({ type: "error", text: res.error || "Gagal menyimpan rekening." });
    } else {
      setMessage({ type: "success", text: "Akun penarikan berhasil diperbarui dan diverifikasi." });
      router.refresh();
    }
  };

  const handleWithdraw = async () => {
    if (!account) {
      alert("Silakan daftarkan & simpan akun penarikan bank terlebih dahulu.");
      return;
    }
    if (availableBalance < 10000) {
      alert("Saldo tidak mencukupi untuk ditarik (Min. Rp 10.000).");
      return;
    }
    if (!confirm(`Tarik dana sebesar Rp ${availableBalance.toLocaleString("id-ID")} ke rekening Anda?`)) return;

    setLoading(true);
    setMessage(null);

    const res = await withdrawFundsAction(invitation.id);
    setLoading(false);

    if ("amount" in res) {
      setMessage({ 
        type: "success", 
        text: `Dana sebesar Rp ${res.amount.toLocaleString("id-ID")} berhasil ditarik ke rekening Anda.` 
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Gagal menarik dana." });
    }
  };

  if (!planInfo.features.hasEnvelopes) {
    return (
      <div className="bg-white rounded-3xl border border-[#ECE7DF] p-12 text-center max-w-xl mx-auto shadow-sm space-y-6">
        <div className="mx-auto w-16 h-16 bg-[#F6EAE7] text-[#C0675E] rounded-2xl flex items-center justify-center">
          <Wallet size={32} />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#C0675E] tracking-widest bg-[#F6EAE7] px-3 py-1 rounded-full">
            Fitur Terkunci
          </span>
          <h2 className="text-xl font-bold font-serif text-[#2E3A35]">
            Amplop Digital & Kado Online
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Terima hadiah amplop dari tamu secara digital langsung ke rekening Anda secara instan dan aman. Fitur ini hanya tersedia pada paket **Premium** atau **Business**.
          </p>
        </div>

        <div className="pt-4 border-t border-[#FAF7F2]">
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            Upgrade ke Paket Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Alert banner */}
      {message && (
        <div className={`p-4 rounded-2xl flex justify-between items-center border text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

      {/* Ledger Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Masuk (Envelope)</span>
            <p className="text-xl font-bold text-slate-800">Rp {totalIncome.toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-slate-500">{paidTxs.length} Pembayaran Lunas</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Withdrawn Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Dicairkan</span>
            <p className="text-xl font-bold text-slate-800">Rp {totalWithdrawn.toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-slate-500">{completedPayouts.length} Kali Penarikan</p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-500 rounded-xl">
            <ArrowDownRight size={20} />
          </div>
        </div>

        {/* Available Balance & Withdraw Button */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-850 shadow-md flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Dapat Ditarik</span>
              <p className="text-xl font-bold text-emerald-450">Rp {availableBalance.toLocaleString("id-ID")}</p>
            </div>
            <Wallet className="text-emerald-500" size={20} />
          </div>

          <button
            onClick={handleWithdraw}
            disabled={availableBalance < 10000 || !account || loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition disabled:bg-slate-800 disabled:text-slate-550 shadow-sm"
          >
            {loading ? "Memproses..." : "Cairkan Dana Sekarang"}
          </button>
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Setup Payout Bank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 self-start">
          <h3 className="text-base font-serif font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Building2 size={18} className="text-pink-600" />
            Rekening Penarikan (KYC)
          </h3>

          <form onSubmit={handleSaveBank} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Nama Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs bg-slate-50 focus:outline-none"
              >
                <option value="bca">Bank Central Asia (BCA)</option>
                <option value="mandiri">Bank Mandiri</option>
                <option value="bni">Bank Negara Indonesia (BNI)</option>
                <option value="bri">Bank Rakyat Indonesia (BRI)</option>
                <option value="cimb">CIMB Niaga</option>
                <option value="gopay">GOPAY / E-Wallet</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Nomor Rekening</label>
              <input 
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none bg-slate-50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Nama Lengkap Pemilik Rekening</label>
              <input 
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Sesuai buku tabungan"
                className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              {loading ? "Menyimpan..." : "Simpan & Verifikasi Akun"}
            </button>
          </form>

          {account && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[10px] text-slate-500 font-mono">
              <p className="font-bold text-slate-700">Status Akun Aktif:</p>
              <p>Bank: <span className="font-bold uppercase">{account.bankCode}</span></p>
              <p>No. Rek: <span className="font-bold">{account.accountNumber}</span></p>
              <p>Nama: <span className="font-bold">{account.holderName}</span></p>
              <p>Verifikasi: <span className="font-bold text-emerald-600">Terverifikasi (KYC Passed)</span></p>
            </div>
          )}
        </div>

        {/* Transactions list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-base font-serif font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <CreditCard size={18} className="text-pink-600" />
            Riwayat Amplop Masuk (E-Envelopes)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-250/50">
                  <th className="p-3">Nama Pengirim</th>
                  <th className="p-3">Jumlah</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center italic text-slate-400">Belum ada transaksi amplop masuk.</td>
                  </tr>
                ) : (
                  initialTxs.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{t.senderName}</p>
                        {t.message && <p className="text-[10px] text-slate-400 italic truncate max-w-xs">{t.message}</p>}
                      </td>
                      <td className="p-3 font-semibold font-mono text-slate-700">Rp {Number(t.amount).toLocaleString("id-ID")}</td>
                      <td className="p-3 uppercase font-mono text-[10px]">{t.method}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          t.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {t.status === "paid" ? "Lunas" : t.status === "pending" ? "Tertunda" : "Gagal"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[10px]">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-serif font-bold text-slate-800 border-b border-slate-100 pt-6 pb-3 flex items-center gap-1.5">
            <RefreshCw size={18} className="text-pink-600" />
            Riwayat Pencairan Saldo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-250/50">
                  <th className="p-3">Jumlah Dicairkan</th>
                  <th className="p-3">Biaya Transfer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Waktu Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center italic text-slate-400">Belum ada riwayat pencairan saldo.</td>
                  </tr>
                ) : (
                  initialPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold font-mono text-slate-850">Rp {Number(p.amount).toLocaleString("id-ID")}</td>
                      <td className="p-3 font-mono text-slate-500">Rp {Number(p.fee).toLocaleString("id-ID")}</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Selesai
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[10px]">
                        {new Date(p.requestedAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
