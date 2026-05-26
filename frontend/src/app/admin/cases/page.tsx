"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import {
  getPlanningWorkspace,
  getUsers,
} from "@/features/admin/services/admin-api";
import type { ManagedUser } from "@/features/admin/types/admin";
import {
  deleteDoctorProgress,
  getAdminDoctorProgress,
  listClinicCases,
  restoreClinicCase,
  setDoctorProgressStatus,
  softDeleteClinicCase,
} from "@/features/cases/services/cases-api";
import type {
  AdminDoctorProgressResponse,
  CaseProgressStatus,
  SemesterClinicCaseRow,
} from "@/features/cases/types";
import { useFeedbackToast } from "@/features/ui/hooks/use-feedback-toast";

type Semester = { id: string; label: string };
type Clinic = { id: string; name: string };

function StatusPill({ status }: { status: CaseProgressStatus }) {
  const config = {
    COMPLETED: "border-emerald-400/35 bg-emerald-500/15 text-emerald-700",
    ASSISTED: "border-amber-400/35 bg-amber-500/15 text-amber-700",
    OPEN: "border-sky-400/35 bg-sky-500/15 text-sky-700",
  }[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${config}`}>
      {status}
    </span>
  );
}

export default function AdminCasesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [cases, setCases] = useState<SemesterClinicCaseRow[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [doctorProgress, setDoctorProgress] = useState<AdminDoctorProgressResponse | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSearch, setProgressSearch] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useFeedbackToast({
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    messageTitle: "Cases",
    errorTitle: "Cases",
  });

  // Bootstrap semesters, clinics, doctors
  useEffect(() => {
    let cancelled = false;
    Promise.all([getPlanningWorkspace(), getUsers()])
      .then(([planning, users]) => {
        if (cancelled) return;
        const semList =
          (planning as { semesters?: Semester[] }).semesters?.map((s) => ({
            id: s.id,
            label: s.label,
          })) || [];
        const clinicList =
          (planning as { clinics?: Clinic[] }).clinics?.map((c) => ({
            id: c.id,
            name: c.name,
          })) || [];
        setSemesters(semList);
        setClinics(clinicList);
        setDoctors(users.filter((u) => u.role === "DOCTOR"));
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e?.message || "Failed to load resources.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCases = async () => {
    setCasesLoading(true);
    try {
      const data = await listClinicCases({
        semesterId: selectedSemesterId || undefined,
        clinicId: selectedClinicId || undefined,
        activeOnly,
      });
      setCases(data);
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to load cases.");
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemesterId, selectedClinicId, activeOnly]);

  const loadDoctorProgress = async (doctorId: string) => {
    if (!doctorId) {
      setDoctorProgress(null);
      return;
    }
    setProgressLoading(true);
    try {
      const data = await getAdminDoctorProgress(doctorId);
      setDoctorProgress(data);
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to load progress.");
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctorProgress(selectedDoctorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId]);

  const filteredCases = useMemo(() => {
    const needle = caseSearch.trim().toLowerCase();
    if (!needle) return cases;
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        (c.description?.toLowerCase().includes(needle) ?? false) ||
        c.clinic.name.toLowerCase().includes(needle) ||
        c.semester.label.toLowerCase().includes(needle),
    );
  }, [cases, caseSearch]);

  const filteredProgress = useMemo(() => {
    if (!doctorProgress) return [];
    const needle = progressSearch.trim().toLowerCase();
    if (!needle) return doctorProgress.progress;
    return doctorProgress.progress.filter(
      (entry) =>
        entry.clinicCase.title.toLowerCase().includes(needle) ||
        entry.clinicCase.clinic.name.toLowerCase().includes(needle),
    );
  }, [doctorProgress, progressSearch]);

  const handleSoftDelete = async (id: string) => {
    try {
      await softDeleteClinicCase(id);
      setMessage("Case archived. It no longer appears in the booking picker.");
      await loadCases();
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to archive case.");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreClinicCase(id);
      setMessage("Case restored.");
      await loadCases();
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to restore case.");
    }
  };

  const handleSetStatus = async (
    progressId: string,
    status: CaseProgressStatus,
  ) => {
    try {
      await setDoctorProgressStatus(progressId, status);
      setMessage(`Progress set to ${status.toLowerCase()}.`);
      await loadDoctorProgress(selectedDoctorId);
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to update progress.");
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    if (!confirm("Remove this progress row? The case becomes open again for this doctor.")) {
      return;
    }
    try {
      await deleteDoctorProgress(progressId);
      setMessage("Progress row removed.");
      await loadDoctorProgress(selectedDoctorId);
    } catch (e) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to delete progress.");
    }
  };

  return (
    <AdminShell
      title="Cases"
      description="Manage the semester case catalog and per-doctor progress. Cases listed here populate the booking picker for the assigned doctor's slots."
    >
      <div className="space-y-6">
        {/* ── Catalog ─────────────────────────────────────────────── */}
        <section className="denty-panel-strong p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Catalog</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                Semester clinic cases
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                Each case becomes a bookable option for any student in its semester when they have an open slot at the linked clinic.
              </p>
            </div>
            <span className="denty-pill">{filteredCases.length} / {cases.length}</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              placeholder="Search by title, description, clinic, or semester"
              className="denty-field text-sm"
            />
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="denty-field cursor-pointer text-sm sm:min-w-[160px]"
            >
              <option value="">All semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="denty-field cursor-pointer text-sm sm:min-w-[160px]"
            >
              <option value="">All clinics</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-white/15 bg-white/30 px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="cursor-pointer accent-teal-400"
              />
              Active only
            </label>
          </div>

          <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {casesLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
            ) : filteredCases.length ? (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  className={`denty-dashboard-card flex flex-wrap items-start justify-between gap-3 p-4 ${
                    c.active ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
                        {c.title}
                      </p>
                      {c.requiredCount > 1 ? (
                        <span className="denty-pill">×{c.requiredCount}</span>
                      ) : null}
                      {!c.active ? (
                        <span className="inline-flex rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      <span className="font-semibold">{c.semester.label}</span>
                      <span className="opacity-60"> · </span>
                      <span className="font-semibold">{c.clinic.name}</span>
                    </p>
                    {c.description ? (
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        {c.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                      Used by {c._count.appointments} appointment{c._count.appointments === 1 ? "" : "s"}
                      <span className="opacity-60"> · </span>
                      {c._count.progress} doctor progress row{c._count.progress === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-none gap-2">
                    {c.active ? (
                      <button
                        type="button"
                        onClick={() => void handleSoftDelete(c.id)}
                        className="denty-button-secondary px-3 py-2 text-xs font-semibold"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRestore(c.id)}
                        className="denty-button-secondary px-3 py-2 text-xs font-semibold"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No cases match the filter.</p>
            )}
          </div>
        </section>

        {/* ── Per-doctor progress ─────────────────────────────────── */}
        <section className="denty-panel-strong p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="denty-kicker">Progress</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                Per-doctor case progress
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                Pick a doctor to see every case row in their semester. Toggle status to override (open ↔ done), or remove a row entirely to reset it.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr]">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="denty-field cursor-pointer text-sm"
            >
              <option value="">Choose a doctor…</option>
              {doctors
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · @{d.username}
                    {d.doctorIdNumber ? ` · ${d.doctorIdNumber}` : ""}
                  </option>
                ))}
            </select>
            <input
              value={progressSearch}
              onChange={(e) => setProgressSearch(e.target.value)}
              placeholder="Filter rows by case title or clinic"
              className="denty-field text-sm"
              disabled={!selectedDoctorId}
            />
          </div>

          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {!selectedDoctorId ? (
              <p className="text-sm text-[var(--muted-foreground)]">Pick a doctor above to view their cases.</p>
            ) : progressLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
            ) : filteredProgress.length ? (
              filteredProgress.map((entry) => (
                <div
                  key={entry.id}
                  className="denty-dashboard-card flex flex-wrap items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
                        {entry.clinicCase.title}
                      </p>
                      <StatusPill status={entry.status} />
                      {entry.clinicCase.requiredCount > 1 ? (
                        <span className="denty-pill">×{entry.clinicCase.requiredCount}</span>
                      ) : null}
                      {!entry.clinicCase.active ? (
                        <span className="inline-flex rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      <span className="font-semibold">{entry.clinicCase.clinic.name}</span>
                      <span className="opacity-60"> · </span>
                      {entry.clinicCase.semester.label}
                    </p>
                    {entry.completedAt ? (
                      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                        Completed {new Date(entry.completedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-none flex-wrap gap-2">
                    {entry.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => void handleSetStatus(entry.id, "COMPLETED")}
                        className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20"
                      >
                        Mark done
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleSetStatus(entry.id, "OPEN")}
                        className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-500/20"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteProgress(entry.id)}
                      className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No progress rows.</p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
