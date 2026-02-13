"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/shared/components/ui/SearchableDropdown";

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

type SchoolOption = {
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
  const [organizationId, setOrganizationId] = useState("");
  const [schoolId, setSchoolId] = useState("");
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
  const [timetableYearSearch, setTimetableYearSearch] = useState("");
  const [timetableClassSearch, setTimetableClassSearch] = useState("");
  const [timetableSectionSearch, setTimetableSectionSearch] = useState("");
  const [timetableTeacherSearch, setTimetableTeacherSearch] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<AcademicYearOption[]>([]);
  const [classMasterOptions, setClassMasterOptions] = useState<ClassMasterOption[]>([]);
  const [allSections, setAllSections] = useState<SectionOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [optionLoading, setOptionLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [tenantAcademicYearSearch, setTenantAcademicYearSearch] = useState("");
  const [sectionClassMasterSearch, setSectionClassMasterSearch] = useState("");
  const [sectionTeacherSearch, setSectionTeacherSearch] = useState("");
  const [subjectAcademicYearSearch, setSubjectAcademicYearSearch] = useState("");
  const [subjectClassMasterSearch, setSubjectClassMasterSearch] = useState("");
  const [subjectSectionSearch, setSubjectSectionSearch] = useState("");
  const [subjectTeacherSearch, setSubjectTeacherSearch] = useState("");
  const [tenantLoading, setTenantLoading] = useState(false);

  const effectiveClassMasterId = timetableClassMasterId || subjectClassMasterId;
  const effectiveAcademicYearId = timetableAcademicYearId || academicYearId;

  const timetableDays = useMemo(() => {
    const filteredEntries = timetableTeacherId
      ? timetableEntries.filter((entry) => entry.teacherId === timetableTeacherId)
      : timetableEntries;
    const fromEntries = Array.from(new Set(filteredEntries.map((entry) => entry.dayOfWeek)));
    if (fromEntries.length === 0) return WEEKDAY_ORDER;
    return WEEKDAY_ORDER.filter((day) => fromEntries.includes(day));
  }, [timetableEntries, timetableTeacherId]);

  const timetablePeriodColumns = useMemo(() => {
    const maxFromEntries = timetableEntries.reduce((max, entry) => Math.max(max, entry.periodNumber), 0);
    const configured = Number(timetablePeriodsPerDay);
    const maxPeriod = Number.isFinite(configured) && configured > 0 ? Math.max(configured, maxFromEntries) : Math.max(8, maxFromEntries);
    return Array.from({ length: maxPeriod }, (_, index) => index + 1);
  }, [timetableEntries, timetablePeriodsPerDay]);

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

  const schoolDropdownOptions = useMemo(
    () =>
      schools
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [schools, organizationId]
  );

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setTenantLoading(true);
      try {
        const response = await fetch("/api/admin/organizations");
        const data = await response.json();
        if (!response.ok || !active) return;

        const items = ((data as Array<{ id: string; name: string }> | undefined) ?? []).map(
          (item) => ({
            id: item.id,
            name: item.name,
          })
        );
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
      setSchools([]);
      setSchoolId("");
      return;
    }

    let active = true;

    async function loadSchools() {
      setTenantLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        const response = await fetch(`/api/admin/schools?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !active) return;

        const items = (
          (data as Array<{ id: string; name: string; organizationId: string }> | undefined) ?? []
        ).map((item) => ({
          id: item.id,
          name: item.name,
          organizationId: item.organizationId,
        }));
        if (!active) return;
        setSchools(items);

        setSchoolId((prev) => {
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

    loadSchools();
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const canLoadOptions = Boolean(organizationId && schoolId);
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
        params.set("schoolId", schoolId);

        const [yearRes, classRes, sectionRes, teacherRes] = await Promise.all([
          fetch(`/api/admin/academic-years?${params.toString()}`),
          fetch(`/api/admin/class-masters?${params.toString()}`),
          fetch(`/api/admin/sections?${params.toString()}`),
          fetch(
            `/api/admin/users?role=TEACHER&organizationId=${encodeURIComponent(organizationId)}&schoolId=${encodeURIComponent(schoolId)}`
          ),
        ]);

        const [yearData, classData, sectionData, teacherData] = await Promise.all([
          yearRes.json(),
          classRes.json(),
          sectionRes.json(),
          teacherRes.json(),
        ]);

        if (!active) return;

        if (yearRes.ok) {
          setAcademicYearOptions(
            ((yearData as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
              id: item.id,
              name: item.name,
            }))
          );
        }

        if (classRes.ok) {
          setClassMasterOptions(
            ((classData as Array<{ id: string; name: string; level?: string }> | undefined) ?? []).map((item) => ({
              id: item.id,
              name: item.name,
              level: item.level,
            }))
          );
        }

        if (sectionRes.ok) {
          setAllSections(
            ((sectionData as Array<{ id: string; name: string; classMasterId: string }> | undefined) ?? []).map((item) => ({
              id: item.id,
              name: item.name,
              classMasterId: item.classMasterId,
            }))
          );
        }

        if (teacherRes.ok) {
          setTeacherOptions(
            ((teacherData as Array<{ id: string; firstName?: string; lastName?: string; email: string }> | undefined) ?? []).map((item) => ({
              id: item.id,
              name: `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || item.email,
              email: item.email,
            }))
          );
        }
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
  }, [organizationId, schoolId]);

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
      if (schoolId) params.set("schoolId", schoolId);
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
      schoolId: schoolId || undefined,
      academicYearId: academicYearId || undefined,
    };
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <Card className="border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-0 shadow-lg shadow-indigo-200/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-white">Academic Management</CardTitle>
                <CardDescription className="mt-2 text-indigo-50">
                  Create academic years, classes, sections, subject allocations, and timetables.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white">Academic Setup</Badge>
                <Badge className="bg-white/20 text-white">Class Operations</Badge>
                <Badge className="bg-white/20 text-white">Timetable</Badge>
              </div>
            </div>
            {message && <div className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white">{message}</div>}
          </CardHeader>
        </Card>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Tenant Scope</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <SearchableDropdown
                options={organizationDropdownOptions}
                value={organizationId}
                onChange={(value) => {
                  setOrganizationId(value);
                  setSchoolId("");
                  setSchoolSearch("");
                }}
                search={organizationSearch}
                onSearchChange={setOrganizationSearch}
                placeholder="Select organization"
                searchPlaceholder="Search organization"
                disabled={tenantLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <SearchableDropdown
                options={schoolDropdownOptions}
                value={schoolId}
                onChange={setSchoolId}
                search={schoolSearch}
                onSearchChange={setSchoolSearch}
                placeholder="Select school"
                searchPlaceholder="Search school"
                disabled={tenantLoading || !organizationId}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year (optional)</label>
            <SearchableDropdown
              options={tenantAcademicYearDropdownOptions}
              value={academicYearId}
              onChange={setAcademicYearId}
              search={tenantAcademicYearSearch}
              onSearchChange={setTenantAcademicYearSearch}
              placeholder="Select academic year (optional)"
              searchPlaceholder="Search academic year"
              disabled={optionLoading || !schoolId}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Section</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master</label>
              <SearchableDropdown
                options={sectionClassMasterDropdownOptions}
                value={sectionClassMasterId}
                onChange={setSectionClassMasterId}
                search={sectionClassMasterSearch}
                onSearchChange={setSectionClassMasterSearch}
                placeholder="Select class master"
                searchPlaceholder="Search class master"
                disabled={optionLoading || !schoolId}
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
              <SearchableDropdown
                options={sectionTeacherDropdownOptions}
                value={sectionTeacherId}
                onChange={setSectionTeacherId}
                search={sectionTeacherSearch}
                onSearchChange={setSectionTeacherSearch}
                placeholder="Select class teacher (optional)"
                searchPlaceholder="Search teacher by name/email"
                disabled={optionLoading || !schoolId}
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Subject Allocation</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <SearchableDropdown
                options={subjectAcademicYearDropdownOptions}
                value={academicYearId}
                onChange={setAcademicYearId}
                search={subjectAcademicYearSearch}
                onSearchChange={setSubjectAcademicYearSearch}
                placeholder="Select academic year"
                searchPlaceholder="Search academic year"
                disabled={optionLoading || !schoolId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master</label>
              <SearchableDropdown
                options={subjectClassMasterDropdownOptions}
                value={subjectClassMasterId}
                onChange={(value) => {
                  setSubjectClassMasterId(value);
                  setSubjectSectionId("");
                  setSubjectSectionSearch("");
                }}
                search={subjectClassMasterSearch}
                onSearchChange={setSubjectClassMasterSearch}
                placeholder="Select class master"
                searchPlaceholder="Search class master"
                disabled={optionLoading || !schoolId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <SearchableDropdown
                options={subjectSectionDropdownOptions}
                value={subjectSectionId}
                onChange={setSubjectSectionId}
                search={subjectSectionSearch}
                onSearchChange={setSubjectSectionSearch}
                placeholder="Select section (optional)"
                searchPlaceholder="Search section"
                disabled={optionLoading || !subjectClassMasterId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Name</label>
              <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teacher</label>
              <SearchableDropdown
                options={subjectTeacherDropdownOptions}
                value={subjectTeacherId}
                onChange={setSubjectTeacherId}
                search={subjectTeacherSearch}
                onSearchChange={setSubjectTeacherSearch}
                placeholder="Select teacher (optional)"
                searchPlaceholder="Search teacher by name/email"
                disabled={optionLoading || !schoolId}
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
              <SearchableDropdown
                options={timetableYearDropdownOptions}
                value={timetableAcademicYearId}
                onChange={setTimetableAcademicYearId}
                search={timetableYearSearch}
                onSearchChange={setTimetableYearSearch}
                placeholder="Select academic year"
                searchPlaceholder="Search academic year"
                disabled={optionLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master</label>
              <SearchableDropdown
                options={timetableClassDropdownOptions}
                value={timetableClassMasterId}
                onChange={(value) => {
                  setTimetableClassMasterId(value);
                  setTimetableSectionId("");
                  setTimetableSectionSearch("");
                }}
                search={timetableClassSearch}
                onSearchChange={setTimetableClassSearch}
                placeholder="Select class master"
                searchPlaceholder="Search class master"
                disabled={optionLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section (optional)</label>
              <SearchableDropdown
                options={timetableSectionDropdownOptions}
                value={timetableSectionId}
                onChange={setTimetableSectionId}
                search={timetableSectionSearch}
                onSearchChange={setTimetableSectionSearch}
                placeholder="All sections / class-level"
                searchPlaceholder="Search section"
                disabled={optionLoading || !effectiveClassMasterId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Periods Per Day</label>
              <input value={timetablePeriodsPerDay} onChange={(e) => setTimetablePeriodsPerDay(e.target.value)} type="number" min={1} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teacher Filter (optional)</label>
            <SearchableDropdown
              options={timetableTeacherDropdownOptions}
              value={timetableTeacherId}
              onChange={setTimetableTeacherId}
              search={timetableTeacherSearch}
              onSearchChange={setTimetableTeacherSearch}
              placeholder="All teachers"
              searchPlaceholder="Search teacher by name/email"
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
                      const slot = timetableEntries.find(
                        (entry) =>
                          entry.dayOfWeek === day &&
                          entry.periodNumber === period &&
                          (!timetableTeacherId || entry.teacherId === timetableTeacherId)
                      );
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
    </div>
  );
}
