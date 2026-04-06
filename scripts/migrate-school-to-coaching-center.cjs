#!/usr/bin/env node

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const tenantCollections = [
  "users",
  "parentstudentlinks",
  "auditlogs",
  "academicyears",
  "classmasters",
  "sections",
  "subjectallocations",
  "timetableentries",
  "studentenrollments",
  "coachingprograms",
  "coachingbatches",
  "coachingenrollments",
  "coachingsessions",
  "coachingattendances",
  "feetypes",
  "feeplans",
  "feeplanassignments",
  "studentfeeledgers",
  "payments",
  "creditnotes",
];

const centerCollections = ["schools"];

async function backfillTenantIds(db, name) {
  const coll = db.collection(name);
  const res1 = await coll.updateMany(
    { coachingCenterId: { $exists: false }, schoolId: { $exists: true } },
    [{ $set: { coachingCenterId: "$schoolId" } }]
  );
  const res2 = await coll.updateMany(
    { schoolId: { $exists: false }, coachingCenterId: { $exists: true } },
    [{ $set: { schoolId: "$coachingCenterId" } }]
  );
  return { modified: (res1.modifiedCount || 0) + (res2.modifiedCount || 0) };
}

async function backfillCenterNames(db, name) {
  const coll = db.collection(name);
  const res1 = await coll.updateMany(
    { coachingCenterName: { $exists: false }, schoolName: { $exists: true } },
    [{ $set: { coachingCenterName: "$schoolName" } }]
  );
  const res2 = await coll.updateMany(
    { coachingCenterCode: { $exists: false }, schoolCode: { $exists: true } },
    [{ $set: { coachingCenterCode: "$schoolCode" } }]
  );
  return { modified: (res1.modifiedCount || 0) + (res2.modifiedCount || 0) };
}

async function main() {
  const mongoose = await import("mongoose");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
  );

  let touched = 0;
  for (const name of tenantCollections) {
    if (!existing.has(name)) continue;
    const { modified } = await backfillTenantIds(db, name);
    touched += modified;
    console.log(`[tenant] ${name}: modified=${modified}`);
  }

  for (const name of centerCollections) {
    if (!existing.has(name)) continue;
    const { modified } = await backfillCenterNames(db, name);
    touched += modified;
    console.log(`[center] ${name}: modified=${modified}`);
  }

  console.log(`done: total modified=${touched}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  const mongoose = await import("mongoose");
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
