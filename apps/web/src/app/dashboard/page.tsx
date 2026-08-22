import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "db";
import { 
  invitations, couples, guests, wishes, transactions, rsvps, events
} from "db";
import { eq, sql, and } from "drizzle-orm";
import { 
  Heart, Users, MessageSquare, DollarSign, ExternalLink
} from "lucide-react";
import { PublishToggle } from "./PublishToggle";
import { WeddingCountdown } from "./WeddingCountdown";

async function getOrInitInvitation(tenantId: string, userName: string) {
  // Try to find the invitation
  let invite = await db.query.invitations.findFirst({
    where: eq(invitations.tenantId, tenantId),
  });

  if (!invite) {
    // Generate clean slug
    const cleanName = userName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const slug = `nikah-${cleanName || "bahagia"}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create draft invitation
    const [newInvite] = await db.insert(invitations).values({
      tenantId: tenantId,
      slug: slug,
      status: "draft",
      religion: "islam",
      locale: "id",
      templateId: "classic-gold",
      theme: {
        colorPrimary: "#d4af37",
        colorAccent: "#b8860b",
        colorBg: "#fffdf9",
        colorText: "#2c2c2c",
        fontHeading: "Playfair Display",
        fontBody: "Inter",
        radius: "8px",
        pattern: "floral",
      }
    }).returning();

    // Init couple profile
    await db.insert(couples).values({
      invitationId: newInvite.id,
      groomFullName: "Nama Pengantin Pria",
      groomNickname: "Pengantin Pria",
      groomFather: "Bapak Pria",
      groomMother: "Ibu Pria",
      groomChildOrder: "Putra Pertama",
      brideFullName: "Nama Pengantin Wanita",
      brideNickname: "Pengantin Wanita",
      brideFather: "Bapak Wanita",
      brideMother: "Ibu Wanita",
      brideChildOrder: "Putri Pertama",
      orderDisplay: "groom_first",
    });

    invite = newInvite;
  }

  return invite;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  // Fetch or initialize
  const invite = await getOrInitInvitation(user.tenantId, user.name);

  // Fetch statistics concurrently (Parallelized)
  const [guestCountRow, rsvpList, wishCountRow, paidTransactions, firstEvent] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(eq(guests.invitationId, invite.id)),
    db.query.rsvps.findMany({
      where: eq(rsvps.invitationId, invite.id),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(wishes)
      .where(eq(wishes.invitationId, invite.id)),
    db
      .select({ amount: transactions.amount })
      .from(transactions)
      .where(
        and(
          eq(transactions.invitationId, invite.id),
          eq(transactions.status, "paid")
        )
      ),
    db.query.events.findFirst({
      where: eq(events.invitationId, invite.id),
      orderBy: (events, { asc }) => [asc(events.startAt)],
    }),
  ]);

  const totalGuests = Number(guestCountRow[0]?.count || 0);
  const totalWishes = Number(wishCountRow[0]?.count || 0);
  const totalFund = paidTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const weddingDate = firstEvent?.startAt ?? null;

  // Count RSVPs by categories
  let countYes = 0;
  let countNo = 0;
  let countMaybe = 0;

  rsvpList.forEach((r) => {
    if (r.attendance === "yes") countYes++;
    else if (r.attendance === "no") countNo++;
    else if (r.attendance === "maybe") countMaybe++;
  });

  const countPending = Math.max(0, totalGuests - rsvpList.length);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicLink = `${appUrl}/${invite.slug}`;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-8 rounded-3xl shadow-lg border border-slate-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400">STATUS UNDANGAN</span>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-white capitalize">
            {invite.status === "published" ? "🎉 Undangan Sudah Dipublikasikan!" : "🛠️ Undangan Sedang Dimodifikasi"}
          </h2>
          <p className="text-slate-300 text-xs">
            Link Publik:{" "}
            <a 
              href={publicLink} 
              target="_blank" 
              rel="noreferrer" 
              className="text-pink-300 underline font-semibold inline-flex items-center gap-1 hover:text-pink-400"
            >
              {publicLink}
              <ExternalLink size={12} />
            </a>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <PublishToggle
            invitationId={invite.id}
            currentStatus={invite.status}
          />
          <Link 
            href="/dashboard/invitation"
            className="px-5 py-2.5 bg-white/10 border border-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition shadow-md text-center"
          >
            Edit Undangan
          </Link>
          <a 
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-pink-600 text-white text-xs font-bold rounded-xl hover:bg-pink-700 transition shadow-md inline-flex items-center justify-center gap-1.5"
          >
            Pratinjau Live
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Wedding Countdown */}
      {weddingDate && (
        <WeddingCountdown weddingDate={weddingDate.toISOString()} />
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Tamu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Daftar Tamu</span>
            <p className="text-2xl font-bold text-slate-800">{totalGuests}</p>
            <p className="text-[10px] text-slate-500">Tamu diundang</p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-600 rounded-xl">
            <Users size={20} />
          </div>
        </div>

        {/* RSVP Kehadiran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Konfirmasi Hadir</span>
            <p className="text-2xl font-bold text-slate-800">{countYes}</p>
            <p className="text-[10px] text-slate-500">{countMaybe} Ragu // {countNo} Tidak</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <Heart size={20} className="fill-current" />
          </div>
        </div>

        {/* Wishes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Ucapan</span>
            <p className="text-2xl font-bold text-slate-800">{totalWishes}</p>
            <p className="text-[10px] text-slate-500">Doa terkumpul</p>
          </div>
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Fund Raised */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Amplop Terkumpul</span>
            <p className="text-2xl font-bold text-slate-800">
              Rp {totalFund.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-slate-500">Verifikasi otomatis</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

      </div>

      {/* Main Grid: RSVP breakdown & checklist */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* RSVP Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold font-serif text-slate-800 border-b border-slate-100 pb-4">
            Progress Status RSVP Tamu
          </h3>
          
          <div className="space-y-4">
            {/* Yes */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                <span>Hadir ({countYes})</span>
                <span>{totalGuests > 0 ? Math.round((countYes / totalGuests) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalGuests > 0 ? (countYes / totalGuests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Maybe */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                <span>Ragu-ragu ({countMaybe})</span>
                <span>{totalGuests > 0 ? Math.round((countMaybe / totalGuests) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalGuests > 0 ? (countMaybe / totalGuests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* No */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                <span>Tidak Hadir ({countNo})</span>
                <span>{totalGuests > 0 ? Math.round((countNo / totalGuests) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalGuests > 0 ? (countNo / totalGuests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Pending */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                <span>Belum Konfirmasi ({countPending})</span>
                <span>{totalGuests > 0 ? Math.round((countPending / totalGuests) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-300 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalGuests > 0 ? (countPending / totalGuests) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Setup Checklist */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold font-serif text-slate-800 border-b border-slate-100 pb-4">
            Checklist Langkah Setup
          </h3>
          
          <ul className="space-y-4 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-full shrink-0">✔</span>
              <div>
                <p className="font-bold text-slate-850">Buat Workspace & Akun</p>
                <p className="text-[10px] text-slate-400">Registrasi berhasil dilakukan.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-full shrink-0">✔</span>
              <div>
                <p className="font-bold text-slate-850">Inisialisasi Draft Undangan</p>
                <p className="text-[10px] text-slate-400">Draft slug: {invite.slug}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 bg-blue-50 text-blue-600 rounded-full shrink-0">→</span>
              <div>
                <p className="font-bold text-slate-850">Lengkapi Detail Pasangan</p>
                <p className="text-[10px] text-slate-400">Buka menu &apos;Edit Undangan&apos; untuk melengkapi foto & deskripsi.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 bg-slate-100 text-slate-400 rounded-full shrink-0">○</span>
              <div>
                <p className="font-bold text-slate-850">Unggah Daftar Tamu (CSV)</p>
                <p className="text-[10px] text-slate-400">Import daftar tamu untuk menghasilkan link personal.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 bg-slate-100 text-slate-400 rounded-full shrink-0">○</span>
              <div>
                <p className="font-bold text-slate-850">Publikasikan Undangan</p>
                <p className="text-[10px] text-slate-400">Ubah status draft menjadi published agar bisa diakses online.</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
