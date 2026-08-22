"use server";

import { db } from "db";
import { guests } from "db";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { getOwnedInvitation } from "@/lib/authorization";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function addGuestAction(data: { name: string; phone?: string; invitationId: string }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    const invite = await getOwnedInvitation(data.invitationId, user.tenantId);
    if (!invite) {
      return { error: "Undangan tidak ditemukan." };
    }

    const planInfo = await getTenantPlan(user.tenantId);
    const currentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(and(
        eq(guests.invitationId, invite.id),
        eq(guests.tenantId, user.tenantId)
      ))
      .then((res) => Number(res[0]?.count || 0));

    if (currentCount >= planInfo.features.guestLimit) {
      return { 
        error: `Batas tamu untuk paket Anda (${planInfo.name}) adalah ${planInfo.features.guestLimit} tamu. Silakan tingkatkan paket Anda.` 
      };
    }

    const token = randomBytes(8).toString("hex");
    await db.insert(guests).values({
      invitationId: invite.id,
      tenantId: user.tenantId,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      slugToken: token,
    });
    
    revalidatePath("/dashboard/guests");
    return { success: true };
  } catch (error) {
    console.error("Add Guest Error:", error);
    return { error: "Gagal menambahkan tamu." };
  }
}

export async function importGuestsAction(invitationId: string, list: Array<{ name: string; phone?: string }>) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    if (!list || list.length === 0) {
      return { error: "Daftar tamu kosong." };
    }

    const invite = await getOwnedInvitation(invitationId, user.tenantId);
    if (!invite) {
      return { error: "Undangan tidak ditemukan." };
    }

    const planInfo = await getTenantPlan(user.tenantId);
    const currentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(and(
        eq(guests.invitationId, invite.id),
        eq(guests.tenantId, user.tenantId)
      ))
      .then((res) => Number(res[0]?.count || 0));

    const spotsLeft = planInfo.features.guestLimit - currentCount;
    if (spotsLeft <= 0) {
      return { 
        error: `Batas tamu untuk paket Anda (${planInfo.name}) adalah ${planInfo.features.guestLimit} tamu. Silakan tingkatkan paket Anda.` 
      };
    }

    const listToInsert = list.slice(0, spotsLeft);

    // Batch insert all guests in a single DB query (was N separate calls — major perf fix)
    const valuesToInsert = listToInsert
      .filter((item) => !!item.name)
      .map((item) => ({
        invitationId: invite.id,
        tenantId: user.tenantId,
        name: item.name.trim(),
        phone: item.phone?.trim() || null,
        slugToken: randomBytes(8).toString("hex"),
      }));

    if (valuesToInsert.length > 0) {
      await db.insert(guests).values(valuesToInsert);
    }

    revalidatePath("/dashboard/guests");
    return { success: true, count: valuesToInsert.length };
  } catch (error) {
    console.error("Import Guests Error:", error);
    return { error: "Terjadi kesalahan saat mengimpor tamu." };
  }
}

export async function deleteGuestAction(guestId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    // Authorization: verify the guest belongs to this tenant
    const guest = await db.query.guests.findFirst({
      where: eq(guests.id, guestId),
    });

    if (!guest || guest.tenantId !== user.tenantId) {
      return { error: "Tidak diizinkan menghapus tamu ini." };
    }

    await db.delete(guests).where(eq(guests.id, guestId));
    revalidatePath("/dashboard/guests");
    return { success: true };
  } catch (error) {
    console.error("Delete Guest Error:", error);
    return { error: "Gagal menghapus tamu." };
  }
}
