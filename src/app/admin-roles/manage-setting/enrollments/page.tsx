'use client';

import { useEffect, useMemo, useState } from 'react';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { getAdminOrganizations, getAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';

type OrganizationOption = { id: string; name: string };
type SchoolOption = { id: string; name: string; organizationId: string };
type AcademicYearOption = { id: string; name: string };
type ClassMasterOption = { id: string; name: string; level?: string };
type SectionOption = { id: string; name: string; classMasterId: string };
type StudentOption = { id: string; firstName?: string; lastName?: string; email: string };

type Enrollment = {
  id: string;
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  classMasterId: string;
  sectionId: string;
  rollNumber?: string;
};

export default function EnrollmentPage() {
  const { toastMessage } = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);

  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classMasterId, setClassMasterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [organizationSearch, setOrganizationSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [academicYearSearch, setAcademicYearSearch] = useState('');
  const [classMasterSearch, setClassMasterSearch] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [classMasters, setClassMasters] = useState<ClassMasterOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [filterClassMasterId, setFilterClassMasterId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterClassSearch, setFilterClassSearch] = useState('');
  const [filterSectionSearch, setFilterSectionSearch] = useState('');
  const [filterStudentSearch, setFilterStudentSearch] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  const schoolOptions = useMemo(
    () =>
      schools
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizationId, schools]
  );

  const organizationOptions = useMemo(
    () => organizations.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizations]
  );

  const academicYearOptions = useMemo(
    () => academicYears.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [academicYears]
  );

  const classOptions = useMemo(
    () =>
      classMasters.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` - ${item.level}` : ''} (${item.id})`,
      })),
    [classMasters]
  );

  const sectionOptions = useMemo(
    () =>
      sections
        .filter((item) => !classMasterId || item.classMasterId === classMasterId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [sections, classMasterId]
  );

  const filterSectionOptions = useMemo(
    () =>
      sections
        .filter((item) => !filterClassMasterId || item.classMasterId === filterClassMasterId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [sections, filterClassMasterId]
  );

  const studentOptions = useMemo(
    () =>
      students.map((item) => ({
        value: item.id,
        label: `${`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email} (${item.email})`,
      })),
    [students]
  );

  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter((item) => {
        if (filterClassMasterId && item.classMasterId !== filterClassMasterId) return false;
        if (filterSectionId && item.sectionId !== filterSectionId) return false;
        if (filterStudentId && item.studentId !== filterStudentId) return false;
        return true;
      }),
    [enrollments, filterClassMasterId, filterSectionId, filterStudentId]
  );

  const academicYearMap = useMemo(
    () => new Map(academicYears.map((item) => [item.id, item.name])),
    [academicYears]
  );
  const classMap = useMemo(
    () => new Map(classMasters.map((item) => [item.id, item.name])),
    [classMasters]
  );
  const sectionMap = useMemo(
    () => new Map(sections.map((item) => [item.id, item.name])),
    [sections]
  );
  const studentMap = useMemo(
    () =>
      new Map(
        students.map((item) => [
          item.id,
          `${`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email} (${item.email})`,
        ])
      ),
    [students]
  );

  async function loadEnrollments(orgId: string, schId: string, yearId?: string) {
    const params = new URLSearchParams();
    params.set('organizationId', orgId);
    params.set('schoolId', schId);
    if (yearId) params.set('academicYearId', yearId);
    const response = await fetch(`/api/admin/enrollments?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) return;
    setEnrollments(((data?.enrollments as Enrollment[] | undefined) ?? []));
  }

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
      setSchoolId('');
      return;
    }

    let active = true;
    async function loadSchools() {
      setTenantLoading(true);
      try {
        const items = await getAdminCoachingCenters(organizationId);
        if (!active) return;
        setSchools(items);
        setSchoolId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return '';
          return prev;
        });
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
    const canLoad = Boolean(organizationId && schoolId);
    if (!canLoad) {
      setAcademicYears([]);
      setClassMasters([]);
      setSections([]);
      setStudents([]);
      setEnrollments([]);
      return;
    }

    let active = true;
    async function loadOptions() {
      setOptionLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('organizationId', organizationId);
        params.set('schoolId', schoolId);
        params.set('includeStudents', 'true');
        const response = await fetch(`/api/admin/academic/options?${params.toString()}`);
        const data = await response.json();

        if (!active) return;
        if (!response.ok) return;

        setAcademicYears(
          ((data?.academicYears as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
        setClassMasters(
          ((data?.classMasters as Array<{ id: string; name: string; level?: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            level: item.level,
          }))
        );
        setSections(
          ((data?.sections as Array<{ id: string; name: string; classMasterId: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            classMasterId: item.classMasterId,
          }))
        );
        setStudents(
          ((data?.students as Array<{ id: string; firstName?: string; lastName?: string; email: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
          }))
        );
      } finally {
        if (active) setOptionLoading(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [organizationId, schoolId]);

  useEffect(() => {
    if (!organizationId || !schoolId) {
      setEnrollments([]);
      return;
    }
    loadEnrollments(organizationId, schoolId, academicYearId || undefined);
  }, [academicYearId, organizationId, schoolId]);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  async function submitEnrollment() {
    if (!organizationId || !schoolId || !academicYearId || !studentId || !classMasterId || !sectionId) {
      setMessage('Please select organization, coaching center, academic year, student, class and section.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const isUpdate = Boolean(editingEnrollmentId);
      const response = await fetch('/api/admin/enrollments', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEnrollmentId || undefined,
          organizationId,
          schoolId,
          academicYearId,
          studentId,
          classMasterId,
          sectionId,
          rollNumber: rollNumber || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Enrollment failed');
        return;
      }
      setEditingEnrollmentId(null);
      setMessage(isUpdate ? 'Enrollment updated successfully.' : 'Enrollment saved successfully.');
      await loadEnrollments(organizationId, schoolId, academicYearId || undefined);
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function removeEnrollment(id: string) {
    if (!organizationId || !schoolId) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set('id', id);
      params.set('organizationId', organizationId);
      params.set('schoolId', schoolId);
      const response = await fetch(`/api/admin/enrollments?${params.toString()}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Failed to remove enrollment');
        return;
      }
      setMessage('Enrollment removed.');
      await loadEnrollments(organizationId, schoolId, academicYearId || undefined);
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingEnrollmentId(null);
    setStudentId('');
    setClassMasterId('');
    setSectionId('');
    setRollNumber('');
  }

  function startEditEnrollment(item: Enrollment) {
    setEditingEnrollmentId(item.id);
    setAcademicYearId(item.academicYearId);
    setStudentId(item.studentId);
    setClassMasterId(item.classMasterId);
    setSectionId(item.sectionId);
    setRollNumber(item.rollNumber || '');
    setMessage('Editing selected enrollment. Update fields and click "Update Enrollment".');
  }

  function parseCsvLine(line: string): string[] {
    const output: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === ',' && !inQuotes) {
        output.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    output.push(current.trim());
    return output;
  }

  async function importCsv(file: File) {
    if (!organizationId || !schoolId) {
      setMessage('Select organization and coaching center before CSV import.');
      return;
    }

    setCsvImporting(true);
    setCsvSummary(null);
    setMessage(null);
    try {
      const content = await file.text();
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        setMessage('CSV must include header and at least one data row.');
        return;
      }

      const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
      const indexMap = new Map(headers.map((header, index) => [header, index]));

      const requiredHeaders = ['studentid', 'classmasterid', 'sectionid'];
      for (const header of requiredHeaders) {
        if (!indexMap.has(header)) {
          setMessage(`Missing required CSV header: ${header}`);
          return;
        }
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      const rows = lines.slice(1).map((line, index) => ({
        rowNumber: index + 2,
        cells: parseCsvLine(line),
      }));
      const batchSize = 5;
      for (let start = 0; start < rows.length; start += batchSize) {
        const batch = rows.slice(start, start + batchSize);
        const results = await Promise.all(
          batch.map(async ({ rowNumber, cells }) => {
            const studentIdValue = cells[indexMap.get('studentid') ?? -1]?.trim();
            const classMasterIdValue = cells[indexMap.get('classmasterid') ?? -1]?.trim();
            const sectionIdValue = cells[indexMap.get('sectionid') ?? -1]?.trim();
            const academicYearIdValue = cells[indexMap.get('academicyearid') ?? -1]?.trim() || academicYearId;
            const rollNumberValue = cells[indexMap.get('rollnumber') ?? -1]?.trim() || undefined;

            if (!studentIdValue || !classMasterIdValue || !sectionIdValue || !academicYearIdValue) {
              return {
                ok: false,
                error: `Row ${rowNumber}: studentId, classMasterId, sectionId and academicYearId are required.`,
              };
            }

            try {
              const response = await fetch('/api/admin/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organizationId,
                  schoolId,
                  academicYearId: academicYearIdValue,
                  studentId: studentIdValue,
                  classMasterId: classMasterIdValue,
                  sectionId: sectionIdValue,
                  rollNumber: rollNumberValue,
                }),
              });
              const data = await response.json();
              if (!response.ok) {
                return {
                  ok: false,
                  error: `Row ${rowNumber}: ${data?.error || 'failed'}`,
                };
              }
              return { ok: true };
            } catch (error) {
              return {
                ok: false,
                error: `Row ${rowNumber}: ${String(error)}`,
              };
            }
          })
        );

        for (const result of results) {
          if (result.ok) {
            success += 1;
          } else {
            failed += 1;
            errors.push(result.error ?? 'Unknown error');
          }
        }
      }

      await loadEnrollments(organizationId, schoolId, academicYearId || undefined);
      const previewErrors = errors.slice(0, 5).join(' | ');
      setCsvSummary(`Imported ${success} row(s). Failed ${failed} row(s).${previewErrors ? ` First errors: ${previewErrors}` : ''}`);
      setMessage('CSV import completed.');
    } finally {
      setCsvImporting(false);
    }
  }

  function downloadCsvTemplate() {
    const header = 'studentId,classMasterId,sectionId,academicYearId,rollNumber';
    const sample = 'student_001,class_001,section_001,year_2026_2027,12';
    const csv = `${header}\n${sample}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student-enrollment-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-lg shadow-emerald-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Student Enrollment</h1>
              <p className="mt-2 text-sm text-emerald-50">
                Assign students to class and section for a selected academic year.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Enrollment</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Bulk CSV</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Edit & Remove</span>
            </div>
          </div>
          {csvSummary && <div className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">{csvSummary}</div>}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Scope</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchableDropdown
              options={organizationOptions}
              value={organizationId}
              onChange={setOrganizationId}
              search={organizationSearch}
              onSearchChange={setOrganizationSearch}
              placeholder="Select organization"
              searchPlaceholder="Search organization"
              label="Organization"
            />
            <SearchableDropdown
              options={schoolOptions}
              value={schoolId}
              onChange={setSchoolId}
              search={schoolSearch}
              onSearchChange={setSchoolSearch}
              placeholder={!organizationId ? 'Select organization first' : 'Select coaching center'}
              searchPlaceholder="Search coaching center"
              disabled={!organizationId}
              label="Coaching Center"
            />
          </div>
          {(tenantLoading || optionLoading) && (
            <p className="mt-3 text-xs font-medium text-gray-500">Refreshing options...</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-gray-900">Create or Update Enrollment</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SearchableDropdown
              options={academicYearOptions}
              value={academicYearId}
              onChange={setAcademicYearId}
              search={academicYearSearch}
              onSearchChange={setAcademicYearSearch}
              placeholder="Select academic year"
              searchPlaceholder="Search academic year"
              disabled={!organizationId || !schoolId}
              label="Academic Year"
            />
            <SearchableDropdown
              options={studentOptions}
              value={studentId}
              onChange={setStudentId}
              search={studentSearch}
              onSearchChange={setStudentSearch}
              placeholder="Select student"
              searchPlaceholder="Search student"
              disabled={!organizationId || !schoolId}
              label="Student"
            />
            <SearchableDropdown
              options={classOptions}
              value={classMasterId}
              onChange={setClassMasterId}
              search={classMasterSearch}
              onSearchChange={setClassMasterSearch}
              placeholder="Select class"
              searchPlaceholder="Search class"
              disabled={!organizationId || !schoolId}
              label="Class"
            />
            <SearchableDropdown
              options={sectionOptions}
              value={sectionId}
              onChange={setSectionId}
              search={sectionSearch}
              onSearchChange={setSectionSearch}
              placeholder={!classMasterId ? 'Select class first' : 'Select section'}
              searchPlaceholder="Search section"
              disabled={!organizationId || !schoolId || !classMasterId}
              label="Section"
            />
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Roll Number (Optional)</label>
              <input
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter roll number"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingEnrollmentId ? 'Update Enrollment' : 'Save Enrollment'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Form
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Bulk CSV Import</h3>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50"
              >
                Download CSV Template
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Required headers: <code>studentId,classMasterId,sectionId</code>. Optional: <code>academicYearId,rollNumber</code>.
              If <code>academicYearId</code> is omitted, selected academic year is used.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={csvImporting || loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                importCsv(file);
                e.currentTarget.value = '';
              }}
              className="mt-3 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-slate-50"
            />
            {csvImporting && <p className="mt-2 text-xs font-medium text-gray-500">Importing CSV rows...</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Existing Enrollments</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Total: {enrollments.length}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Visible: {filteredEnrollments.length}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SearchableDropdown
              options={classOptions}
              value={filterClassMasterId}
              onChange={(value) => {
                setFilterClassMasterId(value);
                setFilterSectionId('');
              }}
              search={filterClassSearch}
              onSearchChange={setFilterClassSearch}
              placeholder="Filter by class"
              searchPlaceholder="Search class filter"
              label="Class Filter"
            />
            <SearchableDropdown
              options={filterSectionOptions}
              value={filterSectionId}
              onChange={setFilterSectionId}
              search={filterSectionSearch}
              onSearchChange={setFilterSectionSearch}
              placeholder={!filterClassMasterId ? 'Select class filter first' : 'Filter by section'}
              searchPlaceholder="Search section filter"
              disabled={!filterClassMasterId}
              label="Section Filter"
            />
            <SearchableDropdown
              options={studentOptions}
              value={filterStudentId}
              onChange={setFilterStudentId}
              search={filterStudentSearch}
              onSearchChange={setFilterStudentSearch}
              placeholder="Filter by student"
              searchPlaceholder="Search student filter"
              label="Student Filter"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterClassMasterId('');
                setFilterSectionId('');
                setFilterStudentId('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Section</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {filteredEnrollments.map((item) => (
                  <tr key={item.id} className={editingEnrollmentId === item.id ? 'bg-indigo-50/50' : ''}>
                    <td className="px-3 py-2 text-sm text-gray-700">{studentMap.get(item.studentId) ?? item.studentId}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{academicYearMap.get(item.academicYearId) ?? item.academicYearId}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{classMap.get(item.classMasterId) ?? item.classMasterId}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{sectionMap.get(item.sectionId) ?? item.sectionId}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.rollNumber || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      {item.rollNumber ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Roll Set</span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">No Roll</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => startEditEnrollment(item)}
                        disabled={loading}
                        className="mr-2 rounded-lg border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEnrollment(item.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                      No enrollments found for selected scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
