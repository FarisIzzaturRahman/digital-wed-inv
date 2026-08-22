"use server";

import {
  couples,
  db,
  events,
  galleryItems,
  gifts,
  invitations,
  stories,
} from "db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  normalizeMapsEmbedUrl,
  normalizeTemplateId,
} from "shared";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "checkout",
  "dashboard",
  "login",
  "logout",
  "register",
]);

const optionalHttpUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "URL tidak valid.");

const invitationUpdateSchema = z.object({
  slug: z.string().trim().regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."
  ),
  status: z.enum(["draft", "published"]),
  religion: z.enum(["islam", "kristen", "katolik", "hindu", "buddha", "umum"]),
  locale: z.enum(["id", "en"]),
  isPrivate: z.boolean(),
  pin: z.string().trim().max(6).optional().default(""),
  musicUrl: optionalHttpUrl,
  coverImageUrl: optionalHttpUrl,
  themeId: z.string().trim().min(1).max(80),
  themeColorPrimary: z.string().regex(/^#[0-9a-f]{6}$/i),
  themeColorAccent: z.string().regex(/^#[0-9a-f]{6}$/i),
  themeColorBg: z.string().regex(/^#[0-9a-f]{6}$/i),
  themeColorText: z.string().regex(/^#[0-9a-f]{6}$/i),
  themeFontHeading: z.string().trim().min(1).max(80),
  themeFontBody: z.string().trim().min(1).max(80),
  themeRadius: z.string().trim().regex(/^\d{1,3}px$/),
  groomFullName: z.string().trim().min(1).max(120),
  groomNickname: z.string().trim().min(1).max(80),
  groomFather: z.string().trim().max(120),
  groomMother: z.string().trim().max(120),
  groomChildOrder: z.string().trim().max(80),
  groomInstagram: z.string().trim().max(100),
  groomPhotoUrl: optionalHttpUrl,
  brideFullName: z.string().trim().min(1).max(120),
  brideNickname: z.string().trim().min(1).max(80),
  brideFather: z.string().trim().max(120),
  brideMother: z.string().trim().max(120),
  brideChildOrder: z.string().trim().max(80),
  brideInstagram: z.string().trim().max(100),
  bridePhotoUrl: optionalHttpUrl,
  orderDisplay: z.enum(["groom_first", "bride_first"]),
  events: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    type: z.enum(["akad", "resepsi", "pengajian", "unduh_mantu", "custom"]),
    startAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
    endAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
    venueName: z.string().trim().min(1).max(160),
    venueAddress: z.string().trim().max(500),
    mapsUrl: optionalHttpUrl,
    mapsEmbed: z.string().trim().max(5000),
    dressCode: z.string().trim().max(200),
    note: z.string().trim().max(500),
  })).max(20),
  stories: z.array(z.object({
    title: z.string().trim().min(1).max(160),
    date: z.string().trim().min(1).max(100),
    body: z.string().trim().min(1).max(5000),
    imageUrl: optionalHttpUrl,
  })).max(50),
  gallery: z.array(z.object({
    url: optionalHttpUrl.refine(Boolean, "URL galeri wajib diisi."),
    caption: z.string().trim().max(300),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    orderIndex: z.number().int().min(0).max(10_000).optional(),
  })).max(100),
  gifts: z.array(z.object({
    type: z.enum(["bank", "ewallet", "qris_static", "physical_address"]),
    label: z.string().trim().min(1).max(100),
    accountName: z.string().trim().min(1).max(120),
    accountNumber: z.string().trim().max(100),
    addressText: z.string().trim().max(1000),
  })).max(20),
});

export async function updateInvitationAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa. Silakan masuk kembali." };

  try {
    const data = invitationUpdateSchema.parse(input);
    if (RESERVED_SLUGS.has(data.slug)) {
      return { error: "Slug tersebut digunakan oleh sistem. Pilih slug lain." };
    }

    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.tenantId, user.tenantId),
    });
    if (!invite) return { error: "Undangan tidak ditemukan." };

    const planInfo = await getTenantPlan(user.tenantId);
    const templateId = normalizeTemplateId(data.themeId);
    if (!planInfo.features.templates.includes(templateId)) {
      return { error: "Template tersebut tidak tersedia pada paket Anda." };
    }
    if (data.musicUrl && !planInfo.features.hasMusic) {
      return { error: "Musik latar tidak tersedia pada paket Anda." };
    }
    if (data.events.length > planInfo.features.eventLimit) {
      return { error: `Paket Anda hanya mendukung ${planInfo.features.eventLimit} acara.` };
    }
    if (data.stories.length > 0 && !planInfo.features.hasStories) {
      return { error: "Cerita perjalanan tidak tersedia pada paket Anda." };
    }
    if (data.gifts.length > 0 && !planInfo.features.hasEnvelopes) {
      return { error: "Kado digital tidak tersedia pada paket Anda." };
    }

    let storedPin: string | null = null;
    if (data.isPrivate) {
      if (data.pin) {
        if (!/^\d{6}$/.test(data.pin)) {
          return { error: "PIN privat harus terdiri dari 6 digit." };
        }
        storedPin = hashPassword(data.pin);
      } else if (invite.pin) {
        storedPin = invite.pin;
      } else {
        return { error: "PIN 6 digit wajib diisi untuk undangan privat." };
      }
    }

    const normalizedEvents = data.events.map((event) => {
      const mapsEmbed = normalizeMapsEmbedUrl(event.mapsEmbed);
      if (event.mapsEmbed && !mapsEmbed) {
        throw new Error("INVALID_MAP_EMBED");
      }
      const startAt = new Date(event.startAt);
      const endAt = new Date(event.endAt);
      if (endAt < startAt) {
        throw new Error("INVALID_EVENT_RANGE");
      }
      return { ...event, mapsEmbed, startAt, endAt };
    });

    await db.transaction(async (txDb) => {
      await txDb.update(invitations)
        .set({
          slug: data.slug,
          status: data.status,
          religion: data.religion,
          locale: data.locale,
          isPrivate: data.isPrivate,
          pin: storedPin,
          musicUrl: data.musicUrl || null,
          coverImageUrl: data.coverImageUrl || null,
          templateId,
          publishedAt:
            data.status === "published" ? invite.publishedAt || new Date() : null,
          updatedAt: new Date(),
          theme: {
            colorPrimary: data.themeColorPrimary,
            colorAccent: data.themeColorAccent,
            colorBg: data.themeColorBg,
            colorText: data.themeColorText,
            fontHeading: data.themeFontHeading,
            fontBody: data.themeFontBody,
            radius: data.themeRadius,
            pattern: "none",
          },
        })
        .where(eq(invitations.id, invite.id));

      await txDb.insert(couples).values({
        invitationId: invite.id,
        groomFullName: data.groomFullName,
        groomNickname: data.groomNickname,
        groomFather: data.groomFather || null,
        groomMother: data.groomMother || null,
        groomChildOrder: data.groomChildOrder || null,
        groomInstagram: data.groomInstagram || null,
        groomPhotoUrl: data.groomPhotoUrl || null,
        brideFullName: data.brideFullName,
        brideNickname: data.brideNickname,
        brideFather: data.brideFather || null,
        brideMother: data.brideMother || null,
        brideChildOrder: data.brideChildOrder || null,
        brideInstagram: data.brideInstagram || null,
        bridePhotoUrl: data.bridePhotoUrl || null,
        orderDisplay: data.orderDisplay,
      }).onConflictDoUpdate({
        target: couples.invitationId,
        set: {
          groomFullName: data.groomFullName,
          groomNickname: data.groomNickname,
          groomFather: data.groomFather || null,
          groomMother: data.groomMother || null,
          groomChildOrder: data.groomChildOrder || null,
          groomInstagram: data.groomInstagram || null,
          groomPhotoUrl: data.groomPhotoUrl || null,
          brideFullName: data.brideFullName,
          brideNickname: data.brideNickname,
          brideFather: data.brideFather || null,
          brideMother: data.brideMother || null,
          brideChildOrder: data.brideChildOrder || null,
          brideInstagram: data.brideInstagram || null,
          bridePhotoUrl: data.bridePhotoUrl || null,
          orderDisplay: data.orderDisplay,
          updatedAt: new Date(),
        },
      });

      await txDb.delete(events).where(eq(events.invitationId, invite.id));
      if (normalizedEvents.length) {
        await txDb.insert(events).values(normalizedEvents.map((event) => ({
          invitationId: invite.id,
          title: event.title,
          type: event.type,
          startAt: event.startAt,
          endAt: event.endAt,
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          mapsUrl: event.mapsUrl || null,
          mapsEmbed: event.mapsEmbed,
          dressCode: event.dressCode || null,
          note: event.note || null,
        })));
      }

      await txDb.delete(stories).where(eq(stories.invitationId, invite.id));
      if (data.stories.length) {
        await txDb.insert(stories).values(data.stories.map((story, orderIndex) => ({
          invitationId: invite.id,
          title: story.title,
          date: story.date,
          body: story.body,
          imageUrl: story.imageUrl || null,
          orderIndex,
        })));
      }

      await txDb.delete(galleryItems).where(eq(galleryItems.invitationId, invite.id));
      if (data.gallery.length) {
        await txDb.insert(galleryItems).values(data.gallery.map((item, index) => ({
          invitationId: invite.id,
          url: item.url,
          caption: item.caption || null,
          orderIndex: item.orderIndex ?? item.sortOrder ?? index,
        })));
      }

      await txDb.delete(gifts).where(eq(gifts.invitationId, invite.id));
      if (data.gifts.length) {
        await txDb.insert(gifts).values(data.gifts.map((gift, orderIndex) => ({
          invitationId: invite.id,
          type: gift.type,
          label: gift.label,
          accountName: gift.accountName,
          accountNumber: gift.accountNumber,
          addressText: gift.addressText || null,
          orderIndex,
        })));
      }
    });

    revalidatePath("/dashboard/invitation");
    revalidatePath("/dashboard");
    revalidatePath(`/${invite.slug}`);
    revalidatePath(`/${data.slug}`);
    return { success: true, slug: data.slug };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Data undangan tidak valid." };
    }
    if (error instanceof Error && error.message === "INVALID_MAP_EMBED") {
      return { error: "Embed peta harus menggunakan URL Google Maps Embed yang valid." };
    }
    if (error instanceof Error && error.message === "INVALID_EVENT_RANGE") {
      return { error: "Waktu selesai acara tidak boleh lebih awal dari waktu mulai." };
    }
    const databaseError = error as { code?: string; message?: string };
    if (databaseError.code === "23505" || databaseError.message?.includes("unique")) {
      return { error: "URL slug sudah digunakan. Silakan pilih slug lain." };
    }
    console.error("Update Invitation Error:", error);
    return { error: "Gagal menyimpan perubahan. Silakan periksa data Anda." };
  }
}
