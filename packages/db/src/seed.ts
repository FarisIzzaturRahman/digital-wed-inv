import { db, pool } from "./index";
import { 
  users, tenants, invitations, couples, events, stories, galleryItems, 
  guests, rsvps, wishes, gifts, paymentAccounts, plans, subscriptions, 
  subscriptionInvoices, auditLogs, transactions, disbursements, webhookEvents
} from "./schema";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database with Alpha data...");
  
  // Clean tables (reorder to satisfy foreign keys)
  await db.delete(auditLogs);
  await db.delete(webhookEvents);
  await db.delete(disbursements);
  await db.delete(transactions);
  await db.delete(subscriptionInvoices);
  await db.delete(subscriptions);
  await db.delete(plans);
  await db.delete(rsvps);
  await db.delete(wishes);
  await db.delete(guests);
  await db.delete(galleryItems);
  await db.delete(stories);
  await db.delete(events);
  await db.delete(couples);
  await db.delete(gifts);
  await db.delete(paymentAccounts);
  await db.delete(invitations);
  await db.delete(tenants);
  await db.delete(users);

  const passwordHash = hashPassword("password123");

  // 1. Seed Plans
  console.log("Seeding plans...");
  const [freePlan] = await db.insert(plans).values({
    name: "Free Trial",
    price: 0,
    features: {
      guestLimit: 50,
      eventLimit: 1,
      templates: ["classic-gold"],
      hasMusic: false,
      hasEnvelopes: false,
      hasStories: false,
      watermark: true
    },
    isActive: true,
  }).returning();

  const [starterPlan] = await db.insert(plans).values({
    name: "Starter",
    price: 99000,
    features: {
      guestLimit: 300,
      eventLimit: 1,
      templates: ["classic-gold", "modern-minimal"],
      hasMusic: true,
      hasEnvelopes: false,
      hasStories: true,
      watermark: false
    },
    isActive: true,
  }).returning();

  const [premiumPlan] = await db.insert(plans).values({
    name: "Premium",
    price: 199000,
    features: {
      guestLimit: 1000000,
      eventLimit: 3,
      templates: ["classic-gold", "modern-minimal", "romantic-blush"],
      hasMusic: true,
      hasEnvelopes: true,
      hasStories: true,
      watermark: false
    },
    isActive: true,
  }).returning();

  const [businessPlan] = await db.insert(plans).values({
    name: "Business / WO",
    price: 499000,
    features: {
      guestLimit: 1000000,
      eventLimit: 10,
      templates: ["classic-gold", "modern-minimal", "romantic-blush"],
      hasMusic: true,
      hasEnvelopes: true,
      hasStories: true,
      watermark: false,
      isMultiInvitation: true
    },
    isActive: true,
  }).returning();

  // 2. Create Superadmin
  console.log("Seeding superadmin...");
  const [adminUser] = await db.insert(users).values({
    email: "admin@example.com",
    name: "Super Admin",
    passwordHash,
    role: "superadmin",
  }).returning();

  // 3. Create Tenant Owner (Operator)
  console.log("Seeding main tenant...");
  const [ownerUser] = await db.insert(users).values({
    email: "owner@example.com",
    name: "Budi & Rina Admin",
    passwordHash,
    role: "operator",
  }).returning();

  const [tenant] = await db.insert(tenants).values({
    ownerUserId: ownerUser.id,
    name: "Budi & Rina Wedding Tenant",
    plan: "premium",
  }).returning();

  // Create active subscription for main tenant
  await db.insert(subscriptions).values({
    tenantId: tenant.id,
    planId: premiumPlan.id,
    status: "active",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  // Seed main invitation
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3);

  const defaultTheme = {
    colorPrimary: "#6B8F71", // Sage
    colorAccent: "#E7C8C2", // Blush
    colorBg: "#FAF7F2", // Sand
    colorText: "#2E3A35",
    fontHeading: "Cormorant Garamond",
    fontBody: "Plus Jakarta Sans",
    radius: "12px",
    pattern: "floral",
  };

  const [invitation] = await db.insert(invitations).values({
    tenantId: tenant.id,
    slug: "demo-rina-dan-budi",
    status: "published",
    templateId: "classic-gold",
    theme: defaultTheme,
    locale: "id",
    religion: "islam",
    isPrivate: false,
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    publishedAt: new Date(),
  }).returning();

  await db.insert(couples).values({
    invitationId: invitation.id,
    groomFullName: "Budi Santoso",
    groomNickname: "Budi",
    groomChildOrder: "Putra pertama",
    groomFather: "Bapak Bambang Santoso",
    groomMother: "Ibu Siti Aminah",
    groomPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    groomInstagram: "budi.santoso",
    brideFullName: "Rina Kartika",
    brideNickname: "Rina",
    brideChildOrder: "Putri kedua",
    brideFather: "Bapak Hendra Kartika",
    brideMother: "Ibu Lilis Surianingsih",
    bridePhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
    brideInstagram: "rina.kartika",
    orderDisplay: "groom_first",
  });

  const akadStart = new Date(futureDate);
  akadStart.setHours(9, 0, 0, 0);
  const akadEnd = new Date(futureDate);
  akadEnd.setHours(11, 0, 0, 0);

  const resepsiStart = new Date(futureDate);
  resepsiStart.setHours(12, 0, 0, 0);
  const resepsiEnd = new Date(futureDate);
  resepsiEnd.setHours(16, 0, 0, 0);

  await db.insert(events).values([
    {
      invitationId: invitation.id,
      type: "akad",
      title: "Akad Nikah",
      startAt: akadStart,
      endAt: akadEnd,
      venueName: "Masjid Agung Al-Azhar",
      venueAddress: "Jl. Sisingamangaraja No.1, Kebayoran Baru, Jakarta Selatan",
      mapsUrl: "https://maps.app.goo.gl/yJ6h1t4xS846nL4A7",
      mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.196395955026!2d106.79782531476926!3d-6.23784139548464!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f141fa573e8f%3A0xe9827051df52b826!2sAl-Azhar%20Great%20Mosque!5e0!3m2!1sen!2sid!4v1655000000000!5m2!1sen!2sid",
      dressCode: "Putih Bersih / Pakaian Adat",
      note: "Hadir tepat waktu sebelum prosesi ijab kabul dimulai.",
    },
    {
      invitationId: invitation.id,
      type: "resepsi",
      title: "Resepsi Pernikahan",
      startAt: resepsiStart,
      endAt: resepsiEnd,
      venueName: "Gedung Serbaguna Al-Azhar",
      venueAddress: "Kawasan Masjid Agung Al-Azhar, Kebayoran Baru, Jakarta Selatan",
      mapsUrl: "https://maps.app.goo.gl/yJ6h1t4xS846nL4A7",
      mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.196395955026!2d106.79782531476926!3d-6.23784139548464!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f141fa573e8f%3A0xe9827051df52b826!2sAl-Azhar%20Great%20Mosque!5e0!3m2!1sen!2sid!4v1655000000000!5m2!1sen!2sid",
      dressCode: "Batik Modern / Pakaian Formal",
      note: "Parkir tersedia di area dalam masjid.",
    }
  ]);

  await db.insert(stories).values([
    {
      invitationId: invitation.id,
      date: "Desember 2021",
      title: "Pertemuan Pertama",
      body: "Kami pertama kali bertemu di sebuah kafe perpustakaan di Jakarta Selatan. Buku yang kami pinjam secara tidak sengaja tertukar, dan itulah awal dari obrolan panjang kami.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400",
      orderIndex: 0,
    }
  ]);

  const galleryUrls = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=600",
  ];

  await db.insert(galleryItems).values(
    galleryUrls.map((url, idx) => ({
      invitationId: invitation.id,
      type: "image",
      url,
      orderIndex: idx,
      layoutHint: "masonry",
    }))
  );

  await db.insert(gifts).values([
    {
      invitationId: invitation.id,
      type: "bank",
      label: "Bank BCA",
      accountName: "Budi Santoso",
      accountNumber: "1234567890",
      orderIndex: 0,
    }
  ]);

  await db.insert(paymentAccounts).values({
    tenantId: tenant.id,
    invitationId: invitation.id,
    holderName: "Budi Santoso",
    bankCode: "bca",
    accountNumber: "1234567890",
    accountNameVerified: true,
    kycStatus: "verified",
    gatewayRecipientId: "rec_budi_123",
  });

  const sampleGuests = [
    { name: "Bapak Agus Suhendar & Istri", category: "vip", phone: "+628123456701", token: "agus-s" },
    { name: "Ibu Megawati Sukmawati", category: "vip", phone: "+628123456702", token: "mega-s" },
    { name: "Paman Joko & Keluarga", category: "keluarga", phone: "+628123456703", token: "joko-k" },
    { name: "Tante Lilis & Om Hendro", category: "keluarga", phone: "+628123456704", token: "lilis-h" },
    { name: "Slamet Rahardjo", category: "teman", phone: "+628123456705", token: "slamet-r" },
    { name: "Dewi Lestari", category: "teman", phone: "+628123456706", token: "dewi-l" },
  ];

  const createdGuestsList = [];
  for (const g of sampleGuests) {
    const [cg] = await db.insert(guests).values({
      invitationId: invitation.id,
      tenantId: tenant.id,
      name: g.name,
      phone: g.phone,
      category: g.category as any,
      slugToken: `sample-${g.token}`,
      sentStatus: "pending",
    }).returning();
    createdGuestsList.push(cg);
  }

  await db.insert(rsvps).values({
    invitationId: invitation.id,
    guestId: createdGuestsList[0].id,
    name: createdGuestsList[0].name,
    attendance: "yes",
    headcount: 2,
    message: "Selamat menempuh hidup baru Budi & Rina! Semoga menjadi keluarga sakinah.",
  });
  
  await db.insert(wishes).values({
    invitationId: invitation.id,
    guestId: createdGuestsList[0].id,
    name: createdGuestsList[0].name,
    message: "Selamat menempuh hidup baru Budi & Rina! Semoga menjadi keluarga sakinah.",
    isApproved: true,
    likes: 3,
  });

  // 4. Seed 8-10 Sample End Users with diverse plans
  console.log("Seeding sample end users...");
  const plansArray = [freePlan, starterPlan, premiumPlan, businessPlan];
  const userPlans = [
    { email: "user1@example.com", name: "Andi & Siti", plan: freePlan, status: "active" },
    { email: "user2@example.com", name: "Joko & Aminah", plan: starterPlan, status: "active" },
    { email: "user3@example.com", name: "Slamet & Sri", plan: premiumPlan, status: "active" },
    { email: "user4@example.com", name: "Hendro & Lestari", plan: businessPlan, status: "active" },
    { email: "user5@example.com", name: "Rizky & Citra", plan: freePlan, status: "active" },
    { email: "user6@example.com", name: "Dimas & Mega", plan: starterPlan, status: "expired" },
    { email: "user7@example.com", name: "Faris & Rini", plan: premiumPlan, status: "active" },
    { email: "user8@example.com", name: "Evan & Dewi", plan: businessPlan, status: "active" },
  ];

  for (const u of userPlans) {
    const [createdUser] = await db.insert(users).values({
      email: u.email,
      name: `${u.name} Admin`,
      passwordHash,
      role: "operator",
    }).returning();

    const [createdTenant] = await db.insert(tenants).values({
      ownerUserId: createdUser.id,
      name: `${u.name} Tenant`,
      plan: u.plan.name.toLowerCase().replace(" trial", "").replace(" / wo", ""),
    }).returning();

    // Create subscription
    const [sub] = await db.insert(subscriptions).values({
      tenantId: createdTenant.id,
      planId: u.plan.id,
      status: u.status,
      expiresAt: u.status === "active" 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }).returning();

    // Create paid invoice if it is starter/premium/business
    if (u.plan.price > 0) {
      await db.insert(subscriptionInvoices).values({
        tenantId: createdTenant.id,
        subscriptionId: sub.id,
        amount: u.plan.price,
        status: u.status === "active" ? "paid" : "failed",
        gatewayRef: `sub_gw_${Math.floor(Math.random() * 1000000)}`,
      });
    }

    // Seed dummy invitation for active users
    if (u.status === "active") {
      const slug = u.name.toLowerCase().replace(" & ", "-dan-").replace(" ", "-");
      const [inv] = await db.insert(invitations).values({
        tenantId: createdTenant.id,
        slug,
        status: "published",
        templateId: (u.plan.features as any).templates[0],
        theme: defaultTheme,
      }).returning();

      const [groomName, brideName] = u.name.split(" & ");
      await db.insert(couples).values({
        invitationId: inv.id,
        groomFullName: groomName || "Pengantin Pria",
        groomNickname: groomName || "Pengantin Pria",
        brideFullName: brideName || "Pengantin Wanita",
        brideNickname: brideName || "Pengantin Wanita",
        orderDisplay: "groom_first",
      });

      // Seed 2 sample guests per user
      const [guest1] = await db.insert(guests).values({
        invitationId: inv.id,
        tenantId: createdTenant.id,
        name: "Teman SMA",
        phone: "+6281111111",
        slugToken: randomBytes(8).toString("hex"),
      }).returning();

      await db.insert(rsvps).values({
        invitationId: inv.id,
        guestId: guest1.id,
        name: "Teman SMA",
        attendance: "yes",
        headcount: 2,
        message: "Selamat kawan!",
      });

      await db.insert(wishes).values({
        invitationId: inv.id,
        guestId: guest1.id,
        name: "Teman SMA",
        message: "Selamat kawan!",
        isApproved: true,
      });
    }
  }

  // 5. Create Audit Logs
  console.log("Seeding admin audit logs...");
  await db.insert(auditLogs).values([
    {
      userId: adminUser.id,
      action: "system_init",
      details: "Initialized system and seeded default plans (Free, Starter, Premium, Business).",
      ipAddress: "127.0.0.1",
    },
    {
      userId: adminUser.id,
      action: "verify_kyc",
      details: "Approved KYC payout account for Budi Santoso (Tenant: Budi & Rina Wedding Tenant).",
      ipAddress: "127.0.0.1",
    }
  ]);

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
