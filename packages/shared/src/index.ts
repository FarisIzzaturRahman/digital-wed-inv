import { z } from "zod";

// User & Tenant Constants
export const USER_ROLES = ["superadmin", "operator", "editor", "guest"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Invitation Constants
export const INVITATION_STATUSES = ["draft", "published", "archived"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const RELIGIONS = ["islam", "kristen", "katolik", "hindu", "buddha", "umum"] as const;
export type Religion = (typeof RELIGIONS)[number];

export const LOCALES = ["id", "en", "ar", "jv", "su"] as const;
export type Locale = (typeof LOCALES)[number];

export const EVENT_TYPES = ["akad", "resepsi", "pengajian", "unduh_mantu", "custom"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const LAYOUT_HINTS = ["masonry", "carousel", "polaroid"] as const;
export type LayoutHint = (typeof LAYOUT_HINTS)[number];

export const GUEST_CATEGORIES = ["vip", "keluarga", "teman", "kantor"] as const;
export type GuestCategory = (typeof GUEST_CATEGORIES)[number];

export const GUEST_SENT_STATUSES = ["pending", "sent", "opened"] as const;
export type GuestSentStatus = (typeof GUEST_SENT_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["yes", "no", "maybe"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const GIFT_TYPES = ["bank", "ewallet", "qris_static", "physical_address"] as const;
export type GiftType = (typeof GIFT_TYPES)[number];

// Theme Schema
export const ThemeSchema = z.object({
  colorPrimary: z.string().default("#d4af37"), // Gold
  colorAccent: z.string().default("#b8860b"), // Dark Gold
  colorBg: z.string().default("#fffdf9"), // Off-white warm
  colorText: z.string().default("#2c2c2c"),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  radius: z.string().default("8px"),
  pattern: z.string().default("floral"),
});
export type ThemeConfig = z.infer<typeof ThemeSchema>;

// Zod Schemas
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(USER_ROLES).default("operator"),
});

export const InvitationBaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: z.enum(INVITATION_STATUSES).default("draft"),
  templateId: z.string().default("classic-gold"),
  theme: ThemeSchema,
  locale: z.enum(LOCALES).default("id"),
  religion: z.enum(RELIGIONS).default("islam"),
  isPrivate: z.boolean().default(false),
  pin: z.string().length(6, "PIN must be exactly 6 characters").nullable().optional(),
  musicUrl: z.string().url("Invalid music URL").or(z.string().length(0)).nullable().optional(),
  coverImageUrl: z.string().url("Invalid cover image URL").or(z.string().length(0)).nullable().optional(),
});

export const CoupleSchema = z.object({
  groomFullName: z.string().min(1, "Groom full name is required"),
  groomNickname: z.string().min(1, "Groom nickname is required"),
  groomChildOrder: z.string().optional().nullable(),
  groomFather: z.string().optional().nullable(),
  groomMother: z.string().optional().nullable(),
  groomPhotoUrl: z.string().url("Invalid photo URL").or(z.string().length(0)).nullable().optional(),
  groomInstagram: z.string().optional().nullable(),
  
  brideFullName: z.string().min(1, "Bride full name is required"),
  brideNickname: z.string().min(1, "Bride nickname is required"),
  brideChildOrder: z.string().optional().nullable(),
  brideFather: z.string().optional().nullable(),
  brideMother: z.string().optional().nullable(),
  bridePhotoUrl: z.string().url("Invalid photo URL").or(z.string().length(0)).nullable().optional(),
  brideInstagram: z.string().optional().nullable(),
  
  orderDisplay: z.enum(["groom_first", "bride_first"]).default("groom_first"),
});

export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(EVENT_TYPES).default("akad"),
  title: z.string().min(1, "Event title is required"),
  startAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date time"),
  endAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date time"),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  mapsUrl: z.string().url("Invalid Google Maps URL").or(z.string().length(0)).nullable().optional(),
  mapsEmbed: z.string().or(z.string().length(0)).nullable().optional(),
  livestreamUrl: z.string().url("Invalid livestream URL").or(z.string().length(0)).nullable().optional(),
  dressCode: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const StorySchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().min(1, "Date/Period is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body text is required"),
  imageUrl: z.string().url("Invalid image URL").or(z.string().length(0)).nullable().optional(),
  orderIndex: z.number().int().default(0),
});

export const GalleryItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().url("Invalid URL"),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").or(z.string().length(0)).nullable().optional(),
  caption: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
  layoutHint: z.enum(LAYOUT_HINTS).default("masonry"),
});

export const GuestSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Guest name is required"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be E.164 format").or(z.string().length(0)).nullable().optional(),
  category: z.enum(GUEST_CATEGORIES).default("teman"),
  groupLabel: z.string().optional().nullable(),
  sentStatus: z.enum(GUEST_SENT_STATUSES).default("pending"),
});

export const RsvpsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  attendance: z.enum(ATTENDANCE_STATUSES),
  headcount: z.number().int().min(1, "Must be at least 1 guest").max(10, "Maximum 10 guests"),
  message: z.string().max(1000).optional().nullable(),
});

export const WishesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  message: z.string().min(2, "Message is required").max(1000),
});

export const GiftSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(GIFT_TYPES).default("bank"),
  label: z.string().min(1, "Bank/Wallet/Label name is required"), // e.g., "BCA", "Gopay", "Kado Fisik"
  accountName: z.string().min(1, "Account owner name is required"),
  accountNumber: z.string().min(1, "Account number/Phone is required"),
  qrisImageUrl: z.string().url("Invalid QRIS image URL").or(z.string().length(0)).nullable().optional(),
  addressText: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const PaymentAccountSchema = z.object({
  holderName: z.string().min(1, "Bank holder name is required"),
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z.string().min(1, "Account number is required"),
});

export const TransactionCreateSchema = z.object({
  amount: z.number().int().min(10000, "Minimum amount is Rp 10.000"),
  senderName: z.string().min(1, "Sender name is required"),
  message: z.string().max(500).optional().nullable(),
});

export function normalizeTemplateId(templateId: string): string {
  return templateId === "modern-minimalist" ? "modern-minimal" : templateId;
}

export function normalizeMapsEmbedUrl(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  const iframeMatch = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (iframeMatch?.[1] || trimmed).replace(/&amp;/g, "&");

  try {
    const parsed = new URL(candidate);
    const allowedHost =
      parsed.hostname === "www.google.com" || parsed.hostname === "maps.google.com";
    const allowedPath =
      parsed.pathname.startsWith("/maps/embed") ||
      (parsed.pathname === "/maps" && parsed.searchParams.get("output") === "embed");

    if (parsed.protocol !== "https:" || !allowedHost || !allowedPath) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
