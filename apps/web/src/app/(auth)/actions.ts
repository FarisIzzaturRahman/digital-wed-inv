"use server";

import { db, users, tenants } from "db";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword, createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return { error: "Email atau password salah." };
    }

    if (user.role === "suspended") {
      return { error: "Akun ini sedang ditangguhkan. Hubungi administrator." };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: "Email atau password salah." };
    }

    // Find the tenant for this user
    let tenant = await db.query.tenants.findFirst({
      where: eq(tenants.ownerUserId, user.id),
    });

    if (!tenant) {
      if (user.role === "superadmin") {
        const [newTenant] = await db.insert(tenants).values({
          ownerUserId: user.id,
          name: "Superadmin Workspace",
          plan: "business",
        }).returning();
        tenant = newTenant;
      } else {
        return { error: "Tenant tidak ditemukan untuk akun ini." };
      }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return { error: "Terjadi kesalahan sistem." };
  }

  // Redirect to dashboard
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Semua kolom input wajib diisi." };
  }

  if (password.length < 6) {
    return { error: "Password minimal harus 6 karakter." };
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return { error: "Email sudah terdaftar." };
    }

    const passwordHash = hashPassword(password);

    // Run in transaction to ensure tenant is created
    const sessionData = await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        email,
        name,
        passwordHash,
        role: "operator",
      }).returning();

      const [newTenant] = await tx.insert(tenants).values({
        ownerUserId: newUser.id,
        name: `${name}'s Workspace`,
        plan: "free",
      }).returning();

      return {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tenantId: newTenant.id,
      };
    });

    await createSession(sessionData);
  } catch (error: any) {
    console.error("Registration Error:", error);
    return { error: "Gagal melakukan registrasi." };
  }

  // Redirect to dashboard
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
