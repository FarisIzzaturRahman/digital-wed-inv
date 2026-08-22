import { createHmac, timingSafeEqual } from "crypto";
import { db, transactions, webhookEvents } from "db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const webhookSchema = z.object({
  gatewayRef: z.string().min(1).max(200),
  status: z.enum(["paid", "failed", "expired"]),
});

function hasValidSignature(rawPayload: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawPayload).digest("hex");
  const suppliedBuffer = Buffer.from(signature.toLowerCase());
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const rawPayload = await request.text();
  const signature = request.headers.get("x-payment-signature");

  if (!hasValidSignature(rawPayload, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const payload = webhookSchema.parse(JSON.parse(rawPayload));

    const processed = await db.transaction(async (txDb) => {
      const transaction = await txDb.query.transactions.findFirst({
        where: eq(transactions.gatewayRef, payload.gatewayRef),
      });
      if (!transaction) {
        return false;
      }

      const [event] = await txDb.insert(webhookEvents).values({
        gateway: transaction.gateway,
        eventType: `payment_${payload.status}`,
        gatewayRef: payload.gatewayRef,
        signatureValid: true,
        processed: false,
        payload,
      }).returning();

      if (payload.status === "paid" && transaction.status !== "paid") {
        await txDb.update(transactions)
          .set({
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, transaction.id));
      } else if (
        transaction.status !== "paid" &&
        (payload.status === "failed" || payload.status === "expired")
      ) {
        await txDb.update(transactions)
          .set({
            status: payload.status,
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, transaction.id));
      }

      await txDb.update(webhookEvents)
        .set({ processed: true })
        .where(eq(webhookEvents.id, event.id));
      return true;
    });

    if (!processed) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
