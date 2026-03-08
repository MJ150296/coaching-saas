"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleSelect } from "@/shared/components/ui/SingleSelect";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { getAdminOrganizations, getAdminCoachingCenters } from "@/shared/lib/client/adminTenantReferenceData";

const CLASS_LEVEL_OPTIONS = [
  { value: "LOWER_PRIMARY", label: "Lower Primary (Classes 1-5)" },
  { value: "UPPER_PRIMARY", label: "Upper Primary (Classes 6-8)" },
  { value: "SECONDARY", label: "Secondary (Classes 9-10)" },
  { value: "HIGHER_SECONDARY", label: "Higher Secondary (Classes 11-12)" },
];

const WEEKDAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

type TimetableEntry = {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  subjectName: string;
  teacherId?: string;
  sourceAllocationId: string;
};

type AcademicYearOption = {
  id: string;
  name: string;
};

type ClassMasterOption = {
  id: string;
  name: string;
  level?: string;
};

type SectionOption = {
  id: string;
  name: string;
  classMasterId: string;
};

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type OrganizationOption = {
  id: string;
  name: string;
};

type CoachingCenterOption = {
  id: string;
  name: string;
  organizationId: string;
};

function inferClassLevelFromName(className: string): string | undefined {
  const match = className.match(/\d+/);
  if (!match) return undefined;
  const classNumber = Number(match[0]);
  if (classNumber >= 1 && classNumber <= 5) return "LOWER_PRIMARY";
  if (classNumber >= 6 && classNumber <= 8) return "UPPER_PRIMARY";
  if (classNumber >= 9 && classNumber <= 10) return "SECONDARY";
  if (classNumber >= 11 && classNumber <= 12) return "HIGHER_SECONDARY";
  return undefined;
}

export default function AcademicManagementPage() {
  const { toastMessage } = useToast();
  const [organizationId, setOrganizationId] = useState("");
  const [coachingCenterId, setCoachingCenterId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  const [className, setClassName] = useState("");
  const [classLevel, setClassLevel] = useState("LOWER_PRIMARY");

  const [sectionClassMasterId, setSectionClassMasterId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionCapacity, setSectionCapacity] = useState("");
  const [sectionRoom, setSectionRoom] = useState("");
  const [sectionShift, setSectionShift] = useState("");
  const [sectionTeacherId, setSectionTeacherId] = useState("");

  const [subjectClassMasterId, setSubjectClassMasterId] = useState("");
  const [subjectSectionId, setSubjectSectionId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectTeacherId, setSubjectTeacherId] = useState("");
  const [subjectWeeklyPeriods, setSubjectWeeklyPeriods] = useState("");
  const [timetableAcademicYearId, setTimetableAcademicYearId] = useState("");
  const [timetableClassMasterId, setTimetableClassMasterId] = useState("");
  const [timetableSectionId, setTimetableSectionId] = useState("");
  const [timetablePeriodsPerDay, setTimetablePeriodsPerDay] = useState("8");
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableTeacherId, setTimetableTeacherId] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<AcademicYearOption[]>([]);
  const [classMasterOptions, setClassMasterOptions] = useState<ClassMasterOption[]>([]);
  const [allSections, setAllSections] = useState<SectionOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [optionLoading, setOptionLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterOption[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [showAdvancedAcademicFields, setShowAdvancedAcademicFields] = useState(false);

  const effectiveClassMasterId = timetableClassMasterId || subjectClassMasterId;
  const effectiveAcademicYearId = timetableAcademicYearId || academicYearId;

  const visibleTimetableEntries = useMemo(
    () =>
      timetableTeacherId
        ? timetableEntries.filter((entry) => entry.teacherId === timetableTeacherId)
        : timetableEntries,
    [timetableEntries, timetableTeacherId]
  );

  const timetableDays = useMemo(() => {
    const fromEntries = Array.from(new Set(visibleTimetableEntries.map((entry) => entry.dayOfWeek)));
    if (fromEntries.length === 0) return WEEKDAY_ORDER;
    return WEEKDAY_ORDER.filter((day) => fromEntries.includes(day));
  }, [visibleTimetableEntries]);

  const timetablePeriodColumns = useMemo(() => {
    const maxFromEntries = timetableEntries.reduce((max, entry) => Math.max(max, entry.periodNumber), 0);
    const configured = Number(timetablePeriodsPerDay);
    const maxPeriod = Number.isFinite(configured) && configured > 0 ? Math.max(configured, maxFromEntries) : Math.max(8, maxFromEntries);
    return Array.from({ length: maxPeriod }, (_, index) => index + 1);
  }, [timetableEntries, timetablePeriodsPerDay]);

  const timetableSlotMap = useMemo(() => {
    const slots = new Map<string, TimetableEntry>();
    for (const entry of visibleTimetableEntries) {
      slots.set(`${entry.dayOfWeek}-${entry.periodNumber}`, entry);
    }
    return slots;
  }, [visibleTimetableEntries]);

  const timetableYearDropdownOptions = useMemo(
    () =>
      academicYearOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [academicYearOptions]
  );

  const timetableClassDropdownOptions = useMemo(
    () =>
      classMasterOptions.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` - ${item.level}` : ""} (${item.id})`,
      })),
    [classMasterOptions]
  );

  const timetableSectionDropdownOptions = useMemo(
    () =>
      allSections
        .filter((item) => !effectiveClassMasterId || item.classMasterId === effectiveClassMasterId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [allSections, effectiveClassMasterId]
  );

  const timetableTeacherDropdownOptions = useMemo(
    () =>
      teacherOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.email})`,
      })),
    [teacherOptions]
  );

  const tenantAcademicYearDropdownOptions = useMemo(
    () =>
      academicYearOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [academicYearOptions]
  );

  const sectionClassMasterDropdownOptions = useMemo(
    () =>
      classMasterOptions.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` - ${item.level}` : ""} (${item.id})`,
      })),
    [classMasterOptions]
  );

  const sectionTeacherDropdownOptions = useMemo(
    () =>
      teacherOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.email})`,
      })),
    [teacherOptions]
  );

  const subjectAcademicYearDropdownOptions = useMemo(
    () =>
      academicYearOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [academicYearOptions]
  );

  const subjectClassMasterDropdownOptions = useMemo(
    () =>
      classMasterOptions.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` - ${item.level}` : ""} (${item.id})`,
      })),
    [classMasterOptions]
  );

  const subjectSectionDropdownOptions = useMemo(
    () =>
      allSections
        .filter((item) => !subjectClassMasterId || item.classMasterId === subjectClassMasterId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [allSections, subjectClassMasterId]
  );

  const subjectTeacherDropdownOptions = useMemo(
    () =>
      teacherOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.email})`,
      })),
    [teacherOptions]
  );

  const organizationDropdownOptions = useMemo(
    () =>
      organizations.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [organizations]
  );

  const coachingCenterDropdownOptions = useMemo(
    () =>
      coachingCenters
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [coachingCenters, organizationId]
  );

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  useEffect(() => {
    if (showAdvancedAcademicFields) return;
    setSectionClassMasterId("");
    setSectionName("");
    setSectionCapacity("");
    setSectionRoom("");
    setSectionShift("");
    setSectionTeacherId("");
    setSubjectSectionId("");
    setTimetableSectionId("");
  }, [showAdvancedAcademicFields]);

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setTenantLoading(true);
      try {
        const items = await getAdminOrganizations();
        if (!active) return;
        setOrganizations(items);
        if (items.length === 1) {
          setOrganizationId((prev) => prev || items[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setCoachingCenters([]);
      setCoachingCenterId("");
      return;
    }

    let active = true;

    async function loadCoachingCenters() {
      setTenantLoading(true);
      try {
        const items = await getAdminCoachingCenters(organizationId);
        if (!active) return;
        setCoachingCenters(items);

        setCoachingCenterId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return "";
          return prev;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadCoachingCenters();
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const canLoadOptions = Boolean(organizationId && coachingCenterId);
    if (!canLoadOptions) {
      setAcademicYearOptions([]);
      setClassMasterOptions([]);
      setAllSections([]);
      setTeacherOptions([]);
      return;
    }

    let active = true;

    async function loadOptions() {
      setOptionLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("coachingCenterId", coachingCenterId);
        const response = await fetch(`/api/admin/academic/options?${params.toString()}`);
        const data = await response.json();

        if (!active) return;
        if (!response.ok) return;

        setAcademicYearOptions(
          ((data?.academicYears as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
        setClassMasterOptions(
          ((data?.classMasters as Array<{ id: string; name: string; level?: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            level: item.level,
          }))
        );
        setAllSections(
          ((data?.sections as Array<{ id: string; name: string; classMasterId: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            classMasterId: item.classMasterId,
          }))
        );
        setTeacherOptions(
          ((data?.teachers as Array<{ id: string; name: string; email: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
          }))
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setOptionLoading(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [organizationId, coachingCenterId]);

  async function postJson(url: string, payload: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Request failed");
        return;
      }
      setMessage("Saved successfully.");
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function loadTimetable() {
    const yearId = effectiveAcademicYearId;
    const classMasterId = effectiveClassMasterId;
    if (!yearId || !classMasterId) {
      setMessage("Academic Year and Class Master are required to load timetable.");
      return;
    }

    setTimetableLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (coachingCenterId) params.set("coachingCenterId", coachingCenterId);
      params.set("academicYearId", yearId);
      params.set("classMasterId", classMasterId);
      if (timetableSectionId) params.set("sectionId", timetableSectionId);

      const response = await fetch(`/api/admin/timetable?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to load timetable");
        return;
      }

      setTimetableEntries((data?.entries || []) as TimetableEntry[]);
      setMessage("Timetable loaded.");
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setTimetableLoading(false);
    }
  }

  async function generateTimetable() {
    const yearId = effectiveAcademicYearId;
    const classMasterId = effectiveClassMasterId;
    if (!yearId || !classMasterId) {
      setMessage("Academic Year and Class Master are required to generate timetable.");
      return;
    }

    setTimetableLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tenantPayload(),
          academicYearId: yearId,
          classMasterId,
          sectionId: timetableSectionId || undefined,
          periodsPerDay: Number(timetablePeriodsPerDay) || 8,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to generate timetable");
        return;
      }

      setMessage(`Timetable generated with ${data.generatedSlots ?? 0} slots.`);
      await loadTimetable();
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setTimetableLoading(false);
    }
  }

  function tenantPayload() {
    return {
      organizationId: organizationId || undefined,
      coachingCenterId: coachingCenterId || undefined,
      academicYearId: academicYearId || undefined,
    };
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <Card className="border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-0 shadow-lg shadow-indigo-200/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 my-5">
              <div>
                <CardTitle className="text-2xl font-bold text-white">Academic Management</CardTitle>
                <CardDescription className="mt-2 text-indigo-50">
                  Create academic years, classes, subject allocations, and timetables. Section fields are optional advanced controls.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white">Academic Setup</Badge>
                <Badge className="bg-white/20 text-white">Class Operations</Badge>
                <Badge className="bg-white/20 text-white">Timetable</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Tenant Scope</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <SingleSelect options={organizationDropdownOptions}
                value={organizationId}
                onValueChange={(value) => {
                  setOrganizationId(value || "");
                  setCoachingCenterId("");
                }}
                placeholder="Select organization"
                disabled={tenantLoading} />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Coaching Center</label>
              <SingleSelect options={coachingCenterDropdownOptions}
                value={coachingCenterId}
                onValueChange={(value) => {
                  setCoachingCenterId(value || "");
                }}
                placeholder="Select coaching center"
                disabled={tenantLoading}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Academic Year (optional)</label>
          <SingleSelect options={tenantAcademicYearDropdownOptions}
            value={academicYearId}
            onValueChange={(value) => {
              setAcademicYearId(value || "");
            }}
            placeholder="Select academic year (optional)"
            disabled={tenantLoading}
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={showAdvancedAcademicFields}
            onChange={(e) => setShowAdvancedAcademicFields(e.target.checked)}
          />
          Enable advanced academic fields (section)
        </label>
      </div>

      <div className="rounded-2xl mx-10 border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
        <h3 className="text-lg font-semibold">Create Academic Year</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={yearName} onChange={(e) => setYearName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="mt-1" />
          </div>
        </div>
        <Button
          disabled={loading}
          className="w-full"
          onClick={() =>
            postJson("/api/admin/academic-years", {
              ...tenantPayload(),
              name: yearName,
              startDate: yearStart,
              endDate: yearEnd,
            })
          }
        >
          {loading ? "Saving..." : "Create Academic Year"}
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
        <h3 className="text-lg font-semibold">Create Class Master</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              value={className}
              onChange={(e) => {
                const name = e.target.value;
                setClassName(name);
                const inferred = inferClassLevelFromName(name);
                if (inferred) setClassLevel(inferred);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              {CLASS_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() =>
            postJson("/api/admin/class-masters", {
              ...tenantPayload(),
              name: className,
              level: classLevel || undefined,
            })
          }
        >
          {loading ? "Saving..." : "Create Class Master"}
        </button>
      </div>

      {showAdvancedAcademicFields && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Section</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master</label>

              <SingleSelect options={sectionClassMasterDropdownOptions}
                value={sectionClassMasterId}
                onValueChange={(value) => {
                  setSectionClassMasterId(value || "");
                }}
                placeholder="Select class master"
                disabled={optionLoading || !coachingCenterId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section Name</label>
              <input value={sectionName} onChange={(e) => setSectionName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input value={sectionCapacity} onChange={(e) => setSectionCapacity(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Number</label>
              <input value={sectionRoom} onChange={(e) => setSectionRoom(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shift</label>
              <input value={sectionShift} onChange={(e) => setSectionShift(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Teacher</label>
              <SingleSelect options={sectionTeacherDropdownOptions}
                value={sectionTeacherId}
                onValueChange={(value) => {
                  setSectionTeacherId(value || "");
                }}
                placeholder="Select class teacher (optional)"
                disabled={optionLoading || !coachingCenterId}
              />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() =>
              postJson("/api/admin/sections", {
                ...tenantPayload(),
                classMasterId: sectionClassMasterId,
                name: sectionName,
                capacity: sectionCapacity ? Number(sectionCapacity) : undefined,
                roomNumber: sectionRoom || undefined,
                shift: sectionShift || undefined,
                classTeacherId: sectionTeacherId || undefined,
              })
            }
          >
            {loading ? "Saving..." : "Create Section"}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
        <h3 className="text-lg font-semibold">Create Subject Allocation</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <SingleSelect options={subjectAcademicYearDropdownOptions}
              value={academicYearId}
              onValueChange={(value) => {
                setAcademicYearId(value || "");
              }}
              placeholder="Select academic year"
              disabled={optionLoading || !coachingCenterId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Master</label>
            <SingleSelect options={subjectClassMasterDropdownOptions}
              value={subjectClassMasterId}
              onValueChange={(value) => {
                setSubjectClassMasterId(value || "");
                setSubjectSectionId("");
              }}
              placeholder="Select class master"
              disabled={optionLoading || !coachingCenterId}
            />
          </div>
          {showAdvancedAcademicFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <SingleSelect options={subjectSectionDropdownOptions}
                value={subjectSectionId}
                onValueChange={(value) => {
                  setSubjectSectionId(value || "");
                }}
                placeholder="Select section (optional)"
                disabled={optionLoading || !subjectClassMasterId}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Name</label>
            <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teacher</label>
            <SingleSelect options={subjectTeacherDropdownOptions}
              value={subjectTeacherId}
              onValueChange={(value) => {
                setSubjectTeacherId(value || "");
              }}
              placeholder="Select teacher (optional)"
              disabled={optionLoading || !coachingCenterId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weekly Periods</label>
            <input value={subjectWeeklyPeriods} onChange={(e) => setSubjectWeeklyPeriods(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() =>
            postJson("/api/admin/subject-allocations", {
              ...tenantPayload(),
              academicYearId,
              classMasterId: subjectClassMasterId,
              sectionId: subjectSectionId || undefined,
              subjectName,
              teacherId: subjectTeacherId || undefined,
              weeklyPeriods: subjectWeeklyPeriods ? Number(subjectWeeklyPeriods) : undefined,
            })
          }
        >
          {loading ? "Saving..." : "Create Subject Allocation"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
        <h3 className="text-lg font-semibold">Generate Timetable</h3>
        <p className="text-sm text-gray-600">
          Uses each subject allocation&apos;s weekly periods to create weekly slots.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <SingleSelect options={timetableYearDropdownOptions}
              value={timetableAcademicYearId}
              onValueChange={(value) => {
                setTimetableAcademicYearId(value || "");
              }}
              placeholder="Select academic year"
              disabled={optionLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Master</label>
            <SingleSelect options={timetableClassDropdownOptions}
              value={timetableClassMasterId}
              onValueChange={(value) => {
                setTimetableClassMasterId(value || "");
                setTimetableSectionId("");
              }}
              placeholder="Select class master"
              disabled={optionLoading}
            />
          </div>
          {showAdvancedAcademicFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Section (optional)</label>
              <SingleSelect options={timetableSectionDropdownOptions}
                value={timetableSectionId}
                onValueChange={(value) => {
                  setTimetableSectionId(value || "");
                }}
                placeholder="All sections / class-level"
                disabled={optionLoading || !effectiveClassMasterId}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Periods Per Day</label>
            <input value={timetablePeriodsPerDay} onChange={(e) => setTimetablePeriodsPerDay(e.target.value)} type="number" min={1} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teacher Filter (optional)</label>
          <SingleSelect options={timetableTeacherDropdownOptions}
            value={timetableTeacherId}
            onValueChange={(value) => {
              setTimetableTeacherId(value || "");
            }}
            placeholder="All teachers"
            disabled={optionLoading}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            disabled={timetableLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={generateTimetable}
          >
            {timetableLoading ? "Working..." : "Generate Timetable"}
          </button>
          <button
            disabled={timetableLoading}
            className="w-full rounded-lg border border-indigo-600 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={loadTimetable}
          >
            {timetableLoading ? "Working..." : "Load Timetable"}
          </button>
        </div>

        <div className="overflow-x-auto border rounded">
          <table className="min-w-full border-collapse text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-200 px-3 py-2 text-left">Day</th>
                {timetablePeriodColumns.map((period) => (
                  <th key={period} className="border border-slate-200 px-3 py-2 text-left">{`P${period}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetableDays.map((day) => (
                <tr key={day}>
                  <td className="border border-slate-200 px-3 py-2 font-medium">{day}</td>
                  {timetablePeriodColumns.map((period) => {
                    const slot = timetableSlotMap.get(`${day}-${period}`);
                    return (
                      <td key={`${day}-${period}`} className="border border-slate-200 px-3 py-2 align-top">
                        {slot ? (
                          <div className="space-y-1">
                            <div className="font-medium">{slot.subjectName}</div>
                            <div className="text-xs text-gray-500">{slot.teacherId ? `Teacher: ${slot.teacherId}` : "Teacher not assigned"}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
