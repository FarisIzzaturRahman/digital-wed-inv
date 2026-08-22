UPDATE "invitations"
SET
	"status" = 'published',
	"published_at" = COALESCE("published_at", "created_at"),
	"updated_at" = now()
WHERE "status" = 'active';--> statement-breakpoint
UPDATE "invitations"
SET "template_id" = 'modern-minimal'
WHERE "template_id" = 'modern-minimalist';--> statement-breakpoint
UPDATE "plans"
SET "features" = jsonb_set(
	"features",
	'{templates}',
	COALESCE(
		(
			SELECT jsonb_agg(
				CASE
					WHEN template_id = 'modern-minimalist' THEN 'modern-minimal'
					ELSE template_id
				END
				ORDER BY template_order
			)
			FROM jsonb_array_elements_text("features"->'templates')
				WITH ORDINALITY AS templates(template_id, template_order)
		),
		'[]'::jsonb
	)
)
WHERE "features" ? 'templates';--> statement-breakpoint
UPDATE "events"
SET "type" = CASE
	WHEN "type" = 'ceremony' THEN 'akad'
	WHEN "type" = 'reception' THEN 'resepsi'
	ELSE 'custom'
END
WHERE "type" NOT IN ('akad', 'resepsi', 'pengajian', 'unduh_mantu', 'custom');--> statement-breakpoint
UPDATE "gifts"
SET "type" = CASE
	WHEN "type" = 'bank_transfer' THEN 'bank'
	WHEN "type" IN ('e_wallet', 'wallet') THEN 'ewallet'
	WHEN "type" IN ('physical', 'address') THEN 'physical_address'
	ELSE 'bank'
END
WHERE "type" NOT IN ('bank', 'ewallet', 'qris_static', 'physical_address');--> statement-breakpoint
UPDATE "events"
SET "maps_embed" = replace(
	substring("maps_embed" from 'src="([^"]+)"'),
	'&amp;',
	'&'
)
WHERE "maps_embed" ~* 'src="[^"]+"';--> statement-breakpoint
INSERT INTO "couples" (
	"invitation_id",
	"groom_full_name",
	"groom_nickname",
	"bride_full_name",
	"bride_nickname",
	"order_display"
)
SELECT
	i."id",
	'Pengantin Pria',
	'Pengantin Pria',
	'Pengantin Wanita',
	'Pengantin Wanita',
	'groom_first'
FROM "invitations" i
LEFT JOIN "couples" c ON c."invitation_id" = i."id"
WHERE c."invitation_id" IS NULL;--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_invitation_id_unique" UNIQUE("invitation_id");--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guest_id_unique" UNIQUE("guest_id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_unique" UNIQUE("tenant_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_gateway_ref_unique" UNIQUE("gateway_ref");--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_guest_id_unique" UNIQUE("guest_id");
