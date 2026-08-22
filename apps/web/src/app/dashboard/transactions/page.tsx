import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getTenantPlan } from "@/lib/licensing";
import { redirect } from "next/navigation";
import { db } from "db";
import { invitations, paymentAccounts, transactions, disbursements } from "db";
import { eq } from "drizzle-orm";
import { LedgerManager } from "./LedgerManager";

export default async function TransactionsPage() {
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

  // Load registered bank account (for payout)
  const account = await db.query.paymentAccounts.findFirst({
    where: eq(paymentAccounts.invitationId, invite.id),
  });

  // Load digital envelope payment transactions
  const txs = await db.query.transactions.findMany({
    where: eq(transactions.invitationId, invite.id),
    orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
  });

  // Load disbursement withdrawals
  const payouts = await db.query.disbursements.findMany({
    where: eq(disbursements.invitationId, invite.id),
    orderBy: (disbursements, { desc }) => [desc(disbursements.requestedAt)],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-slate-800">Amplop & Transaksi Keuangan</h1>
        <p className="text-xs text-slate-500">Daftarkan rekening untuk menerima amplop digital, pantau riwayat pembayaran masuk, dan cairkan dana terkumpul.</p>
      </div>

      <LedgerManager 
        invitation={invite}
        account={account}
        transactions={txs}
        disbursements={payouts}
        planInfo={planInfo}
      />
    </div>
  );
}
