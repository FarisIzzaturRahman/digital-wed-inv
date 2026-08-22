"use server";

import { db, transactions } from "db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export async function simulatePaymentAction(transactionId: string, checkoutToken: string) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PAYMENT_SIMULATION_ENABLED !== "true"
  ) {
    return { error: "Simulasi pembayaran tidak tersedia." };
  }

  const parsed = z.object({
    transactionId: z.string().uuid(),
    checkoutToken: z.string().regex(/^[a-f0-9]{64}$/),
  }).safeParse({ transactionId, checkoutToken });

  if (!parsed.success) {
    return { error: "Checkout tidak valid." };
  }

  const transaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, transactionId),
      eq(transactions.idempotencyKey, checkoutToken)
    ),
  });

  if (!transaction || transaction.status !== "pending") {
    return { error: "Transaksi tidak tersedia atau sudah diproses." };
  }
  if (transaction.expiresAt && transaction.expiresAt.getTime() <= Date.now()) {
    await db.update(transactions)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(transactions.id, transaction.id));
    return { error: "Transaksi telah kedaluwarsa." };
  }

  await db.update(transactions)
    .set({
      status: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(transactions.id, transaction.id),
      eq(transactions.status, "pending")
    ));

  return { success: true };
}
