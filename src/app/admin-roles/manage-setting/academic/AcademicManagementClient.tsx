"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleSelect } from "@/shared/components/ui/SingleSelect";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { getAdminOrganizations, getAdminCoachingCenters } from "@/shared/lib/client/adminTenantReferenceData";


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
  startDate?: string;
  endDate?: string;
};

type ClassMasterOption = {
  id: string;
  name: string;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [editingAcademicYearTarget, setEditingAcademicYearTarget] = useState<AcademicYearOption | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editYearStart, setEditYearStart] = useState("");
  const [editYearEnd, setEditYearEnd] = useState("");
  const [deleteAcademicYearTarget, setDeleteAcademicYearTarget] = useState<AcademicYearOption | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [className, setClassName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        label: `${item.name} (${item.id})`,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        label: `${item.name} (${item.id})`,
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
        label: `${item.name} (${item.id})`,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const organizationDropdownOptions = useMemo(
    () =>
      organizations.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [organizations]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        setClassMasterOptions(
          ((data?.classMasters as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
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
      } finally {
        if (active) setOptionLoading(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [organizationId, coachingCenterId]);

  useEffect(() => {
    const canLoadAcademicYears = Boolean(organizationId && coachingCenterId);
    if (!canLoadAcademicYears) {
      setAcademicYearOptions([]);
      setEditingAcademicYearTarget(null);
      return;
    }

    let active = true;

    async function loadAcademicYears() {
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("coachingCenterId", coachingCenterId);
        params.set("withMeta", "true");
        const response = await fetch(`/api/admin/academic-years?${params.toString()}`);
        const data = await response.json();

        if (!active) return;
        if (!response.ok) return;

        setAcademicYearOptions(
          ((data?.items as Array<{ id: string; name: string; startDate?: string; endDate?: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
          }))
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    loadAcademicYears();

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
      await refreshAcademicYears();
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function refreshAcademicYears() {
    if (!organizationId || !coachingCenterId) return;

    const params = new URLSearchParams();
    params.set("organizationId", organizationId);
    params.set("coachingCenterId", coachingCenterId);
    params.set("withMeta", "true");

    const response = await fetch(`/api/admin/academic-years?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.error || "Failed to load academic years");
      return;
    }

    setAcademicYearOptions(
      ((data?.items as Array<{ id: string; name: string; startDate?: string; endDate?: string }> | undefined) ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
      }))
    );
  }

  function resetAcademicYearForm() {
    setYearName("");
    setYearStart("");
    setYearEnd("");
  }

  function startAcademicYearEdit(item: AcademicYearOption) {
    setEditingAcademicYearTarget(item);
    setEditYearName(item.name);
    setEditYearStart(item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "");
    setEditYearEnd(item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : "");
  }

  function closeAcademicYearEditModal() {
    setEditingAcademicYearTarget(null);
    setEditYearName("");
    setEditYearStart("");
    setEditYearEnd("");
  }

  async function submitAcademicYear() {
    if (!yearName.trim() || !yearStart || !yearEnd) {
      setMessage("Name, start date and end date are required.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tenantPayload(),
          name: yearName,
          startDate: yearStart,
          endDate: yearEnd,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to save academic year");
        return;
      }

      await refreshAcademicYears();
      resetAcademicYearForm();
      setMessage("Academic year created successfully.");
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitAcademicYearEdit() {
    if (!editingAcademicYearTarget) return;
    if (!editYearName.trim() || !editYearStart || !editYearEnd) {
      setMessage("Name, start date and end date are required.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/academic-years", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tenantPayload(),
          id: editingAcademicYearTarget.id,
          name: editYearName,
          startDate: editYearStart,
          endDate: editYearEnd,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to save academic year");
        return;
      }

      await refreshAcademicYears();
      closeAcademicYearEditModal();
      setMessage("Academic year updated successfully.");
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function deleteAcademicYear(id: string) {
    if (!organizationId || !coachingCenterId) return;

    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("id", id);
      const response = await fetch(`/api/admin/academic-years?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to delete academic year");
        return;
      }

      if (editingAcademicYearTarget?.id === id) {
        closeAcademicYearEditModal();
      }
      if (academicYearId === id) setAcademicYearId("");
      if (timetableAcademicYearId === id) setTimetableAcademicYearId("");
      setDeleteAcademicYearTarget(null);
      await refreshAcademicYears();
      setMessage("Academic year deleted successfully.");
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
        {/* Hero Header Card */}
        <Card className="border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-0 shadow-lg shadow-indigo-200/70 overflow-hidden">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 my-5">
              <div>
                <CardTitle className="text-2xl font-bold text-white">Coaching Schedule Management</CardTitle>
                <CardDescription className="mt-2 text-indigo-50">
                  Create academic years, programs, subject allocations, and batch timetables for your coaching center.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 transition-colors">Academic Setup</Badge>
                <Badge className="bg-white/20 text-white hover:bg-white/30 transition-colors">Program Operations</Badge>
                <Badge className="bg-white/20 text-white hover:bg-white/30 transition-colors">Batch Timetable</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Timetable Generator Section */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Generate Batch Timetable</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Uses each subject allocation&apos;s weekly sessions to create weekly schedule slots for batches.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Academic Year</Label>
                <SingleSelect options={timetableYearDropdownOptions}
                  value={timetableAcademicYearId}
                  onValueChange={(value) => {
                    setTimetableAcademicYearId(value || "");
                  }}
                  placeholder="Select academic year"
                  disabled={optionLoading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Program</Label>
                <SingleSelect options={timetableClassDropdownOptions}
                  value={timetableClassMasterId}
                  onValueChange={(value) => {
                    setTimetableClassMasterId(value || "");
                    setTimetableSectionId("");
                  }}
                  placeholder="Select program"
                  disabled={optionLoading}
                />
              </div>
              {showAdvancedAcademicFields && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Batch (optional)</Label>
                  <SingleSelect options={timetableSectionDropdownOptions}
                    value={timetableSectionId}
                    onValueChange={(value) => {
                      setTimetableSectionId(value || "");
                    }}
                    placeholder="All batches / program-level"
                    disabled={optionLoading || !effectiveClassMasterId}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sessions Per Day</Label>
                <Input 
                  value={timetablePeriodsPerDay} 
                  onChange={(e) => setTimetablePeriodsPerDay(e.target.value)} 
                  type="number" 
                  min={1}
                  className="transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium text-gray-700">Faculty Filter (optional)</Label>
              <SingleSelect options={timetableTeacherDropdownOptions}
                value={timetableTeacherId}
                onValueChange={(value) => {
                  setTimetableTeacherId(value || "");
                }}
                placeholder="All faculty"
                disabled={optionLoading}
              />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                disabled={timetableLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={generateTimetable}
              >
                {timetableLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Working...
                  </span>
                ) : "Generate Timetable"}
              </Button>
              <Button
                disabled={timetableLoading}
                variant="outline"
                className="w-full border-indigo-600 text-indigo-700 hover:bg-indigo-50 transition-all duration-200"
                onClick={loadTimetable}
              >
                {timetableLoading ? "Working..." : "Load Timetable"}
              </Button>
            </div>

            {/* Timetable Grid */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="bg-linear-to-r from-slate-50 to-slate-100">
                    <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Day</th>
                    {timetablePeriodColumns.map((period) => (
                      <th key={period} className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">{`S${period}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetableDays.map((day, idx) => (
                    <tr key={day} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/50 transition-colors duration-150`}>
                      <td className="border border-slate-200 px-4 py-3 font-medium text-slate-800">{day}</td>
                      {timetablePeriodColumns.map((period) => {
                        const slot = timetableSlotMap.get(`${day}-${period}`);
                        return (
                          <td key={`${day}-${period}`} className="border border-slate-200 px-4 py-3 align-top">
                            {slot ? (
                              <div className="space-y-1 rounded-lg bg-indigo-50 p-2">
                                <div className="font-medium text-indigo-900">{slot.subjectName}</div>
                                <div className="text-xs text-indigo-600">{slot.teacherId ? `Faculty: ${slot.teacherId}` : "Faculty not assigned"}</div>
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
          </CardContent>
        </Card>

        {/* Create Academic Year Section */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Create Academic Year</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Define a new academic year for your coaching center</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Name</Label>
                <Input 
                  value={yearName} 
                  onChange={(e) => setYearName(e.target.value)} 
                  placeholder="e.g., 2024-2025"
                  className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <Input 
                  type="date" 
                  value={yearStart} 
                  onChange={(e) => setYearStart(e.target.value)} 
                  className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">End Date</Label>
                <Input 
                  type="date" 
                  value={yearEnd} 
                  onChange={(e) => setYearEnd(e.target.value)} 
                  className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <Button
              disabled={loading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={submitAcademicYear}
            >
              {loading ? "Saving..." : "Create Academic Year"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Manage Academic Years</CardTitle>
                <p className="mt-1 text-sm text-gray-600">Edit a wrong academic year entry or delete it when it is still unused.</p>
              </div>
              <Button type="button" variant="outline" onClick={refreshAcademicYears} disabled={loading || optionLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Start Date</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">End Date</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYearOptions.length > 0 ? (
                    academicYearOptions.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          editingAcademicYearTarget?.id === item.id
                            ? "bg-blue-50/70 ring-1 ring-inset ring-blue-200"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/50"
                        }
                      >
                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => startAcademicYearEdit(item)} disabled={loading}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteAcademicYearTarget(item)}
                              disabled={loading}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        No academic years found for the selected coaching center.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(editingAcademicYearTarget)} onOpenChange={(open) => !open && closeAcademicYearEditModal()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Academic Year</DialogTitle>
              <DialogDescription>
                Update the selected academic year for your coaching center.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  value={editYearName}
                  onChange={(e) => setEditYearName(e.target.value)}
                  placeholder="e.g., 2024-2025"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <Input
                  type="date"
                  value={editYearStart}
                  onChange={(e) => setEditYearStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">End Date</Label>
                <Input
                  type="date"
                  value={editYearEnd}
                  onChange={(e) => setEditYearEnd(e.target.value)}
                />
              </div>
            </div>
            {editingAcademicYearTarget ? (
              <p className="text-xs font-medium text-blue-600">
                Editing academic year ID: {editingAcademicYearTarget.id}
              </p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                onClick={closeAcademicYearEditModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !editingAcademicYearTarget}
                onClick={submitAcademicYearEdit}
                className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Update Academic Year"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(deleteAcademicYearTarget)} onOpenChange={(open) => !open && setDeleteAcademicYearTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Academic Year</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Deletion will be blocked if this academic year is already used in programs, enrollments, timetable, or fees.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {deleteAcademicYearTarget ? (
                <span>
                  You are deleting <span className="font-semibold text-slate-900">{deleteAcademicYearTarget.name}</span>.
                </span>
              ) : null}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteAcademicYearTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !deleteAcademicYearTarget}
                onClick={() => deleteAcademicYearTarget && deleteAcademicYear(deleteAcademicYearTarget.id)}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Advanced Fields Toggle */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Advanced Academic Fields</h3>
                <p className="text-sm text-gray-600 mt-1">Enable sections, subject allocations, and detailed timetable controls</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showAdvancedAcademicFields}
                onChange={(e) => setShowAdvancedAcademicFields(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </Card>

        {/* Create Section (Conditional) */}
        {showAdvancedAcademicFields && (
          <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300 animate-in slide-in-from-top-4 duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Create Section</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Add a new section to an existing class master</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Class Master</Label>
                  <SingleSelect options={sectionClassMasterDropdownOptions}
                    value={sectionClassMasterId}
                    onValueChange={(value) => {
                      setSectionClassMasterId(value || "");
                    }}
                    placeholder="Select class master"
                    disabled={optionLoading || !coachingCenterId}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Section Name</Label>
                  <Input 
                    value={sectionName} 
                    onChange={(e) => setSectionName(e.target.value)} 
                    placeholder="e.g., Section A"
                    className="transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Capacity</Label>
                  <Input 
                    value={sectionCapacity} 
                    onChange={(e) => setSectionCapacity(e.target.value)} 
                    type="number" 
                    placeholder="e.g., 40"
                    className="transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Room Number</Label>
                  <Input 
                    value={sectionRoom} 
                    onChange={(e) => setSectionRoom(e.target.value)} 
                    placeholder="e.g., 101"
                    className="transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Shift</Label>
                  <Input 
                    value={sectionShift} 
                    onChange={(e) => setSectionShift(e.target.value)} 
                    placeholder="e.g., Morning"
                    className="transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Class Teacher</Label>
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
              <Button
                disabled={loading}
                className="mt-6 w-full bg-amber-600 hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Subject Allocation Section */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-100 p-2">
                <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Create Subject Allocation</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Assign subjects to programs with faculty and weekly session counts.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Academic Year</Label>
                <SingleSelect options={subjectAcademicYearDropdownOptions}
                  value={academicYearId}
                  onValueChange={(value) => {
                    setAcademicYearId(value || "");
                  }}
                  placeholder="Select academic year"
                  disabled={optionLoading || !coachingCenterId}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Program</Label>
                <SingleSelect options={subjectClassMasterDropdownOptions}
                  value={subjectClassMasterId}
                  onValueChange={(value) => {
                    setSubjectClassMasterId(value || "");
                    setSubjectSectionId("");
                  }}
                  placeholder="Select program"
                  disabled={optionLoading || !coachingCenterId}
                />
              </div>
              {showAdvancedAcademicFields && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Batch</Label>
                  <SingleSelect options={subjectSectionDropdownOptions}
                    value={subjectSectionId}
                    onValueChange={(value) => {
                      setSubjectSectionId(value || "");
                    }}
                    placeholder="Select batch (optional)"
                    disabled={optionLoading || !subjectClassMasterId}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subject / Topic</Label>
                <Input 
                  value={subjectName} 
                  onChange={(e) => setSubjectName(e.target.value)} 
                  placeholder="e.g., Mathematics"
                  className="transition-all duration-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Faculty</Label>
                <SingleSelect options={subjectTeacherDropdownOptions}
                  value={subjectTeacherId}
                  onValueChange={(value) => {
                    setSubjectTeacherId(value || "");
                  }}
                  placeholder="Select faculty (optional)"
                  disabled={optionLoading || !coachingCenterId}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sessions Per Week</Label>
                <Input 
                  value={subjectWeeklyPeriods} 
                  onChange={(e) => setSubjectWeeklyPeriods(e.target.value)} 
                  type="number" 
                  placeholder="e.g., 5"
                  className="transition-all duration-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>
            <Button
              disabled={loading}
              className="mt-6 w-full bg-rose-600 hover:bg-rose-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
