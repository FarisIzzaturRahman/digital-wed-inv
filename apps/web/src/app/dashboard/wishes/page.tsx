import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "db";
import { invitations, wishes } from "db";
import { eq } from "drizzle-orm";
import { WishesManager } from "./WishesManager";

export default async function WishesPage() {
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

  // Load wishes
  const wishesList = await db.query.wishes.findMany({
    where: eq(wishes.invitationId, invite.id),
    orderBy: (wishes, { desc }) => [desc(wishes.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-slate-800">Moderasi Ucapan (Buku Tamu)</h1>
        <p className="text-xs text-slate-500">Moderasi ucapan & doa restu dari para tamu undangan sebelum ditampilkan di halaman publik.</p>
      </div>

      <WishesManager 
        wishes={wishesList}
      />
    </div>
  );
}
