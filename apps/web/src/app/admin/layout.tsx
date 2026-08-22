import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminElevated } from "@/lib/auth";
import { AdminLockScreen } from "./AdminLockScreen";
import { 
  ShieldCheck, LayoutDashboard, Users, CreditCard, Layers, FileText, ArrowLeft, LogOut
} from "lucide-react";
import { logoutAdminAction } from "./actions";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-[#5C7D62] rounded-xl transition duration-150 text-sm font-medium"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logout");
  }
  if (user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const is2FaVerified = await isAdminElevated(user.id);

  if (!is2FaVerified) {
    return <AdminLockScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF7F2]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#2E3A35] text-white flex flex-col justify-between shrink-0 border-r border-[#ece7df]">
        <div className="p-6 space-y-8">
          {/* Logo / Header */}
          <div className="flex items-center gap-2 text-xl font-bold font-serif text-white px-2">
            <ShieldCheck className="text-[#E7C8C2]" size={24} />
            <span className="tracking-wide">AdminConsole</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />}>
              Overview Bisnis
            </SidebarLink>
            <SidebarLink href="/admin/users" icon={<Users size={18} />}>
              Kelola Pengguna
            </SidebarLink>
            <SidebarLink href="/admin/plans" icon={<Layers size={18} />}>
              Paket & Harga
            </SidebarLink>
            <SidebarLink href="/admin/billing" icon={<CreditCard size={18} />}>
              Billing & Invoices
            </SidebarLink>
            <SidebarLink href="/admin/audit-logs" icon={<FileText size={18} />}>
              Audit System Logs
            </SidebarLink>
          </nav>
        </div>

        {/* Back and Logout */}
        <div className="p-6 border-t border-[#6B746F]/30 space-y-3">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2.5 px-4 py-2 bg-[#5C7D62]/40 text-slate-100 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Tenant</span>
          </Link>
          
          <form action={logoutAdminAction}>
            <button 
              type="submit" 
              className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-400 hover:text-[#E7C8C2] transition text-xs font-semibold text-left"
            >
              <LogOut size={14} />
              <span>Keluar Sesi Admin</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-[#ECE7DF] px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-[#2E3A35] font-serif">Superadmin: {user.name}</h2>
          <span className="text-[10px] font-bold text-[#6B8F71] bg-[#E8F0EA] px-2.5 py-1 rounded-full border border-[#6B8F71]/30">
            Console Active & Verified (2FA)
          </span>
        </header>
        
        {/* Children Panel */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
