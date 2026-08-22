"use server";

import { db, users, tenants, subscriptions, plans, auditLogs } from "db";
import { eq } from "drizzle-orm";
import {
  clearAdminElevation,
  createAdminElevation,
  createSession,
  getCurrentUser,
} from "@/lib/auth";
import { requireVerifiedAdmin } from "@/lib/authorization";
import { verifyAdminTotp } from "@/lib/admin-security";
import { revalidatePath } from "next/cache";

// 1. Verify 2FA
export async function verifyAdmin2FA(code: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    return { error: "Akses ditolak." };
  }

  try {
    if (!verifyAdminTotp(code)) {
      return { error: "Kode autentikasi tidak valid." };
    }

    await createAdminElevation(user.id);
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "admin_2fa_verify",
      details: "Admin verified 2FA successfully.",
      ipAddress: null,
    });

    return { success: true };
  } catch (error) {
    console.error("Admin 2FA verification error:", error);
    return { error: "Autentikasi admin belum dikonfigurasi dengan benar." };
  }
}

// 2. Logout Admin Session
export async function logoutAdminAction() {
  await clearAdminElevation();
  revalidatePath("/admin");
}

// 3. Suspend/Unsuspend User
export async function toggleUserSuspension(targetUserId: string, suspend: boolean) {
  const admin = await requireVerifiedAdmin();
  if (!admin) {
    return { error: "Akses ditolak." };
  }

  try {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });
    if (!targetUser || targetUser.role === "superadmin") {
      return { error: "Pengguna tidak dapat ditangguhkan." };
    }

    const newRole = suspend ? "suspended" : "operator";
    await db.update(users)
      .set({ role: newRole })
      .where(eq(users.id, targetUserId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: suspend ? "suspend_user" : "unsuspend_user",
      details: `Admin toggled user ${targetUserId} status to ${newRole}.`,
      ipAddress: "127.0.0.1",
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle suspension error:", error);
    return { error: "Gagal memproses suspensi." };
  }
}

// 4. Change User Subscription Plan
export async function changeUserPlan(tenantId: string, planId: string) {
  const admin = await requireVerifiedAdmin();
  if (!admin) {
    return { error: "Akses ditolak." };
  }

  try {
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId)
    });

    if (!plan) {
      return { error: "Paket tidak ditemukan." };
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) {
      return { error: "Tenant tidak ditemukan." };
    }

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId)
    });

    if (existingSub) {
      const extensionBase = Math.max(
        Date.now(),
        existingSub.expiresAt?.getTime() || 0
      );
      await db.update(subscriptions)
        .set({
          planId: plan.id,
          status: "active",
          expiresAt: new Date(extensionBase + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        tenantId,
        planId: plan.id,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Sync tenant text plan representation
    const planName = plan.name.toLowerCase().replace(" trial", "").replace(" / wo", "");
    await db.update(tenants)
      .set({ plan: planName })
      .where(eq(tenants.id, tenantId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "change_plan",
      details: `Admin changed tenant ${tenantId} plan to ${plan.name}.`,
      ipAddress: "127.0.0.1",
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Change plan error:", error);
    return { error: "Gagal mengganti paket." };
  }
}

// 5. Update Plan Price
export async function updatePlanPrice(planId: string, newPrice: number) {
  const admin = await requireVerifiedAdmin();
  if (!admin) {
    return { error: "Akses ditolak." };
  }

  if (!Number.isSafeInteger(newPrice) || newPrice < 0 || newPrice > 1_000_000_000) {
    return { error: "Harga paket tidak valid." };
  }

  try {
    await db.update(plans)
      .set({ 
        price: newPrice,
        updatedAt: new Date()
      })
      .where(eq(plans.id, planId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "change_price",
      details: `Admin updated plan ${planId} price to Rp ${newPrice}.`,
      ipAddress: "127.0.0.1",
    });

    revalidatePath("/admin/plans");
    return { success: true };
  } catch (error: any) {
    console.error("Update plan price error:", error);
    return { error: "Gagal mengubah harga paket." };
  }
}

// 6. Impersonate User
export async function impersonateUserAction(targetUserId: string) {
  const admin = await requireVerifiedAdmin();
  if (!admin) {
    return { error: "Akses ditolak." };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!user) {
      return { error: "User tidak ditemukan." };
    }
    if (user.role === "suspended" || user.role === "superadmin") {
      return { error: "Akun ini tidak dapat diimpersonasi." };
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.ownerUserId, user.id)
    });

    if (!tenant) {
      return { error: "Tenant tidak ditemukan untuk user ini." };
    }

    // Generate new operator session for admin
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id
    });
    await clearAdminElevation();

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "impersonate_user",
      details: `Admin impersonated user ${user.email} (Tenant: ${tenant.name}).`,
      ipAddress: "127.0.0.1",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Impersonate error:", error);
    return { error: "Gagal memproses impersonasi." };
  }
}
