import { randomBytes } from "crypto";
import { db, guests, invitations, transactions } from "db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasInvitationAccess } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";

const transactionSchema = z.object({
  invitationId: z.string().uuid(),
  guestId: z.string().uuid().nullable().optional(),
  guestToken: z.string().min(1).max(128).nullable().optional(),
  amount: z.coerce.number().int().min(10_000).max(100_000_000),
  senderName: z.string().trim().min(1).max(120),
  message: z.string().trim().max(500).nullable().optional(),
  method: z.enum(["qris", "va", "ewallet", "card"]),
});

export async function POST(request: Request) {
  try {
    const data = transactionSchema.parse(await request.json());
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.id, data.invitationId),
    });

    if (!invite || invite.status !== "published") {
      return NextResponse.json({ error: "Invitation not available" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.tenantId === invite.tenantId;
    if (invite.isPrivate && !isOwner && !(await hasInvitationAccess(invite.id))) {
      return NextResponse.json({ error: "Invitation access required" }, { status: 403 });
    }

    if (data.guestId) {
      const guest = await db.query.guests.findFirst({
        where: and(
          eq(guests.id, data.guestId),
          eq(guests.invitationId, invite.id),
          eq(guests.slugToken, data.guestToken || "")
        ),
      });
      if (!guest) {
        return NextResponse.json({ error: "Invalid guest link" }, { status: 403 });
      }
    }

    const planInfo = await getTenantPlan(invite.tenantId);
    if (!planInfo.features.hasEnvelopes) {
      return NextResponse.json(
        { error: "Digital envelopes are not enabled for this invitation" },
        { status: 403 }
      );
    }

    const gatewayRef = `SD-ENV-${Date.now()}-${randomBytes(4).toString("hex")}`;
    const checkoutToken = randomBytes(32).toString("hex");
    const fee = Math.round(data.amount * 0.015);

    const [transaction] = await db.insert(transactions).values({
      invitationId: invite.id,
      tenantId: invite.tenantId,
      guestId: data.guestId || null,
      gateway: "midtrans_mock",
      gatewayRef,
      method: data.method,
      amount: data.amount,
      fee,
      netAmount: data.amount - fee,
      status: "pending",
      senderName: data.senderName,
      message: data.message || null,
      idempotencyKey: checkoutToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }).returning();

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      checkoutToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid transaction data" },
        { status: 400 }
      );
    }
    console.error("Create Transaction API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
