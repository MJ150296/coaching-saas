#!/usr/bin/env node
/* eslint-disable no-console */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORGANIZATION_ADMIN: "ORGANIZATION_ADMIN",
  COACHING_ADMIN: "COACHING_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  STAFF: "STAFF",
};

const uri = process.env.MONGODB_URI;
const nodeEnv = process.env.NODE_ENV || "development";
const organizationId = process.env.DEV_SEED_ORGANIZATION_ID || "demo-org";
const coachingCenterId = process.env.DEV_SEED_COACHING_CENTER_ID || "demo-coaching-center";
const defaultPassword = process.env.DEV_SEED_PASSWORD || "Password123!";
const superAdminEmail = (process.env.DEV_SEED_SUPERADMIN_EMAIL || "superadmin@example.com").toLowerCase();

const organizationName = process.env.DEV_SEED_ORGANIZATION_NAME || "Demo Organization";
const coachingCenterName = process.env.DEV_SEED_COACHING_CENTER_NAME || "Demo Coaching Center";
const coachingCenterCode = process.env.DEV_SEED_COACHING_CENTER_CODE || "DCC001";

const seedLegacyCleanup = String(process.env.DEV_SEED_CLEANUP_LEGACY || "true").toLowerCase() === "true";
const seedResetTenantUsers = String(process.env.DEV_SEED_RESET_TENANT_USERS || "false").toLowerCase() === "true";
const seedResetTenantData = String(process.env.DEV_SEED_RESET_TENANT_DATA || "false").toLowerCase() === "true";

const COUNTS = {
  superAdmins: 1,
  organizationAdmins: 1,
  coachingAdmins: 1,
  admins: 2,
  teachers: 20,
  students: 200,
  parents: 200,
  staff: 5,
};

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

if (nodeEnv === "production") {
  console.error("Refusing to seed users in production");
  process.exit(1);
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function pad(n) {
  return String(n).padStart(3, "0");
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stableId(prefix, ...parts) {
  const right = parts.map((p) => slug(p)).filter(Boolean).join("-");
  return `${prefix}-${right}`.slice(0, 120);
}

function buildUsers() {
  const users = [];

  for (let i = 1; i <= COUNTS.superAdmins; i += 1) {
    const email = COUNTS.superAdmins === 1 ? superAdminEmail : `superadmin-${pad(i)}@example.com`;
    users.push({
      email,
      firstName: "Super",
      lastName: `Admin${i}`,
      role: USER_ROLES.SUPER_ADMIN,
      organizationId: undefined,
      coachingCenterId: undefined,
    });
  }

  for (let i = 1; i <= COUNTS.organizationAdmins; i += 1) {
    users.push({
      email: `org-admin-${pad(i)}@example.com`,
      firstName: "Organization",
      lastName: `Admin${i}`,
      role: USER_ROLES.ORGANIZATION_ADMIN,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.coachingAdmins; i += 1) {
    users.push({
      email: `coaching-admin-${pad(i)}@example.com`,
      firstName: "Coaching",
      lastName: `Admin${i}`,
      role: USER_ROLES.COACHING_ADMIN,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.admins; i += 1) {
    users.push({
      email: `admin-${pad(i)}@example.com`,
      firstName: "Admin",
      lastName: `User${i}`,
      role: USER_ROLES.ADMIN,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.teachers; i += 1) {
    users.push({
      email: `teacher-${pad(i)}@example.com`,
      firstName: "Teacher",
      lastName: `User${i}`,
      role: USER_ROLES.TEACHER,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.students; i += 1) {
    users.push({
      email: `student-${pad(i)}@example.com`,
      firstName: "Student",
      lastName: `User${i}`,
      role: USER_ROLES.STUDENT,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.parents; i += 1) {
    users.push({
      email: `parent-${pad(i)}@example.com`,
      firstName: "Parent",
      lastName: `User${i}`,
      role: USER_ROLES.PARENT,
      organizationId,
      coachingCenterId,
    });
  }

  for (let i = 1; i <= COUNTS.staff; i += 1) {
    users.push({
      email: `staff-${pad(i)}@example.com`,
      firstName: "Staff",
      lastName: `User${i}`,
      role: USER_ROLES.STAFF,
      organizationId,
      coachingCenterId,
    });
  }

  return users;
}

function buildParentStudentLinks(parentUsers, studentUsers) {
  const links = [];

  // 25 sibling families: each parent linked to 2 children
  for (let i = 0; i < 25; i += 1) {
    const parent = parentUsers[i];
    const studentA = studentUsers[i * 2];
    const studentB = studentUsers[i * 2 + 1];
    if (parent && studentA && studentB) {
      links.push({ parentEmail: parent.email, studentEmail: studentA.email });
      links.push({ parentEmail: parent.email, studentEmail: studentB.email });
    }
  }

  // Remaining students get one primary guardian
  let parentIndex = 25;
  for (let i = 50; i < studentUsers.length; i += 1) {
    if (parentIndex >= parentUsers.length) break;
    links.push({
      parentEmail: parentUsers[parentIndex].email,
      studentEmail: studentUsers[i].email,
    });
    parentIndex += 1;
  }

  // Remaining parents become secondary guardians
  let studentIndex = 0;
  while (parentIndex < parentUsers.length && studentIndex < studentUsers.length) {
    links.push({
      parentEmail: parentUsers[parentIndex].email,
      studentEmail: studentUsers[studentIndex].email,
    });
    parentIndex += 1;
    studentIndex += 1;
  }

  return links;
}

function buildAcademicModel(teacherIds) {
  const academicYearId = stableId("ay", organizationId, coachingCenterId, "2026-2027");
  const classNames = [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11 Science",
    "Class 11 Commerce",
    "Class 12 Science",
    "Class 12 Commerce",
    "Foundation",
  ];
  const sectionNames = ["A", "B"];
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English"];
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  const classMasters = classNames.map((name, index) => ({
    _id: stableId("class", organizationId, coachingCenterId, name),
    organizationId,
    coachingCenterId,
    name,
    level: String(6 + index),
  }));

  const sections = [];
  const subjectAllocations = [];
  const timetableEntries = [];
  let teacherCursor = 0;

  for (const classMaster of classMasters) {
    for (const sectionName of sectionNames) {
      const classTeacherId = teacherIds[teacherCursor % teacherIds.length];
      teacherCursor += 1;
      const sectionId = stableId("section", classMaster._id, sectionName);
      sections.push({
        _id: sectionId,
        organizationId,
        coachingCenterId,
        classMasterId: classMaster._id,
        name: sectionName,
        capacity: 40,
        roomNumber: `${classMaster.name.replace(/\s+/g, "-")}-${sectionName}`,
        shift: "Morning",
        classTeacherId,
      });

      subjects.forEach((subject, subjectIndex) => {
        const teacherId = teacherIds[(teacherCursor + subjectIndex) % teacherIds.length];
        const allocationId = stableId("suballoc", academicYearId, classMaster._id, sectionId, subject);
        subjectAllocations.push({
          _id: allocationId,
          organizationId,
          coachingCenterId,
          academicYearId,
          classMasterId: classMaster._id,
          sectionId,
          subjectName: subject,
          teacherId,
          weeklyPeriods: 4,
        });

        timetableEntries.push({
          _id: stableId("tt", academicYearId, sectionId, days[subjectIndex], subjectIndex + 1),
          organizationId,
          coachingCenterId,
          academicYearId,
          classMasterId: classMaster._id,
          sectionId,
          dayOfWeek: days[subjectIndex],
          periodNumber: subjectIndex + 1,
          subjectName: subject,
          teacherId,
          sourceAllocationId: allocationId,
        });
      });
    }
  }

  return {
    academicYear: {
      _id: academicYearId,
      organizationId,
      coachingCenterId,
      name: "AY 2026-27",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
      isActive: true,
    },
    classMasters,
    sections,
    subjectAllocations,
    timetableEntries,
  };
}

function buildCoachingModel(academicYearId, teacherIds) {
  const programs = [
    { name: "JEE Foundation", code: "JEEF26", classLevel: "11-12", board: "CBSE" },
    { name: "NEET Foundation", code: "NEETF26", classLevel: "11-12", board: "CBSE" },
    { name: "Boards Excellence", code: "BRDX26", classLevel: "10-12", board: "CBSE" },
    { name: "Olympiad Prep", code: "OLY26", classLevel: "8-10", board: "CBSE" },
  ].map((p) => ({
    _id: stableId("program", organizationId, coachingCenterId, p.code),
    organizationId,
    coachingCenterId,
    academicYearId,
    name: p.name,
    code: p.code,
    classLevel: p.classLevel,
    board: p.board,
    description: `${p.name} seeded program`,
    status: "ACTIVE",
  }));

  const batches = [];
  const sessions = [];
  let teacherCursor = 0;
  for (const program of programs) {
    for (const suffix of ["A", "B"]) {
      const facultyId = teacherIds[teacherCursor % teacherIds.length];
      teacherCursor += 1;
      const batchId = stableId("batch", program._id, suffix);
      batches.push({
        _id: batchId,
        organizationId,
        coachingCenterId,
        programId: program._id,
        name: `${program.name.split(" ")[0]} ${suffix}`,
        facultyId,
        capacity: 120,
        scheduleSummary: "Mon/Wed/Fri 4:00 PM - 6:00 PM",
        startsOn: new Date("2026-04-05T00:00:00.000Z"),
        endsOn: new Date("2027-02-28T00:00:00.000Z"),
        isActive: true,
      });

      sessions.push({
        _id: stableId("session", batchId, "completed-1"),
        organizationId,
        coachingCenterId,
        programId: program._id,
        batchId,
        topic: "Intro + Baseline Assessment",
        sessionDate: new Date("2026-05-10T00:00:00.000Z"),
        startsAt: "16:00",
        endsAt: "18:00",
        facultyId,
        status: "COMPLETED",
      });
      sessions.push({
        _id: stableId("session", batchId, "scheduled-1"),
        organizationId,
        coachingCenterId,
        programId: program._id,
        batchId,
        topic: "Core Concept Drills",
        sessionDate: new Date("2026-05-17T00:00:00.000Z"),
        startsAt: "16:00",
        endsAt: "18:00",
        facultyId,
        status: "SCHEDULED",
      });
    }
  }

  return { programs, batches, sessions };
}

function buildFeeModel(academicYearId, classMasters) {
  const feeTypes = [
    { name: "Tuition Fee", amount: 50000, frequency: "YEARLY", isMandatory: true, isTaxable: false },
    { name: "Exam Fee", amount: 5000, frequency: "ONE_TIME", isMandatory: true, isTaxable: false },
    { name: "Lab Fee", amount: 8000, frequency: "YEARLY", isMandatory: false, isTaxable: false },
  ].map((item) => ({
    _id: stableId("feetype", organizationId, coachingCenterId, item.name),
    organizationId,
    coachingCenterId,
    ...item,
  }));

  const feePlan = {
    _id: stableId("feeplan", organizationId, coachingCenterId, academicYearId, "standard"),
    organizationId,
    coachingCenterId,
    academicYearId,
    name: "Standard Annual Plan",
    items: feeTypes.map((item) => ({
      feeTypeId: item._id,
      name: item.name,
      amount: item.amount,
      frequency: item.frequency,
    })),
  };

  const feePlanAssignments = classMasters.map((klass) => ({
    _id: stableId("feeassign", feePlan._id, klass._id),
    organizationId,
    coachingCenterId,
    academicYearId,
    feePlanId: feePlan._id,
    classMasterId: klass._id,
    sectionId: undefined,
  }));

  return { feeTypes, feePlan, feePlanAssignments };
}

async function upsertById(coll, doc) {
  const now = new Date();
  const { _id, ...setPayload } = doc;
  await coll.updateOne(
    { _id },
    {
      $setOnInsert: { _id, createdAt: now },
      $set: { ...setPayload, updatedAt: now },
    },
    { upsert: true }
  );
}

async function countSeedUsersByRole(userColl) {
  const filterBase = { organizationId, coachingCenterId };
  const [superAdmins, orgAdmins, coachingAdmins, admins, teachers, students, parents, staff] = await Promise.all([
    userColl.countDocuments({ role: USER_ROLES.SUPER_ADMIN }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.ORGANIZATION_ADMIN }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.COACHING_ADMIN }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.ADMIN }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.TEACHER }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.STUDENT }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.PARENT }),
    userColl.countDocuments({ ...filterBase, role: USER_ROLES.STAFF }),
  ]);
  return { superAdmins, orgAdmins, coachingAdmins, admins, teachers, students, parents, staff };
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = {
    users: db.collection("users"),
    parentStudentLinks: db.collection("parentstudentlinks"),
    organizations: db.collection("organizations"),
    coachingCenters: db.collection("coachingcenters"),
    academicYears: db.collection("academicyears"),
    classMasters: db.collection("classmasters"),
    sections: db.collection("sections"),
    subjectAllocations: db.collection("subjectallocations"),
    timetableEntries: db.collection("timetableentries"),
    studentEnrollments: db.collection("studentenrollments"),
    coachingPrograms: db.collection("coachingprograms"),
    coachingBatches: db.collection("coachingbatches"),
    coachingEnrollments: db.collection("coachingenrollments"),
    coachingSessions: db.collection("coachingsessions"),
    coachingAttendance: db.collection("coachingattendances"),
    feeTypes: db.collection("feetypes"),
    feePlans: db.collection("feeplans"),
    feePlanAssignments: db.collection("feeplanassignments"),
    studentFeeLedgers: db.collection("studentfeeledgers"),
    payments: db.collection("payments"),
    creditNotes: db.collection("creditnotes"),
  };

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const users = buildUsers();

  if (seedLegacyCleanup) {
    await collections.users.deleteMany({
      email: {
        $in: [
          "organization-admin@example.com",
          "coaching-admin@example.com",
          "admin@example.com",
          "teacher@example.com",
          "student@example.com",
          "parent@example.com",
          "staff@example.com",
        ],
      },
    });
  }

  if (seedResetTenantUsers || seedResetTenantData) {
    await collections.parentStudentLinks.deleteMany({ organizationId, coachingCenterId });
    await collections.users.deleteMany({
      organizationId,
      coachingCenterId,
      role: { $ne: USER_ROLES.SUPER_ADMIN },
    });
  }

  if (seedResetTenantData) {
    await Promise.all([
      collections.academicYears.deleteMany({ organizationId, coachingCenterId }),
      collections.classMasters.deleteMany({ organizationId, coachingCenterId }),
      collections.sections.deleteMany({ organizationId, coachingCenterId }),
      collections.subjectAllocations.deleteMany({ organizationId, coachingCenterId }),
      collections.timetableEntries.deleteMany({ organizationId, coachingCenterId }),
      collections.studentEnrollments.deleteMany({ organizationId, coachingCenterId }),
      collections.coachingPrograms.deleteMany({ organizationId, coachingCenterId }),
      collections.coachingBatches.deleteMany({ organizationId, coachingCenterId }),
      collections.coachingEnrollments.deleteMany({ organizationId, coachingCenterId }),
      collections.coachingSessions.deleteMany({ organizationId, coachingCenterId }),
      collections.coachingAttendance.deleteMany({ organizationId, coachingCenterId }),
      collections.feeTypes.deleteMany({ organizationId, coachingCenterId }),
      collections.feePlans.deleteMany({ organizationId, coachingCenterId }),
      collections.feePlanAssignments.deleteMany({ organizationId, coachingCenterId }),
      collections.studentFeeLedgers.deleteMany({ organizationId, coachingCenterId }),
      collections.payments.deleteMany({ organizationId, coachingCenterId }),
      collections.creditNotes.deleteMany({ organizationId, coachingCenterId }),
    ]);
  }

  await upsertById(collections.organizations, {
    _id: organizationId,
    organizationName,
    type: "coaching",
    address: {
      street: "Demo Street 1",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "INDIA",
    },
    contactInfo: {
      email: "ops@demo-organization.example.com",
      phone: "+919900000001",
    },
    status: "active",
  });

  await upsertById(collections.coachingCenters, {
    _id: coachingCenterId,
    organizationId,
    coachingCenterName,
    coachingCenterCode,
    address: {
      street: "Demo Campus Road",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "INDIA",
    },
    contactInfo: {
      email: "ops@demo-center.example.com",
      phone: "+919900000002",
    },
    status: "active",
    studentCount: COUNTS.students,
    teacherCount: COUNTS.teachers,
  });

  let usersCreated = 0;
  let usersUpdated = 0;
  const emailToId = new Map();

  for (const user of users) {
    const now = new Date();
    const filter = { email: user.email.toLowerCase() };
    const existing = await collections.users.findOne(filter, { projection: { _id: 1 } });
    const targetId = existing?._id || stableId("user", user.email);

    await collections.users.updateOne(
      filter,
      {
        $setOnInsert: { _id: targetId, createdAt: now },
        $set: {
          email: user.email.toLowerCase(),
          password: passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          coachingCenterId: user.coachingCenterId,
          isActive: true,
          emailVerified: true,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    emailToId.set(user.email.toLowerCase(), targetId);
    if (existing) usersUpdated += 1;
    else usersCreated += 1;
  }

  const parentUsers = users.filter((u) => u.role === USER_ROLES.PARENT);
  const studentUsers = users.filter((u) => u.role === USER_ROLES.STUDENT);
  const teacherUsers = users.filter((u) => u.role === USER_ROLES.TEACHER);
  const parentStudentLinks = buildParentStudentLinks(parentUsers, studentUsers);
  const siblingStudents = new Set(studentUsers.slice(0, 50).map((s) => s.email.toLowerCase()));

  let linksCreated = 0;
  let linksUpdated = 0;
  for (const link of parentStudentLinks) {
    const parentId = emailToId.get(link.parentEmail.toLowerCase());
    const studentId = emailToId.get(link.studentEmail.toLowerCase());
    if (!parentId || !studentId) continue;

    const now = new Date();
    const filter = { parentId, studentId };
    const existing = await collections.parentStudentLinks.findOne(filter, { projection: { _id: 1 } });
    const targetId = existing?._id || stableId("parent-link", parentId, studentId);

    await collections.parentStudentLinks.updateOne(
      filter,
      {
        $setOnInsert: { _id: targetId, createdAt: now },
        $set: { parentId, studentId, organizationId, coachingCenterId, updatedAt: now },
      },
      { upsert: true }
    );

    if (existing) linksUpdated += 1;
    else linksCreated += 1;
  }

  const teacherIds = teacherUsers.map((u) => emailToId.get(u.email.toLowerCase())).filter(Boolean);
  const studentIds = studentUsers.map((u) => emailToId.get(u.email.toLowerCase())).filter(Boolean);
  if (teacherIds.length === 0 || studentIds.length === 0) {
    throw new Error("Teacher/student IDs could not be resolved during seed");
  }

  const academic = buildAcademicModel(teacherIds);
  await upsertById(collections.academicYears, academic.academicYear);
  for (const doc of academic.classMasters) await upsertById(collections.classMasters, doc);
  for (const doc of academic.sections) await upsertById(collections.sections, doc);
  for (const doc of academic.subjectAllocations) await upsertById(collections.subjectAllocations, doc);
  for (const doc of academic.timetableEntries) await upsertById(collections.timetableEntries, doc);

  const rollBySection = new Map();
  const sectionIds = academic.sections.map((s) => s._id);
  const classBySectionId = new Map(academic.sections.map((s) => [s._id, s.classMasterId]));
  const studentEnrollments = [];
  for (let i = 0; i < studentIds.length; i += 1) {
    const sectionId = sectionIds[i % sectionIds.length];
    const classMasterId = classBySectionId.get(sectionId);
    if (!classMasterId) continue;
    const nextRoll = (rollBySection.get(sectionId) || 0) + 1;
    rollBySection.set(sectionId, nextRoll);
    studentEnrollments.push({
      _id: stableId("enroll", academic.academicYear._id, studentIds[i]),
      organizationId,
      coachingCenterId,
      academicYearId: academic.academicYear._id,
      studentId: studentIds[i],
      classMasterId,
      sectionId,
      rollNumber: `R${String(nextRoll).padStart(3, "0")}`,
    });
  }
  for (const enrollment of studentEnrollments) {
    await upsertById(collections.studentEnrollments, enrollment);
  }

  const coaching = buildCoachingModel(academic.academicYear._id, teacherIds);
  for (const doc of coaching.programs) await upsertById(collections.coachingPrograms, doc);
  for (const doc of coaching.batches) await upsertById(collections.coachingBatches, doc);
  for (const doc of coaching.sessions) await upsertById(collections.coachingSessions, doc);

  const batchIds = coaching.batches.map((b) => b._id);
  const programByBatchId = new Map(coaching.batches.map((b) => [b._id, b.programId]));
  const coachingEnrollments = [];
  for (let i = 0; i < studentIds.length; i += 1) {
    const batchId = batchIds[i % batchIds.length];
    coachingEnrollments.push({
      _id: stableId("coachenroll", batchId, studentIds[i]),
      organizationId,
      coachingCenterId,
      programId: programByBatchId.get(batchId),
      batchId,
      studentId: studentIds[i],
      enrolledOn: new Date("2026-04-07T00:00:00.000Z"),
      status: "ACTIVE",
    });
  }
  for (const doc of coachingEnrollments) await upsertById(collections.coachingEnrollments, doc);

  const completedSessions = coaching.sessions.filter((s) => s.status === "COMPLETED");
  const attendance = [];
  for (const session of completedSessions) {
    const studentsInBatch = coachingEnrollments.filter((e) => e.batchId === session.batchId);
    for (let i = 0; i < studentsInBatch.length; i += 1) {
      const item = studentsInBatch[i];
      attendance.push({
        _id: stableId("attendance", session._id, item.studentId),
        organizationId,
        coachingCenterId,
        programId: session.programId,
        batchId: session.batchId,
        sessionId: session._id,
        studentId: item.studentId,
        status: i % 10 === 0 ? "ABSENT" : i % 7 === 0 ? "LATE" : "PRESENT",
        remarks: i % 10 === 0 ? "Auto-seeded absence case" : undefined,
        markedAt: new Date("2026-05-10T19:00:00.000Z"),
      });
    }
  }
  for (const doc of attendance) await upsertById(collections.coachingAttendance, doc);

  const fees = buildFeeModel(academic.academicYear._id, academic.classMasters);
  for (const feeType of fees.feeTypes) await upsertById(collections.feeTypes, feeType);
  await upsertById(collections.feePlans, fees.feePlan);
  for (const assignment of fees.feePlanAssignments) await upsertById(collections.feePlanAssignments, assignment);

  const totalPlannedAmount = fees.feePlan.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const ledgers = [];
  for (let i = 0; i < studentIds.length; i += 1) {
    const studentId = studentIds[i];
    const email = studentUsers[i].email.toLowerCase();
    const siblingDiscount = siblingStudents.has(email) ? 5000 : 0;
    const amount = totalPlannedAmount - siblingDiscount;
    ledgers.push({
      _id: stableId("ledger", academic.academicYear._id, studentId),
      organizationId,
      coachingCenterId,
      academicYearId: academic.academicYear._id,
      studentId,
      feePlanId: fees.feePlan._id,
      feeTypeId: undefined,
      originalAmount: totalPlannedAmount,
      amount,
      discount: siblingDiscount
        ? { type: "SIBLING", mode: "FLAT", value: siblingDiscount, amount: siblingDiscount, reason: "Sibling seeded case" }
        : undefined,
      dueDate: new Date(i % 3 === 0 ? "2026-04-20T00:00:00.000Z" : "2026-06-10T00:00:00.000Z"),
      status: "DUE",
    });
  }
  for (const ledger of ledgers) await upsertById(collections.studentFeeLedgers, ledger);

  const payments = [];
  for (let i = 0; i < Math.min(120, studentIds.length); i += 1) {
    const studentId = studentIds[i];
    payments.push({
      _id: stableId("payment", academic.academicYear._id, studentId),
      organizationId,
      coachingCenterId,
      academicYearId: academic.academicYear._id,
      studentId,
      amount: 30000,
      method: i % 2 === 0 ? "UPI" : "ONLINE",
      reference: `SEEDPAY-${pad(i + 1)}`,
      paidAt: new Date("2026-05-15T10:00:00.000Z"),
    });
  }
  for (const payment of payments) await upsertById(collections.payments, payment);

  const creditNotes = [];
  for (let i = 0; i < 15; i += 1) {
    const studentId = studentIds[i];
    creditNotes.push({
      _id: stableId("credit", academic.academicYear._id, studentId),
      organizationId,
      coachingCenterId,
      academicYearId: academic.academicYear._id,
      studentId,
      amount: 1500,
      reason: "Sibling concession",
      createdOn: new Date("2026-05-20T00:00:00.000Z"),
    });
  }
  for (const creditNote of creditNotes) await upsertById(collections.creditNotes, creditNote);

  const roleCounts = await countSeedUsersByRole(collections.users);

  console.log("Seed complete.");
  console.log(`Tenant: organizationId=${organizationId}, coachingCenterId=${coachingCenterId}`);
  console.log(`Organization: ${organizationName}`);
  console.log(`Coaching Center: ${coachingCenterName} (${coachingCenterCode})`);
  console.log(`Users: created=${usersCreated}, updated=${usersUpdated}, password=${defaultPassword}`);
  console.log(`Parent-student links: created=${linksCreated}, updated=${linksUpdated}, total=${parentStudentLinks.length}`);
  console.log("User totals in DB after seed:");
  console.log(`- SUPER_ADMIN: ${roleCounts.superAdmins}`);
  console.log(`- ORGANIZATION_ADMIN: ${roleCounts.orgAdmins}`);
  console.log(`- COACHING_ADMIN: ${roleCounts.coachingAdmins}`);
  console.log(`- ADMIN: ${roleCounts.admins}`);
  console.log(`- TEACHER: ${roleCounts.teachers}`);
  console.log(`- STUDENT: ${roleCounts.students}`);
  console.log(`- PARENT: ${roleCounts.parents}`);
  console.log(`- STAFF: ${roleCounts.staff}`);
  console.log("Operational data seeded:");
  console.log(`- Academic Years: 1`);
  console.log(`- Class Masters: ${academic.classMasters.length}`);
  console.log(`- Sections: ${academic.sections.length}`);
  console.log(`- Student Enrollments: ${studentEnrollments.length}`);
  console.log(`- Subject Allocations: ${academic.subjectAllocations.length}`);
  console.log(`- Timetable Entries: ${academic.timetableEntries.length}`);
  console.log(`- Coaching Programs: ${coaching.programs.length}`);
  console.log(`- Coaching Batches: ${coaching.batches.length}`);
  console.log(`- Coaching Enrollments: ${coachingEnrollments.length}`);
  console.log(`- Coaching Sessions: ${coaching.sessions.length}`);
  console.log(`- Coaching Attendance: ${attendance.length}`);
  console.log(`- Fee Types: ${fees.feeTypes.length}`);
  console.log(`- Fee Plans: 1`);
  console.log(`- Fee Plan Assignments: ${fees.feePlanAssignments.length}`);
  console.log(`- Student Ledgers: ${ledgers.length}`);
  console.log(`- Payments: ${payments.length}`);
  console.log(`- Credit Notes: ${creditNotes.length}`);
  console.log("Sibling scenarios: 25 families with two children, plus sibling discounts in fee ledgers.");

  if (!seedResetTenantUsers && !seedResetTenantData) {
    console.log("Note: reset flags are off, existing tenant records remain and visible counts can exceed seeded counts.");
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
