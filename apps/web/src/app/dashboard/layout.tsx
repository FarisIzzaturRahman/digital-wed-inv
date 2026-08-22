import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { 
  Heart, LayoutDashboard, Edit3, Users, MessageSquare, CreditCard, LogOut, User as UserIcon, ShieldAlert, Sparkles
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition duration-150 text-sm font-medium"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logout");
  }

  const planInfo = await getTenantPlan(user.tenantId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF7F2]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#2E3A35] text-white flex flex-col justify-between shrink-0 border-r border-[#ece7df]">
        <div className="p-6 space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold font-serif text-white px-2">
            <Heart className="text-[#E7C8C2] fill-current animate-pulse" size={24} />
            <span className="tracking-wide">SuratDigital</span>
          </Link>
 
          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />}>
              Overview
            </SidebarLink>
            <SidebarLink href="/dashboard/invitation" icon={<Edit3 size={18} />}>
              Edit Undangan
            </SidebarLink>
            <SidebarLink href="/dashboard/guests" icon={<Users size={18} />}>
              Daftar Tamu & RSVP
            </SidebarLink>
            <SidebarLink href="/dashboard/wishes" icon={<MessageSquare size={18} />}>
              Moderasi Ucapan
            </SidebarLink>
            <SidebarLink href="/dashboard/transactions" icon={<CreditCard size={18} />}>
              Amplop & Transaksi
            </SidebarLink>
            <SidebarLink href="/dashboard/upgrade" icon={<Sparkles size={18} className="text-[#E7C8C2]" />}>
              Tingkatkan Paket
            </SidebarLink>
            
            {user.role === "superadmin" && (
              <div className="pt-4 mt-4 border-t border-slate-750">
                <p className="px-4 text-[10px] uppercase font-bold tracking-widest text-[#E7C8C2] mb-2">Superadmin</p>
                <SidebarLink href="/admin" icon={<ShieldAlert size={18} className="text-[#E7C8C2]" />}>
                  Konsol Admin
                </SidebarLink>
              </div>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-[#6B746F]/30 space-y-4">
          <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl">
            <div className="p-2 bg-slate-700 rounded-lg text-[#E7C8C2]">
              <UserIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-300 truncate">{user.email}</p>
            </div>
          </div>
          
          <Link 
            href="/logout" 
            className="flex items-center gap-3 px-4 py-2 text-slate-450 hover:text-[#E7C8C2] transition text-xs font-semibold"
          >
            <LogOut size={16} />
            <span>Keluar Akun</span>
          </Link>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-[#ECE7DF] px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-[#2E3A35] font-serif">Workspace: {user.name}</h2>
          <div className="flex items-center gap-3">
            {planInfo.name !== "Free Trial" ? (
              <span className="text-[10px] font-bold text-[#6B8F71] bg-[#E8F0EA] px-2.5 py-1 rounded-full border border-[#6B8F71]/30">
                SaaS Plan: {planInfo.name}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  SaaS Plan: Free Trial
                </span>
                <Link 
                  href="/dashboard/upgrade" 
                  className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-2.5 py-1 rounded-full transition"
                >
                  Tingkatkan
                </Link>
              </div>
            )}
          </div>
        </header>
        
        {/* Children Panel */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
