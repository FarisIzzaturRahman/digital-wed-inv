import React from "react";
import { db } from "db";
import { users, invitations, subscriptions, subscriptionInvoices, auditLogs } from "db";
import { eq, sql, desc } from "drizzle-orm";
import { 
  Users, Layers, DollarSign, Heart, Activity, CheckCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Fetch live metrics from DB
  const totalUsersCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .then((res) => Number(res[0]?.count || 0));

  const activeSubsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"))
    .then((res) => Number(res[0]?.count || 0));

  const totalInvitationsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(invitations)
    .then((res) => Number(res[0]?.count || 0));

  const subscriptionRev = await db
    .select({ sum: sql<number>`sum(amount)` })
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.status, "paid"))
    .then((res) => Number(res[0]?.sum || 0));

  const conversionRate = totalUsersCount > 0 
    ? Math.round((activeSubsCount / totalUsersCount) * 100) 
    : 0;

  // Recent logs
  const recentLogs = await db.query.auditLogs.findMany({
    limit: 5,
    orderBy: [desc(auditLogs.createdAt)],
    with: {
      user: true
    }
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2E3A35] via-[#3d4d46] to-[#6B8F71] text-white p-8 rounded-3xl shadow-lg border border-[#6B8F71]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#E7C8C2]">System Console</span>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-white">
            Ikhtisar Bisnis & Server
          </h2>
          <p className="text-slate-200 text-xs">
            Pantau pendaftaran pasangan, performa penjualan paket, status lisensi, dan log audit keamanan sistem.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-[#ECE7DF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Total Pengguna</span>
            <p className="text-xl font-bold text-[#2E3A35]">{totalUsersCount}</p>
            <span className="text-[10px] text-slate-500">Pasangan terdaftar</span>
          </div>
          <div className="p-3 bg-[#E8F0EA] text-[#6B8F71] rounded-xl">
            <Users size={18} />
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-[#ECE7DF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">SaaS Aktif</span>
            <p className="text-xl font-bold text-[#6B8F71]">{activeSubsCount}</p>
            <span className="text-[10px] text-slate-500">Subscription aktif</span>
          </div>
          <div className="p-3 bg-[#E8F0EA] text-[#6B8F71] rounded-xl">
            <Layers size={18} />
          </div>
        </div>

        {/* Total Invitations */}
        <div className="bg-white p-5 rounded-2xl border border-[#ECE7DF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Undangan Dibuat</span>
            <p className="text-xl font-bold text-[#2E3A35]">{totalInvitationsCount}</p>
            <span className="text-[10px] text-slate-500">Draft & Published</span>
          </div>
          <div className="p-3 bg-[#FAF7F2] text-[#6B8F71] rounded-xl">
            <Heart size={18} className="fill-current" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#ECE7DF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Pendapatan SaaS</span>
            <p className="text-xl font-bold text-[#2E3A35]">
              Rp {subscriptionRev.toLocaleString("id-ID")}
            </p>
            <span className="text-[10px] text-slate-500">Pembayaran terverifikasi</span>
          </div>
          <div className="p-3 bg-[#FAF7F2] text-amber-600 rounded-xl">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-[#ECE7DF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Konversi Berbayar</span>
            <p className="text-xl font-bold text-[#2E3A35]">{conversionRate}%</p>
            <span className="text-[10px] text-slate-500">Rasio free ke premium</span>
          </div>
          <div className="p-3 bg-[#F6EAE7] text-[#C0675E] rounded-xl">
            <Activity size={18} />
          </div>
        </div>

      </div>

      {/* Charts and Health status */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* SVG Graphic Charts */}
        <div className="bg-white p-6 rounded-3xl border border-[#ECE7DF] shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-bold font-serif text-[#2E3A35]">Tren Penjualan & Konversi</h3>
            <p className="text-[11px] text-slate-400">Visualisasi data transaksi berlangganan 7 hari terakhir.</p>
          </div>
          
          {/* Beautiful SVG Line Graph */}
          <div className="h-56 w-full relative pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B8F71" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6B8F71" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#FAF7F2" strokeWidth="2" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#FAF7F2" strokeWidth="2" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#FAF7F2" strokeWidth="2" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="#ECE7DF" strokeWidth="2" />
              
              {/* Line graph shadow */}
              <path 
                d="M 0 160 Q 80 120 160 140 T 320 80 T 480 50 L 480 200 L 0 200 Z" 
                fill="url(#chartGrad)" 
              />
              
              {/* Line path */}
              <path 
                d="M 0 160 Q 80 120 160 140 T 320 80 T 480 50" 
                fill="none" 
                stroke="#6B8F71" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              
              {/* Dots */}
              <circle cx="160" cy="140" r="5" fill="#5C7D62" />
              <circle cx="320" cy="80" r="5" fill="#5C7D62" />
              <circle cx="480" cy="50" r="5" fill="#5C7D62" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Senin</span>
              <span>Rabu</span>
              <span>Jumat</span>
              <span>Minggu</span>
            </div>
          </div>
        </div>

        {/* Server Health Status */}
        <div className="bg-white p-6 rounded-3xl border border-[#ECE7DF] shadow-sm space-y-6">
          <h3 className="text-base font-bold font-serif text-[#2E3A35] border-b border-[#ECE7DF] pb-3">
            Kesehatan Sistem
          </h3>
          
          <ul className="space-y-4">
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#6B8F71]" />
                <span className="font-semibold text-slate-700">Database connection</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ONLINE</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#6B8F71]" />
                <span className="font-semibold text-slate-700">Redis Cache Queue</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ACTIVE</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#6B8F71]" />
                <span className="font-semibold text-slate-700">Object Storage (MinIO)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#6B8F71]" />
                <span className="font-semibold text-slate-700">Payment Gateway</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">INTEGRATED</span>
            </li>
          </ul>

          {/* Audit log teaser */}
          <div className="pt-2 border-t border-[#ECE7DF] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#2E3A35] font-serif">Log Audit Terkini</span>
            </div>
            <div className="space-y-2 text-[10px] text-slate-500 font-mono">
              {recentLogs.map((log) => (
                <div key={log.id} className="border-b border-[#FAF7F2] pb-1.5 last:border-b-0">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>{log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="truncate text-slate-650">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
