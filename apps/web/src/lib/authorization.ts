import { db, invitations } from "db";
import { and, eq } from "drizzle-orm";
import { getCurrentUser, isAdminElevated } from "./auth";

export async function getOwnedInvitation(invitationId: string, tenantId: string) {
  return db.query.invitations.findFirst({
    where: and(
      eq(invitations.id, invitationId),
      eq(invitations.tenantId, tenantId)
    ),
  });
}

export async function requireVerifiedAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    return null;
  }

  return (await isAdminElevated(user.id)) ? user : null;
}
