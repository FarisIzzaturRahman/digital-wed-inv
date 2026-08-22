"use server";

import { createHash, timingSafeEqual } from "crypto";
import { db, guests, invitations, rsvps, wishes } from "db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
  createInvitationAccess,
  getCurrentUser,
  hashPassword,
  hasInvitationAccess,
  verifyPassword,
} from "@/lib/auth";

const rsvpInputSchema = z.object({
  submissionType: z.enum(["rsvp", "wish"]).default("rsvp"),
  invitationId: z.string().uuid(),
  guestId: z.string().uuid().nullable().optional(),
  guestToken: z.string().min(1).max(128).nullable().optional(),
  name: z.string().trim().min(1).max(120),
  attendance: z.enum(["yes", "no", "maybe"]),
  headcount: z.number().int().min(1).max(10),
  message: z.string().trim().max(1000).nullable().optional(),
});

export async function unlockInvitationAction(invitationId: string, pin: string) {
  if (!z.string().uuid().safeParse(invitationId).success || !/^\d{6}$/.test(pin)) {
    return { error: "PIN tidak valid." };
  }

  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
  });

  if (!invite || invite.status !== "published" || !invite.isPrivate || !invite.pin) {
    return { error: "Undangan tidak tersedia." };
  }

  const isHashedPin = invite.pin.includes(":");
  const validPin = isHashedPin
    ? verifyPassword(pin, invite.pin)
    : invite.pin.length === pin.length &&
      timingSafeEqual(Buffer.from(invite.pin), Buffer.from(pin));

  if (!validPin) {
    return { error: "PIN tidak valid." };
  }

  if (!isHashedPin) {
    await db.update(invitations)
      .set({ pin: hashPassword(pin), updatedAt: new Date() })
      .where(eq(invitations.id, invite.id));
  }

  await createInvitationAccess(invite.id);
  return { success: true };
}

export async function submitRsvpAction(input: {
  submissionType?: "rsvp" | "wish";
  invitationId: string;
  guestId?: string | null;
  guestToken?: string | null;
  name: string;
  attendance: string;
  headcount: number;
  message?: string | null;
}) {
  try {
    const data = rsvpInputSchema.parse(input);
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.id, data.invitationId),
    });

    if (!invite) {
      return { error: "Undangan tidak ditemukan." };
    }

    const currentUser = await getCurrentUser();
    const isOwnerPreview = currentUser?.tenantId === invite.tenantId;
    if (invite.status !== "published" && !isOwnerPreview) {
      return { error: "Undangan belum dipublikasikan." };
    }
    if (
      invite.isPrivate &&
      !isOwnerPreview &&
      !(await hasInvitationAccess(invite.id))
    ) {
      return { error: "Akses undangan telah kedaluwarsa." };
    }

    let submittedName = data.name;
    if (data.guestId) {
      const guest = await db.query.guests.findFirst({
        where: and(
          eq(guests.id, data.guestId),
          eq(guests.invitationId, invite.id),
          eq(guests.slugToken, data.guestToken || "")
        ),
      });
      if (!guest) {
        return { error: "Tautan tamu tidak valid." };
      }
      submittedName = guest.name;
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const forwardedIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedIp || headersList.get("x-real-ip") || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");

    await db.transaction(async (tx) => {
      if (data.submissionType === "rsvp") {
        const rsvpValues = {
          name: submittedName,
          attendance: data.attendance,
          headcount: data.headcount,
          message: data.message || null,
          ipHash,
          userAgent,
        };

        if (data.guestId) {
          const existingRsvp = await tx.query.rsvps.findFirst({
            where: and(
              eq(rsvps.guestId, data.guestId),
              eq(rsvps.invitationId, invite.id)
            ),
          });

          if (existingRsvp) {
            await tx.update(rsvps).set(rsvpValues).where(eq(rsvps.id, existingRsvp.id));
          } else {
            await tx.insert(rsvps).values({
              invitationId: invite.id,
              guestId: data.guestId,
              ...rsvpValues,
            });
          }
        } else {
          await tx.insert(rsvps).values({
            invitationId: invite.id,
            guestId: null,
            ...rsvpValues,
          });
        }
      }

      if (!data.message) {
        return;
      }

      if (data.guestId) {
        const existingWish = await tx.query.wishes.findFirst({
          where: and(
            eq(wishes.guestId, data.guestId),
            eq(wishes.invitationId, invite.id)
          ),
        });

        if (existingWish) {
          await tx.update(wishes)
            .set({
              name: submittedName,
              message: data.message,
              isApproved: false,
              ipHash,
            })
            .where(eq(wishes.id, existingWish.id));
        } else {
          await tx.insert(wishes).values({
            invitationId: invite.id,
            guestId: data.guestId,
            name: submittedName,
            message: data.message,
            isApproved: false,
            likes: 0,
            ipHash,
          });
        }
      } else {
        await tx.insert(wishes).values({
          invitationId: invite.id,
          guestId: null,
          name: submittedName,
          message: data.message,
          isApproved: false,
          likes: 0,
          ipHash,
        });
      }
    });

    revalidatePath(`/${invite.slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/guests");
    revalidatePath("/dashboard/wishes");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Data RSVP tidak valid." };
    }
    console.error("Submit RSVP Error:", error);
    return { error: "Gagal mengirimkan RSVP. Silakan coba kembali." };
  }
}
