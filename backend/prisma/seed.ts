/* eslint-disable */
/**
 * DentyHub demo seed
 * ------------------
 * Usage:
 *   cd backend
 *   pnpm prisma db seed                   # additive — skips if data already present
 *   SEED_RESET=true pnpm prisma db seed   # nukes demo data first, then re-seeds
 *
 * Goal: when the examiner opens the app every screen should look real:
 *   - admin requests queue has pending users
 *   - patients can browse doctors with real names / clinics
 *   - doctor profile shows past appointments, reports, ratings
 *   - supervisor workspace shows groups, rotation plan, reports to review
 *   - chat shows direct messages, group rooms and the ALL_USERS room
 *
 * Coordination with src/seed.service.ts:
 *   The admin user (`prof.shamali` or whatever ADMIN_USERNAME is set to in .env)
 *   is created on every app boot. This script *expects* that admin to already
 *   exist — we read the first ADMIN user and reuse its id as the creator /
 *   reviewer for the records we plant here. If no admin exists yet we create a
 *   fallback so the seed never fails mid-run.
 *
 * Idempotency:
 *   Every entity with a unique key is upserted (semesters, clinics, users,
 *   shift templates, semester-clinic-cases, etc.). For entities without a
 *   natural unique key (appointments, messages, notifications) we early-exit
 *   when appointment count already exceeds the threshold. Combine that with
 *   the SEED_RESET escape hatch for re-running cleanly.
 */

import { PrismaClient, Prisma, User, Clinic, ShiftTemplate, SemesterClinicCase, RotationPlanDay, ClinicRotationAssignment } from "@prisma/client";
import {
  Role,
  SupervisorStatus,
  DoctorStatus,
  SlotStatus,
  AppointmentStatus,
  PerformanceEventType,
  ReportReviewStatus,
  AppointmentRatingKind,
  ConversationKind,
  ConversationRoomAudience,
  ClinicCaseProgressStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { QUIZ_QUESTIONS_SEED } from "./quiz-questions.seed";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

const log = (...args: unknown[]) => console.log("[seed]", ...args);

/** deterministic-ish "random" choice — avoids needing a seeded RNG */
const pick = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length];

const sample = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const sampleN = <T,>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

const atHour = (date: Date, hours: number, minutes = 0): Date => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const nextSunday = (atLeastDaysAhead = 7): Date => {
  const d = daysFromNow(atLeastDaysAhead);
  while (d.getDay() !== 0) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

// ---------------------------------------------------------------------------
// Reset (only when SEED_RESET=true)
// ---------------------------------------------------------------------------

async function resetDemoData(): Promise<void> {
  log("SEED_RESET=true — wiping demo records (admin user is preserved)");

  // Order matters: child rows before parents. Each deleteMany is permissive
  // (no filter) because in a demo DB this is fine, and the only "real" user
  // we keep is the admin. We delete users last and only the non-admin ones.
  await prisma.appointmentRating.deleteMany({});
  await prisma.caseReportTask.deleteMany({});
  await prisma.caseReport.deleteMany({});
  await prisma.appointmentEvent.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.availabilitySlot.deleteMany({});

  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});

  await prisma.doctorClinicCaseProgress.deleteMany({});
  await prisma.doctorClinicTaskProgress.deleteMany({});
  await prisma.clinicTask.deleteMany({});

  await prisma.clinicRotationAssignment.deleteMany({});
  await prisma.clinicSupervisorAssignment.deleteMany({});
  await prisma.rotationPlanDay.deleteMany({});
  await prisma.rotationPlan.deleteMany({});
  await prisma.clinicSupervisorLink.deleteMany({});

  await prisma.partnerPair.deleteMany({});
  await prisma.partnerRequest.deleteMany({});
  await prisma.groupJoinRequest.deleteMany({});
  await prisma.supervisorTask.deleteMany({});
  await prisma.groupPost.deleteMany({});
  await prisma.doctorGroupSupervisor.deleteMany({});
  await prisma.doctorGroupMember.deleteMany({});
  await prisma.doctorGroup.deleteMany({});

  await prisma.supervisionAssignment.deleteMany({});
  await prisma.doctorFreeze.deleteMany({});
  await prisma.userProfileReport.deleteMany({});

  await prisma.notification.deleteMany({});
  await prisma.supervisorRequest.deleteMany({});
  await prisma.doctorRequest.deleteMany({});
  // QuizAttempt has FK to User — wipe attempts so user.deleteMany succeeds.
  // QuizQuestion is reference data and is preserved.
  await prisma.quizAttempt.deleteMany({});
  // SmileCheckin has FK to User (patient) — wipe before users.
  await prisma.smileCheckin.deleteMany({});
  // ArcadeAttempt has FK to User (patient) — wipe before users.
  await prisma.arcadeAttempt.deleteMany({});

  await prisma.semesterClinicCase.deleteMany({});
  await prisma.clinicExam.deleteMany({});
  await prisma.shiftTemplate.deleteMany({});
  await prisma.clinic.deleteMany({});

  // Detach students from semesters so we can delete semesters cleanly.
  await prisma.user.updateMany({
    where: { role: { not: Role.ADMIN } },
    data: { semesterId: null },
  });
  await prisma.semester.deleteMany({});

  await prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } });

  log("reset complete");
}

// ---------------------------------------------------------------------------
// Static datasets
// ---------------------------------------------------------------------------

const SUPERVISOR_NAMES: ReadonlyArray<{ name: string; username: string; email: string; phone: string }> = [
  { name: "Dr. Lina Haddad", username: "dr.lina.haddad", email: "lina.haddad@example.com", phone: "0790000101" },
  { name: "Dr. Omar Khoury", username: "dr.omar.khoury", email: "omar.khoury@example.com", phone: "0790000102" },
  { name: "Dr. Sara Mansour", username: "dr.sara.mansour", email: "sara.mansour@example.com", phone: "0790000103" },
  { name: "Dr. Tariq Saadeh", username: "dr.tariq.saadeh", email: "tariq.saadeh@example.com", phone: "0790000104" },
];

// Doctors and supervisors REQUIRE an email per AuthService.register()
// (auth.service.ts:97). We follow the same rule in the seed so the seeded
// data matches what the registration form would produce in real life.
const DOCTOR_NAMES: ReadonlyArray<{ name: string; username: string; idNumber: string; email: string; phone: string }> = [
  // Year 4 — Semester 2 (8 doctors)
  { name: "Yousef Al-Najjar", username: "y.alnajjar", idNumber: "D2024001", email: "yousef.alnajjar@students.dentyhub.edu", phone: "0791100201" },
  { name: "Layla Abu Hamdan", username: "l.abuhamdan", idNumber: "D2024002", email: "layla.abuhamdan@students.dentyhub.edu", phone: "0791100202" },
  { name: "Khaled Bani Hani", username: "k.banihani", idNumber: "D2024003", email: "khaled.banihani@students.dentyhub.edu", phone: "0791100203" },
  { name: "Maya Salhab", username: "m.salhab", idNumber: "D2024004", email: "maya.salhab@students.dentyhub.edu", phone: "0791100204" },
  { name: "Rami Qudah", username: "r.qudah", idNumber: "D2024005", email: "rami.qudah@students.dentyhub.edu", phone: "0791100205" },
  { name: "Nour Atallah", username: "n.atallah", idNumber: "D2024006", email: "nour.atallah@students.dentyhub.edu", phone: "0791100206" },
  { name: "Hassan Daoud", username: "h.daoud", idNumber: "D2024007", email: "hassan.daoud@students.dentyhub.edu", phone: "0791100207" },
  { name: "Rana Zayadeen", username: "r.zayadeen", idNumber: "D2024008", email: "rana.zayadeen@students.dentyhub.edu", phone: "0791100208" },
  // Year 5 — Semester 1 (4 doctors)
  { name: "Adam Tahboub", username: "a.tahboub", idNumber: "D2024009", email: "adam.tahboub@students.dentyhub.edu", phone: "0791100209" },
  { name: "Dina Sweidan", username: "d.sweidan", idNumber: "D2024010", email: "dina.sweidan@students.dentyhub.edu", phone: "0791100210" },
  { name: "Faris Obeidat", username: "f.obeidat", idNumber: "D2024011", email: "faris.obeidat@students.dentyhub.edu", phone: "0791100211" },
  { name: "Hala Masri", username: "h.masri", idNumber: "D2024012", email: "hala.masri@students.dentyhub.edu", phone: "0791100212" },
];

const PENDING_DOCTOR = {
  name: "Bilal Shahin",
  username: "b.shahin",
  idNumber: "D2024013",
  email: "bilal.shahin@students.dentyhub.edu",
  phone: "0791100213",
};
const REJECTED_DOCTOR = {
  name: "Marwa Awad",
  username: "m.awad",
  idNumber: "D2024014",
  email: "marwa.awad@students.dentyhub.edu",
  phone: "0791100214",
};

const PATIENT_NAMES: ReadonlyArray<{ name: string; username: string; age: number; gender: string; email?: string; phone: string }> = [
  { name: "Ahmad Al-Rashid", username: "p.ahmad.rashid", age: 34, gender: "male", email: "ahmad.rashid@example.com", phone: "0792000301" },
  { name: "Salma Hijazi", username: "p.salma.hijazi", age: 27, gender: "female", phone: "0792000302" },
  { name: "Mahmoud Faraj", username: "p.mahmoud.faraj", age: 45, gender: "male", email: "mahmoud.faraj@example.com", phone: "0792000303" },
  { name: "Hanan Talhouni", username: "p.hanan.talhouni", age: 52, gender: "female", phone: "0792000304" },
  { name: "Karim Abdullah", username: "p.karim.abdullah", age: 21, gender: "male", phone: "0792000305" },
  { name: "Lara Sabbagh", username: "p.lara.sabbagh", age: 30, gender: "female", email: "lara.sabbagh@example.com", phone: "0792000306" },
  { name: "Tamer Issa", username: "p.tamer.issa", age: 38, gender: "male", phone: "0792000307" },
  { name: "Zeina Khalifeh", username: "p.zeina.khalifeh", age: 26, gender: "female", phone: "0792000308" },
  { name: "Bashar Naser", username: "p.bashar.naser", age: 41, gender: "male", email: "bashar.naser@example.com", phone: "0792000309" },
  { name: "Reem Touqan", username: "p.reem.touqan", age: 29, gender: "female", phone: "0792000310" },
  { name: "Samer Halabi", username: "p.samer.halabi", age: 36, gender: "male", phone: "0792000311" },
  { name: "Yara Hawatmeh", username: "p.yara.hawatmeh", age: 24, gender: "female", email: "yara.hawatmeh@example.com", phone: "0792000312" },
  { name: "Wael Karadsheh", username: "p.wael.karadsheh", age: 49, gender: "male", phone: "0792000313" },
  { name: "Aisha Bdeir", username: "p.aisha.bdeir", age: 33, gender: "female", phone: "0792000314" },
  { name: "Murad Saadi", username: "p.murad.saadi", age: 58, gender: "male", email: "murad.saadi@example.com", phone: "0792000315" },
  { name: "Sahar Awwad", username: "p.sahar.awwad", age: 31, gender: "female", phone: "0792000316" },
  { name: "Fadi Najjar", username: "p.fadi.najjar", age: 22, gender: "male", phone: "0792000317" },
  { name: "Rasha Damen", username: "p.rasha.damen", age: 40, gender: "female", email: "rasha.damen@example.com", phone: "0792000318" },
  { name: "Ibrahim Khalid", username: "p.ibrahim.khalid", age: 63, gender: "male", phone: "0792000319" },
  { name: "Nadia Sharif", username: "p.nadia.sharif", age: 28, gender: "female", phone: "0792000320" },
];

const CLINIC_DEFS: ReadonlyArray<{ name: string; description: string }> = [
  { name: "Endodontics", description: "Root canal & pulp treatments" },
  { name: "Periodontics", description: "Gum health & deep cleanings" },
  { name: "Pediatrics", description: "Children's dental care" },
  { name: "Oral Surgery", description: "Extractions & minor surgical procedures" },
];

const SHIFT_DEFS: ReadonlyArray<{ name: string; startsAt: string; endsAt: string; capacity: number }> = [
  { name: "Morning", startsAt: "08:00", endsAt: "11:00", capacity: 6 },
  { name: "Late Morning", startsAt: "11:00", endsAt: "14:00", capacity: 6 },
  { name: "Afternoon", startsAt: "14:00", endsAt: "17:00", capacity: 6 },
  { name: "Evening", startsAt: "17:00", endsAt: "20:00", capacity: 4 },
];

const CLINIC_CASE_TITLES: Record<string, ReadonlyArray<{ title: string; description: string; requiredCount: number }>> = {
  Endodontics: [
    { title: "Single-canal RCT", description: "Anterior tooth root canal therapy with single canal", requiredCount: 3 },
    { title: "Multi-canal RCT", description: "Posterior molar/premolar with 2-4 canals", requiredCount: 2 },
    { title: "Pulp Capping", description: "Direct/indirect pulp capping on a vital tooth", requiredCount: 2 },
    { title: "Retreatment RCT", description: "Re-treatment of previously root-treated tooth", requiredCount: 2 },
    { title: "Apexification", description: "Calcium hydroxide apexification in immature tooth", requiredCount: 2 },
    { title: "Emergency Pulpectomy", description: "Acute pulpitis emergency management", requiredCount: 3 },
  ],
  Periodontics: [
    { title: "Scaling & Root Planing", description: "Quadrant SRP on moderate periodontitis", requiredCount: 4 },
    { title: "Gingivectomy", description: "Soft tissue surgical recontouring", requiredCount: 2 },
    { title: "Periodontal Maintenance", description: "3-month periodontal maintenance recall", requiredCount: 3 },
    { title: "Crown Lengthening", description: "Surgical crown lengthening procedure", requiredCount: 2 },
    { title: "Periodontal Charting", description: "Full-mouth pocket depth charting & diagnosis", requiredCount: 4 },
    { title: "Flap Surgery", description: "Open-flap debridement on a quadrant", requiredCount: 2 },
  ],
  Pediatrics: [
    { title: "Fissure Sealants", description: "Resin-based sealants on permanent molars", requiredCount: 4 },
    { title: "Pulpotomy (Primary)", description: "Vital pulp therapy on a primary molar", requiredCount: 3 },
    { title: "Stainless Steel Crown", description: "SSC restoration on a primary molar", requiredCount: 3 },
    { title: "Composite Restoration (Pediatric)", description: "Class II composite on primary tooth", requiredCount: 3 },
    { title: "Fluoride Application", description: "Topical fluoride varnish & caries risk assessment", requiredCount: 4 },
    { title: "Behavior Management Session", description: "Initial behavior guidance & rapport visit", requiredCount: 2 },
  ],
  "Oral Surgery": [
    { title: "Simple Extraction", description: "Forceps extraction of an erupted tooth", requiredCount: 4 },
    { title: "Surgical Extraction", description: "Surgical removal with flap & bone removal", requiredCount: 2 },
    { title: "Impacted Third Molar", description: "Removal of mesioangular impacted lower 3rd molar", requiredCount: 2 },
    { title: "Suture Placement & Removal", description: "Suturing post-extraction & follow-up removal", requiredCount: 3 },
    { title: "Alveoloplasty", description: "Bone recontouring after multiple extractions", requiredCount: 2 },
    { title: "Frenectomy", description: "Lingual or labial frenectomy", requiredCount: 2 },
  ],
};

// ---------------------------------------------------------------------------
// Section helpers
// ---------------------------------------------------------------------------

/** Returns the admin user; if missing, creates a fallback. */
async function getOrCreateAdmin() {
  let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (admin) return admin;

  log("no ADMIN found — creating fallback admin (please set ADMIN_USERNAME in .env)");
  const password = await bcrypt.hash("Admin1!", 10);
  admin = await prisma.user.upsert({
    where: { username: "demo.admin" },
    update: {},
    create: {
      username: "demo.admin",
      email: "demo.admin@example.com",
      phone: "0790000001",
      password,
      name: "Demo Administrator",
      role: Role.ADMIN,
      supervisorStatus: SupervisorStatus.APPROVED,
    },
  });
  return admin;
}

async function seedSemesters() {
  log("seeding semesters");
  const y4s2 = await prisma.semester.upsert({
    where: { label: "Year 4 — Semester 2" },
    update: { sortOrder: 1, endsOn: null, active: true },
    create: { label: "Year 4 — Semester 2", sortOrder: 1, endsOn: null, active: true },
  });
  const y5s1 = await prisma.semester.upsert({
    where: { label: "Year 5 — Semester 1" },
    update: { sortOrder: 2, endsOn: new Date("2026-09-30T00:00:00.000Z"), active: true },
    create: { label: "Year 5 — Semester 1", sortOrder: 2, endsOn: new Date("2026-09-30T00:00:00.000Z"), active: true },
  });
  return { y4s2, y5s1 };
}

async function seedSupervisors(adminId: string) {
  log("seeding 4 supervisors");
  const passwordHash = await bcrypt.hash("Doctor1!", 10);
  const created: User[] = [];
  for (const s of SUPERVISOR_NAMES) {
    const user = await prisma.user.upsert({
      where: { username: s.username },
      update: {
        email: s.email,
        phone: s.phone,
        name: s.name,
        role: Role.SUPERVISOR,
        supervisorStatus: SupervisorStatus.APPROVED,
      },
      create: {
        username: s.username,
        email: s.email,
        phone: s.phone,
        password: passwordHash,
        name: s.name,
        role: Role.SUPERVISOR,
        supervisorStatus: SupervisorStatus.APPROVED,
        bio: "Faculty supervisor at the dental teaching clinic.",
      },
    });
    created.push(user);

    // Match the real register flow (auth.service.ts:197): every approved
    // supervisor must have a SupervisorRequest record so the admin's
    // approvals audit trail isn't empty.
    const existingReq = await prisma.supervisorRequest.findFirst({
      where: { applicantId: user.id },
    });
    if (!existingReq) {
      await prisma.supervisorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: adminId,
          status: SupervisorStatus.APPROVED,
          note: "Initial faculty onboarding.",
          decidedAt: daysFromNow(-30),
        },
      });
    }
  }
  return created;
}

async function seedDoctors(y4s2Id: string, y5s1Id: string, adminId: string) {
  log("seeding 12 approved doctors + 1 pending + 1 rejected");
  const passwordHash = await bcrypt.hash("Doctor1!", 10);

  const approved: User[] = [];
  for (let i = 0; i < DOCTOR_NAMES.length; i += 1) {
    const d = DOCTOR_NAMES[i];
    const semesterId = i < 8 ? y4s2Id : y5s1Id;
    const user = await prisma.user.upsert({
      where: { username: d.username },
      update: {
        email: d.email,
        phone: d.phone,
        name: d.name,
        doctorIdNumber: d.idNumber,
        role: Role.DOCTOR,
        doctorStatus: DoctorStatus.APPROVED,
        semesterId,
      },
      create: {
        username: d.username,
        email: d.email,
        phone: d.phone,
        password: passwordHash,
        name: d.name,
        doctorIdNumber: d.idNumber,
        role: Role.DOCTOR,
        doctorStatus: DoctorStatus.APPROVED,
        semesterId,
        bio: "Senior dental student at the teaching clinic.",
      },
    });
    approved.push(user);

    // Match the real register flow (auth.service.ts:205): every approved
    // doctor must have a DoctorRequest record so the admin's audit trail
    // and re-apply flow have history to work with.
    const existingApprovedReq = await prisma.doctorRequest.findFirst({
      where: { applicantId: user.id },
    });
    if (!existingApprovedReq) {
      await prisma.doctorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: adminId,
          status: DoctorStatus.APPROVED,
          note: "Onboarded for the spring 2026 clinic rotation.",
          decidedAt: daysFromNow(-21),
        },
      });
    }
  }

  // PENDING — applicant whose DoctorRequest has not been reviewed yet.
  // Match the real register flow (auth.service.ts:151,157): role is set to
  // DOCTOR immediately at registration; doctorStatus=PENDING blocks login.
  const pending = await prisma.user.upsert({
    where: { username: PENDING_DOCTOR.username },
    update: {
      email: PENDING_DOCTOR.email,
      role: Role.DOCTOR,
      doctorStatus: DoctorStatus.PENDING,
      doctorIdNumber: PENDING_DOCTOR.idNumber,
      semesterId: y4s2Id,
    },
    create: {
      username: PENDING_DOCTOR.username,
      email: PENDING_DOCTOR.email,
      phone: PENDING_DOCTOR.phone,
      password: passwordHash,
      name: PENDING_DOCTOR.name,
      doctorIdNumber: PENDING_DOCTOR.idNumber,
      role: Role.DOCTOR,
      doctorStatus: DoctorStatus.PENDING,
      semesterId: y4s2Id,
    },
  });

  // Make sure exactly one PENDING DoctorRequest exists for that user
  const existingPendingReq = await prisma.doctorRequest.findFirst({
    where: { applicantId: pending.id, status: DoctorStatus.PENDING },
  });
  if (!existingPendingReq) {
    await prisma.doctorRequest.create({
      data: {
        applicantId: pending.id,
        status: DoctorStatus.PENDING,
        note: "Final-year transfer student applying for clinic access.",
      },
    });
  }

  // REJECTED — applicant whose DoctorRequest was rejected; role stays DOCTOR
  // so the auth.service resend-doctor-request flow (which checks role===DOCTOR
  // at line 380) will let them re-apply.
  const rejected = await prisma.user.upsert({
    where: { username: REJECTED_DOCTOR.username },
    update: {
      email: REJECTED_DOCTOR.email,
      role: Role.DOCTOR,
      doctorStatus: DoctorStatus.REJECTED,
      doctorIdNumber: REJECTED_DOCTOR.idNumber,
      semesterId: y4s2Id,
    },
    create: {
      username: REJECTED_DOCTOR.username,
      email: REJECTED_DOCTOR.email,
      phone: REJECTED_DOCTOR.phone,
      password: passwordHash,
      name: REJECTED_DOCTOR.name,
      doctorIdNumber: REJECTED_DOCTOR.idNumber,
      role: Role.DOCTOR,
      doctorStatus: DoctorStatus.REJECTED,
      semesterId: y4s2Id,
    },
  });
  const existingRejReq = await prisma.doctorRequest.findFirst({
    where: { applicantId: rejected.id },
  });
  if (!existingRejReq) {
    await prisma.doctorRequest.create({
      data: {
        applicantId: rejected.id,
        reviewerId: adminId,
        status: DoctorStatus.REJECTED,
        note: "Student ID could not be verified — please re-apply with documents.",
        decidedAt: daysFromNow(-3),
      },
    });
  }

  return { approved, pending, rejected };
}

async function seedPatients() {
  log("seeding 20 patients");
  const passwordHash = await bcrypt.hash("Patient1!", 10);
  const patients: User[] = [];
  for (const p of PATIENT_NAMES) {
    const user = await prisma.user.upsert({
      where: { username: p.username },
      update: { name: p.name, phone: p.phone, age: p.age, gender: p.gender, email: p.email ?? null },
      create: {
        username: p.username,
        phone: p.phone,
        email: p.email ?? null,
        password: passwordHash,
        name: p.name,
        age: p.age,
        gender: p.gender,
        role: Role.PATIENT,
      },
    });
    patients.push(user);
  }
  return patients;
}

/**
 * Seeds 7-21 days of smile-streak check-ins per patient so the leaderboard
 * has realistic data. Each profile gets a different consistency level so
 * the rankings spread out naturally:
 *   - "all-star":   21 perfect days (full habits + brushing pattern)
 *   - "consistent": 14 mostly-good days
 *   - "casual":     7 mixed days
 *   - "sporadic":   3 scattered days
 *
 * Dates use Asia/Amman day keys to match the SmileCheckin model's invariant.
 */
async function seedSmileCheckins(patients: User[]) {
  log(`seeding smile-streak check-ins for ${patients.length} patients`);
  const AMMAN_OFFSET_MS = 3 * 60 * 60 * 1000;
  const todayLocal = new Date(Date.now() + AMMAN_OFFSET_MS);
  const todayKey = todayLocal.toISOString().slice(0, 10);

  // Profile picker: stable per patient by hashing username, so re-seeding is
  // deterministic.
  const profiles: ReadonlyArray<{ days: number; hitRate: number }> = [
    { days: 21, hitRate: 0.95 },
    { days: 14, hitRate: 0.78 },
    { days: 7, hitRate: 0.6 },
    { days: 3, hitRate: 0.4 },
  ];

  for (const patient of patients) {
    let hash = 2166136261;
    for (const c of patient.username) {
      hash ^= c.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    const profile = profiles[hash % profiles.length];
    const rows: {
      patientId: string;
      dateKey: string;
      score: number;
      brushingPatternDone: boolean;
      flossed: boolean;
      mouthwash: boolean;
      water: boolean;
    }[] = [];

    for (let i = profile.days - 1; i >= 0; i -= 1) {
      // Step back i Amman-days from today.
      const d = new Date(todayLocal.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      if (dateKey > todayKey) continue;

      // Per-day deterministic randomness so habit toggles spread naturally.
      let r = (hash ^ (i * 2654435761)) >>> 0;
      const next = () => {
        r = (Math.imul(r ^ (r >>> 15), 2246822507) ^
          Math.imul(r ^ (r >>> 13), 3266489909)) >>> 0;
        return (r >>> 0) / 4294967296;
      };

      const brushing = next() < profile.hitRate;
      const flossed = next() < profile.hitRate;
      const mouthwash = next() < profile.hitRate;
      const water = next() < profile.hitRate;
      const score =
        (brushing ? 40 : 0) +
        (flossed ? 20 : 0) +
        (mouthwash ? 20 : 0) +
        (water ? 20 : 0);

      rows.push({
        patientId: patient.id,
        dateKey,
        score,
        brushingPatternDone: brushing,
        flossed,
        mouthwash,
        water,
      });
    }

    if (rows.length > 0) {
      await prisma.smileCheckin.createMany({
        data: rows,
        skipDuplicates: true,
      });
    }
  }
}

/**
 * Seed arcade attempts so the leaderboard isn't empty at demo time. Each
 * patient gets a deterministic spread of attempts across the three games:
 *   - 1-7 days of attempts per game
 *   - Score range varies by game (Plaque Blaster ~400-2400, Tooth Defender
 *     ~150-1500, Floss Rush ~80-900) to look like real play data.
 */
async function seedArcadeAttempts(patients: User[]) {
  log(`seeding arcade attempts for ${patients.length} patients`);
  const AMMAN_OFFSET_MS = 3 * 60 * 60 * 1000;
  const todayLocal = new Date(Date.now() + AMMAN_OFFSET_MS);

  // (game, baseScore, maxBoost) — boost scales with day-index so older
  // attempts look "warmup" and newer ones approach personal bests.
  const games = [
    { type: "PLAQUE_BLASTER" as const, base: 380, maxBoost: 2000 },
    { type: "TOOTH_DEFENDER" as const, base: 140, maxBoost: 1300 },
    { type: "FLOSS_RUSH" as const, base: 70, maxBoost: 800 },
  ];

  for (const patient of patients) {
    let hash = 2166136261;
    for (const c of patient.username) {
      hash ^= c.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    // Hanan Talhouni gets every level pre-unlocked so the demo can test
    // any difficulty without grinding. Other patients get a normal spread.
    const isDemoUnlockAll = patient.username === "p.hanan.talhouni";

    for (const game of games) {
      // Per-patient skill factor 0..1 (some patients are pros, some aren't).
      const skill =
        (((hash ^ game.type.length * 2654435761) >>> 0) / 4294967296) * 0.9 +
        0.1;

      const attempts: {
        patientId: string;
        gameType: "PLAQUE_BLASTER" | "TOOTH_DEFENDER" | "FLOSS_RUSH";
        dateKey: string;
        score: number;
        streakLevel: number;
        durationMs: number;
        completedAt: Date;
      }[] = [];

      if (isDemoUnlockAll) {
        // 11 attempts on 11 distinct prior days, one at each level. Scores
        // are calibrated to comfortably clear every threshold so unlocks
        // chain all the way to Lv 11.
        for (let lv = 1; lv <= 11; lv += 1) {
          const dayIdx = 11 - lv; // L1 = oldest, L11 = today-ish
          const d = new Date(
            todayLocal.getTime() - dayIdx * 24 * 60 * 60 * 1000,
          );
          const dateKey = d.toISOString().slice(0, 10);
          // Score scales with level — generous enough to pass any threshold.
          const score = Math.round(game.base + game.maxBoost * (lv / 10));
          attempts.push({
            patientId: patient.id,
            gameType: game.type,
            dateKey,
            score,
            streakLevel: lv,
            durationMs: 60_000,
            completedAt: new Date(d.getTime() - AMMAN_OFFSET_MS),
          });
        }
      } else {
        const days = 1 + ((hash >>> 3) % 7); // 1..7 days
        for (let i = days - 1; i >= 0; i -= 1) {
          const d = new Date(
            todayLocal.getTime() - i * 24 * 60 * 60 * 1000,
          );
          const dateKey = d.toISOString().slice(0, 10);
          // Streak level = consecutive days from oldest to newest (1..days).
          const streakLevel = Math.min(11, days - i);
          // Score climbs with streak level + skill noise.
          let r = (hash ^ (i * 2246822507) ^ game.type.length) >>> 0;
          r = (Math.imul(r ^ (r >>> 15), 2246822507) ^
            Math.imul(r ^ (r >>> 13), 3266489909)) >>> 0;
          const noise = (r >>> 0) / 4294967296;
          const score = Math.round(
            game.base +
              game.maxBoost * skill * (streakLevel / 10) * (0.7 + noise * 0.6),
          );
          attempts.push({
            patientId: patient.id,
            gameType: game.type,
            dateKey,
            score,
            streakLevel,
            durationMs: 60_000 + Math.round(noise * 30_000),
            completedAt: new Date(d.getTime() - AMMAN_OFFSET_MS),
          });
        }
      }
      if (attempts.length > 0) {
        await prisma.arcadeAttempt.createMany({
          data: attempts,
          skipDuplicates: true,
        });
      }
    }
  }
}

async function seedClinics() {
  log("seeding 4 clinics");
  const clinics: Clinic[] = [];
  for (const c of CLINIC_DEFS) {
    const clinic = await prisma.clinic.upsert({
      where: { name: c.name },
      update: { description: c.description, active: true },
      create: { name: c.name, description: c.description, active: true },
    });
    clinics.push(clinic);
  }
  return clinics;
}

async function seedShiftTemplates() {
  log("seeding 4 shift templates");
  const shifts: ShiftTemplate[] = [];
  for (const s of SHIFT_DEFS) {
    const shift = await prisma.shiftTemplate.upsert({
      where: { name: s.name },
      update: { startsAt: s.startsAt, endsAt: s.endsAt, appointmentCapacity: s.capacity, active: true },
      create: { name: s.name, startsAt: s.startsAt, endsAt: s.endsAt, appointmentCapacity: s.capacity, active: true },
    });
    shifts.push(shift);
  }
  return shifts;
}

async function seedSemesterClinicCases(
  semesters: Array<{ id: string; label: string }>,
  clinics: Array<{ id: string; name: string }>,
) {
  log("seeding semester-clinic cases (6 per clinic × per semester)");
  const all: SemesterClinicCase[] = [];
  for (const semester of semesters) {
    for (const clinic of clinics) {
      const defs = CLINIC_CASE_TITLES[clinic.name] ?? [];
      for (const def of defs) {
        const created = await prisma.semesterClinicCase.upsert({
          where: {
            semesterId_clinicId_title: {
              semesterId: semester.id,
              clinicId: clinic.id,
              title: def.title,
            },
          },
          update: { description: def.description, requiredCount: def.requiredCount, active: true },
          create: {
            semesterId: semester.id,
            clinicId: clinic.id,
            title: def.title,
            description: def.description,
            requiredCount: def.requiredCount,
            active: true,
          },
        });
        all.push(created);
      }
    }
  }
  return all;
}

async function seedClinicSupervisorLinks(
  supervisors: Array<{ id: string }>,
  clinics: Array<{ id: string; name: string }>,
) {
  log("linking each supervisor to 2 clinics");
  // Distribute: sup0 -> [Endo, Perio], sup1 -> [Perio, Peds],
  //             sup2 -> [Peds, OS],   sup3 -> [OS, Endo]
  const pairs = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  for (let i = 0; i < supervisors.length; i += 1) {
    const [a, b] = pairs[i];
    for (const clinicIdx of [a, b]) {
      const clinic = clinics[clinicIdx];
      await prisma.clinicSupervisorLink.upsert({
        where: {
          clinicId_supervisorId: {
            clinicId: clinic.id,
            supervisorId: supervisors[i].id,
          },
        },
        update: {},
        create: {
          clinicId: clinic.id,
          supervisorId: supervisors[i].id,
          notes: `Primary specialty in ${clinic.name}`,
        },
      });
    }
  }
}

async function seedGroups(
  supervisors: Array<{ id: string; name: string }>,
  doctorsY4: Array<{ id: string; name: string }>,
  doctorsY5: Array<{ id: string; name: string }>,
  adminId: string,
) {
  log("seeding 2 doctor groups (Alpha + Beta)");

  // Group Alpha (Y4 Sem 2) — 8 members, supervisors 0 & 1
  let alpha = await prisma.doctorGroup.findFirst({ where: { name: "Group Alpha" } });
  if (!alpha) {
    alpha = await prisma.doctorGroup.create({
      data: {
        name: "Group Alpha",
        description: "Year 4 Semester 2 rotation cohort",
        semesterLabel: "Year 4 — Semester 2",
        active: true,
        createdById: adminId,
      },
    });
  }

  let beta = await prisma.doctorGroup.findFirst({ where: { name: "Group Beta" } });
  if (!beta) {
    beta = await prisma.doctorGroup.create({
      data: {
        name: "Group Beta",
        description: "Year 5 Semester 1 rotation cohort",
        semesterLabel: "Year 5 — Semester 1",
        active: true,
        createdById: adminId,
      },
    });
  }

  // Add members (upsert by unique groupId+doctorId)
  for (const doc of doctorsY4) {
    await prisma.doctorGroupMember.upsert({
      where: { doctorId: doc.id },
      update: { groupId: alpha.id },
      create: { groupId: alpha.id, doctorId: doc.id },
    });
  }
  for (const doc of doctorsY5) {
    await prisma.doctorGroupMember.upsert({
      where: { doctorId: doc.id },
      update: { groupId: beta.id },
      create: { groupId: beta.id, doctorId: doc.id },
    });
  }

  // Supervisors: Alpha gets sup0+sup1, Beta gets sup2+sup3
  const alphaSups = [supervisors[0], supervisors[1]];
  const betaSups = [supervisors[2], supervisors[3]];
  for (const s of alphaSups) {
    await prisma.doctorGroupSupervisor.upsert({
      where: { groupId_supervisorId: { groupId: alpha.id, supervisorId: s.id } },
      update: {},
      create: { groupId: alpha.id, supervisorId: s.id },
    });
  }
  for (const s of betaSups) {
    await prisma.doctorGroupSupervisor.upsert({
      where: { groupId_supervisorId: { groupId: beta.id, supervisorId: s.id } },
      update: {},
      create: { groupId: beta.id, supervisorId: s.id },
    });
  }

  // SupervisionAssignment rows (semester-scoped) so the supervisor dashboards
  // can list the doctors they supervise.
  for (const s of alphaSups) {
    for (const d of doctorsY4) {
      await prisma.supervisionAssignment.upsert({
        where: {
          supervisorId_doctorId_semesterLabel: {
            supervisorId: s.id,
            doctorId: d.id,
            semesterLabel: "Year 4 — Semester 2",
          },
        },
        update: { active: true },
        create: {
          supervisorId: s.id,
          doctorId: d.id,
          semesterLabel: "Year 4 — Semester 2",
          active: true,
        },
      });
    }
  }
  for (const s of betaSups) {
    for (const d of doctorsY5) {
      await prisma.supervisionAssignment.upsert({
        where: {
          supervisorId_doctorId_semesterLabel: {
            supervisorId: s.id,
            doctorId: d.id,
            semesterLabel: "Year 5 — Semester 1",
          },
        },
        update: { active: true },
        create: {
          supervisorId: s.id,
          doctorId: d.id,
          semesterLabel: "Year 5 — Semester 1",
          active: true,
        },
      });
    }
  }

  return { alpha, beta };
}

async function seedPartnerPairs(
  alphaId: string,
  betaId: string,
  doctorsY4: Array<{ id: string }>,
  doctorsY5: Array<{ id: string }>,
) {
  log("creating partner pairs inside each group");

  // pair (0,1),(2,3),(4,5),(6,7) for Alpha
  const alphaPairs: Array<[string, string]> = [];
  for (let i = 0; i < doctorsY4.length - 1; i += 2) {
    alphaPairs.push([doctorsY4[i].id, doctorsY4[i + 1].id]);
  }
  for (const [a, b] of alphaPairs) {
    const exists = await prisma.partnerPair.findFirst({
      where: { OR: [{ doctorOneId: a }, { doctorTwoId: a }, { doctorOneId: b }, { doctorTwoId: b }] },
    });
    if (!exists) {
      await prisma.partnerPair.create({
        data: { groupId: alphaId, doctorOneId: a, doctorTwoId: b },
      });
    }
  }

  // Beta: pair (0,1),(2,3)
  const betaPairs: Array<[string, string]> = [];
  for (let i = 0; i < doctorsY5.length - 1; i += 2) {
    betaPairs.push([doctorsY5[i].id, doctorsY5[i + 1].id]);
  }
  for (const [a, b] of betaPairs) {
    const exists = await prisma.partnerPair.findFirst({
      where: { OR: [{ doctorOneId: a }, { doctorTwoId: a }, { doctorOneId: b }, { doctorTwoId: b }] },
    });
    if (!exists) {
      await prisma.partnerPair.create({
        data: { groupId: betaId, doctorOneId: a, doctorTwoId: b },
      });
    }
  }
}

async function seedRotationPlan(
  alphaId: string,
  clinics: Array<{ id: string; name: string }>,
  shifts: Array<{ id: string; name: string; startsAt: string; endsAt: string }>,
  adminId: string,
) {
  log("seeding Spring 2026 rotation plan (next Sunday → 2 weeks)");
  const startsOn = nextSunday(7);
  const endsOn = new Date(startsOn);
  endsOn.setDate(startsOn.getDate() + 11);

  let plan = await prisma.rotationPlan.findFirst({ where: { label: "Spring 2026 Rotation" } });
  if (!plan) {
    plan = await prisma.rotationPlan.create({
      data: {
        label: "Spring 2026 Rotation",
        startsOn,
        endsOn,
        shiftId: shifts[0].id, // default shift
        active: true,
        createdById: adminId,
      },
    });
  }

  // Working days: Sun-Thu for 2 weeks → 10 working days
  const workingDates: Date[] = [];
  for (let offset = 0; offset < 12; offset += 1) {
    const d = new Date(startsOn);
    d.setDate(startsOn.getDate() + offset);
    if (d.getDay() >= 0 && d.getDay() <= 4) {
      workingDates.push(d);
    }
  }

  // Days 4 and 9 marked as vacation; others rotate through clinics.
  const planDays: RotationPlanDay[] = [];
  for (let i = 0; i < workingDates.length; i += 1) {
    const date = workingDates[i];
    const isVacation = i === 4 || i === 9;
    const clinic = isVacation ? null : clinics[i % clinics.length];
    const day = await prisma.rotationPlanDay.upsert({
      where: { planId_assignmentDate: { planId: plan.id, assignmentDate: date } },
      update: {
        clinicId: clinic?.id ?? null,
        isVacation,
        vacationReason: isVacation ? "University holiday" : null,
      },
      create: {
        planId: plan.id,
        clinicId: clinic?.id ?? null,
        assignmentDate: date,
        isVacation,
        vacationReason: isVacation ? "University holiday" : null,
      },
    });
    planDays.push(day);
  }

  // ClinicRotationAssignments for 5 of the non-vacation days for Group Alpha
  const assignmentTargets = workingDates
    .map((date, idx) => ({ date, idx }))
    .filter(({ idx }) => idx !== 4 && idx !== 9)
    .slice(0, 5);

  const assignments: ClinicRotationAssignment[] = [];
  for (let i = 0; i < assignmentTargets.length; i += 1) {
    const { date } = assignmentTargets[i];
    const clinic = clinics[i % clinics.length];
    const shift = shifts[i % shifts.length];
    let asn = await prisma.clinicRotationAssignment.findFirst({
      where: { assignmentDate: date, shiftId: shift.id, clinicId: clinic.id },
    });
    if (!asn) {
      asn = await prisma.clinicRotationAssignment.create({
        data: {
          planId: plan.id,
          groupId: alphaId,
          clinicId: clinic.id,
          shiftId: shift.id,
          assignmentDate: date,
          notes: `${clinic.name} — ${shift.name} rotation`,
        },
      });
    }
    assignments.push(asn);
  }

  return { plan, planDays, assignments, workingDates };
}

async function seedAvailabilitySlotsForRotation(
  doctorsAlpha: Array<{ id: string }>,
  clinics: Array<{ id: string }>,
  workingDates: Date[],
  shifts: Array<{ id: string; startsAt: string; endsAt: string }>,
) {
  log("seeding ~30 OPEN availability slots for Group Alpha doctors");
  // For each of the first 4 non-vacation working dates we create ~8 slots
  // across the 8 Alpha doctors, each 30 minutes long inside a shift window.
  const targetDates = workingDates.filter((_, i) => i !== 4 && i !== 9).slice(0, 4);

  let total = 0;
  for (let dIdx = 0; dIdx < targetDates.length; dIdx += 1) {
    const date = targetDates[dIdx];
    const clinic = clinics[dIdx % clinics.length];
    const shift = shifts[dIdx % shifts.length];
    const [startH, startM] = shift.startsAt.split(":").map(Number);
    for (let i = 0; i < doctorsAlpha.length; i += 1) {
      const doctor = doctorsAlpha[i];
      const start = atHour(date, startH, startM + i * 30);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      // Skip if a slot already exists for this doctor at that exact time
      const existing = await prisma.availabilitySlot.findFirst({
        where: { doctorId: doctor.id, startTime: start },
      });
      if (existing) continue;
      await prisma.availabilitySlot.create({
        data: {
          doctorId: doctor.id,
          clinicId: clinic.id,
          startTime: start,
          endTime: end,
          status: SlotStatus.OPEN,
          purpose: "General",
          autoGenerated: false,
        },
      });
      total += 1;
      if (total >= 30) break;
    }
    if (total >= 30) break;
  }
}

// ---------------------------------------------------------------------------
// Appointments + reports + ratings + events
// ---------------------------------------------------------------------------

type CategoryName =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED_NO_REPORT"
  | "COMPLETED_SUBMITTED"
  | "COMPLETED_REVIEWED";

interface AppointmentSpec {
  category: CategoryName;
  status: AppointmentStatus;
  daysOffset: number; // negative = past
  note?: string;
}

const APPOINTMENT_SPECS: AppointmentSpec[] = [
  // 8 PENDING — patient just requested, doctor hasn't responded
  ...Array.from({ length: 8 }, (_, i) => ({
    category: "PENDING" as CategoryName,
    status: AppointmentStatus.PENDING,
    daysOffset: 2 + i, // future
  })),
  // 8 APPROVED — future, doctor approved
  ...Array.from({ length: 8 }, (_, i) => ({
    category: "APPROVED" as CategoryName,
    status: AppointmentStatus.APPROVED,
    daysOffset: 4 + i,
  })),
  // 4 REJECTED — doctor said no
  ...Array.from({ length: 4 }, (_, i) => ({
    category: "REJECTED" as CategoryName,
    status: AppointmentStatus.REJECTED,
    daysOffset: -2 - i,
    note: "Patient didn't bring records",
  })),
  // 6 CANCELLED — mix of who cancelled
  ...Array.from({ length: 6 }, (_, i) => ({
    category: "CANCELLED" as CategoryName,
    status: AppointmentStatus.CANCELLED,
    daysOffset: -3 - i,
  })),
  // 4 NO_SHOW
  ...Array.from({ length: 4 }, (_, i) => ({
    category: "NO_SHOW" as CategoryName,
    status: AppointmentStatus.COMPLETED,
    daysOffset: -5 - i,
  })),
  // 10 COMPLETED, report not yet submitted
  ...Array.from({ length: 10 }, (_, i) => ({
    category: "COMPLETED_NO_REPORT" as CategoryName,
    status: AppointmentStatus.COMPLETED,
    daysOffset: -6 - i,
  })),
  // 10 COMPLETED, report SUBMITTED awaiting review
  ...Array.from({ length: 10 }, (_, i) => ({
    category: "COMPLETED_SUBMITTED" as CategoryName,
    status: AppointmentStatus.COMPLETED,
    daysOffset: -10 - i,
  })),
  // 10 COMPLETED, report REVIEWED — these drive the leaderboard
  ...Array.from({ length: 10 }, (_, i) => ({
    category: "COMPLETED_REVIEWED" as CategoryName,
    status: AppointmentStatus.COMPLETED,
    daysOffset: -15 - i,
  })),
];

const REPORT_TITLES = [
  "Initial assessment & treatment plan",
  "Endodontic therapy — visit 1",
  "Restoration completion",
  "Scaling & root planing follow-up",
  "Pediatric examination",
  "Extraction & post-op review",
];

const buildFormData = (clinicName: string, patientName: string, idx: number) => {
  const radiographicViewPool = ["Periapical", "Bitewing", "Panoramic", "CBCT"];
  return {
    chiefComplaint: pick(
      [
        "Patient reports sharp pain on chewing in the lower right quadrant.",
        "Gum bleeding while brushing for the past 3 weeks.",
        "Sensitivity to cold on the upper left first molar.",
        "Difficulty chewing due to a broken tooth.",
        "Routine check-up requested by the patient.",
      ],
      idx,
    ),
    medicalHistory: pick(
      [
        "No significant medical history. NKDA.",
        "Controlled hypertension on Lisinopril. NKDA.",
        "Type 2 diabetes, HbA1c 7.1. Allergic to penicillin.",
        "Asthma, uses albuterol inhaler. NKDA.",
      ],
      idx,
    ),
    dentalHistory: pick(
      [
        "Last dental visit 18 months ago. Previous composite restorations.",
        "Multiple extractions in the past 5 years. Brushes once daily.",
        "Regular 6-monthly check-ups. Previous orthodontic treatment.",
        "First dental visit in over 3 years.",
      ],
      idx,
    ),
    socialHistory: pick(
      [
        "Non-smoker. Occasional alcohol intake.",
        "Smokes ~10 cigarettes/day. No alcohol.",
        "Non-smoker, non-drinker. Two cups of coffee daily.",
        "Former smoker (quit 2 years ago).",
      ],
      idx,
    ),
    extraOralFindings: "Symmetrical face, no lymphadenopathy, TMJ within normal limits.",
    intraOralFindings: pick(
      [
        "Generalised plaque accumulation. Moderate gingival inflammation around lower anteriors.",
        "Deep distal caries on tooth #36. Adjacent teeth sound.",
        "Mild attrition on incisal edges. No mobility detected.",
        "Multiple class II caries lesions in posterior teeth.",
      ],
      idx,
    ),
    radiographicViews: sampleN(radiographicViewPool, 2),
    radiographicFindings: pick(
      [
        "Periapical radiolucency at apex of #36 consistent with chronic apical periodontitis.",
        "Generalised horizontal bone loss of approximately 20%.",
        "No radiographic pathology detected.",
        "Impacted lower 3rd molar in mesioangular position.",
      ],
      idx,
    ),
    diagnosisLines: [
      `Primary: ${clinicName === "Endodontics" ? "Symptomatic irreversible pulpitis" : clinicName === "Periodontics" ? "Generalised chronic periodontitis (Stage II)" : clinicName === "Pediatrics" ? "Early childhood caries" : "Impacted tooth requiring extraction"}`,
      "Secondary: Plaque-induced gingivitis",
      "Differential: Cracked tooth syndrome (ruled out)",
    ],
    treatmentVisits: [
      { visitLabel: "Visit 1", tooth: "#36", procedure: "Diagnosis & emergency pain relief" },
      { visitLabel: "Visit 2", tooth: "#36", procedure: "Working length determination & instrumentation" },
      { visitLabel: "Visit 3", tooth: "#36", procedure: "Obturation & coronal seal" },
      { visitLabel: "Visit 4", tooth: "—", procedure: "Post-op review & permanent restoration referral" },
      { visitLabel: "Visit 5", tooth: "", procedure: "" },
      { visitLabel: "Visit 6", tooth: "", procedure: "" },
      { visitLabel: "Visit 7", tooth: "", procedure: "" },
      { visitLabel: "Visit 8", tooth: "", procedure: "" },
    ],
    facultyNotes: `Patient ${patientName} was cooperative. Procedure carried out under supervision with adequate isolation.`,
  };
};

const REVIEW_FEEDBACK = [
  "Good work on isolation, watch the apex next time.",
  "Solid diagnosis. Improve documentation of medical history.",
  "Excellent case selection. Treatment plan well justified.",
  "Acceptable outcome. Pay closer attention to occlusion check.",
  "Strong clinical reasoning. Consider taking an additional periapical view next time.",
];

async function seedAppointmentsAndReports(
  doctors: Array<{ id: string; name: string; phone: string | null; semesterId: string | null }>,
  patients: Array<{ id: string; name: string; phone: string | null }>,
  clinics: Array<{ id: string; name: string }>,
  clinicCases: Array<{ id: string; clinicId: string; semesterId: string; title: string }>,
  supervisors: Array<{ id: string; name: string }>,
  partnerPairsMap: Map<string, string>, // doctorId -> partnerDoctorId
) {
  log(`seeding ${APPOINTMENT_SPECS.length} appointments across all lifecycle stages`);

  const counters = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    noShow: 0,
    completedNoReport: 0,
    completedSubmitted: 0,
    completedReviewed: 0,
    reports: 0,
    ratings: 0,
    events: 0,
  };

  for (let i = 0; i < APPOINTMENT_SPECS.length; i += 1) {
    const spec = APPOINTMENT_SPECS[i];
    const doctor = pick(doctors, i);
    const patient = pick(patients, i + 3);
    const clinic = pick(clinics, i);

    // Find a clinic-case in this doctor's semester for that clinic if possible
    const candidate = clinicCases.find(
      (c) => c.clinicId === clinic.id && (!doctor.semesterId || c.semesterId === doctor.semesterId),
    );
    const clinicCase = candidate ?? clinicCases.find((c) => c.clinicId === clinic.id) ?? null;

    // Time slot — distinct minute offset so unique constraint on doctor+startTime
    // never collides between re-runs of this loop within the same seed.
    const baseDate = daysFromNow(spec.daysOffset);
    const slotStart = atHour(baseDate, 9 + (i % 8), (i * 17) % 60);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    // Skip if the same doctor/start already exists (rerun safety)
    const existingSlot = await prisma.availabilitySlot.findFirst({
      where: { doctorId: doctor.id, startTime: slotStart },
      include: { appointment: true },
    });
    if (existingSlot?.appointment) {
      continue;
    }

    const slot =
      existingSlot ??
      (await prisma.availabilitySlot.create({
        data: {
          doctorId: doctor.id,
          clinicId: clinic.id,
          startTime: slotStart,
          endTime: slotEnd,
          status:
            spec.category === "PENDING" || spec.category === "APPROVED"
              ? SlotStatus.BOOKED
              : spec.category === "CANCELLED"
                ? SlotStatus.CANCELLED
                : SlotStatus.BOOKED,
          purpose: "General",
          autoGenerated: false,
        },
      }));

    const partnerDoctorId =
      spec.category === "APPROVED" || spec.category === "COMPLETED_REVIEWED"
        ? partnerPairsMap.get(doctor.id) ?? null
        : null;

    // Match the real booking flow (appointments-bookings.service.ts:118-122):
    // when an appointment has a partner doctor, the partner's slot at the
    // same time becomes PAIR_BLOCKED so a patient can't double-book the pair.
    if (partnerDoctorId) {
      const partnerSlotExisting = await prisma.availabilitySlot.findFirst({
        where: { doctorId: partnerDoctorId, startTime: slotStart },
      });
      if (partnerSlotExisting) {
        if (partnerSlotExisting.status === SlotStatus.OPEN) {
          await prisma.availabilitySlot.update({
            where: { id: partnerSlotExisting.id },
            data: { status: SlotStatus.PAIR_BLOCKED },
          });
        }
      } else {
        await prisma.availabilitySlot.create({
          data: {
            doctorId: partnerDoctorId,
            clinicId: clinic.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: SlotStatus.PAIR_BLOCKED,
            purpose: "Partner pair — blocked",
            autoGenerated: false,
          },
        });
      }
    }

    // Build appointment payload
    const data: Prisma.AppointmentCreateInput = {
      slot: { connect: { id: slot.id } },
      doctor: { connect: { id: doctor.id } },
      patient: { connect: { id: patient.id } },
      doctorPhone: doctor.phone,
      status: spec.status,
      note: spec.note,
      clinicCase: clinicCase ? { connect: { id: clinicCase.id } } : undefined,
      partnerDoctor: partnerDoctorId ? { connect: { id: partnerDoctorId } } : undefined,
    };

    // Per-category extras
    if (spec.category === "REJECTED") {
      counters.rejected += 1;
    } else if (spec.category === "PENDING") {
      counters.pending += 1;
    } else if (spec.category === "APPROVED") {
      counters.approved += 1;
    } else if (spec.category === "CANCELLED") {
      const byDoctor = i % 2 === 0;
      data.cancelledByDoctor = byDoctor;
      data.cancelledByPatient = !byDoctor;
      data.note = byDoctor ? "Doctor not available — please rebook." : "Patient cancelled.";
      counters.cancelled += 1;
    } else if (spec.category === "NO_SHOW") {
      data.noShow = true;
      data.completedAt = atHour(baseDate, 11);
      counters.noShow += 1;
    } else if (spec.category === "COMPLETED_NO_REPORT") {
      data.completedAt = atHour(baseDate, 11);
      data.doctorCompletionNotes =
        "Procedure completed without complications. Patient tolerated treatment well.";
      counters.completedNoReport += 1;
    } else if (spec.category === "COMPLETED_SUBMITTED") {
      data.completedAt = atHour(baseDate, 11);
      data.doctorCompletionNotes = "Case completed; report submitted for supervisor review.";
      data.reportSubmitted = true;
      data.reportSubmittedAt = atHour(daysFromNow(spec.daysOffset + 1), 14);
      counters.completedSubmitted += 1;
    } else if (spec.category === "COMPLETED_REVIEWED") {
      data.completedAt = atHour(baseDate, 11);
      data.doctorCompletionNotes = "Procedure completed; report has been reviewed by supervisor.";
      data.reportSubmitted = true;
      data.reportSubmittedAt = atHour(daysFromNow(spec.daysOffset + 1), 14);
      counters.completedReviewed += 1;
    }

    const appointment = await prisma.appointment.create({ data });

    // ----------------------------- reports ------------------------------
    if (spec.category === "COMPLETED_SUBMITTED" || spec.category === "COMPLETED_REVIEWED") {
      const isReviewed = spec.category === "COMPLETED_REVIEWED";
      const reviewer = pick(supervisors, i);
      const reportTitle = pick(REPORT_TITLES, i);
      const formData = buildFormData(clinic.name, patient.name, i);

      const reportData: Prisma.CaseReportCreateInput = {
        appointment: { connect: { id: appointment.id } },
        doctor: { connect: { id: doctor.id } },
        clinic: { connect: { id: clinic.id } },
        patientName: patient.name,
        patientPhone: patient.phone,
        supervisorName: reviewer.name,
        title: reportTitle,
        description: `${clinic.name} case for patient ${patient.name}. ${formData.chiefComplaint}`,
        formData: formData as unknown as Prisma.InputJsonValue,
        status: isReviewed ? ReportReviewStatus.REVIEWED : ReportReviewStatus.SUBMITTED,
        submittedAt: data.reportSubmittedAt ?? new Date(),
      };
      if (isReviewed) {
        reportData.reviewer = { connect: { id: reviewer.id } };
        reportData.mark = 70 + Math.floor(Math.random() * 26); // 70-95
        const rawRating = 3.5 + Math.random() * 1.5; // 3.5 - 5
        reportData.rating = Math.round(rawRating * 2) / 2; // half-star precision
        reportData.feedback = pick(REVIEW_FEEDBACK, i);
        reportData.reviewedAt = atHour(daysFromNow(spec.daysOffset + 2), 16);
      }
      if (partnerDoctorId) {
        reportData.partnerDoctor = { connect: { id: partnerDoctorId } };
      }

      const report = await prisma.caseReport.create({ data: reportData });
      counters.reports += 1;

      // REPORT_SUBMITTED event for all submitted reports
      await prisma.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          patientId: patient.id,
          type: PerformanceEventType.REPORT_SUBMITTED,
          createdAt: data.reportSubmittedAt ?? new Date(),
        },
      });
      counters.events += 1;

      if (isReviewed && clinicCase) {
        // bump doctor clinic case progress
        await prisma.doctorClinicCaseProgress.upsert({
          where: {
            doctorId_clinicCaseId: { doctorId: doctor.id, clinicCaseId: clinicCase.id },
          },
          update: {
            status: i % 3 === 0 ? ClinicCaseProgressStatus.ASSISTED : ClinicCaseProgressStatus.COMPLETED,
            completedAt: reportData.reviewedAt as Date,
            lastReportId: report.id,
            lastAppointmentId: appointment.id,
          },
          create: {
            doctorId: doctor.id,
            clinicCaseId: clinicCase.id,
            status: i % 3 === 0 ? ClinicCaseProgressStatus.ASSISTED : ClinicCaseProgressStatus.COMPLETED,
            completedAt: reportData.reviewedAt as Date,
            lastReportId: report.id,
            lastAppointmentId: appointment.id,
          },
        });
      }

      // ratings for REVIEWED ones
      if (isReviewed) {
        const halfStar = () => Math.round((3 + Math.random() * 2) * 2) / 2;
        await prisma.appointmentRating.create({
          data: {
            appointmentId: appointment.id,
            raterId: patient.id,
            targetId: doctor.id,
            kind: AppointmentRatingKind.PATIENT_TO_DOCTOR,
            stars: Math.max(3.5, halfStar()),
            comment: "Friendly and professional throughout the visit.",
            active: true,
          },
        });
        await prisma.appointmentRating.create({
          data: {
            appointmentId: appointment.id,
            raterId: reviewer.id,
            targetId: doctor.id,
            kind: AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
            stars: Math.max(3.5, halfStar()),
            comment: "Clinical handling at expected standard.",
            active: true,
          },
        });
        await prisma.appointmentRating.create({
          data: {
            appointmentId: appointment.id,
            raterId: doctor.id,
            targetId: patient.id,
            kind: AppointmentRatingKind.DOCTOR_TO_PATIENT,
            stars: halfStar(),
            comment: "Cooperative patient, followed all instructions.",
            active: true,
          },
        });
        counters.ratings += 3;
      }
    }

    // events for other lifecycle states (drives weekly performance counters)
    if (spec.category === "NO_SHOW") {
      await prisma.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          patientId: patient.id,
          type: PerformanceEventType.NO_SHOW,
        },
      });
      counters.events += 1;
    } else if (spec.category === "REJECTED") {
      await prisma.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          patientId: patient.id,
          type: PerformanceEventType.REJECTED,
        },
      });
      counters.events += 1;
    } else if (spec.category === "CANCELLED") {
      const cancelType =
        data.cancelledByDoctor
          ? PerformanceEventType.CANCEL_DOCTOR
          : PerformanceEventType.CANCEL_PATIENT;
      await prisma.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          patientId: patient.id,
          type: cancelType,
        },
      });
      counters.events += 1;
    }
  }

  return counters;
}

// ---------------------------------------------------------------------------
// Notifications + chat
// ---------------------------------------------------------------------------

async function seedNotifications(
  doctors: Array<{ id: string; name: string }>,
  patients: Array<{ id: string; name: string }>,
  supervisors: Array<{ id: string; name: string }>,
) {
  log("seeding ~30 notifications");
  const samples: Array<{ recipientId: string; title: string; body: string; read: boolean }> = [];

  for (let i = 0; i < 8; i += 1) {
    const doctor = pick(doctors, i);
    samples.push({
      recipientId: doctor.id,
      title: "New patient request",
      body: `${pick(patients, i).name} booked an appointment with you.`,
      read: i % 3 === 0,
    });
  }
  for (let i = 0; i < 8; i += 1) {
    const patient = pick(patients, i);
    samples.push({
      recipientId: patient.id,
      title: "Your appointment was approved",
      body: `Dr. ${pick(doctors, i).name} confirmed your upcoming appointment.`,
      read: i % 2 === 0,
    });
  }
  for (let i = 0; i < 6; i += 1) {
    const sup = pick(supervisors, i);
    samples.push({
      recipientId: sup.id,
      title: "New report awaiting review",
      body: `A new case report has been submitted by ${pick(doctors, i).name}.`,
      read: false,
    });
  }
  for (let i = 0; i < 8; i += 1) {
    const doctor = pick(doctors, i);
    samples.push({
      recipientId: doctor.id,
      title: "Welcome to Group Alpha",
      body: "You have been added to the rotation group. Check this week's schedule.",
      read: i % 4 === 0,
    });
  }

  await prisma.notification.createMany({ data: samples });
  return samples.length;
}

async function seedConversations(
  alphaId: string,
  betaId: string,
  doctorsAlpha: Array<{ id: string }>,
  doctorsBeta: Array<{ id: string }>,
  supervisors: Array<{ id: string }>,
  patients: Array<{ id: string }>,
  adminId: string,
) {
  log("seeding conversations (group rooms + ALL_USERS room + 4 direct chats)");

  // Group Alpha room — chat tied to the DoctorGroup via unique groupId
  let alphaRoom = await prisma.conversation.findFirst({ where: { groupId: alphaId } });
  if (!alphaRoom) {
    alphaRoom = await prisma.conversation.create({
      data: {
        kind: ConversationKind.ROOM,
        audience: ConversationRoomAudience.GROUP,
        title: "Group Alpha — Chat",
        description: "Coordination room for Year 4 Semester 2 rotation group.",
        groupId: alphaId,
      },
    });
  }

  // Group Beta room
  let betaRoom = await prisma.conversation.findFirst({ where: { groupId: betaId } });
  if (!betaRoom) {
    betaRoom = await prisma.conversation.create({
      data: {
        kind: ConversationKind.ROOM,
        audience: ConversationRoomAudience.GROUP,
        title: "Group Beta — Chat",
        description: "Coordination room for Year 5 Semester 1 rotation group.",
        groupId: betaId,
      },
    });
  }

  // ALL_USERS room — keyed on code so it's idempotent
  let allRoom = await prisma.conversation.findFirst({ where: { code: "ALL_USERS" } });
  if (!allRoom) {
    allRoom = await prisma.conversation.create({
      data: {
        kind: ConversationKind.ROOM,
        audience: ConversationRoomAudience.ALL_USERS,
        code: "ALL_USERS",
        title: "Announcements",
        description: "Clinic-wide announcements for everyone.",
      },
    });
  }

  // Helpers for participants/messages
  const addParticipants = async (conversationId: string, userIds: string[]) => {
    for (const userId of userIds) {
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        update: {},
        create: { conversationId, userId },
      });
    }
  };

  // Add room participants
  await addParticipants(alphaRoom.id, [
    ...doctorsAlpha.map((d) => d.id),
    ...supervisors.slice(0, 2).map((s) => s.id),
  ]);
  await addParticipants(betaRoom.id, [
    ...doctorsBeta.map((d) => d.id),
    ...supervisors.slice(2, 4).map((s) => s.id),
  ]);
  // Everyone for the announcements room
  const everyone = [
    adminId,
    ...supervisors.map((s) => s.id),
    ...doctorsAlpha.map((d) => d.id),
    ...doctorsBeta.map((d) => d.id),
    ...patients.map((p) => p.id),
  ];
  await addParticipants(allRoom.id, everyone);

  // Seed messages only if room currently has none (idempotency)
  const seedMessages = async (
    conversationId: string,
    speakers: Array<{ id: string }>,
    contents: string[],
    startOffsetDays: number,
  ) => {
    const existing = await prisma.message.count({ where: { conversationId } });
    if (existing > 0) return;
    for (let i = 0; i < contents.length; i += 1) {
      const sender = pick(speakers, i);
      const imageUrl =
        i === Math.floor(contents.length / 2)
          ? `/uploads/chat/${"3f4479e4-9bb1-4215-8a58-e0ff7366af8f"}.png`
          : null;
      await prisma.message.create({
        data: {
          conversationId,
          senderId: sender.id,
          text: contents[i],
          imageUrl,
          createdAt: atHour(daysFromNow(startOffsetDays + i), 10 + (i % 6), (i * 7) % 60),
        },
      });
    }
  };

  await seedMessages(
    alphaRoom.id,
    [...doctorsAlpha, ...supervisors.slice(0, 2)],
    [
      "Morning everyone — see today's rotation in Endodontics.",
      "Bring your loupes, supervisor will check isolation.",
      "Sharing the case selection sheet for this week.",
      "Reminder: case reports for last week are due tomorrow.",
      "Anyone available to assist with a tricky molar extraction?",
      "I can assist after my 11am slot.",
      "Great, thanks!",
    ],
    -5,
  );

  await seedMessages(
    betaRoom.id,
    [...doctorsBeta, ...supervisors.slice(2, 4)],
    [
      "Welcome to Group Beta — final-year rotation begins next week.",
      "Please review the new SOP for sterile chains.",
      "Booking is open. Confirm your slots.",
      "First exam scheduled for Thursday.",
      "Don't forget loupes & PPE.",
      "See you all at 8am.",
    ],
    -4,
  );

  await seedMessages(
    allRoom.id,
    [{ id: adminId }, ...supervisors],
    [
      "Clinic-wide reminder: please update your availability for next week.",
      "Building B will be closed Friday for maintenance.",
      "New radiograph viewer available at chair 7.",
      "Reminder: ID badges must be worn inside the clinic.",
    ],
    -3,
  );

  // 4 DIRECT conversations between random users
  const directPairs: Array<[string, string]> = [
    [doctorsAlpha[0].id, patients[0].id],
    [doctorsAlpha[1].id, patients[5].id],
    [supervisors[0].id, doctorsAlpha[3].id],
    [doctorsBeta[0].id, patients[10].id],
  ];
  for (let i = 0; i < directPairs.length; i += 1) {
    const [a, b] = directPairs[i];
    // Look up existing direct conversation between exactly these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        kind: ConversationKind.DIRECT,
        AND: [
          { participants: { some: { userId: a } } },
          { participants: { some: { userId: b } } },
        ],
      },
    });
    let convo = existing;
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { kind: ConversationKind.DIRECT },
      });
      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: convo.id, userId: a },
          { conversationId: convo.id, userId: b },
        ],
      });
    }
    const existingMsgs = await prisma.message.count({ where: { conversationId: convo.id } });
    if (existingMsgs === 0) {
      const sample = [
        "Hi, thanks for reaching out!",
        "Could we move the appointment to Wednesday?",
        "Sure, 10am works for me.",
        "Please bring your previous X-rays.",
        "Confirmed — see you then.",
        "Quick question about post-op care…",
        "Of course, here are the instructions.",
        "Thank you!",
      ];
      const messages = sampleN(sample, 6 + (i % 3));
      for (let m = 0; m < messages.length; m += 1) {
        const senderId = m % 2 === 0 ? a : b;
        await prisma.message.create({
          data: {
            conversationId: convo.id,
            senderId,
            text: messages[m],
            createdAt: atHour(daysFromNow(-3 + m), 9 + m, (m * 9) % 60),
          },
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Quiz question bank — reference data for the Game module
// ---------------------------------------------------------------------------

async function seedQuizQuestions(): Promise<number> {
  // The quiz question bank is reference data (not demo data tied to a doctor).
  // We upsert by `prompt` because it's deterministic and unique across the bank.
  // Re-running this is safe: if a prompt already exists we refresh its options
  // / correctIndex / category in case the question text was lightly edited but
  // the prompt remained the same.
  let upserts = 0;
  for (const q of QUIZ_QUESTIONS_SEED) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { prompt: q.prompt },
      select: { id: true },
    });
    if (existing) {
      await prisma.quizQuestion.update({
        where: { id: existing.id },
        data: {
          options: [...q.options],
          correctIndex: q.correctIndex,
          category: q.category,
          active: true,
        },
      });
    } else {
      await prisma.quizQuestion.create({
        data: {
          prompt: q.prompt,
          options: [...q.options],
          correctIndex: q.correctIndex,
          category: q.category,
          active: true,
        },
      });
    }
    upserts += 1;
  }
  log(`quiz questions upserted: ${upserts}`);
  return upserts;
}

async function main() {
  log("DentyHub demo seed starting…");

  // Reference data (quiz questions) is always reconciled, regardless of the
  // appointment-count idempotency gate below — they're not "demo" rows.
  await seedQuizQuestions();

  if (process.env.SEED_RESET === "true") {
    await resetDemoData();
  } else {
    // Idempotency early-exit: if there are already plenty of appointments,
    // assume the demo data is in place and just bail. This lets the script be
    // re-run safely after a successful seed.
    const appts = await prisma.appointment.count();
    if (appts >= 5) {
      log(
        `already seeded (appointment count = ${appts}). ` +
          `Set SEED_RESET=true to wipe demo data and re-run.`,
      );
      return;
    }
  }

  const admin = await getOrCreateAdmin();
  const { y4s2, y5s1 } = await seedSemesters();
  const supervisors = await seedSupervisors(admin.id);
  const { approved: doctors } = await seedDoctors(y4s2.id, y5s1.id, admin.id);
  const patients = await seedPatients();
  await seedSmileCheckins(patients);
  await seedArcadeAttempts(patients);
  const clinics = await seedClinics();
  const shifts = await seedShiftTemplates();
  const clinicCases = await seedSemesterClinicCases(
    [
      { id: y4s2.id, label: y4s2.label },
      { id: y5s1.id, label: y5s1.label },
    ],
    clinics,
  );
  await seedClinicSupervisorLinks(supervisors, clinics);

  const doctorsY4 = doctors.slice(0, 8);
  const doctorsY5 = doctors.slice(8);

  const { alpha, beta } = await seedGroups(supervisors, doctorsY4, doctorsY5, admin.id);

  await seedPartnerPairs(alpha.id, beta.id, doctorsY4, doctorsY5);

  const { workingDates } = await seedRotationPlan(alpha.id, clinics, shifts, admin.id);

  await seedAvailabilitySlotsForRotation(doctorsY4, clinics, workingDates, shifts);

  // Build partner map for appointments (each doctor -> their pair partner)
  const allPairs = await prisma.partnerPair.findMany();
  const partnerMap = new Map<string, string>();
  for (const p of allPairs) {
    partnerMap.set(p.doctorOneId, p.doctorTwoId);
    partnerMap.set(p.doctorTwoId, p.doctorOneId);
  }

  const counters = await seedAppointmentsAndReports(
    doctors,
    patients,
    clinics,
    clinicCases.map((c) => ({
      id: c.id,
      clinicId: c.clinicId,
      semesterId: c.semesterId,
      title: c.title,
    })),
    supervisors,
    partnerMap,
  );

  const notifCount = await seedNotifications(doctors, patients, supervisors);

  await seedConversations(
    alpha.id,
    beta.id,
    doctorsY4,
    doctorsY5,
    supervisors,
    patients,
    admin.id,
  );

  // Print a summary the student/examiner can sanity-check
  const totals = {
    users: await prisma.user.count(),
    semesters: await prisma.semester.count(),
    clinics: await prisma.clinic.count(),
    shiftTemplates: await prisma.shiftTemplate.count(),
    semesterClinicCases: await prisma.semesterClinicCase.count(),
    groups: await prisma.doctorGroup.count(),
    partnerPairs: await prisma.partnerPair.count(),
    rotationPlans: await prisma.rotationPlan.count(),
    rotationDays: await prisma.rotationPlanDay.count(),
    rotationAssignments: await prisma.clinicRotationAssignment.count(),
    availabilitySlots: await prisma.availabilitySlot.count(),
    appointments: await prisma.appointment.count(),
    appointmentEvents: await prisma.appointmentEvent.count(),
    caseReports: await prisma.caseReport.count(),
    ratings: await prisma.appointmentRating.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count(),
    quizQuestions: await prisma.quizQuestion.count(),
  };
  log("==================== SEED SUMMARY ====================");
  for (const [k, v] of Object.entries(totals)) {
    log(`  ${k.padEnd(22)} : ${v}`);
  }
  log("appointment lifecycle breakdown:", counters);
  log("======================================================");
  log("done.");
}

main()
  .catch((err) => {
    console.error("[seed] ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
