'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { Badge } from '@/shared/components/ui/Badge';

type StepStatus = { type: 'idle' | 'loading' | 'success' | 'error'; message: string };
type JsonRecord = Record<string, unknown>;
type OrgOption = { id: string; name: string };
type SchoolOption = { id: string; name: string; organizationId: string };

const initialStatus: StepStatus = { type: 'idle', message: '' };
const DRAFT_KEY = 'onboarding_wizard_draft_v1';

const stepMeta = [
  { title: 'Bootstrap Check', description: 'Verify superadmin is ready before onboarding.' },
  { title: 'Create Organization', description: 'Create tenant root organization.' },
  { title: 'Create School', description: 'Create school under organization.' },
  { title: 'Create Admin Accounts', description: 'Create org/school/admin operators.' },
  { title: 'Academic Setup', description: 'Create academic year and class master.' },
  { title: 'Teacher + Class Teacher', description: 'Create teacher and assign section class teacher.' },
  { title: 'Fees Setup', description: 'Create fee type/plan and assign plan to class.' },
  { title: 'Create Student + Parent', description: 'Create student and auto-link parent.' },
  { title: 'Student Ledger', description: 'Create student fee ledger entry.' },
  { title: 'Parent Handover', description: 'Share credentials and login instructions.' },
];

function StatusBanner({ status }: { status: StepStatus }) {
  if (status.type === 'idle') return null;
  const className =
    status.type === 'success'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status.type === 'error'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';

  return <div className={`mt-3 rounded border px-3 py-2 text-sm ${className}`}>{status.message}</div>;
}

function extractId(data: JsonRecord): string {
  if (typeof data.id === 'string') return data.id;
  if (typeof data._id === 'string') return data._id;
  if (typeof data.organizationId === 'string') return data.organizationId;
  if (typeof data.schoolId === 'string') return data.schoolId;
  if (typeof data.feeTypeId === 'string') return data.feeTypeId;
  if (typeof data.feePlanId === 'string') return data.feePlanId;
  if (typeof data.studentId === 'string') return data.studentId;
  if (typeof data.classMasterId === 'string') return data.classMasterId;
  if (typeof data.academicYearId === 'string') return data.academicYearId;
  const user = data.user as { id?: string } | undefined;
  if (typeof user?.id === 'string') return user.id;
  return '';
}

export default function OnboardingFlowPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, StepStatus>>({});

  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classMasterId, setClassMasterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [feeTypeId, setFeeTypeId] = useState('');
  const [feePlanId, setFeePlanId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [recentOrganizationId, setRecentOrganizationId] = useState('');
  const [recentSchoolId, setRecentSchoolId] = useState('');
  const [adminRoleSearch, setAdminRoleSearch] = useState('');
  const [feeFrequencySearch, setFeeFrequencySearch] = useState('');

  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    type: 'SCHOOL_GROUP',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    contactEmail: '',
    contactPhone: '',
  });
  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolCode: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    contactEmail: '',
    contactPhone: '',
  });
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.SCHOOL_ADMIN,
  });
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });
  const [classForm, setClassForm] = useState({ name: '', level: 'PRIMARY' });
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [sectionForm, setSectionForm] = useState({
    name: 'A',
    capacity: '30',
    roomNumber: '',
    shift: 'MORNING',
  });
  const [subjectForm, setSubjectForm] = useState({ subjectName: 'Mathematics', weeklyPeriods: '5' });
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: 'Tuition',
    amount: '3000',
    frequency: 'MONTHLY',
    isMandatory: true,
    isTaxable: false,
  });
  const [feePlanForm, setFeePlanForm] = useState({
    name: 'Standard Plan',
    itemsJson: '[{"feeTypeId":"feeType_1","name":"Tuition","amount":3000,"frequency":"MONTHLY"}]',
  });
  const [studentForm, setStudentForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    parentEmail: '',
    parentPassword: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
  });
  const [ledgerForm, setLedgerForm] = useState({ amount: '3000', dueDate: '' });
  const [skipSubjectAllocation, setSkipSubjectAllocation] = useState(false);
  const [skipAssignFeePlan, setSkipAssignFeePlan] = useState(false);

  const completion = useMemo(() => {
    return [
      statusMap.bootstrapCheck?.type === 'success',
      Boolean(organizationId),
      Boolean(schoolId),
      true,
      Boolean(academicYearId && classMasterId),
      Boolean(teacherId && sectionId && (skipSubjectAllocation || statusMap.subjectAllocation?.type === 'success')),
      Boolean(feePlanId && (skipAssignFeePlan || statusMap.assignFeePlan?.type === 'success')),
      Boolean(studentId),
      statusMap.studentLedger?.type === 'success',
      true,
    ];
  }, [statusMap, organizationId, schoolId, academicYearId, classMasterId, teacherId, sectionId, feePlanId, studentId, skipSubjectAllocation, skipAssignFeePlan]);

  const filteredOrganizations = useMemo(() => {
    const q = organizationSearch.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (org) => org.name.toLowerCase().includes(q) || org.id.toLowerCase().includes(q)
    );
  }, [organizations, organizationSearch]);

  const filteredSchools = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();
    const scoped = schools.filter((school) => school.organizationId === organizationId);
    if (!q) return scoped;
    return scoped.filter(
      (school) => school.name.toLowerCase().includes(q) || school.id.toLowerCase().includes(q)
    );
  }, [schools, schoolSearch, organizationId]);

  const organizationOptions = useMemo(
    () =>
      filteredOrganizations.map((org) => ({
        value: org.id,
        label: `${org.name} (${org.id})${org.id === recentOrganizationId ? ' - Recently Created' : ''}`,
      })),
    [filteredOrganizations, recentOrganizationId]
  );

  const schoolOptions = useMemo(
    () =>
      filteredSchools.map((school) => ({
        value: school.id,
        label: `${school.name} (${school.id})${school.id === recentSchoolId ? ' - Recently Created' : ''}`,
      })),
    [filteredSchools, recentSchoolId]
  );

  const maxUnlockedStep = useMemo(() => {
    let max = 0;
    for (let i = 0; i < completion.length - 1; i += 1) {
      if (completion[i]) max = i + 1;
    }
    return Math.max(max, currentStep);
  }, [completion, currentStep]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as JsonRecord;

      if (typeof draft.currentStep === 'number') setCurrentStep(Math.max(0, Math.min(stepMeta.length - 1, draft.currentStep)));
      if (typeof draft.organizationId === 'string') setOrganizationId(draft.organizationId);
      if (typeof draft.schoolId === 'string') setSchoolId(draft.schoolId);
      if (typeof draft.academicYearId === 'string') setAcademicYearId(draft.academicYearId);
      if (typeof draft.classMasterId === 'string') setClassMasterId(draft.classMasterId);
      if (typeof draft.sectionId === 'string') setSectionId(draft.sectionId);
      if (typeof draft.teacherId === 'string') setTeacherId(draft.teacherId);
      if (typeof draft.feeTypeId === 'string') setFeeTypeId(draft.feeTypeId);
      if (typeof draft.feePlanId === 'string') setFeePlanId(draft.feePlanId);
      if (typeof draft.studentId === 'string') setStudentId(draft.studentId);
      if (typeof draft.skipSubjectAllocation === 'boolean') setSkipSubjectAllocation(draft.skipSubjectAllocation);
      if (typeof draft.skipAssignFeePlan === 'boolean') setSkipAssignFeePlan(draft.skipAssignFeePlan);

      if (draft.orgForm && typeof draft.orgForm === 'object') setOrgForm((prev) => ({ ...prev, ...(draft.orgForm as typeof prev) }));
      if (draft.schoolForm && typeof draft.schoolForm === 'object') setSchoolForm((prev) => ({ ...prev, ...(draft.schoolForm as typeof prev) }));
      if (draft.adminForm && typeof draft.adminForm === 'object') setAdminForm((prev) => ({ ...prev, ...(draft.adminForm as typeof prev) }));
      if (draft.yearForm && typeof draft.yearForm === 'object') setYearForm((prev) => ({ ...prev, ...(draft.yearForm as typeof prev) }));
      if (draft.classForm && typeof draft.classForm === 'object') setClassForm((prev) => ({ ...prev, ...(draft.classForm as typeof prev) }));
      if (draft.teacherForm && typeof draft.teacherForm === 'object') setTeacherForm((prev) => ({ ...prev, ...(draft.teacherForm as typeof prev) }));
      if (draft.sectionForm && typeof draft.sectionForm === 'object') setSectionForm((prev) => ({ ...prev, ...(draft.sectionForm as typeof prev) }));
      if (draft.subjectForm && typeof draft.subjectForm === 'object') setSubjectForm((prev) => ({ ...prev, ...(draft.subjectForm as typeof prev) }));
      if (draft.feeTypeForm && typeof draft.feeTypeForm === 'object') setFeeTypeForm((prev) => ({ ...prev, ...(draft.feeTypeForm as typeof prev) }));
      if (draft.feePlanForm && typeof draft.feePlanForm === 'object') setFeePlanForm((prev) => ({ ...prev, ...(draft.feePlanForm as typeof prev) }));
      if (draft.studentForm && typeof draft.studentForm === 'object') setStudentForm((prev) => ({ ...prev, ...(draft.studentForm as typeof prev) }));
      if (draft.ledgerForm && typeof draft.ledgerForm === 'object') setLedgerForm((prev) => ({ ...prev, ...(draft.ledgerForm as typeof prev) }));
    } catch {
      // Ignore invalid drafts
    }
  }, []);

  async function loadOrganizations() {
    try {
      const response = await fetch('/api/admin/organizations');
      const data = (await response.json()) as Array<{ id?: string; name?: string }>;
      if (!response.ok || !Array.isArray(data)) return;
      setOrganizations(
        data
          .filter((row) => typeof row.id === 'string' && typeof row.name === 'string')
          .map((row) => ({ id: row.id as string, name: row.name as string }))
      );
    } catch {
      // Ignore dropdown loading errors in UI
    }
  }

  async function loadSchools(orgId?: string) {
    try {
      const query = orgId ? `?organizationId=${encodeURIComponent(orgId)}` : '';
      const response = await fetch(`/api/admin/schools${query}`);
      const data = (await response.json()) as Array<{ id?: string; name?: string; organizationId?: string }>;
      if (!response.ok || !Array.isArray(data)) return;
      const mapped = data
        .filter(
          (row) =>
            typeof row.id === 'string' &&
            typeof row.name === 'string' &&
            typeof row.organizationId === 'string'
        )
        .map((row) => ({
          id: row.id as string,
          name: row.name as string,
          organizationId: row.organizationId as string,
        }));
      setSchools(mapped);
    } catch {
      // Ignore dropdown loading errors in UI
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadSchools(organizationId);
      if (schoolId && !schools.find((s) => s.id === schoolId && s.organizationId === organizationId)) {
        setSchoolId('');
      }
    } else {
      setSchools([]);
      setSchoolId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  useEffect(() => {
    const draft = {
      currentStep,
      organizationId,
      schoolId,
      academicYearId,
      classMasterId,
      sectionId,
      teacherId,
      feeTypeId,
      feePlanId,
      studentId,
      skipSubjectAllocation,
      skipAssignFeePlan,
      orgForm,
      schoolForm,
      adminForm,
      yearForm,
      classForm,
      teacherForm,
      sectionForm,
      subjectForm,
      feeTypeForm,
      feePlanForm,
      studentForm,
      ledgerForm,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    currentStep,
    organizationId,
    schoolId,
    academicYearId,
    classMasterId,
    sectionId,
    teacherId,
    feeTypeId,
    feePlanId,
    studentId,
    skipSubjectAllocation,
    skipAssignFeePlan,
    orgForm,
    schoolForm,
    adminForm,
    yearForm,
    classForm,
    teacherForm,
    sectionForm,
    subjectForm,
    feeTypeForm,
    feePlanForm,
    studentForm,
    ledgerForm,
  ]);

  async function postStep(
    key: string,
    url: string,
    payload: Record<string, unknown>,
    onSuccess?: (data: JsonRecord) => void
  ) {
    setStatusMap((prev) => ({ ...prev, [key]: { type: 'loading', message: 'Saving...' } }));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as JsonRecord;
      if (!response.ok) {
        setStatusMap((prev) => ({ ...prev, [key]: { type: 'error', message: String(data.error || 'Request failed') } }));
        return;
      }
      if (onSuccess) onSuccess(data);
      setStatusMap((prev) => ({ ...prev, [key]: { type: 'success', message: 'Saved successfully.' } }));
    } catch (error) {
      setStatusMap((prev) => ({ ...prev, [key]: { type: 'error', message: `Error: ${String(error)}` } }));
    }
  }

  async function checkBootstrap() {
    const key = 'bootstrapCheck';
    setStatusMap((prev) => ({ ...prev, [key]: { type: 'loading', message: 'Checking...' } }));
    try {
      const response = await fetch('/api/auth/superadmin-check');
      const data = (await response.json()) as { superadminExists?: boolean };
      const ok = Boolean(response.ok && data.superadminExists);
      setStatusMap((prev) => ({
        ...prev,
        [key]: { type: ok ? 'success' : 'error', message: ok ? 'Superadmin exists.' : 'Superadmin not bootstrapped yet.' },
      }));
    } catch (error) {
      setStatusMap((prev) => ({ ...prev, [key]: { type: 'error', message: `Error: ${String(error)}` } }));
    }
  }

  function stepContent() {
    switch (currentStep) {
      case 0:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <button onClick={checkBootstrap} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Check Bootstrap Status</button>
            <a href="/auth/superadmin-bootstrap" className="ml-3 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Open Bootstrap Page</a>
            <StatusBanner status={statusMap.bootstrapCheck ?? initialStatus} />
          </section>
        );
      case 1:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={orgForm.organizationName} onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })} placeholder="Organization Name" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })} placeholder="Type" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.street} onChange={(e) => setOrgForm({ ...orgForm, street: e.target.value })} placeholder="Street" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} placeholder="City" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} placeholder="State" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.zipCode} onChange={(e) => setOrgForm({ ...orgForm, zipCode: e.target.value })} placeholder="Zip Code" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.country} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} placeholder="Country" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.contactEmail} onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })} placeholder="Contact Email" className="rounded border px-3 py-2 text-sm" />
              <input value={orgForm.contactPhone} onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button
              onClick={() =>
                postStep('organization', '/api/admin/organizations', orgForm, async (d) => {
                  const id = extractId(d);
                  if (id) {
                    setOrganizationId(id);
                    setRecentOrganizationId(id);
                  }
                  await loadOrganizations();
                })
              }
              className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create Organization
            </button>
            <StatusBanner status={statusMap.organization ?? initialStatus} />
          </section>
        );
      case 2:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 text-sm text-gray-600">organizationId: <span className="font-medium">{organizationId || 'Not set'}</span></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={schoolForm.schoolName} onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })} placeholder="School Name" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.schoolCode} onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })} placeholder="School Code" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.street} onChange={(e) => setSchoolForm({ ...schoolForm, street: e.target.value })} placeholder="Street" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.city} onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })} placeholder="City" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.state} onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })} placeholder="State" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.zipCode} onChange={(e) => setSchoolForm({ ...schoolForm, zipCode: e.target.value })} placeholder="Zip Code" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.country} onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })} placeholder="Country" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.contactEmail} onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })} placeholder="Contact Email" className="rounded border px-3 py-2 text-sm" />
              <input value={schoolForm.contactPhone} onChange={(e) => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button
              onClick={() =>
                postStep('school', '/api/admin/schools', { ...schoolForm, organizationId }, async (d) => {
                  const id = extractId(d);
                  if (id) {
                    setSchoolId(id);
                    setRecentSchoolId(id);
                  }
                  await loadSchools(organizationId);
                })
              }
              className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create School
            </button>
            <StatusBanner status={statusMap.school ?? initialStatus} />
          </section>
        );
      case 3:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Email" className="rounded border px-3 py-2 text-sm" />
              <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Password" className="rounded border px-3 py-2 text-sm" />
              <input value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} placeholder="First Name" className="rounded border px-3 py-2 text-sm" />
              <input value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} placeholder="Last Name" className="rounded border px-3 py-2 text-sm" />
              <input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="Phone" className="rounded border px-3 py-2 text-sm" />
              <SearchableDropdown
                options={[
                  { value: UserRole.ORGANIZATION_ADMIN, label: 'ORGANIZATION_ADMIN' },
                  { value: UserRole.SCHOOL_ADMIN, label: 'SCHOOL_ADMIN' },
                  { value: UserRole.ADMIN, label: 'ADMIN' },
                ]}
                value={adminForm.role}
                onChange={(value) => setAdminForm({ ...adminForm, role: value as UserRole })}
                search={adminRoleSearch}
                onSearchChange={setAdminRoleSearch}
                placeholder="Select admin role"
                searchPlaceholder="Search role"
              />
            </div>
            <button
              onClick={() => {
                if (!organizationId || !schoolId) {
                  setStatusMap((prev) => ({
                    ...prev,
                    adminUser: { type: 'error', message: 'Please select organization and school from tenant selectors.' },
                  }));
                  return;
                }
                postStep('adminUser', '/api/admin/users', { ...adminForm, organizationId, schoolId });
              }}
              className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create Admin User
            </button>
            <StatusBanner status={statusMap.adminUser ?? initialStatus} />
          </section>
        );
      case 4:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="Academic Year Name" className="rounded border px-3 py-2 text-sm" />
              <input type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className="rounded border px-3 py-2 text-sm" />
              <input type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('academicYear', '/api/admin/academic-years', { organizationId, schoolId, ...yearForm }, (d) => setAcademicYearId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Academic Year</button>
            <StatusBanner status={statusMap.academicYear ?? initialStatus} />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class Name" className="rounded border px-3 py-2 text-sm" />
              <input value={classForm.level} onChange={(e) => setClassForm({ ...classForm, level: e.target.value })} placeholder="Class Level" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('classMaster', '/api/admin/class-masters', { organizationId, schoolId, ...classForm }, (d) => setClassMasterId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Class Master</button>
            <StatusBanner status={statusMap.classMaster ?? initialStatus} />
          </section>
        );
      case 5:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="Teacher Email" className="rounded border px-3 py-2 text-sm" />
              <input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Teacher Password" className="rounded border px-3 py-2 text-sm" />
              <input value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} placeholder="Teacher First Name" className="rounded border px-3 py-2 text-sm" />
              <input value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} placeholder="Teacher Last Name" className="rounded border px-3 py-2 text-sm" />
              <input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} placeholder="Teacher Phone" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('teacherUser', '/api/admin/users', { ...teacherForm, role: UserRole.TEACHER, organizationId, schoolId }, (d) => setTeacherId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Teacher</button>
            <StatusBanner status={statusMap.teacherUser ?? initialStatus} />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={classMasterId} onChange={(e) => setClassMasterId(e.target.value)} placeholder="classMasterId" className="rounded border px-3 py-2 text-sm" />
              <input value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Section Name" className="rounded border px-3 py-2 text-sm" />
              <input value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })} type="number" placeholder="Capacity" className="rounded border px-3 py-2 text-sm" />
              <input value={sectionForm.roomNumber} onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })} placeholder="Room Number" className="rounded border px-3 py-2 text-sm" />
              <input value={sectionForm.shift} onChange={(e) => setSectionForm({ ...sectionForm, shift: e.target.value })} placeholder="Shift" className="rounded border px-3 py-2 text-sm" />
              <input value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="classTeacherId" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('section', '/api/admin/sections', { organizationId, schoolId, classMasterId, name: sectionForm.name, capacity: Number(sectionForm.capacity || '0'), roomNumber: sectionForm.roomNumber || undefined, shift: sectionForm.shift || undefined, classTeacherId: teacherId || undefined }, (d) => setSectionId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Section + Assign Class Teacher</button>
            <StatusBanner status={statusMap.section ?? initialStatus} />
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={skipSubjectAllocation} onChange={(e) => setSkipSubjectAllocation(e.target.checked)} />
              Skip subject allocation (optional)
            </label>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} placeholder="Subject Name" className="rounded border px-3 py-2 text-sm" />
              <input value={subjectForm.weeklyPeriods} onChange={(e) => setSubjectForm({ ...subjectForm, weeklyPeriods: e.target.value })} type="number" placeholder="Weekly Periods" className="rounded border px-3 py-2 text-sm" />
              <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} placeholder="academicYearId" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button disabled={skipSubjectAllocation} onClick={() => postStep('subjectAllocation', '/api/admin/subject-allocations', { organizationId, schoolId, academicYearId, classMasterId, sectionId: sectionId || undefined, subjectName: subjectForm.subjectName, teacherId: teacherId || undefined, weeklyPeriods: Number(subjectForm.weeklyPeriods || '0') })} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Create Subject Allocation (Optional)</button>
            <StatusBanner status={statusMap.subjectAllocation ?? initialStatus} />
          </section>
        );
      case 6:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input value={feeTypeForm.name} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })} placeholder="Fee Type Name" className="rounded border px-3 py-2 text-sm" />
              <input value={feeTypeForm.amount} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })} type="number" placeholder="Amount" className="rounded border px-3 py-2 text-sm" />
              <SearchableDropdown
                options={[
                  { value: 'ONE_TIME', label: 'ONE_TIME' },
                  { value: 'MONTHLY', label: 'MONTHLY' },
                  { value: 'QUARTERLY', label: 'QUARTERLY' },
                  { value: 'YEARLY', label: 'YEARLY' },
                ]}
                value={feeTypeForm.frequency}
                onChange={(value) => setFeeTypeForm({ ...feeTypeForm, frequency: value })}
                search={feeFrequencySearch}
                onSearchChange={setFeeFrequencySearch}
                placeholder="Select frequency"
                searchPlaceholder="Search frequency"
              />
            </div>
            <button onClick={() => postStep('feeType', '/api/admin/fee-types', { organizationId, schoolId, ...feeTypeForm, amount: Number(feeTypeForm.amount || '0') }, (d) => setFeeTypeId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Fee Type</button>
            <StatusBanner status={statusMap.feeType ?? initialStatus} />
            <div className="mt-4 grid grid-cols-1 gap-3">
              <input value={feePlanForm.name} onChange={(e) => setFeePlanForm({ ...feePlanForm, name: e.target.value })} placeholder="Fee Plan Name" className="rounded border px-3 py-2 text-sm" />
              <textarea value={feePlanForm.itemsJson} onChange={(e) => setFeePlanForm({ ...feePlanForm, itemsJson: e.target.value })} className="h-24 rounded border px-3 py-2 font-mono text-xs" />
            </div>
            <button onClick={() => postStep('feePlan', '/api/admin/fee-plans', { organizationId, schoolId, academicYearId, name: feePlanForm.name, items: (() => { try { return JSON.parse(feePlanForm.itemsJson); } catch { return []; } })() }, (d) => setFeePlanId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Fee Plan</button>
            <StatusBanner status={statusMap.feePlan ?? initialStatus} />
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={skipAssignFeePlan} onChange={(e) => setSkipAssignFeePlan(e.target.checked)} />
              Skip fee plan assignment (optional)
            </label>
            <button disabled={skipAssignFeePlan} onClick={() => postStep('assignFeePlan', '/api/admin/fee-plan-assignments', { organizationId, schoolId, academicYearId, feePlanId, classMasterId, sectionId: sectionId || undefined })} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Assign Fee Plan to Class/Section</button>
            <StatusBanner status={statusMap.assignFeePlan ?? initialStatus} />
          </section>
        );
      case 7:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Student Email" className="rounded border px-3 py-2 text-sm" />
              <input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Student Password" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} placeholder="Student First Name" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} placeholder="Student Last Name" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="Student Phone" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.parentEmail} onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} placeholder="Parent Email" className="rounded border px-3 py-2 text-sm" />
              <input type="password" value={studentForm.parentPassword} onChange={(e) => setStudentForm({ ...studentForm, parentPassword: e.target.value })} placeholder="Parent Password" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.parentFirstName} onChange={(e) => setStudentForm({ ...studentForm, parentFirstName: e.target.value })} placeholder="Parent First Name" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.parentLastName} onChange={(e) => setStudentForm({ ...studentForm, parentLastName: e.target.value })} placeholder="Parent Last Name" className="rounded border px-3 py-2 text-sm" />
              <input value={studentForm.parentPhone} onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })} placeholder="Parent Phone" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('studentWithParent', '/api/admin/users', { email: studentForm.email, password: studentForm.password, firstName: studentForm.firstName, lastName: studentForm.lastName, phone: studentForm.phone || undefined, role: UserRole.STUDENT, organizationId, schoolId, parent: { email: studentForm.parentEmail, password: studentForm.parentPassword, firstName: studentForm.parentFirstName, lastName: studentForm.parentLastName, phone: studentForm.parentPhone || undefined } }, (d) => setStudentId(extractId(d)))} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Student + Parent</button>
            <StatusBanner status={statusMap.studentWithParent ?? initialStatus} />
          </section>
        );
      case 8:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="studentId" className="rounded border px-3 py-2 text-sm" />
              <input value={feePlanId} onChange={(e) => setFeePlanId(e.target.value)} placeholder="feePlanId" className="rounded border px-3 py-2 text-sm" />
              <input value={feeTypeId} onChange={(e) => setFeeTypeId(e.target.value)} placeholder="feeTypeId (optional)" className="rounded border px-3 py-2 text-sm" />
              <input value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} type="number" placeholder="Amount" className="rounded border px-3 py-2 text-sm" />
              <input value={ledgerForm.dueDate} onChange={(e) => setLedgerForm({ ...ledgerForm, dueDate: e.target.value })} type="date" className="rounded border px-3 py-2 text-sm" />
            </div>
            <button onClick={() => postStep('studentLedger', '/api/admin/student-fee-ledger', { organizationId, schoolId, academicYearId, studentId, feePlanId: feePlanId || undefined, feeTypeId: feeTypeId || undefined, amount: Number(ledgerForm.amount || '0'), dueDate: ledgerForm.dueDate })} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create Fee Ledger Entry</button>
            <StatusBanner status={statusMap.studentLedger ?? initialStatus} />
          </section>
        );
      default:
        return (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-700">Parent can login with the credentials entered in Step 8.</p>
            <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
              <p><span className="font-medium">Parent Email:</span> {studentForm.parentEmail || 'N/A'}</p>
              <p><span className="font-medium">Login URL:</span> /auth/signin</p>
              <p><span className="font-medium">Parent Dashboard:</span> /parent/dashboard</p>
            </div>
            <div className="mt-4 rounded border border-gray-200 bg-white p-3 text-xs">
              <p className="mb-2 font-semibold text-gray-800">Final Summary</p>
              <pre className="overflow-x-auto text-gray-700">{JSON.stringify({
                organizationId,
                schoolId,
                academicYearId,
                classMasterId,
                sectionId,
                teacherId,
                feeTypeId,
                feePlanId,
                studentId,
                parentEmail: studentForm.parentEmail,
              }, null, 2)}</pre>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  const payload = {
                    organizationId,
                    schoolId,
                    academicYearId,
                    classMasterId,
                    sectionId,
                    teacherId,
                    feeTypeId,
                    feePlanId,
                    studentId,
                    parentEmail: studentForm.parentEmail,
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'onboarding-summary.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
              >
                Export Summary JSON
              </button>
              <button
                onClick={() => localStorage.removeItem(DRAFT_KEY)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Saved Draft
              </button>
            </div>
          </section>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">End-to-End Onboarding Wizard</h1>
          <p className="mt-2 text-sm text-gray-600">Use Next/Back to complete each step in sequence.</p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Tenant Selectors</h2>
          <p className="mt-1 text-xs text-gray-600">Select organization and school once. IDs are auto-used in all steps.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchableDropdown
              options={organizationOptions}
              value={organizationId}
              onChange={setOrganizationId}
              search={organizationSearch}
              onSearchChange={setOrganizationSearch}
              placeholder="Select organization"
              searchPlaceholder="Search organization by name or ID"
            />

            <SearchableDropdown
              options={schoolOptions}
              value={schoolId}
              onChange={setSchoolId}
              search={schoolSearch}
              onSearchChange={setSchoolSearch}
              placeholder={organizationId ? 'Select school' : 'Select organization first'}
              searchPlaceholder="Search school by name or ID"
              disabled={!organizationId}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentOrganizationId && <Badge variant="green">Recent Org: {recentOrganizationId}</Badge>}
            {recentSchoolId && <Badge variant="green">Recent School: {recentSchoolId}</Badge>}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => loadOrganizations()} className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Refresh Organizations</button>
            <button onClick={() => loadSchools(organizationId)} disabled={!organizationId} className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Refresh Schools</button>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {stepMeta.map((step, idx) => {
              const active = idx === currentStep;
              const done = completion[idx];
              const locked = idx > maxUnlockedStep;
              return (
                <button
                  key={step.title}
                  disabled={locked}
                  onClick={() => setCurrentStep(idx)}
                  className={`rounded border px-2 py-2 text-left text-xs ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : done
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : locked
                      ? 'border-gray-200 bg-gray-50 text-gray-400'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <div className="font-semibold">{idx + 1}. {step.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xl font-semibold text-gray-900">{stepMeta[currentStep].title}</h2>
          <p className="mt-1 text-sm text-gray-600">{stepMeta[currentStep].description}</p>
        </div>

        {stepContent()}

        <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Back
          </button>
          <div className="text-xs text-gray-500">Step {currentStep + 1} of {stepMeta.length}</div>
          <button
            onClick={() => setCurrentStep((s) => Math.min(stepMeta.length - 1, s + 1))}
            disabled={currentStep === stepMeta.length - 1 || !completion[currentStep]}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
