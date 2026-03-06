import { UserRole } from '@/domains/user-management/domain/entities/User';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { StatusBanner } from './StatusBanner';
import { StepStatus } from './types';

type FieldErrors = Record<string, string>;

const baseInputClass =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2';

function inputClass(message?: string) {
  return `${baseInputClass} ${
    message
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-100'
  }`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function NoAccessStep() {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <p className="text-sm font-semibold text-rose-700">
        You do not have permission to access this onboarding step.
      </p>
    </section>
  );
}

export function BootstrapStep({
  onCheckBootstrap,
  status,
}: {
  onCheckBootstrap: () => void;
  status: StepStatus;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <button onClick={onCheckBootstrap} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Check Bootstrap Status</button>
      <a href="/auth/superadmin-bootstrap" className="ml-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Open Bootstrap Page</a>
      <StatusBanner status={status} />
    </section>
  );
}

export function OrganizationStep({
  orgForm,
  setOrgForm,
  onCreate,
  status,
  errors,
}: {
  orgForm: {
    organizationName: string;
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
  };
  setOrgForm: (value: {
    organizationName: string;
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
  }) => void;
  onCreate: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input value={orgForm.organizationName} onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })} placeholder="Organization Name" className={inputClass(errors?.organizationName)} />
          <FieldError message={errors?.organizationName} />
        </div>
        <div>
          <input value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })} placeholder="Type" className={inputClass(errors?.type)} />
          <FieldError message={errors?.type} />
        </div>
        <input value={orgForm.street} onChange={(e) => setOrgForm({ ...orgForm, street: e.target.value })} placeholder="Street" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} placeholder="City" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} placeholder="State" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={orgForm.zipCode} onChange={(e) => setOrgForm({ ...orgForm, zipCode: e.target.value })} placeholder="Zip Code" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={orgForm.country} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} placeholder="Country" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <div>
          <input value={orgForm.contactEmail} onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })} placeholder="Contact Email" className={inputClass(errors?.contactEmail)} />
          <FieldError message={errors?.contactEmail} />
        </div>
        <input value={orgForm.contactPhone} onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
      </div>
      <button onClick={onCreate} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Organization</button>
      <StatusBanner status={status} />
    </section>
  );
}

export function CoachingCenterStep({
  schoolForm,
  setSchoolForm,
  organizationId,
  onCreate,
  status,
  errors,
}: {
  schoolForm: {
    schoolName: string;
    schoolCode: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
  };
  setSchoolForm: (value: {
    schoolName: string;
    schoolCode: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
  }) => void;
  organizationId: string;
  onCreate: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="mb-3 text-sm text-gray-600">organizationId: <span className="font-medium">{organizationId || 'Not set'}</span></div>
      <FieldError message={errors?.organizationId} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input value={schoolForm.schoolName} onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })} placeholder="Coaching Center Name" className={inputClass(errors?.schoolName)} />
          <FieldError message={errors?.schoolName} />
        </div>
        <div>
          <input value={schoolForm.schoolCode} onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })} placeholder="Coaching Center Code" className={inputClass(errors?.schoolCode)} />
          <FieldError message={errors?.schoolCode} />
        </div>
        <input value={schoolForm.street} onChange={(e) => setSchoolForm({ ...schoolForm, street: e.target.value })} placeholder="Street" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.city} onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })} placeholder="City" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.state} onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })} placeholder="State" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.zipCode} onChange={(e) => setSchoolForm({ ...schoolForm, zipCode: e.target.value })} placeholder="Zip Code" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.country} onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })} placeholder="Country" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.contactEmail} onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })} placeholder="Contact Email" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={schoolForm.contactPhone} onChange={(e) => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
      </div>
      <button onClick={onCreate} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Coaching Center</button>
      <StatusBanner status={status} />
    </section>
  );
}

export function AdminUserStep({
  adminForm,
  setAdminForm,
  adminRoleSearch,
  setAdminRoleSearch,
  onCreate,
  status,
  errors,
}: {
  adminForm: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
  };
  setAdminForm: (value: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
  }) => void;
  adminRoleSearch: string;
  setAdminRoleSearch: (value: string) => void;
  onCreate: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <FieldError message={errors?.tenant} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Email" className={inputClass(errors?.email)} />
          <FieldError message={errors?.email} />
        </div>
        <div>
          <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Password" className={inputClass(errors?.password)} />
          <FieldError message={errors?.password} />
        </div>
        <div>
          <input value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} placeholder="First Name" className={inputClass(errors?.firstName)} />
          <FieldError message={errors?.firstName} />
        </div>
        <div>
          <input value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} placeholder="Last Name" className={inputClass(errors?.lastName)} />
          <FieldError message={errors?.lastName} />
        </div>
        <input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <SearchableDropdown
          options={[
            { value: UserRole.ORGANIZATION_ADMIN, label: 'ORGANIZATION_ADMIN' },
            { value: UserRole.COACHING_ADMIN, label: 'COACHING_ADMIN' },
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
      <button onClick={onCreate} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Admin User</button>
      <StatusBanner status={status} />
    </section>
  ); 
}

export function AcademicSetupStep({
  organizationId,
  schoolId,
  academicYearId,
  classMasterId,
  setAcademicYearId,
  setClassMasterId,
  yearForm,
  setYearForm,
  classForm,
  setClassForm,
  classLevelOptions,
  classLevelSearch,
  setClassLevelSearch,
  academicYearSearch,
  setAcademicYearSearch,
  classMasterSearch,
  setClassMasterSearch,
  tenantAcademicYearOptions,
  tenantClassMasterOptions,
  onRefreshAcademicYears,
  onRefreshClasses,
  onCreateAcademicYear,
  onCreateClassMaster,
  statusAcademicYear,
  statusClassMaster,
  inferClassLevelFromName,
  errors,
}: {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  classMasterId: string;
  setAcademicYearId: (value: string) => void;
  setClassMasterId: (value: string) => void;
  yearForm: { name: string; startDate: string; endDate: string };
  setYearForm: (value: { name: string; startDate: string; endDate: string }) => void;
  classForm: { name: string; level: string };
  setClassForm: (value: { name: string; level: string }) => void;
  classLevelOptions: Array<{ value: string; label: string }>;
  classLevelSearch: string;
  setClassLevelSearch: (value: string) => void;
  academicYearSearch: string;
  setAcademicYearSearch: (value: string) => void;
  classMasterSearch: string;
  setClassMasterSearch: (value: string) => void;
  tenantAcademicYearOptions: Array<{ value: string; label: string }>;
  tenantClassMasterOptions: Array<{ value: string; label: string }>;
  onRefreshAcademicYears: () => void;
  onRefreshClasses: () => void;
  onCreateAcademicYear: () => void;
  onCreateClassMaster: () => void;
  statusAcademicYear: StepStatus;
  statusClassMaster: StepStatus;
  inferClassLevelFromName: (className: string) => string | undefined;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-semibold text-gray-800">Use Existing (Optional)</p>
        <p className="mt-1 text-xs text-gray-600">Select existing academic year/class master if already created.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <SearchableDropdown
            options={tenantAcademicYearOptions}
            value={academicYearId}
            onChange={setAcademicYearId}
            search={academicYearSearch}
            onSearchChange={setAcademicYearSearch}
            placeholder="Select academic year"
            searchPlaceholder="Search academic year by name or ID"
            disabled={!organizationId || !schoolId}
          />
          <SearchableDropdown
            options={tenantClassMasterOptions}
            value={classMasterId}
            onChange={setClassMasterId}
            search={classMasterSearch}
            onSearchChange={setClassMasterSearch}
            placeholder="Select class master"
            searchPlaceholder="Search class by name, level or ID"
            disabled={!organizationId || !schoolId}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onRefreshAcademicYears} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Academic Years</button>
          <button onClick={onRefreshClasses} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Classes</button>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-gray-800">Or Create New</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <input value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="Academic Year Name" className={inputClass(errors?.yearName)} />
          <FieldError message={errors?.yearName} />
        </div>
        <div>
          <input type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className={inputClass(errors?.yearStartDate)} />
          <FieldError message={errors?.yearStartDate} />
        </div>
        <div>
          <input type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className={inputClass(errors?.yearEndDate)} />
          <FieldError message={errors?.yearEndDate} />
        </div>
      </div>
      <button onClick={onCreateAcademicYear} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Academic Year</button>
      <StatusBanner status={statusAcademicYear} />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input
          value={classForm.name}
          onChange={(e) => {
            const name = e.target.value;
            const inferredLevel = inferClassLevelFromName(name);
            setClassForm({
              ...classForm,
              name,
              level: inferredLevel ?? classForm.level,
            });
          }}
          placeholder="Class Name (example: 1, 6, 9, 11)"
          className={inputClass(errors?.className)}
        />
          <FieldError message={errors?.className} />
        </div>
        <SearchableDropdown
          options={classLevelOptions}
          value={classForm.level}
          onChange={(value) => setClassForm({ ...classForm, level: value })}
          search={classLevelSearch}
          onSearchChange={setClassLevelSearch}
          placeholder="Select class level"
          searchPlaceholder="Search class level"
        />
        <FieldError message={errors?.classLevel} />
      </div>
      <button onClick={onCreateClassMaster} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Class Master</button>
      <StatusBanner status={statusClassMaster} />
    </section>
  );
}

export function TeacherClassTeacherStep({
  organizationId,
  schoolId,
  teacherForm,
  setTeacherForm,
  classMasterId,
  setClassMasterId,
  classMasterSearch,
  setClassMasterSearch,
  sectionForm,
  setSectionForm,
  teacherId,
  setTeacherId,
  teacherSearch,
  setTeacherSearch,
  skipSubjectAllocation,
  setSkipSubjectAllocation,
  subjectForm,
  setSubjectForm,
  academicYearId,
  setAcademicYearId,
  academicYearSearch,
  setAcademicYearSearch,
  tenantClassMasterOptions,
  tenantTeacherOptions,
  tenantAcademicYearOptions,
  onRefreshClasses,
  onRefreshTeachers,
  onCreateTeacher,
  onCreateSectionAssignTeacher,
  onCreateSubjectAllocation,
  statusTeacherUser,
  statusSection,
  statusSubjectAllocation,
  errors,
}: {
  organizationId: string;
  schoolId: string;
  teacherForm: { email: string; password: string; firstName: string; lastName: string; phone: string };
  setTeacherForm: (value: { email: string; password: string; firstName: string; lastName: string; phone: string }) => void;
  classMasterId: string;
  setClassMasterId: (value: string) => void;
  classMasterSearch: string;
  setClassMasterSearch: (value: string) => void;
  sectionForm: { name: string; capacity: string; roomNumber: string; shift: string };
  setSectionForm: (value: { name: string; capacity: string; roomNumber: string; shift: string }) => void;
  teacherId: string;
  setTeacherId: (value: string) => void;
  teacherSearch: string;
  setTeacherSearch: (value: string) => void;
  skipSubjectAllocation: boolean;
  setSkipSubjectAllocation: (value: boolean) => void;
  subjectForm: { subjectName: string; weeklyPeriods: string };
  setSubjectForm: (value: { subjectName: string; weeklyPeriods: string }) => void;
  academicYearId: string;
  setAcademicYearId: (value: string) => void;
  academicYearSearch: string;
  setAcademicYearSearch: (value: string) => void;
  tenantClassMasterOptions: Array<{ value: string; label: string }>;
  tenantTeacherOptions: Array<{ value: string; label: string }>;
  tenantAcademicYearOptions: Array<{ value: string; label: string }>;
  onRefreshClasses: () => void;
  onRefreshTeachers: () => void;
  onCreateTeacher: () => void;
  onCreateSectionAssignTeacher: () => void;
  onCreateSubjectAllocation: () => void;
  statusTeacherUser: StepStatus;
  statusSection: StepStatus;
  statusSubjectAllocation: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="Teacher Email" className={inputClass(errors?.teacherEmail)} />
          <FieldError message={errors?.teacherEmail} />
        </div>
        <div>
          <input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Teacher Password" className={inputClass(errors?.teacherPassword)} />
          <FieldError message={errors?.teacherPassword} />
        </div>
        <div>
          <input value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} placeholder="Teacher First Name" className={inputClass(errors?.teacherFirstName)} />
          <FieldError message={errors?.teacherFirstName} />
        </div>
        <div>
          <input value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} placeholder="Teacher Last Name" className={inputClass(errors?.teacherLastName)} />
          <FieldError message={errors?.teacherLastName} />
        </div>
        <input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} placeholder="Teacher Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
      </div>
      <button onClick={onCreateTeacher} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Teacher</button>
      <StatusBanner status={statusTeacherUser} />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SearchableDropdown
          options={tenantClassMasterOptions}
          value={classMasterId}
          onChange={setClassMasterId}
          search={classMasterSearch}
          onSearchChange={setClassMasterSearch}
          placeholder="Select class"
          searchPlaceholder="Search class by name, level or ID"
          disabled={!organizationId || !schoolId}
        />
        <FieldError message={errors?.classMasterId} />
        <div>
          <input value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Section Name" className={inputClass(errors?.sectionName)} />
          <FieldError message={errors?.sectionName} />
        </div>
        <input value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })} type="number" placeholder="Capacity" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={sectionForm.roomNumber} onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })} placeholder="Room Number" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <input value={sectionForm.shift} onChange={(e) => setSectionForm({ ...sectionForm, shift: e.target.value })} placeholder="Shift" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <SearchableDropdown
          options={tenantTeacherOptions}
          value={teacherId}
          onChange={setTeacherId}
          search={teacherSearch}
          onSearchChange={setTeacherSearch}
          placeholder="Select class teacher"
          searchPlaceholder="Search teacher by name, email or ID"
          disabled={!organizationId || !schoolId}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onRefreshClasses} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Classes</button>
        <button onClick={onRefreshTeachers} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Teachers</button>
      </div>
      <button onClick={onCreateSectionAssignTeacher} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Section + Assign Class Teacher</button>
      <StatusBanner status={statusSection} />
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={skipSubjectAllocation} onChange={(e) => setSkipSubjectAllocation(e.target.checked)} />
        Skip subject allocation (optional)
      </label>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} placeholder="Subject Name" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <FieldError message={errors?.subjectName} />
        <input value={subjectForm.weeklyPeriods} onChange={(e) => setSubjectForm({ ...subjectForm, weeklyPeriods: e.target.value })} type="number" placeholder="Weekly Periods" className={inputClass(errors?.weeklyPeriods)} />
        <FieldError message={errors?.weeklyPeriods} />
        <SearchableDropdown
          options={tenantAcademicYearOptions}
          value={academicYearId}
          onChange={setAcademicYearId}
          search={academicYearSearch}
          onSearchChange={setAcademicYearSearch}
          placeholder="Select academic year"
          searchPlaceholder="Search academic year by name or ID"
          disabled={!organizationId || !schoolId}
        />
        <FieldError message={errors?.academicYearId} />
      </div>
      <button disabled={skipSubjectAllocation} onClick={onCreateSubjectAllocation} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50">Create Subject Allocation (Optional)</button>
      <StatusBanner status={statusSubjectAllocation} />
    </section>
  );
}

export function FeesSetupStep({
  feeTypeForm,
  setFeeTypeForm,
  feeFrequencySearch,
  setFeeFrequencySearch,
  onCreateFeeType,
  statusFeeType,
  feePlanForm,
  setFeePlanForm,
  onCreateFeePlan,
  statusFeePlan,
  skipAssignFeePlan,
  setSkipAssignFeePlan,
  onAssignFeePlan,
  statusAssignFeePlan,
  errors,
}: {
  feeTypeForm: { name: string; amount: string; frequency: string; isMandatory: boolean; isTaxable: boolean };
  setFeeTypeForm: (value: { name: string; amount: string; frequency: string; isMandatory: boolean; isTaxable: boolean }) => void;
  feeFrequencySearch: string;
  setFeeFrequencySearch: (value: string) => void;
  onCreateFeeType: () => void;
  statusFeeType: StepStatus;
  feePlanForm: { name: string; itemsJson: string };
  setFeePlanForm: (value: { name: string; itemsJson: string }) => void;
  onCreateFeePlan: () => void;
  statusFeePlan: StepStatus;
  skipAssignFeePlan: boolean;
  setSkipAssignFeePlan: (value: boolean) => void;
  onAssignFeePlan: () => void;
  statusAssignFeePlan: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <input value={feeTypeForm.name} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })} placeholder="Fee Type Name" className={inputClass(errors?.feeTypeName)} />
          <FieldError message={errors?.feeTypeName} />
        </div>
        <div>
          <input value={feeTypeForm.amount} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })} type="number" placeholder="Amount" className={inputClass(errors?.feeTypeAmount)} />
          <FieldError message={errors?.feeTypeAmount} />
        </div>
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
        <FieldError message={errors?.feeTypeFrequency} />
      </div>
      <button onClick={onCreateFeeType} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Fee Type</button>
      <StatusBanner status={statusFeeType} />
      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <input value={feePlanForm.name} onChange={(e) => setFeePlanForm({ ...feePlanForm, name: e.target.value })} placeholder="Fee Plan Name" className={inputClass(errors?.feePlanName)} />
          <FieldError message={errors?.feePlanName} />
        </div>
        <div>
          <textarea value={feePlanForm.itemsJson} onChange={(e) => setFeePlanForm({ ...feePlanForm, itemsJson: e.target.value })} className={`h-24 ${inputClass(errors?.feePlanItemsJson)}`} />
          <FieldError message={errors?.feePlanItemsJson} />
        </div>
      </div>
      <button onClick={onCreateFeePlan} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Fee Plan</button>
      <StatusBanner status={statusFeePlan} />
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={skipAssignFeePlan} onChange={(e) => setSkipAssignFeePlan(e.target.checked)} />
        Skip fee plan assignment (optional)
      </label>
      <button disabled={skipAssignFeePlan} onClick={onAssignFeePlan} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50">Assign Fee Plan to Class/Section</button>
      <StatusBanner status={statusAssignFeePlan} />
    </section>
  );
}

export function StudentLedgerStep({
  organizationId,
  schoolId,
  tenantStudentOptions,
  studentId,
  setStudentId,
  studentSearch,
  setStudentSearch,
  tenantFeePlanOptions,
  feePlanId,
  setFeePlanId,
  feePlanSearch,
  setFeePlanSearch,
  tenantFeeTypeOptions,
  feeTypeId,
  setFeeTypeId,
  feeTypeSearch,
  setFeeTypeSearch,
  ledgerForm,
  setLedgerForm,
  onRefreshStudents,
  onRefreshFeePlans,
  onRefreshFeeTypes,
  onCreateLedger,
  status,
  errors,
}: {
  organizationId: string;
  schoolId: string;
  tenantStudentOptions: Array<{ value: string; label: string }>;
  studentId: string;
  setStudentId: (value: string) => void;
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  tenantFeePlanOptions: Array<{ value: string; label: string }>;
  feePlanId: string;
  setFeePlanId: (value: string) => void;
  feePlanSearch: string;
  setFeePlanSearch: (value: string) => void;
  tenantFeeTypeOptions: Array<{ value: string; label: string }>;
  feeTypeId: string;
  setFeeTypeId: (value: string) => void;
  feeTypeSearch: string;
  setFeeTypeSearch: (value: string) => void;
  ledgerForm: { amount: string; dueDate: string };
  setLedgerForm: (value: { amount: string; dueDate: string }) => void;
  onRefreshStudents: () => void;
  onRefreshFeePlans: () => void;
  onRefreshFeeTypes: () => void;
  onCreateLedger: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <FieldError message={errors?.academicYearId} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SearchableDropdown
          options={tenantStudentOptions}
          value={studentId}
          onChange={setStudentId}
          search={studentSearch}
          onSearchChange={setStudentSearch}
          placeholder="Select student"
          searchPlaceholder="Search student by name, email or ID"
          disabled={!organizationId || !schoolId}
        />
        <FieldError message={errors?.studentId} />
        <SearchableDropdown
          options={tenantFeePlanOptions}
          value={feePlanId}
          onChange={setFeePlanId}
          search={feePlanSearch}
          onSearchChange={setFeePlanSearch}
          placeholder="Select fee plan"
          searchPlaceholder="Search fee plan by name or ID"
          disabled={!organizationId || !schoolId}
        />
        <SearchableDropdown
          options={tenantFeeTypeOptions}
          value={feeTypeId}
          onChange={setFeeTypeId}
          search={feeTypeSearch}
          onSearchChange={setFeeTypeSearch}
          placeholder="Select fee type (optional)"
          searchPlaceholder="Search fee type by name or ID"
          disabled={!organizationId || !schoolId}
        />
        <div>
          <input value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} type="number" placeholder="Amount" className={inputClass(errors?.ledgerAmount)} />
          <FieldError message={errors?.ledgerAmount} />
        </div>
        <div>
          <input value={ledgerForm.dueDate} onChange={(e) => setLedgerForm({ ...ledgerForm, dueDate: e.target.value })} type="date" className={inputClass(errors?.ledgerDueDate)} />
          <FieldError message={errors?.ledgerDueDate} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onRefreshStudents} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Students</button>
        <button onClick={onRefreshFeePlans} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Fee Plans</button>
        <button onClick={onRefreshFeeTypes} disabled={!organizationId || !schoolId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Refresh Fee Types</button>
      </div>
      <button onClick={onCreateLedger} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Fee Ledger Entry</button>
      <StatusBanner status={status} />
    </section>
  );
}

export function StudentParentStep({
  studentForm,
  setStudentForm,
  onCreate,
  status,
  errors,
}: {
  studentForm: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    parentEmail: string;
    parentPassword: string;
    parentFirstName: string;
    parentLastName: string;
    parentPhone: string;
  };
  setStudentForm: (value: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    parentEmail: string;
    parentPassword: string;
    parentFirstName: string;
    parentLastName: string;
    parentPhone: string;
  }) => void;
  onCreate: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <p className="mb-3 text-xs text-gray-600">
        Parent email is required. If parent already exists (sibling case), leave parent password/name blank.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Student Email" className={inputClass(errors?.studentEmail)} />
          <FieldError message={errors?.studentEmail} />
        </div>
        <div>
          <input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Student Password" className={inputClass(errors?.studentPassword)} />
          <FieldError message={errors?.studentPassword} />
        </div>
        <div>
          <input value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} placeholder="Student First Name" className={inputClass(errors?.studentFirstName)} />
          <FieldError message={errors?.studentFirstName} />
        </div>
        <div>
          <input value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} placeholder="Student Last Name" className={inputClass(errors?.studentLastName)} />
          <FieldError message={errors?.studentLastName} />
        </div>
        <input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="Student Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <div>
          <input value={studentForm.parentEmail} onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} placeholder="Parent Email" className={inputClass(errors?.parentEmail)} />
          <FieldError message={errors?.parentEmail} />
        </div>
        <div>
          <input type="password" value={studentForm.parentPassword} onChange={(e) => setStudentForm({ ...studentForm, parentPassword: e.target.value })} placeholder="Parent Password" className={inputClass(errors?.parentPassword)} />
          <FieldError message={errors?.parentPassword} />
        </div>
        <div>
          <input value={studentForm.parentFirstName} onChange={(e) => setStudentForm({ ...studentForm, parentFirstName: e.target.value })} placeholder="Parent First Name" className={inputClass(errors?.parentFirstName)} />
          <FieldError message={errors?.parentFirstName} />
        </div>
        <div>
          <input value={studentForm.parentLastName} onChange={(e) => setStudentForm({ ...studentForm, parentLastName: e.target.value })} placeholder="Parent Last Name" className={inputClass(errors?.parentLastName)} />
          <FieldError message={errors?.parentLastName} />
        </div>
        <input value={studentForm.parentPhone} onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })} placeholder="Parent Phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
      </div>
      <button onClick={onCreate} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Create Student + Link Parent</button>
      <StatusBanner status={status} />
    </section>
  );
}

export function ParentHandoverStep({
  summary,
  parentEmail,
  onExportSummary,
  onClearDraft,
}: {
  summary: {
    organizationId: string;
    schoolId: string;
    academicYearId: string;
    classMasterId: string;
    sectionId: string;
    teacherId: string;
    feeTypeId: string;
    feePlanId: string;
    studentId: string;
    parentEmail: string;
  };
  parentEmail: string;
  onExportSummary: () => void;
  onClearDraft: () => void;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <p className="text-sm text-gray-700">If parent already existed, use existing credentials. Otherwise use the credentials entered in Step 8.</p>
      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
        <p><span className="font-medium">Parent Email:</span> {parentEmail || 'N/A'}</p>
        <p><span className="font-medium">Login URL:</span> /auth/signin</p>
        <p><span className="font-medium">Parent Dashboard:</span> /parent/dashboard</p>
      </div>
      <div className="mt-4 rounded-md border border-gray-200 bg-white p-3 text-xs">
        <p className="mb-2 font-semibold text-gray-800">Final Summary</p>
        <pre className="overflow-x-auto text-gray-700">{JSON.stringify(summary, null, 2)}</pre>
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={onExportSummary} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Export Summary JSON</button>
        <button onClick={onClearDraft} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Clear Saved Draft</button>
      </div>
    </section>
  );
}
