import { PrismaClient, UserRole, ProjectStage, InvoiceStatus, SupplierCategory, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱  Seeding PlanDesign database…\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const [admin, architect, designer] = await Promise.all([
    upsertUser({
      name: "Alex Carter",
      email: "admin@plandesign.com",
      password: "Admin123!",
      role: UserRole.admin,
    }),
    upsertUser({
      name: "Jordan Reeves",
      email: "architect@plandesign.com",
      password: "Arch123!",
      role: UserRole.architect,
    }),
    upsertUser({
      name: "Morgan Ellis",
      email: "designer@plandesign.com",
      password: "Design123!",
      role: UserRole.interior_designer,
    }),
    upsertUser({
      name: "Riley Kim",
      email: "employee@plandesign.com",
      password: "Emp123!",
      role: UserRole.employee,
    }),
    upsertUser({
      name: "Sam Patel",
      email: "client@plandesign.com",
      password: "Client123!",
      role: UserRole.client,
    }),
  ]);

  console.log("✓ Users created");

  // ── Clients ────────────────────────────────────────────────────────────────
  const clientA = await db.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      name: "Horizon Hospitality Group",
      email: "info@horizonhg.com",
      phone: "+1-555-2100",
      address: "182 Skyline Blvd, Miami FL 33101",
      notes: "Luxury hotel chain seeking flagship renovation.",
      assignedToId: architect.id,
    },
  });

  const clientB = await db.client.upsert({
    where: { id: "seed-client-2" },
    update: {},
    create: {
      id: "seed-client-2",
      name: "Meridian Realty",
      email: "projects@meridianrealty.com",
      phone: "+1-555-3040",
      address: "67 Park Avenue, New York NY 10021",
      notes: "High-end residential developer.",
      assignedToId: designer.id,
    },
  });

  const clientC = await db.client.upsert({
    where: { id: "seed-client-3" },
    update: {},
    create: {
      id: "seed-client-3",
      name: "Nova Creative Offices",
      email: "hello@novacreative.io",
      phone: "+1-555-8870",
      address: "300 Innovation Drive, Austin TX 78701",
      notes: "Tech studio requiring full office interior design.",
      assignedToId: designer.id,
    },
  });

  console.log("✓ Clients created");

  // ── Projects ───────────────────────────────────────────────────────────────
  const projectA = await db.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Horizon Lobby Renovation",
      stage: ProjectStage.execution,
      status: "active",
      budget: 480000,
      spent: 182000,
      progress: 62,
      description: "Full-scale lobby and lounge redesign for flagship Miami hotel.",
      clientId: clientA.id,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-09-30"),
      location: "Miami, FL",
    },
  });

  const projectB = await db.project.upsert({
    where: { id: "seed-project-2" },
    update: {},
    create: {
      id: "seed-project-2",
      name: "Meridian Penthouse Interiors",
      stage: ProjectStage.design,
      status: "active",
      budget: 290000,
      spent: 97000,
      progress: 38,
      description: "Residential penthouse interior design and specification.",
      clientId: clientB.id,
      startDate: new Date("2026-03-15"),
      endDate: new Date("2026-11-01"),
      location: "New York, NY",
    },
  });

  const projectC = await db.project.upsert({
    where: { id: "seed-project-3" },
    update: {},
    create: {
      id: "seed-project-3",
      name: "Nova Office Fit-Out",
      stage: ProjectStage.discovery,
      status: "active",
      budget: 175000,
      spent: 14500,
      progress: 14,
      description: "Creative office space for 120-person tech startup.",
      clientId: clientC.id,
      startDate: new Date("2026-05-01"),
      location: "Austin, TX",
    },
  });

  // Project members
  await Promise.all([
    db.projectMember.upsert({
      where: { userId_projectId: { userId: architect.id, projectId: projectA.id } },
      update: {},
      create: { userId: architect.id, projectId: projectA.id, role: "lead" },
    }),
    db.projectMember.upsert({
      where: { userId_projectId: { userId: designer.id, projectId: projectA.id } },
      update: {},
      create: { userId: designer.id, projectId: projectA.id, role: "member" },
    }),
    db.projectMember.upsert({
      where: { userId_projectId: { userId: designer.id, projectId: projectB.id } },
      update: {},
      create: { userId: designer.id, projectId: projectB.id, role: "lead" },
    }),
    db.projectMember.upsert({
      where: { userId_projectId: { userId: architect.id, projectId: projectC.id } },
      update: {},
      create: { userId: architect.id, projectId: projectC.id, role: "lead" },
    }),
  ]);

  console.log("✓ Projects + members created");

  // ── Invoices ───────────────────────────────────────────────────────────────
  await Promise.all([
    db.invoice.upsert({
      where: { id: "seed-inv-1" },
      update: {},
      create: {
        id: "seed-inv-1",
        number: "INV-2026-001",
        status: InvoiceStatus.paid,
        amount: 48000,
        issuedAt: new Date("2026-02-15"),
        dueAt: new Date("2026-03-15"),
        clientId: clientA.id,
        projectId: projectA.id,
      },
    }),
    db.invoice.upsert({
      where: { id: "seed-inv-2" },
      update: {},
      create: {
        id: "seed-inv-2",
        number: "INV-2026-002",
        status: InvoiceStatus.sent,
        amount: 72000,
        issuedAt: new Date("2026-04-01"),
        dueAt: new Date("2026-05-01"),
        clientId: clientA.id,
        projectId: projectA.id,
      },
    }),
    db.invoice.upsert({
      where: { id: "seed-inv-3" },
      update: {},
      create: {
        id: "seed-inv-3",
        number: "INV-2026-003",
        status: InvoiceStatus.draft,
        amount: 29000,
        clientId: clientB.id,
        projectId: projectB.id,
      },
    }),
    db.invoice.upsert({
      where: { id: "seed-inv-4" },
      update: {},
      create: {
        id: "seed-inv-4",
        number: "INV-2026-004",
        status: InvoiceStatus.overdue,
        amount: 17500,
        issuedAt: new Date("2026-03-01"),
        dueAt: new Date("2026-04-01"),
        clientId: clientB.id,
        projectId: projectB.id,
      },
    }),
  ]);

  console.log("✓ Invoices created");

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks = [
    {
      id: "seed-task-1",
      title: "Finalise lobby material board",
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      projectId: projectA.id,
      assigneeId: designer.id,
      creatorId: architect.id,
      dueAt: new Date("2026-05-20"),
    },
    {
      id: "seed-task-2",
      title: "Submit structural drawings to council",
      status: TaskStatus.todo,
      priority: TaskPriority.urgent,
      projectId: projectA.id,
      assigneeId: architect.id,
      creatorId: admin.id,
      dueAt: new Date("2026-05-15"),
    },
    {
      id: "seed-task-3",
      title: "Penthouse furniture specification",
      status: TaskStatus.review,
      priority: TaskPriority.medium,
      projectId: projectB.id,
      assigneeId: designer.id,
      creatorId: designer.id,
      dueAt: new Date("2026-05-25"),
    },
    {
      id: "seed-task-4",
      title: "Concept presentation for Nova",
      status: TaskStatus.todo,
      priority: TaskPriority.medium,
      projectId: projectC.id,
      assigneeId: architect.id,
      creatorId: admin.id,
      dueAt: new Date("2026-05-30"),
    },
    {
      id: "seed-task-5",
      title: "Lobby lighting procurement",
      status: TaskStatus.done,
      priority: TaskPriority.high,
      projectId: projectA.id,
      assigneeId: designer.id,
      creatorId: architect.id,
    },
  ];

  for (const task of tasks) {
    await db.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log("✓ Tasks created");

  // ── Meetings ───────────────────────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const twoWeeks = new Date(now); twoWeeks.setDate(now.getDate() + 14);

  const meetingA = await db.meeting.upsert({
    where: { id: "seed-meeting-1" },
    update: {},
    create: {
      id: "seed-meeting-1",
      title: "Horizon lobby design review",
      startsAt: tomorrow,
      location: "Studio Conference Room A",
      room: "A-02",
      duration: 90,
      clientId: clientA.id,
      projectId: projectA.id,
    },
  });

  const meetingB = await db.meeting.upsert({
    where: { id: "seed-meeting-2" },
    update: {},
    create: {
      id: "seed-meeting-2",
      title: "Meridian penthouse walkthrough",
      startsAt: nextWeek,
      location: "On site — 67 Park Avenue",
      room: "On Site",
      duration: 75,
      clientId: clientB.id,
      projectId: projectB.id,
    },
  });

  await db.meeting.upsert({
    where: { id: "seed-meeting-3" },
    update: {},
    create: {
      id: "seed-meeting-3",
      title: "Nova discovery & brief",
      startsAt: twoWeeks,
      location: "Video call",
      room: "Meet Link",
      duration: 60,
      clientId: clientC.id,
      projectId: projectC.id,
    },
  });

  await Promise.all([
    db.meetingAttendee.upsert({
      where: { userId_meetingId: { userId: architect.id, meetingId: meetingA.id } },
      update: {},
      create: { userId: architect.id, meetingId: meetingA.id },
    }),
    db.meetingAttendee.upsert({
      where: { userId_meetingId: { userId: designer.id, meetingId: meetingA.id } },
      update: {},
      create: { userId: designer.id, meetingId: meetingA.id },
    }),
    db.meetingAttendee.upsert({
      where: { userId_meetingId: { userId: designer.id, meetingId: meetingB.id } },
      update: {},
      create: { userId: designer.id, meetingId: meetingB.id },
    }),
  ]);

  console.log("✓ Meetings + attendees created");

  // ── Suppliers ──────────────────────────────────────────────────────────────
  const suppliers = [
    {
      id: "seed-sup-1",
      name: "Forma Furnishings",
      category: SupplierCategory.furniture,
      phone: "+1-555-7100",
      email: "trade@formafurnishings.com",
      city: "Chicago",
      notes: "Premium commercial furniture. 6-8 week lead time.",
    },
    {
      id: "seed-sup-2",
      name: "Apex Electrical Supply",
      category: SupplierCategory.electrical,
      phone: "+1-555-4400",
      email: "orders@apexelectrical.com",
      city: "Dallas",
    },
    {
      id: "seed-sup-3",
      name: "BlueLine Plumbing & Fixtures",
      category: SupplierCategory.plumbing,
      phone: "+1-555-2233",
      email: "b2b@bluelinefixtures.com",
      city: "Miami",
    },
    {
      id: "seed-sup-4",
      name: "Strata Stone & Tile",
      category: SupplierCategory.materials,
      phone: "+1-555-9120",
      email: "contracts@stratamaterials.com",
      city: "New York",
      notes: "Natural stone, large-format tile. Trade accounts available.",
    },
  ];

  for (const s of suppliers) {
    await db.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  await Promise.all([
    db.projectSupplier.upsert({
      where: { projectId_supplierId: { projectId: projectA.id, supplierId: "seed-sup-1" } },
      update: {},
      create: { projectId: projectA.id, supplierId: "seed-sup-1", notes: "Custom lounge furniture package" },
    }),
    db.projectSupplier.upsert({
      where: { projectId_supplierId: { projectId: projectA.id, supplierId: "seed-sup-2" } },
      update: {},
      create: { projectId: projectA.id, supplierId: "seed-sup-2", notes: "Lighting procurement" },
    }),
    db.projectSupplier.upsert({
      where: { projectId_supplierId: { projectId: projectB.id, supplierId: "seed-sup-4" } },
      update: {},
      create: { projectId: projectB.id, supplierId: "seed-sup-4", notes: "Marble and tile schedule" },
    }),
  ]);

  await Promise.all([
    db.clientNote.upsert({
      where: { id: "seed-note-1" },
      update: {},
      create: {
        id: "seed-note-1",
        clientId: clientA.id,
        content: "Client approved revised material board with premium brass accents.",
        createdById: architect.id,
        createdByName: "Jordan Reeves",
      },
    }),
    db.clientNote.upsert({
      where: { id: "seed-note-2" },
      update: {},
      create: {
        id: "seed-note-2",
        clientId: clientB.id,
        content: "Requested alternate dining fixture options under 8-week lead time.",
        createdById: designer.id,
        createdByName: "Morgan Ellis",
      },
    }),
  ]);

  await Promise.all([
    db.attachment.upsert({
      where: { id: "seed-file-1" },
      update: {},
      create: {
        id: "seed-file-1",
        ownerType: "client",
        clientId: clientA.id,
        name: "horizon-brand-guidelines.pdf",
        mimeType: "application/pdf",
        size: 521300,
        url: "/uploads/clients/seed-client-1/horizon-brand-guidelines.pdf",
        uploadedById: architect.id,
      },
    }),
    db.attachment.upsert({
      where: { id: "seed-file-2" },
      update: {},
      create: {
        id: "seed-file-2",
        ownerType: "project",
        projectId: projectA.id,
        name: "lobby-lighting-plan-v2.pdf",
        mimeType: "application/pdf",
        size: 834120,
        url: "/uploads/projects/seed-project-1/lobby-lighting-plan-v2.pdf",
        uploadedById: designer.id,
      },
    }),
    db.attachment.upsert({
      where: { id: "seed-file-3" },
      update: {},
      create: {
        id: "seed-file-3",
        ownerType: "project",
        projectId: projectB.id,
        name: "penthouse-moodboard.jpg",
        mimeType: "image/jpeg",
        size: 214200,
        url: "/uploads/projects/seed-project-2/penthouse-moodboard.jpg",
        uploadedById: designer.id,
      },
    }),
  ]);

  await Promise.all([
    db.projectComment.upsert({
      where: { id: "seed-comment-1" },
      update: {},
      create: {
        id: "seed-comment-1",
        projectId: projectA.id,
        content: "Client wants a warmer tone for reception desk stone cladding.",
        authorId: architect.id,
        authorName: "Jordan Reeves",
      },
    }),
    db.projectComment.upsert({
      where: { id: "seed-comment-2" },
      update: {},
      create: {
        id: "seed-comment-2",
        projectId: projectB.id,
        content: "Need procurement confirmation before final furniture lock-in.",
        authorId: designer.id,
        authorName: "Morgan Ellis",
      },
    }),
  ]);

  await Promise.all([
    db.expense.upsert({
      where: { id: "seed-expense-1" },
      update: {},
      create: {
        id: "seed-expense-1",
        label: "Lobby material samples",
        category: "materials",
        amount: 4200,
        occurredAt: new Date("2026-04-21"),
        clientId: clientA.id,
        projectId: projectA.id,
        createdById: admin.id,
      },
    }),
    db.expense.upsert({
      where: { id: "seed-expense-2" },
      update: {},
      create: {
        id: "seed-expense-2",
        label: "Site photography",
        category: "labor",
        amount: 1850,
        occurredAt: new Date("2026-04-28"),
        clientId: clientB.id,
        projectId: projectB.id,
        createdById: designer.id,
      },
    }),
  ]);

  await Promise.all([
    db.notification.upsert({
      where: { id: "seed-notification-1" },
      update: {},
      create: {
        id: "seed-notification-1",
        title: "Invoice overdue",
        message: "INV-2026-004 is overdue and needs follow-up.",
        type: "warning",
        isRead: false,
        entityType: "invoice",
        entityId: "seed-inv-4",
      },
    }),
    db.notification.upsert({
      where: { id: "seed-notification-2" },
      update: {},
      create: {
        id: "seed-notification-2",
        title: "New client file uploaded",
        message: "Horizon brand guide has been attached.",
        type: "info",
        isRead: false,
        entityType: "file",
        entityId: "seed-file-1",
      },
    }),
  ]);

  await Promise.all([
    db.activityEvent.upsert({
      where: { id: "seed-activity-1" },
      update: {},
      create: {
        id: "seed-activity-1",
        eventType: "project_created",
        entityType: "project",
        entityId: projectA.id,
        title: "Project started",
        description: "Horizon Lobby Renovation moved into execution setup.",
        actorId: architect.id,
        actorName: "Jordan Reeves",
        clientId: clientA.id,
        projectId: projectA.id,
      },
    }),
    db.activityEvent.upsert({
      where: { id: "seed-activity-2" },
      update: {},
      create: {
        id: "seed-activity-2",
        eventType: "file_uploaded",
        entityType: "file",
        entityId: "seed-file-2",
        title: "Lighting plan uploaded",
        description: "v2 electrical and ambience lighting package uploaded.",
        actorId: designer.id,
        actorName: "Morgan Ellis",
        clientId: clientA.id,
        projectId: projectA.id,
      },
    }),
    db.activityEvent.upsert({
      where: { id: "seed-activity-3" },
      update: {},
      create: {
        id: "seed-activity-3",
        eventType: "expense_logged",
        entityType: "project",
        entityId: projectB.id,
        title: "Expense recorded",
        description: "Site photography invoice logged to project finances.",
        actorId: admin.id,
        actorName: "Alex Carter",
        clientId: clientB.id,
        projectId: projectB.id,
      },
    }),
  ]);

  console.log("✓ Suppliers created");
  console.log("✓ Workflow artifacts created");
  console.log("\n✅  Seed complete.\n");
  console.log("Test accounts:");
  console.log("  admin@plandesign.com        / Admin123!");
  console.log("  architect@plandesign.com    / Arch123!");
  console.log("  designer@plandesign.com     / Design123!");
  console.log("  employee@plandesign.com     / Emp123!");
  console.log("  client@plandesign.com       / Client123!");
}

async function upsertUser({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const hashed = await bcrypt.hash(password, 12);
  return db.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: hashed, role },
  });
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
