import { UserRole } from '@/domains/user-management/domain/entities/User';
import { MultiSelect } from '@/components/multi-select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBanner } from './StatusBanner';
import { StepStatus } from './types';
import { FeesSetupForm } from '@/shared/components/forms';

type FieldErrors = Record<string, string>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function NoAccessStep() {
  return (
    <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-rose-100 p-2">
            <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-700">
              You do not have permission to access this onboarding step.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Bootstrap Check</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Verify system bootstrap status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button onClick={onCheckBootstrap} className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg">
            Check Bootstrap Status
          </Button>
          <Button variant="outline" className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 transition-all duration-200" asChild>
            <a href="/auth/superadmin-bootstrap">Open Bootstrap Page</a>
          </Button>
        </div>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
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
  const isLoading = status.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Create Organization</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Set up a new organization in the system</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
            <Input value={orgForm.organizationName} onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })} placeholder="Organization Name" className={`transition-all duration-200 ${errors?.organizationName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`} />
            <FieldError message={errors?.organizationName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <Input value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })} placeholder="Type" className={`transition-all duration-200 ${errors?.type ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`} />
            <FieldError message={errors?.type} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Street</Label>
            <Input value={orgForm.street} onChange={(e) => setOrgForm({ ...orgForm, street: e.target.value })} placeholder="Street" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">City</Label>
            <Input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} placeholder="City" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">State</Label>
            <Input value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} placeholder="State" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Zip Code</Label>
            <Input value={orgForm.zipCode} onChange={(e) => setOrgForm({ ...orgForm, zipCode: e.target.value })} placeholder="Zip Code" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Country</Label>
            <Input value={orgForm.country} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} placeholder="Country" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Email</Label>
            <Input value={orgForm.contactEmail} onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })} placeholder="Contact Email" className={`transition-all duration-200 ${errors?.contactEmail ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`} />
            <FieldError message={errors?.contactEmail} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
            <Input value={orgForm.contactPhone} onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100" />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onCreate} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Organization"}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
  );
}

export function CoachingCenterStep({
  coachingCenterForm,
  setCoachingCenterForm,
  organizationId,
  onCreate,
  status,
  errors,
}: {
  coachingCenterForm: {
    coachingCenterName: string;
    coachingCenterCode: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
  };
  setCoachingCenterForm: (value: {
    coachingCenterName: string;
    coachingCenterCode: string;
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
  const isLoading = status.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Create Coaching Center</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Add a new coaching center under the organization</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <span className="font-medium text-gray-700">Organization ID:</span> <span className="text-gray-600">{organizationId || 'Not set'}</span>
        </div>
        <FieldError message={errors?.organizationId} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Coaching Center Name</Label>
            <Input value={coachingCenterForm.coachingCenterName} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, coachingCenterName: e.target.value })} placeholder="Coaching Center Name" className={`transition-all duration-200 ${errors?.coachingCenterName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-emerald-500 focus:ring-emerald-100'}`} />
            <FieldError message={errors?.coachingCenterName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Coaching Center Code</Label>
            <Input value={coachingCenterForm.coachingCenterCode} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, coachingCenterCode: e.target.value })} placeholder="Coaching Center Code" className={`transition-all duration-200 ${errors?.coachingCenterCode ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-emerald-500 focus:ring-emerald-100'}`} />
            <FieldError message={errors?.coachingCenterCode} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Street</Label>
            <Input value={coachingCenterForm.street} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, street: e.target.value })} placeholder="Street" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">City</Label>
            <Input value={coachingCenterForm.city} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, city: e.target.value })} placeholder="City" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">State</Label>
            <Input value={coachingCenterForm.state} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, state: e.target.value })} placeholder="State" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Zip Code</Label>
            <Input value={coachingCenterForm.zipCode} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, zipCode: e.target.value })} placeholder="Zip Code" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Country</Label>
            <Input value={coachingCenterForm.country} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, country: e.target.value })} placeholder="Country" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Email</Label>
            <Input value={coachingCenterForm.contactEmail} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, contactEmail: e.target.value })} placeholder="Contact Email" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
            <Input value={coachingCenterForm.contactPhone} onChange={(e) => setCoachingCenterForm({ ...coachingCenterForm, contactPhone: e.target.value })} placeholder="Contact Phone" className="transition-all duration-200 focus:border-emerald-500 focus:ring-emerald-100" />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onCreate} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Coaching Center"}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
  );
}

export function AdminUserStep({
  adminForm,
  setAdminForm,
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
  onCreate: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  const isLoading = status.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Create Admin User</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Set up an administrator account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FieldError message={errors?.tenant} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <Input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Email" className={`transition-all duration-200 ${errors?.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-purple-500 focus:ring-purple-100'}`} />
            <FieldError message={errors?.email} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Password" className={`transition-all duration-200 ${errors?.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-purple-500 focus:ring-purple-100'}`} />
            <FieldError message={errors?.password} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">First Name</Label>
            <Input value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} placeholder="First Name" className={`transition-all duration-200 ${errors?.firstName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-purple-500 focus:ring-purple-100'}`} />
            <FieldError message={errors?.firstName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Last Name</Label>
            <Input value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} placeholder="Last Name" className={`transition-all duration-200 ${errors?.lastName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-purple-500 focus:ring-purple-100'}`} />
            <FieldError message={errors?.lastName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Phone</Label>
            <Input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="Phone" className="transition-all duration-200 focus:border-purple-500 focus:ring-purple-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Role</Label>
            <MultiSelect
              options={[
                { value: UserRole.ORGANIZATION_ADMIN, label: 'ORGANIZATION_ADMIN' },
                { value: UserRole.COACHING_ADMIN, label: 'COACHING_ADMIN' },
                { value: UserRole.ADMIN, label: 'ADMIN' },
              ]}
              value={[adminForm.role]}
              onValueChange={(values) => setAdminForm({ ...adminForm, role: values[0] as UserRole })}
              singleSelect={true}
              placeholder="Select admin role"
            />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onCreate} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Admin User"}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
  );
}

export function AcademicSetupStep({
  organizationId,
  coachingCenterId,
  academicYearId,
  setAcademicYearId,
  classMasterId,
  setClassMasterId,
  yearForm,
  setYearForm,
  classForm,
  setClassForm,
  classLevelOptions,
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
  coachingCenterId: string;
  academicYearId: string;
  setAcademicYearId: (value: string) => void;
  classMasterId: string;
  setClassMasterId: (value: string) => void;
  yearForm: { name: string; startDate: string; endDate: string };
  setYearForm: (value: { name: string; startDate: string; endDate: string }) => void;
  classForm: { name: string; level: string };
  setClassForm: (value: { name: string; level: string }) => void;
  classLevelOptions: Array<{ value: string; label: string }>;
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
  const isLoadingYear = statusAcademicYear.type === 'loading';
  const isLoadingClass = statusClassMaster.type === 'loading';
  return (
    <div className="space-y-6">
      {/* Academic Year Section */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2">
              <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Academic Year</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">Create academic years for your coaching center</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Use Existing (Optional)</p>
            <p className="mt-1 text-xs text-gray-600">Select existing academic year if already created.</p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <MultiSelect
                options={tenantAcademicYearOptions}
                value={[academicYearId]}
                onValueChange={(values) => setAcademicYearId(values[0] || '')}
                singleSelect={true}
                placeholder="Select academic year"
                disabled={!organizationId || !coachingCenterId}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefreshAcademicYears} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Academic Years</Button>
            </div>
          </div>

          <p className="mb-3 text-sm font-semibold text-gray-800">Or Create New</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Academic Year Name</Label>
              <Input value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="Academic Year Name" className={`transition-all duration-200 ${errors?.yearName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`} />
              <FieldError message={errors?.yearName} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Start Date</Label>
              <Input type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className={`transition-all duration-200 ${errors?.yearStartDate ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`} />
              <FieldError message={errors?.yearStartDate} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">End Date</Label>
              <Input type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className={`transition-all duration-200 ${errors?.yearEndDate ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`} />
              <FieldError message={errors?.yearEndDate} />
            </div>
          </div>
          <Button disabled={isLoadingYear} onClick={onCreateAcademicYear} className="mt-4 w-full bg-sky-600 hover:bg-sky-700 transition-all duration-200 shadow-md hover:shadow-lg">
            {isLoadingYear ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : "Create Academic Year"}
          </Button>
          <StatusBanner status={statusAcademicYear} />
        </CardContent>
      </Card>

      {/* Class/Program Section */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Class/Program</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">Create classes or programs for your coaching center</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Use Existing (Optional)</p>
            <p className="mt-1 text-xs text-gray-600">Select existing class/program if already created.</p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <MultiSelect
                options={tenantClassMasterOptions}
                value={[classMasterId]}
                onValueChange={(values) => setClassMasterId(values[0] || '')}
                singleSelect={true}
                placeholder="Select class/program"
                disabled={!organizationId || !coachingCenterId}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefreshClasses} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Classes</Button>
            </div>
          </div>

          <p className="mb-3 text-sm font-semibold text-gray-800">Or Create New</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Class/Program Name</Label>
              <Input 
                value={classForm.name} 
                onChange={(e) => {
                  const newName = e.target.value;
                  setClassForm({ 
                    ...classForm, 
                    name: newName,
                    level: inferClassLevelFromName(newName) || classForm.level
                  });
                }} 
                placeholder="e.g., Class 10, JEE Foundation" 
                className={`transition-all duration-200 ${errors?.className ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-emerald-500 focus:ring-emerald-100'}`} 
              />
              <FieldError message={errors?.className} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Level</Label>
              <MultiSelect
                options={classLevelOptions}
                value={[classForm.level]}
                onValueChange={(values) => setClassForm({ ...classForm, level: values[0] || '' })}
                singleSelect={true}
                placeholder="Select level"
                className={errors?.classLevel ? 'border-rose-300' : ''}
              />
              <FieldError message={errors?.classLevel} />
            </div>
          </div>
          <Button disabled={isLoadingClass} onClick={onCreateClassMaster} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
            {isLoadingClass ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : "Create Class/Program"}
          </Button>
          <StatusBanner status={statusClassMaster} />
        </CardContent>
      </Card>
    </div>
  );
}

export function TeacherClassTeacherStep({
  organizationId,
  coachingCenterId,
  teacherForm,
  setTeacherForm,
  programId,
  setProgramId,
  tenantProgramOptions,
  onRefreshPrograms,
  onRefreshTeachers,
  onCreateTeacher,
  statusTeacherUser,
  errors,
}: {
  organizationId: string;
  coachingCenterId: string;
  teacherForm: { email: string; password: string; firstName: string; lastName: string; phone: string };
  setTeacherForm: (value: { email: string; password: string; firstName: string; lastName: string; phone: string }) => void;
  programId: string;
  setProgramId: (value: string) => void;
  tenantProgramOptions: Array<{ value: string; label: string }>;
  onRefreshPrograms: () => void;
  onRefreshTeachers: () => void;
  onCreateTeacher: () => void;
  statusTeacherUser: StepStatus;
  errors?: FieldErrors;
}) {
  const isLoading = statusTeacherUser.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Create Teacher</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Add a new teacher to the coaching center</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Teacher Email</Label>
            <Input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="Teacher Email" className={`transition-all duration-200 ${errors?.teacherEmail ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-amber-500 focus:ring-amber-100'}`} />
            <FieldError message={errors?.teacherEmail} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Teacher Password</Label>
            <Input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Teacher Password" className={`transition-all duration-200 ${errors?.teacherPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-amber-500 focus:ring-amber-100'}`} />
            <FieldError message={errors?.teacherPassword} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Teacher First Name</Label>
            <Input value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} placeholder="Teacher First Name" className={`transition-all duration-200 ${errors?.teacherFirstName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-amber-500 focus:ring-amber-100'}`} />
            <FieldError message={errors?.teacherFirstName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Teacher Last Name</Label>
            <Input value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} placeholder="Teacher Last Name" className={`transition-all duration-200 ${errors?.teacherLastName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-amber-500 focus:ring-amber-100'}`} />
            <FieldError message={errors?.teacherLastName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Teacher Phone</Label>
            <Input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} placeholder="Teacher Phone" className="transition-all duration-200 focus:border-amber-500 focus:ring-amber-100" />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onCreateTeacher} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Teacher"}
        </Button>
        <StatusBanner status={statusTeacherUser} />
        
        <div className="mt-6 space-y-2">
          <Label className="text-sm font-medium text-gray-700">Assign to Program</Label>
          <MultiSelect
            options={tenantProgramOptions}
            value={[programId]}
            onValueChange={(values) => setProgramId(values[0] || '')}
            singleSelect={true}
            placeholder="Select program"
            disabled={!organizationId || !coachingCenterId}
          />
          <FieldError message={errors?.programId} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefreshPrograms} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Programs</Button>
          <Button variant="outline" size="sm" onClick={onRefreshTeachers} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Teachers</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeesSetupStep({
  organizationId,
  coachingCenterId,
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
  organizationId: string;
  coachingCenterId: string;
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
    <FeesSetupForm
      organizationId={organizationId}
      coachingCenterId={coachingCenterId}
      feeTypeForm={feeTypeForm}
      setFeeTypeForm={setFeeTypeForm}
      feePlanForm={feePlanForm}
      setFeePlanForm={setFeePlanForm}
      feeFrequencySearch={feeFrequencySearch}
      setFeeFrequencySearch={setFeeFrequencySearch}
      onCreateFeeType={onCreateFeeType}
      onCreateFeePlan={onCreateFeePlan}
      onAssignFeePlan={onAssignFeePlan}
      statusFeeType={statusFeeType}
      statusFeePlan={statusFeePlan}
      statusAssignFeePlan={statusAssignFeePlan}
      skipAssignFeePlan={skipAssignFeePlan}
      setSkipAssignFeePlan={setSkipAssignFeePlan}
      errors={errors}
      showAssignmentSection={true}
    />
  );
}

export function StudentLedgerStep({
  organizationId,
  coachingCenterId,
  tenantStudentOptions,
  studentId,
  setStudentId,
  tenantFeePlanOptions,
  feePlanId,
  setFeePlanId,
  tenantFeeTypeOptions,
  feeTypeId,
  setFeeTypeId,
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
  coachingCenterId: string;
  tenantStudentOptions: Array<{ value: string; label: string }>;
  studentId: string;
  setStudentId: (value: string) => void;
  tenantFeePlanOptions: Array<{ value: string; label: string }>;
  feePlanId: string;
  setFeePlanId: (value: string) => void;
  tenantFeeTypeOptions: Array<{ value: string; label: string }>;
  feeTypeId: string;
  setFeeTypeId: (value: string) => void;
  ledgerForm: { amount: string; dueDate: string };
  setLedgerForm: (value: { amount: string; dueDate: string }) => void;
  onRefreshStudents: () => void;
  onRefreshFeePlans: () => void;
  onRefreshFeeTypes: () => void;
  onCreateLedger: () => void;
  status: StepStatus;
  errors?: FieldErrors;
}) {
  const isLoading = status.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2">
            <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Student Fee Ledger</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Create fee ledger entries for students</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FieldError message={errors?.academicYearId} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student</Label>
            <MultiSelect
              options={tenantStudentOptions}
              value={[studentId]}
              onValueChange={(values) => setStudentId(values[0] || '')}
              singleSelect={true}
              placeholder="Select student"
              disabled={!organizationId || !coachingCenterId}
            />
            <FieldError message={errors?.studentId} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Fee Plan</Label>
            <MultiSelect
              options={tenantFeePlanOptions}
              value={[feePlanId]}
              onValueChange={(values) => setFeePlanId(values[0] || '')}
              singleSelect={true}
              placeholder="Select fee plan"
              disabled={!organizationId || !coachingCenterId}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Fee Type (Optional)</Label>
            <MultiSelect
              options={tenantFeeTypeOptions}
              value={[feeTypeId]}
              onValueChange={(values) => setFeeTypeId(values[0] || '')}
              singleSelect={true}
              placeholder="Select fee type (optional)"
              disabled={!organizationId || !coachingCenterId}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Amount</Label>
            <Input value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} type="number" placeholder="Amount" className={`transition-all duration-200 ${errors?.ledgerAmount ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-teal-500 focus:ring-teal-100'}`} />
            <FieldError message={errors?.ledgerAmount} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Due Date</Label>
            <Input value={ledgerForm.dueDate} onChange={(e) => setLedgerForm({ ...ledgerForm, dueDate: e.target.value })} type="date" className={`transition-all duration-200 ${errors?.ledgerDueDate ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-teal-500 focus:ring-teal-100'}`} />
            <FieldError message={errors?.ledgerDueDate} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefreshStudents} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Students</Button>
          <Button variant="outline" size="sm" onClick={onRefreshFeePlans} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Fee Plans</Button>
          <Button variant="outline" size="sm" onClick={onRefreshFeeTypes} disabled={!organizationId || !coachingCenterId} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">Refresh Fee Types</Button>
        </div>
        <Button disabled={isLoading} onClick={onCreateLedger} className="mt-4 w-full bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Fee Ledger Entry"}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
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
    schoolGrade: string;
    schoolName: string;
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
    schoolGrade: string;
    schoolName: string;
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
  const isLoading = status.type === 'loading';
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pink-100 p-2">
            <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Create Student + Parent</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Add a new student and link to parent account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <span className="font-medium">Note:</span> Parent email is required. If parent already exists (sibling case), leave parent password/name blank.
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student Email</Label>
            <Input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Student Email" className={`transition-all duration-200 ${errors?.studentEmail ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-pink-500 focus:ring-pink-100'}`} />
            <FieldError message={errors?.studentEmail} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student Password</Label>
            <Input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Student Password" className={`transition-all duration-200 ${errors?.studentPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-pink-500 focus:ring-pink-100'}`} />
            <FieldError message={errors?.studentPassword} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student First Name</Label>
            <Input value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} placeholder="Student First Name" className={`transition-all duration-200 ${errors?.studentFirstName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-pink-500 focus:ring-pink-100'}`} />
            <FieldError message={errors?.studentFirstName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student Last Name</Label>
            <Input value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} placeholder="Student Last Name" className={`transition-all duration-200 ${errors?.studentLastName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-pink-500 focus:ring-pink-100'}`} />
            <FieldError message={errors?.studentLastName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student Phone</Label>
            <Input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="Student Phone" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">School Name</Label>
            <Input value={studentForm.schoolName} onChange={(e) => setStudentForm({ ...studentForm, schoolName: e.target.value })} placeholder="School Name" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Class/Grade</Label>
            <Input value={studentForm.schoolGrade} onChange={(e) => setStudentForm({ ...studentForm, schoolGrade: e.target.value })} placeholder="Class/Grade" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Parent Email</Label>
            <Input value={studentForm.parentEmail} onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} placeholder="Parent Email" className={`transition-all duration-200 ${errors?.parentEmail ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-pink-500 focus:ring-pink-100'}`} />
            <FieldError message={errors?.parentEmail} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Parent Password</Label>
            <Input type="password" value={studentForm.parentPassword} onChange={(e) => setStudentForm({ ...studentForm, parentPassword: e.target.value })} placeholder="Parent Password" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Parent First Name</Label>
            <Input value={studentForm.parentFirstName} onChange={(e) => setStudentForm({ ...studentForm, parentFirstName: e.target.value })} placeholder="Parent First Name" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Parent Last Name</Label>
            <Input value={studentForm.parentLastName} onChange={(e) => setStudentForm({ ...studentForm, parentLastName: e.target.value })} placeholder="Parent Last Name" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Parent Phone</Label>
            <Input value={studentForm.parentPhone} onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })} placeholder="Parent Phone" className="transition-all duration-200 focus:border-pink-500 focus:ring-pink-100" />
          </div>
        </div>
        <Button disabled={isLoading} onClick={onCreate} className="mt-6 w-full bg-pink-600 hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Student + Link Parent"}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
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
    coachingCenterId: string;
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
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Parent Handover</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">Onboarding complete - share credentials with parent</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">If parent already existed, use existing credentials. Otherwise use the credentials entered in Step 8.</p>
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
          <p><span className="font-medium text-gray-700">Parent Email:</span> <span className="text-gray-600">{parentEmail || 'N/A'}</span></p>
          <p className="mt-1"><span className="font-medium text-gray-700">Login URL:</span> <span className="text-gray-600">/auth/signin</span></p>
          <p className="mt-1"><span className="font-medium text-gray-700">Parent Dashboard:</span> <span className="text-gray-600">/parent/dashboard</span></p>
        </div>
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-gray-800">Final Summary</p>
          <pre className="overflow-x-auto text-xs text-gray-700">{JSON.stringify(summary, null, 2)}</pre>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={onExportSummary} className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg">
            Export Summary JSON
          </Button>
          <Button variant="outline" onClick={onClearDraft} className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">
            Clear Saved Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
