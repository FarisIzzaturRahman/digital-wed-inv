import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { redirect } from "next/navigation";
import { db } from "db";
import { invitations, guests } from "db";
import { eq } from "drizzle-orm";
import { GuestManager } from "./GuestManager";

export default async function GuestsPage() {
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

  const planInfo = await getTenantPlan(user.tenantId);

  // Load guests list with RSVPs
  const list = await db.query.guests.findMany({
    where: eq(guests.invitationId, invite.id),
    with: {
      rsvps: true,
    },
    orderBy: (guests, { desc }) => [desc(guests.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-slate-800">Daftar Tamu & RSVP</h1>
        <p className="text-xs text-slate-550">Kelola daftar undangan, generate link unik personal, monitor status RSVP, dan blast pesan via WhatsApp.</p>
      </div>

      <GuestManager 
        invitation={invite} 
        guests={list}
        planInfo={planInfo}
      />
    </div>
  );
}
