"use client";

import { useState } from "react";

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
  const [classLevel, setClassLevel] = useState("");

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

  function tenantPayload() {
    return {
      organizationId: organizationId || undefined,
      schoolId: schoolId || undefined,
      academicYearId: academicYearId || undefined,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">Academic Management</h2>
          <p className="text-sm text-gray-600">Create academic years, classes, sections, and subject allocations.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a className="text-indigo-600 hover:underline" href="/admin-roles/users">Users</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/fees">Fees</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/schools">Schools</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/organizations">Organizations</a>
          </div>
          {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Tenant Scope</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization ID</label>
              <input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School ID</label>
              <input value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year ID (optional)</label>
            <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Academic Year</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={yearName} onChange={(e) => setYearName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
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
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Class Master</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
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

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Section</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master ID</label>
              <input value={sectionClassMasterId} onChange={(e) => setSectionClassMasterId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section Name</label>
              <input value={sectionName} onChange={(e) => setSectionName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input value={sectionCapacity} onChange={(e) => setSectionCapacity(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Number</label>
              <input value={sectionRoom} onChange={(e) => setSectionRoom(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shift</label>
              <input value={sectionShift} onChange={(e) => setSectionShift(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Teacher ID</label>
              <input value={sectionTeacherId} onChange={(e) => setSectionTeacherId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
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

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Subject Allocation</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year ID</label>
              <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master ID</label>
              <input value={subjectClassMasterId} onChange={(e) => setSubjectClassMasterId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section ID</label>
              <input value={subjectSectionId} onChange={(e) => setSubjectSectionId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Name</label>
              <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teacher ID</label>
              <input value={subjectTeacherId} onChange={(e) => setSubjectTeacherId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weekly Periods</label>
              <input value={subjectWeeklyPeriods} onChange={(e) => setSubjectWeeklyPeriods(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
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
      </div>
    </div>
  );
}
