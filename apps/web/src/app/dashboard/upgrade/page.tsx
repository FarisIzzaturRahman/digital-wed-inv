import React from "react";
import Link from "next/link";
import { db } from "db";
import { plans } from "db";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { Check, ArrowRight, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const currentPlan = await getTenantPlan(user.tenantId);

  // Fetch all active plans from database
  const plansList = await db.query.plans.findMany({
    where: eq(plans.isActive, true),
    orderBy: [asc(plans.price)],
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B8F71] bg-[#E8F0EA] px-3 py-1 rounded-full border border-[#6B8F71]/20">
          Paket Berlangganan
        </span>
        <h1 className="text-3xl font-bold font-serif text-[#2E3A35]">Pilih Paket Terbaik Untuk Hari Bahagiamu</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tingkatkan paket undangan digitalmu untuk mengaktifkan fitur premium seperti backsound musik, galeri prewedding, kado amplop digital, dan daftar tamu tanpa batas.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {plansList.map((plan) => {
          const isCurrent = currentPlan.name.toLowerCase() === plan.name.toLowerCase();
          const features = (plan.features as any) || {};
          const isFree = plan.price === 0;
          
          return (
            <div 
              key={plan.id} 
              className={`bg-white rounded-3xl border p-6 flex flex-col justify-between relative transition hover:translate-y-[-4px] hover:shadow-md ${
                isCurrent 
                  ? "border-[#6B8F71] ring-2 ring-[#6B8F71]/20" 
                  : "border-[#ECE7DF] shadow-sm"
              }`}
            >
              {/* Highlight Ribbon */}
              {plan.name.includes("Premium") && (
                <span className="absolute top-0 right-6 translate-y-[-50%] bg-[#E7C8C2] text-[#2E3A35] font-bold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#FAF7F2] shadow-sm flex items-center gap-1">
                  <Star size={10} className="fill-current" />
                  Populer
                </span>
              )}

              <div className="space-y-5">
                <div className="space-y-1 text-left">
                  <span className="text-[9px] uppercase font-bold text-[#6B8F71] tracking-wider block">PAKET</span>
                  <h3 className="text-lg font-bold font-serif text-[#2E3A35]">{plan.name}</h3>
                </div>

                <div className="py-2 text-left">
                  <span className="text-2xl font-black text-[#2E3A35]">
                    Rp {plan.price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">sekali bayar</span>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-2.5 text-xs text-slate-650 pt-4 border-t border-[#ECE7DF] text-left">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#6B8F71] shrink-0 mt-0.5" />
                    <span>
                      Batas {features.guestLimit >= 1000000 ? "Tamu Tanpa Batas" : `${features.guestLimit} Tamu`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#6B8F71] shrink-0 mt-0.5" />
                    <span>Hingga {features.eventLimit} Acara (Akad/Resepsi)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className={`${features.hasMusic ? "text-[#6B8F71]" : "text-slate-300"} shrink-0 mt-0.5`} />
                    <span className={features.hasMusic ? "text-slate-700" : "text-slate-400 line-through"}>
                      Backsound Musik Latar
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className={`${features.hasEnvelopes ? "text-[#6B8F71]" : "text-slate-300"} shrink-0 mt-0.5`} />
                    <span className={features.hasEnvelopes ? "text-slate-700" : "text-slate-400 line-through"}>
                      Kado & Amplop Online verified
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className={`${!features.watermark ? "text-[#6B8F71]" : "text-slate-300"} shrink-0 mt-0.5`} />
                    <span className={!features.watermark ? "text-slate-700" : "text-slate-400 line-through"}>
                      Bebas Watermark Logo
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-[#FAF7F2]">
                {isCurrent ? (
                  <button 
                    disabled 
                    className="w-full py-2.5 bg-[#E8F0EA] text-[#6B8F71] font-bold rounded-xl text-xs border border-[#6B8F71]/25 cursor-default flex items-center justify-center gap-1.5"
                  >
                    Paket Aktif Saat Ini
                  </button>
                ) : isFree ? (
                  <button 
                    disabled 
                    className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs cursor-default flex items-center justify-center gap-1.5"
                  >
                    Bukan Pilihan Upgrade
                  </button>
                ) : (
                  <Link 
                    href={`/checkout/subscription?planId=${plan.id}`}
                    className="w-full py-2.5 bg-[#6B8F71] hover:bg-[#5C7D62] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Pilih Paket Ini
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
