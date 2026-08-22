import React from "react";
import { db } from "db";
import { 
  invitations, couples, events, stories, galleryItems, gifts, wishes, guests 
} from "db";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { InvitationWrapper } from "../../InvitationWrapper";
import { getCurrentUser, hasInvitationAccess } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { InvitationAccessGate } from "../../InvitationAccessGate";
import { serializeInvitationPayload } from "@/lib/serializers";

export default async function PersonalInvitationPage({
  params,
}: {
  params: Promise<{ invitationSlug: string; slug_token: string }>;
}) {
  const { invitationSlug, slug_token } = await params;

  // 1. Fetch invitation & guest in parallel first
  const [invite, user] = await Promise.all([
    db.query.invitations.findFirst({
      where: eq(invitations.slug, invitationSlug),
    }),
    getCurrentUser(),
  ]);

  if (!invite) {
    notFound();
  }

  const isOwnerPreview = user?.tenantId === invite.tenantId;
  if (invite.status !== "published" && !isOwnerPreview) {
    notFound();
  }

  if (
    invite.isPrivate &&
    !isOwnerPreview &&
    !(await hasInvitationAccess(invite.id))
  ) {
    return <InvitationAccessGate invitationId={invite.id} />;
  }

  // 2. Fetch guest by token
  const guestObj = await db.query.guests.findFirst({
    where: and(
      eq(guests.invitationId, invite.id),
      eq(guests.slugToken, slug_token)
    ),
  });

  // If token is invalid, fallback redirect to public general link
  if (!guestObj) {
    redirect(`/${invitationSlug}`);
  }

  // 3. Update opened status & fetch all content concurrently (Parallelized)
  const markOpenedPromise = !guestObj.openedAt
    ? db.update(guests)
        .set({ 
          openedAt: new Date(),
          sentStatus: "opened" 
        })
        .where(eq(guests.id, guestObj.id))
    : Promise.resolve();

  const [coupleObj, eventsList, storiesList, galleryList, giftsList, wishesList, planInfo] = await Promise.all([
    db.query.couples.findFirst({
      where: eq(couples.invitationId, invite.id),
    }),
    db.query.events.findMany({
      where: eq(events.invitationId, invite.id),
      orderBy: (events, { asc }) => [asc(events.startAt)],
    }),
    db.query.stories.findMany({
      where: eq(stories.invitationId, invite.id),
      orderBy: (stories, { asc }) => [asc(stories.createdAt)],
    }),
    db.query.galleryItems.findMany({
      where: eq(galleryItems.invitationId, invite.id),
      orderBy: (galleryItems, { asc }) => [asc(galleryItems.orderIndex)],
    }),
    db.query.gifts.findMany({
      where: eq(gifts.invitationId, invite.id),
    }),
    db.query.wishes.findMany({
      where: and(
        eq(wishes.invitationId, invite.id),
        eq(wishes.isApproved, true)
      ),
      orderBy: (wishes, { desc }) => [desc(wishes.createdAt)],
    }),
    getTenantPlan(invite.tenantId),
    markOpenedPromise,
  ]);

  if (!coupleObj) {
    notFound();
  }

  const { publicInvitation, serializedEvents, serializedWishes } = serializeInvitationPayload({
    invite,
    events: eventsList,
    wishes: wishesList,
  });

  return (
    <div className="relative min-h-screen">
      {/* Draft banner notice */}
      {invite.status === "draft" && (
        <div className="sticky top-0 z-50 bg-amber-500 text-slate-900 text-center py-2 px-4 text-xs font-bold shadow-md">
          ⚠️ Mode Pratinjau Draft: Undangan ini belum aktif/publik untuk umum.
        </div>
      )}

      <InvitationWrapper 
        invitation={publicInvitation}
        couple={coupleObj}
        events={serializedEvents}
        stories={storiesList}
        gallery={galleryList}
        gifts={giftsList}
        wishes={serializedWishes}
        guestName={guestObj.name}
        guestToken={guestObj.slugToken}
        guestId={guestObj.id}
        showWatermark={planInfo.features.watermark}
      />
    </div>
  );
}
