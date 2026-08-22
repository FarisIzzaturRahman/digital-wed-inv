import React from "react";
import { db } from "db";
import { 
  invitations, couples, events, stories, galleryItems, gifts, wishes 
} from "db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvitationWrapper } from "./InvitationWrapper";
import { getCurrentUser, hasInvitationAccess } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { InvitationAccessGate } from "./InvitationAccessGate";
import { serializeInvitationPayload } from "@/lib/serializers";

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ invitationSlug: string }>;
}) {
  const { invitationSlug } = await params;

  // 1. Fetch invitation
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.slug, invitationSlug),
  });

  if (!invite) {
    notFound();
  }

  const user = await getCurrentUser();
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

  // 2. Fetch all invitation contents & plan concurrently (Parallelized - 1 Database RTT)
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
        showWatermark={planInfo.features.watermark}
      />
    </div>
  );
}
