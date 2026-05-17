"use client";

import type { ManagedUser } from "@/features/admin/types/admin";
import type { PlanningWorkspaceData } from "@/features/supervision/types";

type PlanningClinic = PlanningWorkspaceData["clinics"][number];

type PlanningSupervisorsViewProps = {
  panelClass: string;
  primaryAction: string;
  smallDanger: string;
  clinicSupervisorForm: {
    clinicId: string;
    supervisorId: string;
    notes: string;
  };
  sortedClinics: PlanningClinic[];
  sortedSupervisors: ManagedUser[];
  selectedClinicSupervisorTarget: PlanningClinic | null;
  onClinicSupervisorFieldChange: (
    field: "clinicId" | "supervisorId" | "notes",
    value: string
  ) => void;
  onSaveClinicSupervisor: () => void;
  onRemoveClinicSupervisor: (clinicId: string, supervisorId: string) => void;
};

export function PlanningSupervisorsView({
  panelClass,
  primaryAction,
  smallDanger,
  clinicSupervisorForm,
  sortedClinics,
  sortedSupervisors,
  selectedClinicSupervisorTarget,
  onClinicSupervisorFieldChange,
  onSaveClinicSupervisor,
  onRemoveClinicSupervisor,
}: PlanningSupervisorsViewProps) {
  const coveredClinics = sortedClinics.filter(
    (clinic) => clinic.supervisorLinks.length > 0
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.64fr_1.36fr]">
      <div className={panelClass}>
        <p className="denty-kicker">Coverage desk</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
          Link supervisors to clinics
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Supervisors belong to clinics generally, not to one specific plan day.
          A clinic can host multiple supervisors, and one supervisor can cover
          multiple clinics.
        </p>

        <div className="mt-6 space-y-3">
          <select
            value={clinicSupervisorForm.clinicId}
            onChange={(e) =>
              onClinicSupervisorFieldChange("clinicId", e.target.value)
            }
            className="denty-field cursor-pointer text-sm"
          >
            {sortedClinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>

          <select
            value={clinicSupervisorForm.supervisorId}
            onChange={(e) =>
              onClinicSupervisorFieldChange("supervisorId", e.target.value)
            }
            className="denty-field cursor-pointer text-sm"
          >
            {sortedSupervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </option>
            ))}
          </select>

          <textarea
            value={clinicSupervisorForm.notes}
            onChange={(e) =>
              onClinicSupervisorFieldChange("notes", e.target.value)
            }
            className="denty-field min-h-[110px] text-sm"
            placeholder="Optional clinic note for this supervisor"
          />
        </div>

        {selectedClinicSupervisorTarget ? (
          <div className="mt-5 rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(11,30,52,0.56))] p-5 text-white shadow-[0_20px_54px_rgba(6,17,34,0.24)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">
                  {selectedClinicSupervisorTarget.name}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {selectedClinicSupervisorTarget.supervisorLinks.length} linked supervisors
                  {selectedClinicSupervisorTarget.description
                    ? ` | ${selectedClinicSupervisorTarget.description}`
                    : ""}
                </p>
              </div>
              <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
                Coverage live
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            onClick={onSaveClinicSupervisor}
            className={primaryAction}
          >
            Save clinic supervisor
          </button>
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="denty-kicker">Coverage wall</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              Supervisor by clinic
            </h2>
          </div>
          <span className="rounded-full border border-white/14 bg-[rgba(255,255,255,0.28)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(10,22,40,0.58)]">
            {coveredClinics.length} clinics covered
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {coveredClinics.map((clinic) => (
            <div
              key={clinic.id}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(229,237,243,0.18))] shadow-[0_20px_54px_rgba(7,18,34,0.08)] backdrop-blur-[18px]"
            >
              <div className="grid gap-4 border-b border-white/10 px-5 py-4 xl:grid-cols-[0.42fr_0.58fr] xl:items-center">
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">
                    {clinic.name}
                  </p>
                  {clinic.description ? (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {clinic.description}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/24 px-4 py-3">
                  <p className="denty-kicker !tracking-[0.16em]">Coverage</p>
                  <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                    {clinic.supervisorLinks.length} supervisors linked
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Supervisors can cover multiple clinics at the same time.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-5 py-4 lg:grid-cols-2">
                {clinic.supervisorLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-[22px] border border-white/10 bg-white/24 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          {link.supervisor.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          @{link.supervisor.username}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onRemoveClinicSupervisor(clinic.id, link.supervisor.id)
                        }
                        className={smallDanger}
                      >
                        Remove
                      </button>
                    </div>
                    {link.notes ? (
                      <p className="mt-3 text-xs leading-6 text-[var(--muted-foreground)]">
                        {link.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!coveredClinics.length ? (
            <div className="denty-placeholder p-5">
              <p className="denty-kicker">Clinic coverage</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                No supervisors have been linked to clinics yet.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
