'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { MultiSelect } from '@/components/multi-select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { getAdminOrganizations, getAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';
import { FormCard, PrimaryButton, TabButton, TableCard } from './components/CoachingUi';

type OrganizationOption = { id: string; name: string };
type CoachingCenterOption = { id: string; name: string; organizationId: string };
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
  const [pendingAttendanceSessionId, setPendingAttendanceSessionId] = useState('');
  const [pendingAttendanceBatchId, setPendingAttendanceBatchId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);

  const [organizationId, setOrganizationId] = useState('');
  const [coachingCenterId, setCoachingCenterId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [organizationSearch, setOrganizationSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coachingCenterSearch, setCoachingCenterSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [academicYearSearch, setAcademicYearSearch] = useState('');

  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [programClassLevel, setProgramClassLevel] = useState('');
  const [programBoard, setProgramBoard] = useState('');
  const [programDescription, setProgramDescription] = useState('');

  const [batchProgramId, setBatchProgramId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [batchProgramSearch, setBatchProgramSearch] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchFacultyId, setBatchFacultyId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [batchFacultySearch, setBatchFacultySearch] = useState('');
  const [batchCapacity, setBatchCapacity] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('');
  const [batchStartsOn, setBatchStartsOn] = useState('');
  const [batchEndsOn, setBatchEndsOn] = useState('');
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [editBatchFacultyId, setEditBatchFacultyId] = useState('');

  const [enrollmentProgramId, setEnrollmentProgramId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enrollmentProgramSearch, setEnrollmentProgramSearch] = useState('');
  const [enrollmentBatchId, setEnrollmentBatchId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enrollmentBatchSearch, setEnrollmentBatchSearch] = useState('');
  const [enrollmentStudentId, setEnrollmentStudentId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enrollmentStudentSearch, setEnrollmentStudentSearch] = useState('');

  const [sessionProgramId, setSessionProgramId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionProgramSearch, setSessionProgramSearch] = useState('');
  const [sessionBatchId, setSessionBatchId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionBatchSearch, setSessionBatchSearch] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartsAt, setSessionStartsAt] = useState('');
  const [sessionEndsAt, setSessionEndsAt] = useState('');
  const [sessionFacultyId, setSessionFacultyId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionFacultySearch, setSessionFacultySearch] = useState('');

  const [attendanceSessionId, setAttendanceSessionId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [attendanceSessionSearch, setAttendanceSessionSearch] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceRegister, setAttendanceRegister] = useState<Record<string, { status: string; remarks: string; selected: boolean }>>({});
  const [activeAttendanceStudentId, setActiveAttendanceStudentId] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterOption[]>([]);
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

  const coachingCenterOptions = useMemo(
    () =>
      coachingCenters
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [organizationId, coachingCenters]
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

  const studentById = useMemo(
    () => new Map(students.map((item) => [item.id, item])),
    [students]
  );

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === attendanceSessionId),
    [sessions, attendanceSessionId]
  );

  const sessionEnrollments = useMemo(
    () => (selectedSession ? enrollments.filter((item) => item.batchId === selectedSession.batchId) : []),
    [enrollments, selectedSession]
  );

  const sessionStudentIds = useMemo(
    () => Array.from(new Set(sessionEnrollments.map((item) => item.studentId))),
    [sessionEnrollments]
  );

  const sessionStudents = useMemo(
    () => sessionStudentIds.map((id) => ({ id, data: studentById.get(id) })),
    [sessionStudentIds, studentById]
  );

  const attendanceByStudent = useMemo(() => {
    const entries = attendance.filter((item) => item.sessionId === attendanceSessionId);
    return new Map(entries.map((item) => [item.studentId, item]));
  }, [attendance, attendanceSessionId]);

  const filteredSessionStudents = useMemo(() => {
    const q = attendanceSearch.trim().toLowerCase();
    if (!q) return sessionStudents;
    return sessionStudents.filter(({ id, data }) => {
      const label = `${data?.firstName ?? ''} ${data?.lastName ?? ''} ${data?.email ?? ''} ${id}`.toLowerCase();
      return label.includes(q);
    });
  }, [attendanceSearch, sessionStudents]);

  const registerGroups = useMemo(() => {
    const groups: Array<{ label: string; ids: string[] }> = [];
    const byStatus = new Map<string, string[]>();
    for (const { id } of filteredSessionStudents) {
      const status = attendanceRegister[id]?.status ?? 'UNMARKED';
      const key = status.toUpperCase();
      if (!byStatus.has(key)) byStatus.set(key, []);
      byStatus.get(key)!.push(id);
    }
    const order = ['PRESENT', 'LATE', 'ABSENT', 'UNMARKED'];
    for (const key of order) {
      const ids = byStatus.get(key);
      if (ids && ids.length) groups.push({ label: key, ids });
    }
    return groups;
  }, [attendanceRegister, filteredSessionStudents]);

  const attendanceExportRows = useMemo(
    () =>
      filteredSessionStudents.map(({ id, data }) => {
        const register = attendanceRegister[id];
        const attendanceItem = attendanceByStudent.get(id);
        const status = register?.status ?? attendanceItem?.status ?? 'UNMARKED';
        const remarks = register?.remarks ?? '';
        const name = `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim() || data?.email || id;
        return {
          studentId: id,
          studentName: name,
          email: data?.email ?? '',
          status,
          remarks,
        };
      }),
    [attendanceByStudent, attendanceRegister, filteredSessionStudents]
  );

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
    params.set('coachingCenterId', schId);
    params.set('withMeta', 'true');
    if (yearId) params.set('academicYearId', yearId);
    const programParams = params.toString();

    const shared = new URLSearchParams();
    shared.set('organizationId', orgId);
    shared.set('coachingCenterId', schId);
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
      if (organizationId && coachingCenterId) {
        await loadCoachingData(organizationId, coachingCenterId, academicYearId || undefined);
      }
    } catch (error) {
      const text = String(error);
      setMessage(text);
      toastMessage(text);
    } finally {
      setLoading(false);
    }
  }

  function openBatchAssignmentEdit(batch: BatchItem) {
    setEditingBatch(batch);
    setEditBatchFacultyId(batch.facultyId || '');
  }

  function closeBatchAssignmentEdit() {
    setEditingBatch(null);
    setEditBatchFacultyId('');
  }

  async function updateBatchAssignment() {
    if (!editingBatch) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/coaching-batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBatch.id,
          organizationId,
          coachingCenterId,
          facultyId: editBatchFacultyId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update batch assignment');
      }
      await loadCoachingData(organizationId, coachingCenterId, academicYearId || undefined);
      closeBatchAssignmentEdit();
      setMessage('Batch faculty assignment updated successfully.');
      toastMessage('Batch faculty assignment updated successfully.');
    } catch (error) {
      const text = String(error);
      setMessage(text);
      toastMessage(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!attendanceSessionId) {
      setAttendanceRegister({});
      return;
    }
    const next: Record<string, { status: string; remarks: string; selected: boolean }> = {};
    for (const studentId of sessionStudentIds) {
      const existing = attendanceByStudent.get(studentId);
      next[studentId] = {
        selected: true,
        status: existing?.status ?? 'PRESENT',
        remarks: '',
      };
    }
    if (typeof window !== 'undefined') {
      const draftKey = `attendance:draft:${organizationId}:${coachingCenterId}:${attendanceSessionId}`;
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Record<string, { status: string; remarks: string; selected: boolean }>;
          for (const studentId of Object.keys(next)) {
            if (parsed[studentId]) {
              next[studentId] = {
                status: parsed[studentId].status ?? next[studentId].status,
                remarks: parsed[studentId].remarks ?? next[studentId].remarks,
                selected: typeof parsed[studentId].selected === 'boolean' ? parsed[studentId].selected : next[studentId].selected,
              };
            }
          }
        } catch {
          // ignore draft parsing errors
        }
      }
    }
    setAttendanceRegister(next);
  }, [attendanceSessionId, attendanceByStudent, sessionStudentIds]);

  useEffect(() => {
    if (!attendanceSessionId) return;
    const draftKey = `attendance:draft:${organizationId}:${coachingCenterId}:${attendanceSessionId}`;
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(attendanceRegister));
      } catch {
        // ignore storage errors
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [attendanceRegister, attendanceSessionId, organizationId, coachingCenterId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!activeAttendanceStudentId) return;
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const key = event.key.toLowerCase();
      if (key === 'p' || key === 'a' || key === 'l') {
        event.preventDefault();
        const status = key === 'p' ? 'PRESENT' : key === 'a' ? 'ABSENT' : 'LATE';
        setAttendanceRegister((prev) => ({
          ...prev,
          [activeAttendanceStudentId]: {
            status,
            remarks: prev[activeAttendanceStudentId]?.remarks ?? '',
            selected: prev[activeAttendanceStudentId]?.selected ?? true,
          },
        }));
      }
      if (key === 'r') {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>(`[data-remarks-for='${activeAttendanceStudentId}']`);
        input?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeAttendanceStudentId]);

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
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const sessionId = params.get('sessionId');
    const batchId = params.get('batchId');
    if (tab === 'programs' || tab === 'delivery' || tab === 'attendance') {
      setActiveTab(tab);
    }
    if (sessionId) {
      setPendingAttendanceSessionId(sessionId);
    }
    if (batchId) {
      setPendingAttendanceBatchId(batchId);
    }
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
    if (!(organizationId && coachingCenterId)) {
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
        params.set('coachingCenterId', coachingCenterId);
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

        await loadCoachingData(organizationId, coachingCenterId, academicYearId || undefined);
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
  }, [organizationId, coachingCenterId, academicYearId, toastMessage]);

  useEffect(() => {
    if (!sessions.length) return;
    if (pendingAttendanceSessionId) {
      const exists = sessions.some((item) => item.id === pendingAttendanceSessionId);
      if (exists) {
        setActiveTab('attendance');
        setAttendanceSessionId(pendingAttendanceSessionId);
        setPendingAttendanceSessionId('');
      }
    }
    if (pendingAttendanceBatchId) {
      const batchSessions = sessions
        .filter((item) => item.batchId === pendingAttendanceBatchId)
        .sort((a, b) => +new Date(b.sessionDate) - +new Date(a.sessionDate));
      if (batchSessions.length) {
        setActiveTab('attendance');
        setAttendanceSessionId(batchSessions[0].id);
        setPendingAttendanceBatchId('');
      }
    }
  }, [pendingAttendanceBatchId, pendingAttendanceSessionId, sessions]);

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
            <MultiSelect
              options={organizationOptions}
              value={organizationId ? [organizationId] : []}
              onValueChange={(values) => setOrganizationId(values[0] || '')}
              placeholder="Select organization"
              disabled={tenantLoading}
              singleSelect
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Coaching Center</label>
            <MultiSelect
              options={coachingCenterOptions}
              value={coachingCenterId ? [coachingCenterId] : []}
              onValueChange={(values) => setCoachingCenterId(values[0] || '')}
              placeholder={!organizationId ? 'Select organization first' : 'Select coaching center'}
              disabled={tenantLoading || !organizationId}
              singleSelect
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
            <MultiSelect
              options={academicYearOptions}
              value={academicYearId ? [academicYearId] : []}
              onValueChange={(values) => setAcademicYearId(values[0] || '')}
              placeholder="Select academic year"
              disabled={optionLoading || !coachingCenterId}
              singleSelect
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
                  disabled={loading || !organizationId || !coachingCenterId || !academicYearId || !programName.trim()}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-programs',
                      {
                        organizationId,
                        coachingCenterId,
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
                <MultiSelect
                  options={programOptions}
                  value={batchProgramId ? [batchProgramId] : []}
                  onValueChange={(values) => setBatchProgramId(values[0] || '')}
                  placeholder="Select program"
                  singleSelect
                />
                <input value={batchName} onChange={(e) => setBatchName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Batch name" />
                <MultiSelect
                  options={teacherOptions}
                  value={batchFacultyId ? [batchFacultyId] : []}
                  onValueChange={(values) => setBatchFacultyId(values[0] || '')}
                  placeholder="Select faculty (optional)"
                  singleSelect
                />
                <input value={batchCapacity} onChange={(e) => setBatchCapacity(e.target.value)} type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Capacity" />
                <input value={batchSchedule} onChange={(e) => setBatchSchedule(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Schedule summary (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={batchStartsOn} onChange={(e) => setBatchStartsOn(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={batchEndsOn} onChange={(e) => setBatchEndsOn(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <PrimaryButton
                  disabled={loading || !organizationId || !coachingCenterId || !batchProgramId || !batchName.trim() || !batchCapacity}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-batches',
                      {
                        organizationId,
                        coachingCenterId,
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
                      <th className="px-3 py-2">Faculty</th>
                      <th className="px-3 py-2">Capacity</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.programId}</td>
                        <td className="px-3 py-2">{teachers.find((teacher) => teacher.id === item.facultyId)?.name || item.facultyId || '-'}</td>
                        <td className="px-3 py-2">{item.capacity}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => openBatchAssignmentEdit(item)}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit Faculty
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!batches.length && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
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
                <MultiSelect
                  options={programOptions}
                  value={enrollmentProgramId ? [enrollmentProgramId] : []}
              onValueChange={(values) => {
                setEnrollmentProgramId(values[0] || '');
                setEnrollmentBatchId('');
              }}
                  placeholder="Select program"
                  singleSelect
                />
                <MultiSelect
                  options={batchOptionsForEnrollment}
                  value={enrollmentBatchId ? [enrollmentBatchId] : []}
                  onValueChange={(values) => setEnrollmentBatchId(values[0] || '')}
                  placeholder={!enrollmentProgramId ? 'Select program first' : 'Select batch'}
                  disabled={!enrollmentProgramId}
                  singleSelect
                />
                <MultiSelect
                  options={studentOptions}
                  value={enrollmentStudentId ? [enrollmentStudentId] : []}
                  onValueChange={(values) => setEnrollmentStudentId(values[0] || '')}
                  placeholder="Select student"
                  singleSelect
                />
                <PrimaryButton
                  disabled={loading || !organizationId || !coachingCenterId || !enrollmentProgramId || !enrollmentBatchId || !enrollmentStudentId}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-enrollments',
                      {
                        organizationId,
                        coachingCenterId,
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
                <MultiSelect
                  options={programOptions}
                  value={sessionProgramId ? [sessionProgramId] : []}
              onValueChange={(values) => {
                setSessionProgramId(values[0] || '');
                setSessionBatchId('');
              }}
                  placeholder="Select program"
                  singleSelect
                />
                <MultiSelect
                  options={batchOptionsForSession}
                  value={sessionBatchId ? [sessionBatchId] : []}
                  onValueChange={(values) => setSessionBatchId(values[0] || '')}
                  placeholder={!sessionProgramId ? 'Select program first' : 'Select batch'}
                  disabled={!sessionProgramId}
                  singleSelect
                />
                <input value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Session topic" />
                <div className="grid grid-cols-3 gap-3">
                  <input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={sessionStartsAt} onChange={(e) => setSessionStartsAt(e.target.value)} type="time" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={sessionEndsAt} onChange={(e) => setSessionEndsAt(e.target.value)} type="time" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <MultiSelect
                  options={teacherOptions}
                  value={sessionFacultyId ? [sessionFacultyId] : []}
                  onValueChange={(values) => setSessionFacultyId(values[0] || '')}
                  placeholder="Select faculty (optional)"
                  singleSelect
                />
                <PrimaryButton
                  disabled={loading || !organizationId || !coachingCenterId || !sessionProgramId || !sessionBatchId || !sessionTopic.trim() || !sessionDate}
                  onClick={() =>
                    postJson(
                      '/api/admin/coaching-sessions',
                      {
                        organizationId,
                        coachingCenterId,
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
                        <td className="px-3 py-2">
                          <a
                            href={`/admin-roles/manage-setting/coaching?tab=attendance&sessionId=${encodeURIComponent(item.id)}`}
                            className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                          >
                            {item.topic}
                          </a>
                        </td>
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
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">Attendance Register</h2>
                  <div className="flex items-center gap-2">
                    <CsvExportButton
                      filename={`attendance-register-${attendanceSessionId || 'session'}.csv`}
                      rows={attendanceExportRows}
                      columns={[
                        { key: 'studentId', label: 'Student ID' },
                        { key: 'studentName', label: 'Student' },
                        { key: 'email', label: 'Email' },
                        { key: 'status', label: 'Status' },
                        { key: 'remarks', label: 'Remarks' },
                      ]}
                      className="bg-white"
                    />
                    <PdfExportButton
                      filename={`attendance-register-${attendanceSessionId || 'session'}.pdf`}
                      title="Attendance Register"
                      rows={attendanceExportRows}
                      columns={[
                        { key: 'studentId', label: 'Student ID' },
                        { key: 'studentName', label: 'Student' },
                        { key: 'email', label: 'Email' },
                        { key: 'status', label: 'Status' },
                        { key: 'remarks', label: 'Remarks' },
                      ]}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select a session to load the roster. Mark attendance with a single pass.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3">
                <MultiSelect
                  options={sessionOptions}
                  value={attendanceSessionId ? [attendanceSessionId] : []}
                  onValueChange={(values) => setAttendanceSessionId(values[0] || '')}
                  placeholder="Select session"
                  singleSelect
                />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                      <span>Roster</span>
                      <span>{sessionStudentIds.length} students</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Selected</span>
                      <span>{Object.values(attendanceRegister).filter((row) => row.selected).length}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        setAttendanceRegister((prev) => {
                          const next = { ...prev };
                          for (const key of Object.keys(next)) {
                            next[key] = { ...next[key], status: 'PRESENT' };
                          }
                          return next;
                        });
                      }}
                      disabled={!attendanceSessionId}
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      onClick={() => {
                        setAttendanceRegister((prev) => {
                          const next = { ...prev };
                          for (const key of Object.keys(next)) {
                            next[key] = { ...next[key], status: 'ABSENT' };
                          }
                          return next;
                        });
                      }}
                      disabled={!attendanceSessionId}
                    >
                      Mark All Absent
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      onClick={() => {
                        setAttendanceRegister((prev) => {
                          const next = { ...prev };
                          for (const key of Object.keys(next)) {
                            next[key] = { ...next[key], status: 'LATE' };
                          }
                          return next;
                        });
                      }}
                      disabled={!attendanceSessionId}
                    >
                      Mark All Late
                    </button>
                  </div>
                  <PrimaryButton
                    disabled={
                      loading ||
                      !organizationId ||
                      !coachingCenterId ||
                      !attendanceSessionId ||
                      Object.values(attendanceRegister).filter((row) => row.selected).length === 0
                    }
                    onClick={() => {
                      const selectedSession = sessions.find((item) => item.id === attendanceSessionId);
                      if (!selectedSession) {
                        toastMessage('Please select a valid session.');
                        return;
                      }
                      const entries = Object.entries(attendanceRegister).filter(([, row]) => row.selected);
                      if (!entries.length) {
                        toastMessage('Select at least one student to mark attendance.');
                        return;
                      }
                      void (async () => {
                        setLoading(true);
                        setMessage(null);
                        try {
                          const results = await Promise.all(
                            entries.map(([studentId, row]) =>
                              fetch('/api/admin/coaching-attendance', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  organizationId,
                                  coachingCenterId,
                                  programId: selectedSession.programId,
                                  batchId: selectedSession.batchId,
                                  sessionId: attendanceSessionId,
                                  studentId,
                                  status: row.status,
                                  remarks: row.remarks || undefined,
                                }),
                              })
                            )
                          );
                          for (const res of results) {
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              throw new Error(data?.error || 'Failed to mark attendance');
                            }
                          }
                          setMessage('Attendance marked successfully.');
                          toastMessage('Attendance marked successfully.');
                          if (organizationId && coachingCenterId) {
                            await loadCoachingData(organizationId, coachingCenterId, academicYearId || undefined);
                          }
                          if (typeof window !== 'undefined') {
                            const draftKey = `attendance:draft:${organizationId}:${coachingCenterId}:${attendanceSessionId}`;
                            window.localStorage.removeItem(draftKey);
                          }
                        } catch (error) {
                          const text = String(error);
                          setMessage(text);
                          toastMessage(text);
                        } finally {
                          setLoading(false);
                        }
                      })();
                    }}
                    loading={loading}
                    text="Save Attendance"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Session Register</h3>
                    <p className="text-xs text-slate-500">Mark status and add remarks per student.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                        checked={
                          Object.values(attendanceRegister).length > 0 &&
                          Object.values(attendanceRegister).every((row) => row.selected)
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAttendanceRegister((prev) => {
                            const next = { ...prev };
                            for (const key of Object.keys(next)) {
                              next[key] = { ...next[key], selected: checked };
                            }
                            return next;
                          });
                        }}
                        disabled={!attendanceSessionId}
                      />
                      Select all
                    </label>
                    <input
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      placeholder="Search student..."
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                      disabled={!attendanceSessionId}
                    />
                  </div>
                </div>

                <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase text-slate-500 shadow-sm">
                      <tr>
                        <th className="px-3 py-2 w-10">Mark</th>
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registerGroups.map((group) => (
                        <Fragment key={group.label}>
                          <tr key={group.label} className="bg-slate-100/70">
                            <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-600">
                              {group.label} ({group.ids.length})
                            </td>
                          </tr>
                          {group.ids.map((id) => {
                            const data = studentById.get(id);
                            const row = attendanceRegister[id];
                            const displayName = `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim() || data?.email || id;
                            return (
                              <tr
                                key={id}
                                className={`border-t border-slate-100 ${activeAttendanceStudentId === id ? 'bg-cyan-50/60' : ''}`}
                                onClick={() => setActiveAttendanceStudentId(id)}
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                                    checked={row?.selected ?? false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setAttendanceRegister((prev) => ({
                                        ...prev,
                                        [id]: {
                                          status: prev[id]?.status ?? 'PRESENT',
                                          remarks: prev[id]?.remarks ?? '',
                                          selected: checked,
                                        },
                                      }));
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="text-sm font-medium text-slate-900">
                                    <a
                                      href={`/profile/users/${encodeURIComponent(id)}`}
                                      className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                                    >
                                      {displayName}
                                    </a>
                                  </div>
                                  <div className="text-xs text-slate-500">{data?.email ?? id}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-2">
                                    {attendanceStatusOptions.map((option) => (
                                      <label key={option.value} className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                        <input
                                          type="radio"
                                          name={`status-${id}`}
                                          value={option.value}
                                          checked={(row?.status ?? 'PRESENT') === option.value}
                                          onChange={() => {
                                            setAttendanceRegister((prev) => ({
                                              ...prev,
                                              [id]: {
                                                status: option.value,
                                                remarks: prev[id]?.remarks ?? '',
                                                selected: prev[id]?.selected ?? true,
                                              },
                                            }));
                                          }}
                                          className="h-3 w-3 text-cyan-600"
                                        />
                                        {option.label}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    data-remarks-for={id}
                                    value={row?.remarks ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setAttendanceRegister((prev) => ({
                                        ...prev,
                                        [id]: {
                                          status: prev[id]?.status ?? 'PRESENT',
                                          remarks: value,
                                          selected: prev[id]?.selected ?? true,
                                        },
                                      }));
                                    }}
                                    placeholder="Optional note"
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))}
                      {!filteredSessionStudents.length && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            {attendanceSessionId
                              ? optionLoading
                                ? 'Loading...'
                                : 'No students found for this session.'
                              : 'Select a session to load the register.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        <Dialog open={Boolean(editingBatch)} onOpenChange={(open) => !open && closeBatchAssignmentEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Teacher Assignment</DialogTitle>
              <DialogDescription>
                Update the faculty assigned to this batch. This is how teacher assignment is currently managed for programs in coaching setup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div><span className="font-semibold text-slate-900">Batch:</span> {editingBatch?.name}</div>
                <div><span className="font-semibold text-slate-900">Program:</span> {editingBatch?.programId}</div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Faculty</label>
                <MultiSelect
                  options={teacherOptions}
                  value={editBatchFacultyId ? [editBatchFacultyId] : []}
                  onValueChange={(values) => setEditBatchFacultyId(values[0] || '')}
                  placeholder="Select faculty"
                  singleSelect
                />
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={closeBatchAssignmentEdit}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !editingBatch}
                onClick={updateBatchAssignment}
                className="rounded-lg border border-teal-600 bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Update Assignment'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
