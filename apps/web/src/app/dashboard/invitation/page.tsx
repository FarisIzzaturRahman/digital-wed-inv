import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "db";
import { invitations, couples, events, stories, galleryItems, gifts } from "db";
import { eq } from "drizzle-orm";
import { InvitationForm } from "./InvitationForm";

export default async function InvitationPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logout");
  }

  // Load invitation
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.tenantId, user.tenantId),
  });

  if (!invite) {
    redirect("/dashboard");
  }

  // Load couple
  const couple = await db.query.couples.findFirst({
    where: eq(couples.invitationId, invite.id),
  });

  // Load events
  const inviteEvents = await db.query.events.findMany({
    where: eq(events.invitationId, invite.id),
  });

  // Load stories
  const inviteStories = await db.query.stories.findMany({
    where: eq(stories.invitationId, invite.id),
  });

  // Load gallery
  const inviteGallery = await db.query.galleryItems.findMany({
    where: eq(galleryItems.invitationId, invite.id),
    orderBy: (galleryItems, { asc }) => [asc(galleryItems.orderIndex)],
  });

  // Load gifts
  const inviteGifts = await db.query.gifts.findMany({
    where: eq(gifts.invitationId, invite.id),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-slate-800">Edit Detail Undangan</h1>
        <p className="text-xs text-slate-500">Sesuaikan informasi acara, profil mempelai, foto galeri, kado, dan tema desain.</p>
      </div>

      <InvitationForm 
        invitation={{
          id: invite.id,
          slug: invite.slug,
          status: invite.status,
          templateId: invite.templateId,
          theme: invite.theme,
          locale: invite.locale,
          religion: invite.religion,
          isPrivate: invite.isPrivate,
          hasPin: Boolean(invite.pin),
          musicUrl: invite.musicUrl,
          coverImageUrl: invite.coverImageUrl,
        }}
        couple={couple || {}}
        events={inviteEvents}
        stories={inviteStories}
        gallery={inviteGallery}
        gifts={inviteGifts}
      />
    </div>
  );
}
