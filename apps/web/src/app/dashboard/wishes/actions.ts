"use server";

import { db } from "db";
import { invitations, wishes } from "db";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleWishApprovalAction(wishId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    const wish = await db.query.wishes.findFirst({
      where: eq(wishes.id, wishId),
    });
    if (!wish) return { error: "Ucapan tidak ditemukan." };

    const invite = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.id, wish.invitationId),
        eq(invitations.tenantId, user.tenantId)
      ),
    });
    if (!invite) return { error: "Akses ditolak." };

    await db.update(wishes)
      .set({ isApproved: !wish.isApproved })
      .where(eq(wishes.id, wishId));
      
    revalidatePath("/dashboard/wishes");
    return { success: true };
  } catch (error) {
    console.error("Toggle Wish Approval Error:", error);
    return { error: "Gagal memperbarui status ucapan." };
  }
}

export async function deleteWishAction(wishId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    const wish = await db.query.wishes.findFirst({
      where: eq(wishes.id, wishId),
    });
    if (!wish) return { error: "Ucapan tidak ditemukan." };

    const invite = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.id, wish.invitationId),
        eq(invitations.tenantId, user.tenantId)
      ),
    });
    if (!invite) return { error: "Akses ditolak." };

    await db.delete(wishes).where(eq(wishes.id, wishId));
    revalidatePath("/dashboard/wishes");
    return { success: true };
  } catch (error) {
    console.error("Delete Wish Error:", error);
    return { error: "Gagal menghapus ucapan." };
  }
}
