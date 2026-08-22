"use server";

import {
  db,
  disbursements,
  invitations,
  paymentAccounts,
  transactions,
} from "db";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedInvitation } from "@/lib/authorization";
import { getTenantPlan } from "@/lib/licensing";

const paymentAccountSchema = z.object({
  holderName: z.string().trim().min(2).max(120),
  bankCode: z.string().trim().min(2).max(30),
  accountNumber: z.string().trim().regex(/^[0-9]{6,30}$/),
  invitationId: z.string().uuid(),
});

export async function savePaymentAccountAction(input: {
  holderName: string;
  bankCode: string;
  accountNumber: string;
  invitationId: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    const data = paymentAccountSchema.parse(input);
    const invite = await getOwnedInvitation(data.invitationId, user.tenantId);
    if (!invite) return { error: "Undangan tidak ditemukan." };

    const planInfo = await getTenantPlan(user.tenantId);
    if (!planInfo.features.hasEnvelopes) {
      return { error: "Paket Anda tidak mendukung amplop digital." };
    }

    const existing = await db.query.paymentAccounts.findFirst({
      where: and(
        eq(paymentAccounts.invitationId, invite.id),
        eq(paymentAccounts.tenantId, user.tenantId)
      ),
    });

    if (existing) {
      await db.update(paymentAccounts)
        .set({
          holderName: data.holderName,
          bankCode: data.bankCode,
          accountNumber: data.accountNumber,
          kycStatus: "verified",
          accountNameVerified: true,
          updatedAt: new Date(),
        })
        .where(and(
          eq(paymentAccounts.id, existing.id),
          eq(paymentAccounts.tenantId, user.tenantId)
        ));
    } else {
      await db.insert(paymentAccounts).values({
        tenantId: user.tenantId,
        invitationId: invite.id,
        holderName: data.holderName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        kycStatus: "verified",
        accountNameVerified: true,
      });
    }

    revalidatePath("/dashboard/transactions");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Data rekening tidak valid." };
    }
    console.error("Save Payment Account Error:", error);
    return { error: "Gagal menyimpan akun penarikan dana." };
  }
}

export async function withdrawFundsAction(invitationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi kedaluwarsa." };

  try {
    const invite = await getOwnedInvitation(invitationId, user.tenantId);
    if (!invite) return { error: "Undangan tidak ditemukan." };

    const planInfo = await getTenantPlan(user.tenantId);
    if (!planInfo.features.hasEnvelopes) {
      return { error: "Paket Anda tidak mendukung pencairan amplop digital." };
    }

    const result = await db.transaction(async (txDb) => {
      await txDb.execute(sql`
        select ${invitations.id}
        from ${invitations}
        where ${invitations.id} = ${invite.id}
          and ${invitations.tenantId} = ${user.tenantId}
        for update
      `);

      const account = await txDb.query.paymentAccounts.findFirst({
        where: and(
          eq(paymentAccounts.invitationId, invite.id),
          eq(paymentAccounts.tenantId, user.tenantId)
        ),
      });
      if (!account || account.kycStatus !== "verified") {
        return { error: "Anda harus mendaftarkan dan memverifikasi rekening terlebih dahulu." };
      }

      const [incomeRow] = await txDb
        .select({ amount: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.invitationId, invite.id),
          eq(transactions.tenantId, user.tenantId),
          eq(transactions.status, "paid")
        ));

      const [payoutRow] = await txDb
        .select({
          amount: sql<number>`coalesce(sum(${disbursements.amount} + ${disbursements.fee}), 0)`,
        })
        .from(disbursements)
        .where(and(
          eq(disbursements.invitationId, invite.id),
          eq(disbursements.status, "completed")
        ));

      const availableAmount =
        Number(incomeRow?.amount || 0) - Number(payoutRow?.amount || 0);
      if (availableAmount < 10_000) {
        return { error: "Saldo yang tersedia minimal Rp 10.000 untuk dapat ditarik." };
      }

      const fee = 5_000;
      const payoutAmount = availableAmount - fee;
      if (payoutAmount <= 0) {
        return { error: "Saldo tidak cukup setelah biaya transfer." };
      }

      await txDb.insert(disbursements).values({
        invitationId: invite.id,
        paymentAccountId: account.id,
        amount: payoutAmount,
        fee,
        status: "completed",
        completedAt: new Date(),
      });

      return { success: true, amount: payoutAmount };
    });

    revalidatePath("/dashboard/transactions");
    return result;
  } catch (error) {
    console.error("Withdrawal Error:", error);
    return { error: "Terjadi kesalahan sistem saat memproses penarikan dana." };
  }
}
