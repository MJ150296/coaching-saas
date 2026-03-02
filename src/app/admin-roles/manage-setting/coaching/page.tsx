'use client';

import { useEffect, useMemo, useState } from 'react';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { getAdminOrganizations, getAdminSchools } from '@/shared/lib/client/adminTenantReferenceData';
import { FormCard, PrimaryButton, TabButton, TableCard } from './components/CoachingUi';

type OrganizationOption = { id: string; name: string };
type SchoolOption = { id: string; name: string; organizationId: string };
type AcademicYearOption = { id: string; name: string };
type TeacherOption = { id: string; name: string; email: string };
type StudentOption = { id: string; firstName?: string; lastName?: string; email: string };

type ProgramItem = {
  id: string;
  academicYearId: string;
  name: string;
  code?: string;
  classLevel?: string;
  board?: string;
  status: string;
};

type BatchItem = {
  id: string;
  programId: string;
  name: string;
  facultyId?: string;
  capacity: number;
  isActive: boolean;
};

type EnrollmentItem = {
  id: string;
  programId: string;
  batchId: string;
  studentId: string;
  status: string;
};

type SessionItem = {
  id: string;
  programId: string;
  batchId: string;
  topic: string;
  sessionDate: string;
  startsAt?: string;
  endsAt?: string;
  status: string;
};

type AttendanceItem = {
  id: string;
  sessionId: string;
  studentId: string;
  status: string;
  markedAt: string;
};

type MetaResponse<T> = {
  items: T[];
};

type TabKey = 'programs' | 'delivery' | 'attendance';

function readItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  const meta = payload as MetaResponse<T> | null;
  if (meta && Array.isArray(meta.items)) {
    return meta.items;
  }
  return [];
}

export default function CoachingManagementPage() {
  const { toastMessage } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('programs');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);

  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const [organizationSearch, setOrganizationSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [academicYearSearch, setAcademicYearSearch] = useState('');

  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [programClassLevel, setProgramClassLevel] = useState('');
  const [programBoard, setProgramBoard] = useState('');
  const [programDescription, setProgramDescription] = useState('');

  const [batchProgramId, setBatchProgramId] = useState('');
  const [batchProgramSearch, setBatchProgramSearch] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchFacultyId, setBatchFacultyId] = useState('');
  const [batchFacultySearch, setBatchFacultySearch] = useState('');
  const [batchCapacity, setBatchCapacity] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('');
  const [batchStartsOn, setBatchStartsOn] = useState('');
  const [batchEndsOn, setBatchEndsOn] = useState('');

  const [enrollmentProgramId, setEnrollmentProgramId] = useState('');
  const [enrollmentProgramSearch, setEnrollmentProgramSearch] = useState('');
  const [enrollmentBatchId, setEnrollmentBatchId] = useState('');
  const [enrollmentBatchSearch, setEnrollmentBatchSearch] = useState('');
  const [enrollmentStudentId, setEnrollmentStudentId] = useState('');
  const [enrollmentStudentSearch, setEnrollmentStudentSearch] = useState('');

  const [sessionProgramId, setSessionProgramId] = useState('');
  const [sessionProgramSearch, setSessionProgramSearch] = useState('');
  const [sessionBatchId, setSessionBatchId] = useState('');
  const [sessionBatchSearch, setSessionBatchSearch] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartsAt, setSessionStartsAt] = useState('');
  const [sessionEndsAt, setSessionEndsAt] = useState('');
  const [sessionFacultyId, setSessionFacultyId] = useState('');
  const [sessionFacultySearch, setSessionFacultySearch] = useState('');

  const [attendanceSessionId, setAttendanceSessionId] = useState('');
  const [attendanceSessionSearch, setAttendanceSessionSearch] = useState('');
  const [attendanceStudentId, setAttendanceStudentId] = useState('');
  const [attendanceStudentSearch, setAttendanceStudentSearch] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');
  const [attendanceStatusSearch, setAttendanceStatusSearch] = useState('');
  const [attendanceRemarks, setAttendanceRemarks] = useState('');

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  const organizationOptions = useMemo(
    () => organizations.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizations]
  );

  const schoolOptions = useMemo(
    () =>
      schools
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizationId, schools]
  );

  const academicYearOptions = useMemo(
    () => academicYears.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [academicYears]
  );

  const programOptions = useMemo(
    () => programs.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [programs]
  );

  const teacherOptions = useMemo(
    () => teachers.map((item) => ({ value: item.id, label: `${item.name} (${item.email})` })),
    [teachers]
  );

  const studentOptions = useMemo(
    () =>
      students.map((item) => ({
        value: item.id,
        label: `${`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email} (${item.email})`,
      })),
    [students]
  );

  const sessionOptions = useMemo(
    () =>
      sessions.map((item) => ({
        value: item.id,
        label: `${item.topic} (${new Date(item.sessionDate).toLocaleDateString()})`,
      })),
    [sessions]
  );

  const attendanceStatusOptions = [
    { value: 'PRESENT', label: 'PRESENT' },
    { value: 'ABSENT', label: 'ABSENT' },
    { value: 'LATE', label: 'LATE' },
  ];

  const filteredBatchesForEnrollment = useMemo(
    () => batches.filter((item) => !enrollmentProgramId || item.programId === enrollmentProgramId),
    [batches, enrollmentProgramId]
  );

  const filteredBatchesForSession = useMemo(
    () => batches.filter((item) => !sessionProgramId || item.programId === sessionProgramId),
    [batches, sessionProgramId]
  );

  const batchOptionsForEnrollment = useMemo(
    () => filteredBatchesForEnrollment.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [filteredBatchesForEnrollment]
  );

  const batchOptionsForSession = useMemo(
    () => filteredBatchesForSession.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [filteredBatchesForSession]
  );

  async function loadCoachingData(orgId: string, schId: string, yearId?: string) {
    const params = new URLSearchParams();
    params.set('organizationId', orgId);
    params.set('schoolId', schId);
    params.set('withMeta', 'true');
    if (yearId) params.set('academicYearId', yearId);
    const programParams = params.toString();

    const shared = new URLSearchParams();
    shared.set('organizationId', orgId);
    shared.set('schoolId', schId);
    shared.set('withMeta', 'true');
    const commonParams = shared.toString();

    const [programRes, batchRes, enrollRes, sessionRes, attendanceRes] = await Promise.all([
      fetch(`/api/admin/coaching-programs?${programParams}`),
      fetch(`/api/admin/coaching-batches?${commonParams}`),
      fetch(`/api/admin/coaching-enrollments?${commonParams}`),
      fetch(`/api/admin/coaching-sessions?${commonParams}`),
      fetch(`/api/admin/coaching-attendance?${commonParams}`),
    ]);

    const [programBody, batchBody, enrollBody, sessionBody, attendanceBody] = await Promise.all([
      programRes.json(),
      batchRes.json(),
      enrollRes.json(),
      sessionRes.json(),
      attendanceRes.json(),
    ]);

    if (!programRes.ok) throw new Error(programBody?.error || 'Failed to load programs');
    if (!batchRes.ok) throw new Error(batchBody?.error || 'Failed to load batches');
    if (!enrollRes.ok) throw new Error(enrollBody?.error || 'Failed to load enrollments');
    if (!sessionRes.ok) throw new Error(sessionBody?.error || 'Failed to load sessions');
    if (!attendanceRes.ok) throw new Error(attendanceBody?.error || 'Failed to load attendance');

    setPrograms(readItems<ProgramItem>(programBody));
    setBatches(readItems<BatchItem>(batchBody));
    setEnrollments(readItems<EnrollmentItem>(enrollBody));
    setSessions(readItems<SessionItem>(sessionBody));
    setAttendance(readItems<AttendanceItem>(attendanceBody));
  }

  async function postJson(url: string, payload: Record<string, unknown>, successMessage: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
      }
      setMessage(successMessage);
      toastMessage(successMessage);
      if (organizationId && schoolId) {
        await loadCoachingData(organizationId, schoolId, academicYearId || undefined);
      }
    } catch (error) {
      const text = String(error);
      setMessage(text);
      toastMessage(text);
    } finally {
      setLoading(false);
    }
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
        const items = await getAdminSchools(organizationId);
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
    if (!(organizationId && schoolId)) {
      setAcademicYears([]);
      setTeachers([]);
      setStudents([]);
      setPrograms([]);
      setBatches([]);
      setEnrollments([]);
      setSessions([]);
      setAttendance([]);
      return;
    }

    let active = true;
    async function loadOptionsAndData() {
      setOptionLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('organizationId', organizationId);
        params.set('schoolId', schoolId);
        params.set('includeStudents', 'true');
        const response = await fetch(`/api/admin/academic/options?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load options');
        }
        if (!active) return;

        setAcademicYears((data?.academicYears as AcademicYearOption[] | undefined) ?? []);
        setTeachers((data?.teachers as TeacherOption[] | undefined) ?? []);
        setStudents((data?.students as StudentOption[] | undefined) ?? []);

        await loadCoachingData(organizationId, schoolId, academicYearId || undefined);
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setOptionLoading(false);
      }
    }
    loadOptionsAndData();
    return () => {
      active = false;
    };
  }, [organizationId, schoolId, academicYearId, toastMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-cyan-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-700 p-6 text-white shadow-lg shadow-cyan-200/60">
          <h1 className="text-2xl font-bold">Coaching Management</h1>
          <p className="mt-2 text-sm text-cyan-50">
            Manage coaching programs, batches, enrollments, sessions, and attendance from a cleaner tabbed workspace.
          </p>
          {message ? <p className="mt-3 rounded bg-white/15 px-3 py-2 text-sm">{message}</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
            <SearchableDropdown
              options={organizationOptions}
              value={organizationId}
              onChange={setOrganizationId}
              search={organizationSearch}
              onSearchChange={setOrganizationSearch}
              placeholder="Select organization"
              searchPlaceholder="Search organization"
              disabled={tenantLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Coaching Center</label>
            <SearchableDropdown
              options={schoolOptions}
              value={schoolId}
              onChange={setSchoolId}
              search={schoolSearch}
              onSearchChange={setSchoolSearch}
              placeholder={!organizationId ? 'Select organization first' : 'Select coaching center'}
              searchPlaceholder="Search coaching center"
              disabled={tenantLoading || !organizationId}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
            <SearchableDropdown
              options={academicYearOptions}
              value={academicYearId}
              onChange={setAcademicYearId}
              search={academicYearSearch}
              onSearchChange={setAcademicYearSearch}
              placeholder="Select academic year"
              searchPlaceholder="Search academic year"
              disabled={optionLoading || !schoolId}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <TabButton label="Programs & Batches" active={activeTab === 'programs'} onClick={() => setActiveTab('programs')} />
            <TabButton label="Enrollments & Sessions" active={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} />
            <TabButton label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          </div>
        </section>

        {activeTab === 'programs' && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormCard title="Create Program">
                <input value={programName} onChange={(e) => setProgramName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Program name" />
                <input value={programCode} onChange={(e) => setProgramCode(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Program code (optional)" />
                <input value={programClassLevel} onChange={(e) => setProgramClassLevel(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Class level (optional)" />
                <input value={programBoard} onChange={(e) => setProgramBoard(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Board (optional)" />
                <textarea value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description (optional)" rows={2} />
                <PrimaryButton
                  disabled={loading || !organizationId || !schoolId || !academicYearId || !programName.trim()}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-programs',
                      {
                        organizationId,
                        schoolId,
                        academicYearId,
                        name: programName,
                        code: programCode || undefined,
                        classLevel: programClassLevel || undefined,
                        board: programBoard || undefined,
                        description: programDescription || undefined,
                      },
                      'Program created successfully.'
                    )
                  }
                  loading={loading}
                  text="Create Program"
                />
              </FormCard>

              <FormCard title="Create Batch">
                <SearchableDropdown
                  options={programOptions}
                  value={batchProgramId}
                  onChange={setBatchProgramId}
                  search={batchProgramSearch}
                  onSearchChange={setBatchProgramSearch}
                  placeholder="Select program"
                  searchPlaceholder="Search program"
                />
                <input value={batchName} onChange={(e) => setBatchName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Batch name" />
                <SearchableDropdown
                  options={teacherOptions}
                  value={batchFacultyId}
                  onChange={setBatchFacultyId}
                  search={batchFacultySearch}
                  onSearchChange={setBatchFacultySearch}
                  placeholder="Select faculty (optional)"
                  searchPlaceholder="Search faculty"
                />
                <input value={batchCapacity} onChange={(e) => setBatchCapacity(e.target.value)} type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Capacity" />
                <input value={batchSchedule} onChange={(e) => setBatchSchedule(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Schedule summary (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={batchStartsOn} onChange={(e) => setBatchStartsOn(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={batchEndsOn} onChange={(e) => setBatchEndsOn(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <PrimaryButton
                  disabled={loading || !organizationId || !schoolId || !batchProgramId || !batchName.trim() || !batchCapacity}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-batches',
                      {
                        organizationId,
                        schoolId,
                        programId: batchProgramId,
                        name: batchName,
                        facultyId: batchFacultyId || undefined,
                        capacity: Number(batchCapacity || 0),
                        scheduleSummary: batchSchedule || undefined,
                        startsOn: batchStartsOn || undefined,
                        endsOn: batchEndsOn || undefined,
                      },
                      'Batch created successfully.'
                    )
                  }
                  loading={loading}
                  text="Create Batch"
                />
              </FormCard>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TableCard title={`Programs (${programs.length})`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Year</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.academicYearId}</td>
                        <td className="px-3 py-2">{item.status}</td>
                      </tr>
                    ))}
                    {!programs.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                          {optionLoading ? 'Loading...' : 'No programs found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>

              <TableCard title={`Batches (${batches.length})`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Program</th>
                      <th className="px-3 py-2">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.programId}</td>
                        <td className="px-3 py-2">{item.capacity}</td>
                      </tr>
                    ))}
                    {!batches.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                          {optionLoading ? 'Loading...' : 'No batches found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            </section>
          </>
        )}

        {activeTab === 'delivery' && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormCard title="Create Enrollment">
                <SearchableDropdown
                  options={programOptions}
                  value={enrollmentProgramId}
                  onChange={(value) => {
                    setEnrollmentProgramId(value);
                    setEnrollmentBatchId('');
                  }}
                  search={enrollmentProgramSearch}
                  onSearchChange={setEnrollmentProgramSearch}
                  placeholder="Select program"
                  searchPlaceholder="Search program"
                />
                <SearchableDropdown
                  options={batchOptionsForEnrollment}
                  value={enrollmentBatchId}
                  onChange={setEnrollmentBatchId}
                  search={enrollmentBatchSearch}
                  onSearchChange={setEnrollmentBatchSearch}
                  placeholder={!enrollmentProgramId ? 'Select program first' : 'Select batch'}
                  searchPlaceholder="Search batch"
                />
                <SearchableDropdown
                  options={studentOptions}
                  value={enrollmentStudentId}
                  onChange={setEnrollmentStudentId}
                  search={enrollmentStudentSearch}
                  onSearchChange={setEnrollmentStudentSearch}
                  placeholder="Select student"
                  searchPlaceholder="Search student"
                />
                <PrimaryButton
                  disabled={loading || !organizationId || !schoolId || !enrollmentProgramId || !enrollmentBatchId || !enrollmentStudentId}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-enrollments',
                      {
                        organizationId,
                        schoolId,
                        programId: enrollmentProgramId,
                        batchId: enrollmentBatchId,
                        studentId: enrollmentStudentId,
                      },
                      'Enrollment created successfully.'
                    )
                  }
                  loading={loading}
                  text="Create Enrollment"
                />
              </FormCard>

              <FormCard title="Create Session">
                <SearchableDropdown
                  options={programOptions}
                  value={sessionProgramId}
                  onChange={(value) => {
                    setSessionProgramId(value);
                    setSessionBatchId('');
                  }}
                  search={sessionProgramSearch}
                  onSearchChange={setSessionProgramSearch}
                  placeholder="Select program"
                  searchPlaceholder="Search program"
                />
                <SearchableDropdown
                  options={batchOptionsForSession}
                  value={sessionBatchId}
                  onChange={setSessionBatchId}
                  search={sessionBatchSearch}
                  onSearchChange={setSessionBatchSearch}
                  placeholder={!sessionProgramId ? 'Select program first' : 'Select batch'}
                  searchPlaceholder="Search batch"
                />
                <input value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Session topic" />
                <div className="grid grid-cols-3 gap-3">
                  <input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={sessionStartsAt} onChange={(e) => setSessionStartsAt(e.target.value)} type="time" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={sessionEndsAt} onChange={(e) => setSessionEndsAt(e.target.value)} type="time" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <SearchableDropdown
                  options={teacherOptions}
                  value={sessionFacultyId}
                  onChange={setSessionFacultyId}
                  search={sessionFacultySearch}
                  onSearchChange={setSessionFacultySearch}
                  placeholder="Select faculty (optional)"
                  searchPlaceholder="Search faculty"
                />
                <PrimaryButton
                  disabled={loading || !organizationId || !schoolId || !sessionProgramId || !sessionBatchId || !sessionTopic.trim() || !sessionDate}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-sessions',
                      {
                        organizationId,
                        schoolId,
                        programId: sessionProgramId,
                        batchId: sessionBatchId,
                        topic: sessionTopic,
                        sessionDate,
                        startsAt: sessionStartsAt || undefined,
                        endsAt: sessionEndsAt || undefined,
                        facultyId: sessionFacultyId || undefined,
                      },
                      'Session created successfully.'
                    )
                  }
                  loading={loading}
                  text="Create Session"
                />
              </FormCard>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TableCard title={`Enrollments (${enrollments.length})`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Batch</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.batchId}</td>
                        <td className="px-3 py-2">{item.studentId}</td>
                        <td className="px-3 py-2">{item.status}</td>
                      </tr>
                    ))}
                    {!enrollments.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                          {optionLoading ? 'Loading...' : 'No enrollments found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>

              <TableCard title={`Sessions (${sessions.length})`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Topic</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.topic}</td>
                        <td className="px-3 py-2">{new Date(item.sessionDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{item.batchId}</td>
                      </tr>
                    ))}
                    {!sessions.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                          {optionLoading ? 'Loading...' : 'No sessions found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            </section>
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormCard title="Mark Attendance">
                <SearchableDropdown
                  options={sessionOptions}
                  value={attendanceSessionId}
                  onChange={setAttendanceSessionId}
                  search={attendanceSessionSearch}
                  onSearchChange={setAttendanceSessionSearch}
                  placeholder="Select session"
                  searchPlaceholder="Search session"
                />
                <SearchableDropdown
                  options={studentOptions}
                  value={attendanceStudentId}
                  onChange={setAttendanceStudentId}
                  search={attendanceStudentSearch}
                  onSearchChange={setAttendanceStudentSearch}
                  placeholder="Select student"
                  searchPlaceholder="Search student"
                />
                <SearchableDropdown
                  options={attendanceStatusOptions}
                  value={attendanceStatus}
                  onChange={setAttendanceStatus}
                  search={attendanceStatusSearch}
                  onSearchChange={setAttendanceStatusSearch}
                  placeholder="Select status"
                  searchPlaceholder="Search status"
                />
                <input value={attendanceRemarks} onChange={(e) => setAttendanceRemarks(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Remarks (optional)" />
                <PrimaryButton
                  disabled={loading || !organizationId || !schoolId || !attendanceSessionId || !attendanceStudentId}
                  onClick={() => {
                    const selectedSession = sessions.find((item) => item.id === attendanceSessionId);
                    if (!selectedSession) {
                      toastMessage('Please select a valid session.');
                      return;
                    }
                    void postJson(
                      '/api/admin/coaching-attendance',
                      {
                        organizationId,
                        schoolId,
                        programId: selectedSession.programId,
                        batchId: selectedSession.batchId,
                        sessionId: attendanceSessionId,
                        studentId: attendanceStudentId,
                        status: attendanceStatus,
                        remarks: attendanceRemarks || undefined,
                      },
                      'Attendance marked successfully.'
                    );
                  }}
                  loading={loading}
                  text="Mark Attendance"
                />
              </FormCard>

              <TableCard title={`Attendance (${attendance.length})`}>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.sessionId}</td>
                        <td className="px-3 py-2">{item.studentId}</td>
                        <td className="px-3 py-2">{item.status}</td>
                      </tr>
                    ))}
                    {!attendance.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                          {optionLoading ? 'Loading...' : 'No attendance found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableCard>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
