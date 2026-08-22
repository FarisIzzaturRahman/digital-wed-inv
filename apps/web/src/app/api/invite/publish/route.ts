import { NextResponse } from "next/server";
import { db } from "db";
import { invitations } from "db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invitationId, status } = await request.json();

    if (!invitationId || !["published", "draft"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Security: verify the invitation belongs to this user's tenant
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.id, invitationId),
    });

    if (!invite || invite.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.update(invitations)
      .set({
        status,
        publishedAt: status === "published" ? invite.publishedAt || new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId));

    revalidatePath("/dashboard");
    revalidatePath(`/${invite.slug}`);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Publish toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
