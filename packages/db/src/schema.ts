import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("operator"), // superadmin, operator, editor, guest, suspended
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("users_role_idx").on(table.role),
]);

// 2. Tenants
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"), // free, premium, business
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tenants_owner_user_id_idx").on(table.ownerUserId),
]);

// 3. Invitations
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, published, archived
  templateId: text("template_id").notNull().default("classic-gold"),
  theme: jsonb("theme").notNull().default({}), // colorPrimary, colorBg, fontHeading, etc.
  locale: text("locale").notNull().default("id"), // id, en, ar, jv, su
  religion: text("religion").notNull().default("islam"), // islam, kristen, katolik, hindu, buddha, umum
  isPrivate: boolean("is_private").notNull().default(false),
  pin: text("pin"),
  musicUrl: text("music_url"),
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("invitations_tenant_id_idx").on(table.tenantId),
  index("invitations_status_idx").on(table.status),
  index("invitations_slug_status_idx").on(table.slug, table.status),
]);

// 4. Couples
export const couples = pgTable("couples", {
  invitationId: uuid("invitation_id").primaryKey().references(() => invitations.id, { onDelete: "cascade" }),
  
  groomFullName: text("groom_full_name").notNull(),
  groomNickname: text("groom_nickname").notNull(),
  groomChildOrder: text("groom_child_order"),
  groomFather: text("groom_father"),
  groomMother: text("groom_mother"),
  groomPhotoUrl: text("groom_photo_url"),
  groomInstagram: text("groom_instagram"),
  
  brideFullName: text("bride_full_name").notNull(),
  brideNickname: text("bride_nickname").notNull(),
  brideChildOrder: text("bride_child_order"),
  brideFather: text("bride_father"),
  brideMother: text("bride_mother"),
  bridePhotoUrl: text("bride_photo_url"),
  brideInstagram: text("bride_instagram"),
  
  orderDisplay: text("order_display").notNull().default("groom_first"), // groom_first, bride_first
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. Events
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("akad"), // akad, resepsi, pengajian, unduh_mantu, custom
  title: text("title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  mapsUrl: text("maps_url"),
  mapsEmbed: text("maps_embed"),
  livestreamUrl: text("livestream_url"),
  dressCode: text("dress_code"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("events_invitation_id_idx").on(table.invitationId),
  index("events_start_at_idx").on(table.startAt),
]);

// 6. Stories
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // text representation of date/period e.g. "Desember 2021"
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("stories_invitation_id_idx").on(table.invitationId),
  index("stories_order_idx").on(table.invitationId, table.orderIndex),
]);

// 7. Gallery Items
export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("image"), // image, video
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  orderIndex: integer("order_index").notNull().default(0),
  layoutHint: text("layout_hint").notNull().default("masonry"), // masonry, carousel, polaroid
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("gallery_items_invitation_id_idx").on(table.invitationId),
  index("gallery_items_order_idx").on(table.invitationId, table.orderIndex),
]);

// 8. Guests
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slugToken: text("slug_token").notNull(), // short unique token
  phone: text("phone"),
  category: text("category").notNull().default("teman"), // vip, keluarga, teman, kantor
  groupLabel: text("group_label"),
  sentStatus: text("sent_status").notNull().default("pending"), // pending, sent, opened
  openedAt: timestamp("opened_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("guests_invitation_id_idx").on(table.invitationId),
  index("guests_tenant_id_idx").on(table.tenantId),
  uniqueIndex("guests_invitation_token_idx").on(table.invitationId, table.slugToken),
]);

// 9. RSVPs
export const rsvps = pgTable("rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").unique().references(() => guests.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  attendance: text("attendance").notNull(), // yes, no, maybe
  headcount: integer("headcount").notNull().default(1),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
}, (table) => [
  index("rsvps_invitation_id_idx").on(table.invitationId),
  index("rsvps_attendance_idx").on(table.invitationId, table.attendance),
]);

// 10. Wishes (Guest Book)
export const wishes = pgTable("wishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").unique().references(() => guests.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  ipHash: text("ip_hash"),
}, (table) => [
  index("wishes_invitation_id_idx").on(table.invitationId),
  index("wishes_approved_idx").on(table.invitationId, table.isApproved),
  index("wishes_created_at_idx").on(table.createdAt),
]);

// 11. Gifts (Static cash/gift details)
export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("bank"), // bank, ewallet, qris_static, physical_address
  label: text("label").notNull(), // e.g. "BCA", "Gopay"
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  qrisImageUrl: text("qris_image_url"),
  addressText: text("address_text"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("gifts_invitation_id_idx").on(table.invitationId),
]);

// 12. Payment Accounts (KYC registration of the couple's bank accounts for disbursement)
export const paymentAccounts = pgTable("payment_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invitationId: uuid("invitation_id").notNull().unique().references(() => invitations.id, { onDelete: "cascade" }),
  holderName: text("holder_name").notNull(),
  bankCode: text("bank_code").notNull(),
  accountNumber: text("account_number").notNull(),
  accountNameVerified: boolean("account_name_verified").notNull().default(false),
  kycStatus: text("kyc_status").notNull().default("pending"), // pending, verified, rejected
  gatewayRecipientId: text("gateway_recipient_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("payment_accounts_tenant_id_idx").on(table.tenantId),
]);

// 13. Transactions (Digital envelopes paid online)
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
  gateway: text("gateway").notNull(), // xendit, midtrans
  gatewayRef: text("gateway_ref").notNull().unique(), // transaction reference ID in payment gateway
  method: text("method").notNull(), // qris, va, ewallet, card
  amount: integer("amount").notNull(), // amount in IDR
  fee: integer("fee").notNull().default(0),
  netAmount: integer("net_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, expired, failed
  senderName: text("sender_name").notNull(),
  message: text("message"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("transactions_invitation_id_idx").on(table.invitationId),
  index("transactions_tenant_id_idx").on(table.tenantId),
  index("transactions_status_idx").on(table.status),
]);

// 14. Disbursements (Sending collected envelope money to couple's bank accounts)
export const disbursements = pgTable("disbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  paymentAccountId: uuid("payment_account_id").notNull().references(() => paymentAccounts.id, { onDelete: "cascade" }),
  gatewayDisbursementRef: text("gateway_disbursement_ref"),
  amount: integer("amount").notNull(),
  fee: integer("fee").notNull().default(0),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  batchId: text("batch_id"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("disbursements_invitation_id_idx").on(table.invitationId),
  index("disbursements_payment_account_id_idx").on(table.paymentAccountId),
]);

// 15. Webhook Events (For idempotency and auditing)
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateway: text("gateway").notNull(),
  eventType: text("event_type").notNull(),
  gatewayRef: text("gateway_ref").notNull(),
  signatureValid: boolean("signature_valid").notNull().default(false),
  processed: boolean("processed").notNull().default(false),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("webhook_events_gateway_ref_idx").on(table.gatewayRef),
]);

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  tenants: many(tenants),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, { fields: [tenants.ownerUserId], references: [users.id] }),
  invitations: many(invitations),
  guests: many(guests),
  paymentAccounts: many(paymentAccounts),
  subscriptions: many(subscriptions),
  subscriptionInvoices: many(subscriptionInvoices),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [invitations.tenantId], references: [tenants.id] }),
  couple: one(couples, { fields: [invitations.id], references: [couples.invitationId] }),
  events: many(events),
  stories: many(stories),
  galleryItems: many(galleryItems),
  guests: many(guests),
  rsvps: many(rsvps),
  wishes: many(wishes),
  gifts: many(gifts),
  transactions: many(transactions),
}));

export const couplesRelations = relations(couples, ({ one }) => ({
  invitation: one(invitations, { fields: [couples.invitationId], references: [invitations.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  invitation: one(invitations, { fields: [events.invitationId], references: [invitations.id] }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  invitation: one(invitations, { fields: [stories.invitationId], references: [invitations.id] }),
}));

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  invitation: one(invitations, { fields: [galleryItems.invitationId], references: [invitations.id] }),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  invitation: one(invitations, { fields: [guests.invitationId], references: [invitations.id] }),
  tenant: one(tenants, { fields: [guests.tenantId], references: [tenants.id] }),
  rsvps: many(rsvps),
  wishes: many(wishes),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  invitation: one(invitations, { fields: [rsvps.invitationId], references: [invitations.id] }),
  guest: one(guests, { fields: [rsvps.guestId], references: [guests.id] }),
}));

export const wishesRelations = relations(wishes, ({ one }) => ({
  invitation: one(invitations, { fields: [wishes.invitationId], references: [invitations.id] }),
  guest: one(guests, { fields: [wishes.guestId], references: [guests.id] }),
}));

export const giftsRelations = relations(gifts, ({ one }) => ({
  invitation: one(invitations, { fields: [gifts.invitationId], references: [invitations.id] }),
}));

// 16. Plans
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  features: jsonb("features").notNull().default({}), // e.g. { guestLimit: 50, eventLimit: 1, hasEnvelopes: false }
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 17. Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().unique().references(() => tenants.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // active, expired, cancelled
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("subscriptions_tenant_id_idx").on(table.tenantId),
  index("subscriptions_status_idx").on(table.status),
]);

// 18. Subscription Invoices
export const subscriptionInvoices = pgTable("subscription_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed
  gatewayRef: text("gateway_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("subscription_invoices_tenant_id_idx").on(table.tenantId),
]);

// 19. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // e.g. "suspend_user", "change_plan", "change_price"
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [subscriptions.tenantId], references: [tenants.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
  invoices: many(subscriptionInvoices),
}));

export const subscriptionInvoicesRelations = relations(subscriptionInvoices, ({ one }) => ({
  tenant: one(tenants, { fields: [subscriptionInvoices.tenantId], references: [tenants.id] }),
  subscription: one(subscriptions, { fields: [subscriptionInvoices.subscriptionId], references: [subscriptions.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
