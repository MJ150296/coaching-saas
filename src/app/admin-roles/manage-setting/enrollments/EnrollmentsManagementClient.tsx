'use client';

import { useEffect, useMemo, useState } from 'react';
import { MultiSelect } from '@/components/multi-select';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { getAdminOrganizations, getAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';

type OrganizationOption = { id: string; name: string };
type CoachingCenterOption = { id: string; name: string; organizationId: string };
type AcademicYearOption = { id: string; name: string };
type ProgramOption = { id: string; name: string; code?: string };
type BatchOption = { id: string; name: string; programId: string; capacity: number };
type StudentOption = { id: string; firstName?: string; lastName?: string; email: string };

type Enrollment = {
  id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  programId: string;
  batchId?: string;
  rollNumber?: string;
};

export default function EnrollmentPage() {
  const { toastMessage } = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);

  const [organizationId, setOrganizationId] = useState('');
  const [coachingCenterId, setCoachingCenterId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [showAdvancedAcademicFields, setShowAdvancedAcademicFields] = useState(false);


  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [filterProgramId, setFilterProgramId] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  const coachingCenterOptions = useMemo(
    () =>
      coachingCenters
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizationId, coachingCenters]
  );

  const organizationOptions = useMemo(
    () => organizations.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizations]
  );

  const academicYearOptions = useMemo(
    () => academicYears.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [academicYears]
  );

  const programOptions = useMemo(
    () =>
      programs.map((item) => ({
        value: item.id,
        label: `${item.name}${item.code ? ` (${item.code})` : ''} (${item.id})`,
      })),
    [programs]
  );

  const batchOptions = useMemo(
    () =>
      batches
        .filter((item) => !programId || item.programId === programId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [batches, programId]
  );

  const filterBatchOptions = useMemo(
    () =>
      batches
        .filter((item) => !filterProgramId || item.programId === filterProgramId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [batches, filterProgramId]
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
        if (filterProgramId && item.programId !== filterProgramId) return false;
        if (filterBatchId && item.batchId !== filterBatchId) return false;
        if (filterStudentId && item.studentId !== filterStudentId) return false;
        return true;
      }),
    [enrollments, filterProgramId, filterBatchId, filterStudentId]
  );

  const academicYearMap = useMemo(
    () => new Map(academicYears.map((item) => [item.id, item.name])),
    [academicYears]
  );
  const programMap = useMemo(
    () => new Map(programs.map((item) => [item.id, item.name])),
    [programs]
  );
  const batchMap = useMemo(
    () => new Map(batches.map((item) => [item.id, item.name])),
    [batches]
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
  const studentEmailMap = useMemo(
    () => new Map(students.map((item) => [item.id, item.email])),
    [students]
  );
  const studentNameMap = useMemo(
    () =>
      new Map(
        students.map((item) => [
          item.id,
          `${`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email}`,
        ])
      ),
    [students]
  );

  const rosterEnrollments = useMemo(
    () =>
      enrollments.filter((item) => {
        if (!filterProgramId) return false;
        if (item.programId !== filterProgramId) return false;
        if (filterBatchId && item.batchId !== filterBatchId) return false;
        return true;
      }),
    [enrollments, filterProgramId, filterBatchId]
  );

  const rosterRows = useMemo(
    () =>
      rosterEnrollments.map((item) => ({
        studentId: item.studentId,
        studentName: studentNameMap.get(item.studentId) ?? item.studentId,
        email: studentEmailMap.get(item.studentId) ?? '',
        programName: programMap.get(item.programId) ?? item.programId,
        batchName: item.batchId ? batchMap.get(item.batchId) ?? item.batchId : '-',
        rollNumber: item.rollNumber || '-',
        academicYear: academicYearMap.get(item.academicYearId) ?? item.academicYearId,
      })),
    [academicYearMap, programMap, rosterEnrollments, batchMap, studentEmailMap, studentNameMap]
  );

  async function loadEnrollments(orgId: string, centerId: string, yearId?: string) {
    const params = new URLSearchParams();
    params.set('organizationId', orgId);
    params.set('coachingCenterId', centerId);
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
      setCoachingCenters([]);
      setCoachingCenterId('');
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
          if (!items.some((item) => item.id === prev)) return '';
          return prev;
        });
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
    const canLoad = Boolean(organizationId && coachingCenterId);
    if (!canLoad) {
      setAcademicYears([]);
      setPrograms([]);
      setBatches([]);
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
        params.set('coachingCenterId', coachingCenterId);
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
        setPrograms(
          ((data?.programs as Array<{ id: string; name: string; code?: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
          }))
        );
        setBatches(
          ((data?.batches as Array<{ id: string; name: string; programId: string; capacity: number }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            programId: item.programId,
            capacity: item.capacity,
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
  }, [organizationId, coachingCenterId]);

  useEffect(() => {
    if (!organizationId || !coachingCenterId) {
      setEnrollments([]);
      return;
    }
    loadEnrollments(organizationId, coachingCenterId, academicYearId || undefined);
  }, [academicYearId, organizationId, coachingCenterId]);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  useEffect(() => {
    if (showAdvancedAcademicFields) return;
    setBatchId('');
    setRollNumber('');
    setFilterBatchId('');
  }, [showAdvancedAcademicFields]);

  async function submitEnrollment() {
    if (!organizationId || !coachingCenterId || !academicYearId || !studentId || !programId) {
      setMessage('Please select organization, coaching center, academic year, student and program.');
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
          coachingCenterId,
          academicYearId,
          studentId,
          programId,
          batchId: batchId || undefined,
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
      await loadEnrollments(organizationId, coachingCenterId, academicYearId || undefined);
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function removeEnrollment(id: string) {
    if (!organizationId || !coachingCenterId) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set('id', id);
      params.set('organizationId', organizationId);
      params.set('coachingCenterId', coachingCenterId);
      const response = await fetch(`/api/admin/enrollments?${params.toString()}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Failed to remove enrollment');
        return;
      }
      setMessage('Enrollment removed.');
      await loadEnrollments(organizationId, coachingCenterId, academicYearId || undefined);
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingEnrollmentId(null);
    setStudentId('');
    setProgramId('');
    setBatchId('');
    setRollNumber('');
  }

  function startEditEnrollment(item: Enrollment) {
    setEditingEnrollmentId(item.id);
    setAcademicYearId(item.academicYearId);
    setStudentId(item.studentId);
    setProgramId(item.programId);
    setBatchId(item.batchId || '');
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
    if (!organizationId || !coachingCenterId) {
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

      const requiredHeaders = ['studentid', 'programid'];
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
            const programIdValue = cells[indexMap.get('programid') ?? -1]?.trim();
            const batchIdValue = cells[indexMap.get('batchid') ?? -1]?.trim();
            const academicYearIdValue = cells[indexMap.get('academicyearid') ?? -1]?.trim() || academicYearId;
            const rollNumberValue = cells[indexMap.get('rollnumber') ?? -1]?.trim() || undefined;

            if (!studentIdValue || !programIdValue || !academicYearIdValue) {
              return {
                ok: false,
                error: `Row ${rowNumber}: studentId, programId and academicYearId are required.`,
              };
            }

            try {
              const response = await fetch('/api/admin/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organizationId,
                  coachingCenterId,
                  academicYearId: academicYearIdValue,
                  studentId: studentIdValue,
                  programId: programIdValue,
                  batchId: batchIdValue || undefined,
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

      await loadEnrollments(organizationId, coachingCenterId, academicYearId || undefined);
      const previewErrors = errors.slice(0, 5).join(' | ');
      setCsvSummary(`Imported ${success} row(s). Failed ${failed} row(s).${previewErrors ? ` First errors: ${previewErrors}` : ''}`);
      setMessage('CSV import completed.');
    } finally {
      setCsvImporting(false);
    }
  }

  function downloadCsvTemplate() {
    const header = showAdvancedAcademicFields
      ? 'studentId,programId,batchId,academicYearId,rollNumber'
      : 'studentId,programId,academicYearId';
    const sample = showAdvancedAcademicFields
      ? 'student_001,program_001,batch_001,year_2026_2027,12'
      : 'student_001,program_001,year_2026_2027';
    const csv = `${header}\n${sample}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'coaching-student-enrollment-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/40 to-teal-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-lg shadow-emerald-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Student Enrollment</h1>
              <p className="mt-2 text-sm text-emerald-50">
                Assign students to program and batch context for a selected academic year.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Enrollment</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Bulk CSV</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Edit & Remove</span>
            </div>
          </div>
          {csvSummary && <div className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">{csvSummary}</div>}
        </div>

        {/* Tenant Scope Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-emerald-100 p-2">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Tenant Scope</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <MultiSelect
                options={organizationOptions}
                value={organizationId ? [organizationId] : []}
                onValueChange={(values) => setOrganizationId(values[0] || '')}
                placeholder="Select organization"
                singleSelect
              />
            </div>
            <div className="space-y-2">
              <MultiSelect
                options={coachingCenterOptions}
                value={coachingCenterId ? [coachingCenterId] : []}
                onValueChange={(values) => setCoachingCenterId(values[0] || '')}
                placeholder={!organizationId ? 'Select organization first' : 'Select coaching center'}
                disabled={!organizationId}
                singleSelect
              />
            </div>
          </div>
          {(tenantLoading || optionLoading) && (
            <p className="mt-3 text-xs font-medium text-gray-500 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing options...
            </p>
          )}
        </div>

        {/* Create or Update Enrollment Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-teal-100 p-2">
              <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create or Update Enrollment</h2>
              <p className="text-sm text-gray-600 mt-1">Assign students to programs and batches</p>
            </div>
          </div>
          
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={showAdvancedAcademicFields}
              onChange={(e) => setShowAdvancedAcademicFields(e.target.checked)}
            />
            Enable advanced academic fields (batch and roll number)
          </label>
          
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <MultiSelect
                options={academicYearOptions}
                value={academicYearId ? [academicYearId] : []}
                onValueChange={(values) => setAcademicYearId(values[0] || '')}
                placeholder="Select academic year"
                disabled={!organizationId || !coachingCenterId}
                singleSelect
              />
            </div>
            <div className="space-y-2">
              <MultiSelect
                options={studentOptions}
                value={studentId ? [studentId] : []}
                onValueChange={(values) => setStudentId(values[0] || '')}
                placeholder="Select student"
                disabled={!organizationId || !coachingCenterId}
                singleSelect
              />
            </div>
            <div className="space-y-2">
              <MultiSelect
                options={programOptions}
                value={programId ? [programId] : []}
                onValueChange={(values) => setProgramId(values[0] || '')}
                placeholder="Select program"
                disabled={!organizationId || !coachingCenterId}
                singleSelect
              />
            </div>
            {showAdvancedAcademicFields && (
              <>
                <div className="space-y-2">
                  <MultiSelect
                    options={batchOptions}
                    value={batchId ? [batchId] : []}
                    onValueChange={(values) => setBatchId(values[0] || '')}
                    placeholder={!programId ? 'Select program first' : 'Select batch (optional)'}
                    disabled={!organizationId || !coachingCenterId || !programId}
                    singleSelect
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Roll Number (Optional)</label>
                  <input
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter roll number"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={loading}
              className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-700 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : editingEnrollmentId ? 'Update Enrollment' : 'Save Enrollment'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Form
            </button>
          </div>

          {/* Bulk CSV Import Section */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Bulk CSV Import
              </h3>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 transition-colors"
              >
                Download CSV Template
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Required headers: <code className="bg-gray-100 px-1 rounded">studentId,programId</code>. Optional: <code className="bg-gray-100 px-1 rounded">batchId,academicYearId,rollNumber</code>.
              If <code className="bg-gray-100 px-1 rounded">academicYearId</code> is omitted, selected academic year is used.
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
              className="mt-3 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-slate-50 transition-all"
            />
            {csvImporting && (
              <p className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing CSV rows...
              </p>
            )}
          </div>
        </div>

        {/* Existing Enrollments Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Existing Enrollments</h2>
            </div>
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
            <div className="space-y-2">
              <MultiSelect
                options={programOptions}
                value={filterProgramId ? [filterProgramId] : []}
                onValueChange={(values) => {
                  setFilterProgramId(values[0] || '');
                  setFilterBatchId('');
                }}
                placeholder="Filter by program"
                singleSelect
              />
            </div>
            {showAdvancedAcademicFields && (
              <div className="space-y-2">
                <MultiSelect
                  options={filterBatchOptions}
                  value={filterBatchId ? [filterBatchId] : []}
                  onValueChange={(values) => setFilterBatchId(values[0] || '')}
                  placeholder={!filterProgramId ? 'Select program filter first' : 'Filter by batch'}
                  disabled={!filterProgramId}
                  singleSelect
                />
              </div>
            )}
            <div className="space-y-2">
              <MultiSelect
                options={studentOptions}
                value={filterStudentId ? [filterStudentId] : []}
                onValueChange={(values) => setFilterStudentId(values[0] || '')}
                placeholder="Filter by student"
                singleSelect
              />
            </div>
          </div>
          
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setFilterProgramId('');
                setFilterBatchId('');
                setFilterStudentId('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {filteredEnrollments.map((item, idx) => (
                  <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${editingEnrollmentId === item.id ? 'bg-indigo-50/50' : ''} hover:bg-indigo-50/30 transition-colors`}>
                    <td className="px-4 py-3 text-sm text-gray-700">{studentMap.get(item.studentId) ?? item.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{academicYearMap.get(item.academicYearId) ?? item.academicYearId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{programMap.get(item.programId) ?? item.programId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.batchId ? batchMap.get(item.batchId) ?? item.batchId : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.rollNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.rollNumber ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Roll Set</span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">No Roll</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => startEditEnrollment(item)}
                        disabled={loading}
                        className="mr-2 rounded-lg border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEnrollment(item.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No enrollments found for selected scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Program/Batch Roster Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Program/Batch Roster</h2>
                <p className="text-xs text-slate-500">Select a program (and optional batch) to generate a roster.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="program-batch-roster.csv"
                rows={rosterRows}
                columns={[
                  { key: 'studentId', label: 'Student ID' },
                  { key: 'studentName', label: 'Student' },
                  { key: 'email', label: 'Email' },
                  { key: 'programName', label: 'Program' },
                  { key: 'batchName', label: 'Batch' },
                  { key: 'rollNumber', label: 'Roll' },
                  { key: 'academicYear', label: 'Academic Year' },
                ]}
              />
              <PdfExportButton
                filename="program-batch-roster.pdf"
                title="Program/Batch Roster"
                rows={rosterRows}
                columns={[
                  { key: 'studentId', label: 'Student ID' },
                  { key: 'studentName', label: 'Student' },
                  { key: 'email', label: 'Email' },
                  { key: 'programName', label: 'Program' },
                  { key: 'batchName', label: 'Batch' },
                  { key: 'rollNumber', label: 'Roll' },
                  { key: 'academicYear', label: 'Academic Year' },
                ]}
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {rosterRows.map((row, idx) => (
                  <tr key={`${row.studentId}-${row.programName}-${row.batchName}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <a
                        href={`/profile/users/${encodeURIComponent(row.studentId)}`}
                        className="font-medium text-slate-700 hover:text-slate-900 hover:underline transition-colors"
                      >
                        {row.studentName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.programName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.batchName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.rollNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.academicYear}</td>
                  </tr>
                ))}
                {!filterProgramId ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      Select a program to view the roster.
                    </td>
                  </tr>
                ) : rosterRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No students enrolled for the selected program/batch.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}