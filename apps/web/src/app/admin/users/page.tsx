import React from "react";
import { db } from "db";
import { users, plans } from "db";
import { notLike, eq } from "drizzle-orm";
import { UserList } from "./UserList";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // 1. Load users (excluding superadmins)
  const usersList = await db.query.users.findMany({
    where: notLike(users.role, "superadmin"),
    with: {
      tenants: {
        with: {
          subscriptions: {
            with: {
              plan: true
            }
          }
        }
      }
    }
  });

  // 2. Load available plans for dropdown override
  const plansList = await db.query.plans.findMany({
    where: eq(plans.isActive, true)
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-[#2E3A35]">Manajemen Pengguna</h1>
        <p className="text-xs text-slate-550">
          Pantau status akun, override paket subscription manual, dan lakukan penangguhan (suspensi) akun pengguna SaaS.
        </p>
      </div>

      <UserList 
        usersData={usersList} 
        plansData={plansList} 
      />
    </div>
  );
}
