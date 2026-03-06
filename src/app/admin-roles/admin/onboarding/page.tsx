'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { StepHeaderCard } from './components/StepHeaderCard';
import { StepTabsCard } from './components/StepTabsCard';
import { TenantSelectorsCard } from './components/TenantSelectorsCard';
import { WizardNavigationCard } from './components/WizardNavigationCard';
import {
  AcademicSetupStep,
  AdminUserStep,
  BootstrapStep,
  FeesSetupStep,
  NoAccessStep,
  OrganizationStep,
  ParentHandoverStep,
  CoachingCenterStep,
  StudentLedgerStep,
  StudentParentStep,
  TeacherClassTeacherStep,
} from './components/OnboardingSteps';
import { StepMeta, StepStatus } from './components/types';
import {
  AcademicYearOption,
  CLASS_LEVEL_OPTIONS,
  ClassLevelOption,
  ClassOption,
  extractId,
  FeePlanOption,
  FeeTypeOption,
  fetchAcademicYears,
  fetchClassMasters,
  fetchFeePlans,
  fetchFeeTypes,
  fetchOrganizations,
  fetchSchools,
  fetchStudents,
  fetchTeachers,
  inferClassLevelFromName,
  JsonRecord,
  OrgOption,
  SchoolOption,
  STEP_ALLOWED_ROLES,
  STEP_META,
  StudentOption,
  TeacherOption,
} from './lib/onboardingData';
import { clearDraft, loadDraft, saveDraft } from './lib/draftPersistence';
import { invalidateAdminOrganizations, invalidateAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';

const initialStatus: StepStatus = { type: 'idle', message: '' };
const DRAFT_KEY = 'onboarding_wizard_draft_v1';

const stepMeta: StepMeta[] = STEP_META;
const stepAllowedRoles: UserRole[][] = STEP_ALLOWED_ROLES;
const classLevelOptions: ClassLevelOption[] = CLASS_LEVEL_OPTIONS;

type OnboardingDraft = {
  currentStep: number;
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  classMasterId: string;
  sectionId: string;
  teacherId: string;
  feeTypeId: string;
  feePlanId: string;
  studentId: string;
  skipSubjectAllocation: boolean;
  skipAssignFeePlan: boolean;
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
  adminForm: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
  };
  yearForm: { name: string; startDate: string; endDate: string };
  classForm: { name: string; level: string };
  teacherForm: { email: string; password: string; firstName: string; lastName: string; phone: string };
  sectionForm: { name: string; capacity: string; roomNumber: string; shift: string };
  subjectForm: { subjectName: string; weeklyPeriods: string };
  feeTypeForm: { name: string; amount: string; frequency: string; isMandatory: boolean; isTaxable: boolean };
  feePlanForm: { name: string; itemsJson: string };
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
  ledgerForm: { amount: string; dueDate: string };
};

export default function OnboardingFlowPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, StepStatus>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusInvalidNonce, setFocusInvalidNonce] = useState(0);
  const [enforceSequence, setEnforceSequence] = useState(false);
  const stepContentRef = useRef<HTMLDivElement>(null);

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
  const [coachingCenters, setCoachingCenters] = useState<SchoolOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [classMasters, setClassMasters] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlanOption[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [loadingClassMasters, setLoadingClassMasters] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFeeTypes, setLoadingFeeTypes] = useState(false);
  const [loadingFeePlans, setLoadingFeePlans] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [academicYearSearch, setAcademicYearSearch] = useState('');
  const [classMasterSearch, setClassMasterSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [feeTypeSearch, setFeeTypeSearch] = useState('');
  const [feePlanSearch, setFeePlanSearch] = useState('');
  const [classLevelSearch, setClassLevelSearch] = useState('');
  const [recentOrganizationId, setRecentOrganizationId] = useState('');
  const [recentSchoolId, setRecentSchoolId] = useState('');
  const [adminRoleSearch, setAdminRoleSearch] = useState('');
  const [feeFrequencySearch, setFeeFrequencySearch] = useState('');

  const actorRole = session?.user?.role;
  const actorOrganizationId = session?.user?.organizationId ?? '';
  const actorSchoolId = session?.user?.schoolId ?? '';
  const canSelectOrganization = actorRole === UserRole.SUPER_ADMIN;
  const canSelectSchool =
    actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.ORGANIZATION_ADMIN;
  const canAccessStep = useCallback(
    (stepIndex: number) => Boolean(actorRole && stepAllowedRoles[stepIndex]?.includes(actorRole)),
    [actorRole]
  );

  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    type: 'SCHOOL_GROUP',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'INDIA',
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
    country: 'INDIA',
    contactEmail: '',
    contactPhone: '',
  });
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.COACHING_ADMIN,
  });
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });
  const [classForm, setClassForm] = useState({ name: '', level: 'LOWER_PRIMARY' });
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
    const scoped = coachingCenters.filter((coachingCenter) => coachingCenter.organizationId === organizationId);
    if (!q) return scoped;
    return scoped.filter(
      (coachingCenter) => coachingCenter.name.toLowerCase().includes(q) || coachingCenter.id.toLowerCase().includes(q)
    );
  }, [coachingCenters, schoolSearch, organizationId]);

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
      filteredSchools.map((coachingCenter) => ({
        value: coachingCenter.id,
        label: `${coachingCenter.name} (${coachingCenter.id})${coachingCenter.id === recentSchoolId ? ' - Recently Created' : ''}`,
      })),
    [filteredSchools, recentSchoolId]
  );

  const filteredAcademicYears = useMemo(() => {
    const q = academicYearSearch.trim().toLowerCase();
    const scoped = academicYears.filter(
      (item) => item.organizationId === organizationId && item.schoolId === schoolId
    );
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.startDate ?? '').toLowerCase().includes(q) ||
        (item.endDate ?? '').toLowerCase().includes(q)
    );
  }, [academicYearSearch, academicYears, organizationId, schoolId]);

  const academicYearOptions = useMemo(
    () =>
      filteredAcademicYears.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [filteredAcademicYears]
  );

  const filteredClassMasters = useMemo(() => {
    const q = classMasterSearch.trim().toLowerCase();
    const scoped = classMasters.filter(
      (item) => item.organizationId === organizationId && item.schoolId === schoolId
    );
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.level ?? '').toLowerCase().includes(q)
    );
  }, [classMasters, classMasterSearch, organizationId, schoolId]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    const scoped = teachers.filter((item) => {
      if (organizationId && item.organizationId && item.organizationId !== organizationId) return false;
      if (schoolId && item.schoolId && item.schoolId !== schoolId) return false;
      return true;
    });
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch, organizationId, schoolId]);

  const classMasterOptions = useMemo(
    () =>
      filteredClassMasters.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` [${item.level}]` : ''} (${item.id})`,
      })),
    [filteredClassMasters]
  );

  const teacherOptions = useMemo(
    () =>
      filteredTeachers.map((item) => ({
        value: item.id,
        label: `${item.name} - ${item.email} (${item.id})`,
      })),
    [filteredTeachers]
  );

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const scoped = students.filter((item) => {
      if (organizationId && item.organizationId && item.organizationId !== organizationId) return false;
      if (schoolId && item.schoolId && item.schoolId !== schoolId) return false;
      return true;
    });
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
    );
  }, [organizationId, schoolId, studentSearch, students]);

  const filteredFeeTypes = useMemo(() => {
    const q = feeTypeSearch.trim().toLowerCase();
    const scoped = feeTypes.filter(
      (item) => item.organizationId === organizationId && item.schoolId === schoolId
    );
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.frequency.toLowerCase().includes(q)
    );
  }, [feeTypeSearch, feeTypes, organizationId, schoolId]);

  const filteredFeePlans = useMemo(() => {
    const q = feePlanSearch.trim().toLowerCase();
    const scoped = feePlans.filter(
      (item) => item.organizationId === organizationId && item.schoolId === schoolId
    );
    if (!q) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.academicYearId.toLowerCase().includes(q)
    );
  }, [feePlanSearch, feePlans, organizationId, schoolId]);

  const studentOptions = useMemo(
    () =>
      filteredStudents.map((item) => ({
        value: item.id,
        label: `${item.name} - ${item.email} (${item.id})`,
      })),
    [filteredStudents]
  );

  const feeTypeOptions = useMemo(
    () =>
      filteredFeeTypes.map((item) => ({
        value: item.id,
        label: `${item.name} [${item.frequency}] (${item.id})`,
      })),
    [filteredFeeTypes]
  );

  const feePlanOptions = useMemo(
    () =>
      filteredFeePlans.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [filteredFeePlans]
  );

  const tenantOrganizationOptions = useMemo(() => {
    if (!organizationId) return organizationOptions;
    const exists = organizationOptions.some((opt) => opt.value === organizationId);
    if (exists) return organizationOptions;
    return [{ value: organizationId, label: `Current Organization (${organizationId})` }, ...organizationOptions];
  }, [organizationId, organizationOptions]);

  const tenantSchoolOptions = useMemo(() => {
    if (!schoolId) return schoolOptions;
    const exists = schoolOptions.some((opt) => opt.value === schoolId);
    if (exists) return schoolOptions;
    return [{ value: schoolId, label: `Current Coaching Center (${schoolId})` }, ...schoolOptions];
  }, [schoolId, schoolOptions]);

  const tenantClassMasterOptions = useMemo(() => {
    if (!classMasterId) return classMasterOptions;
    const exists = classMasterOptions.some((opt) => opt.value === classMasterId);
    if (exists) return classMasterOptions;
    return [{ value: classMasterId, label: `Current Class (${classMasterId})` }, ...classMasterOptions];
  }, [classMasterId, classMasterOptions]);

  const tenantAcademicYearOptions = useMemo(() => {
    if (!academicYearId) return academicYearOptions;
    const exists = academicYearOptions.some((opt) => opt.value === academicYearId);
    if (exists) return academicYearOptions;
    return [{ value: academicYearId, label: `Current Academic Year (${academicYearId})` }, ...academicYearOptions];
  }, [academicYearId, academicYearOptions]);

  const tenantTeacherOptions = useMemo(() => {
    if (!teacherId) return teacherOptions;
    const exists = teacherOptions.some((opt) => opt.value === teacherId);
    if (exists) return teacherOptions;
    return [{ value: teacherId, label: `Current Teacher (${teacherId})` }, ...teacherOptions];
  }, [teacherId, teacherOptions]);

  const tenantStudentOptions = useMemo(() => {
    if (!studentId) return studentOptions;
    const exists = studentOptions.some((opt) => opt.value === studentId);
    if (exists) return studentOptions;
    return [{ value: studentId, label: `Current Student (${studentId})` }, ...studentOptions];
  }, [studentId, studentOptions]);

  const tenantFeeTypeOptions = useMemo(() => {
    if (!feeTypeId) return feeTypeOptions;
    const exists = feeTypeOptions.some((opt) => opt.value === feeTypeId);
    if (exists) return feeTypeOptions;
    return [{ value: feeTypeId, label: `Current Fee Type (${feeTypeId})` }, ...feeTypeOptions];
  }, [feeTypeId, feeTypeOptions]);

  const tenantFeePlanOptions = useMemo(() => {
    if (!feePlanId) return feePlanOptions;
    const exists = feePlanOptions.some((opt) => opt.value === feePlanId);
    if (exists) return feePlanOptions;
    return [{ value: feePlanId, label: `Current Fee Plan (${feePlanId})` }, ...feePlanOptions];
  }, [feePlanId, feePlanOptions]);

  const visibleStepIndexes = useMemo(
    () => stepMeta.map((_, idx) => idx).filter((idx) => canAccessStep(idx)),
    [canAccessStep]
  );

  const currentVisibleStepPosition = useMemo(
    () => visibleStepIndexes.findIndex((idx) => idx === currentStep),
    [currentStep, visibleStepIndexes]
  );
  const visibleCompletionCount = useMemo(
    () => visibleStepIndexes.reduce((count, stepIndex) => (completion[stepIndex] ? count + 1 : count), 0),
    [completion, visibleStepIndexes]
  );
  const completionPercent = useMemo(() => {
    if (!visibleStepIndexes.length) return 0;
    return Math.round((visibleCompletionCount / visibleStepIndexes.length) * 100);
  }, [visibleCompletionCount, visibleStepIndexes.length]);
  const dataLoadingForCurrentStep = useMemo(() => {
    if (currentStep === 4) return loadingAcademicYears || loadingClassMasters;
    if (currentStep === 5) return loadingAcademicYears || loadingClassMasters || loadingTeachers;
    if (currentStep === 6) return loadingFeeTypes || loadingFeePlans;
    if (currentStep === 8) return loadingStudents || loadingFeeTypes || loadingFeePlans;
    return false;
  }, [
    currentStep,
    loadingAcademicYears,
    loadingClassMasters,
    loadingFeePlans,
    loadingFeeTypes,
    loadingStudents,
    loadingTeachers,
  ]);

  const maxUnlockedVisiblePosition = useMemo(() => {
    let max = 0;
    for (let i = 0; i < visibleStepIndexes.length - 1; i += 1) {
      const stepIndex = visibleStepIndexes[i];
      if (completion[stepIndex]) {
        max = i + 1;
      } else {
        break;
      }
    }
    return Math.max(max, currentVisibleStepPosition, 0);
  }, [completion, currentVisibleStepPosition, visibleStepIndexes]);

  useEffect(() => {
    const draft = loadDraft<OnboardingDraft>(DRAFT_KEY);
    if (!draft) return;

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

    if (draft.orgForm && typeof draft.orgForm === 'object') setOrgForm((prev) => ({ ...prev, ...draft.orgForm }));
    if (draft.schoolForm && typeof draft.schoolForm === 'object') setSchoolForm((prev) => ({ ...prev, ...draft.schoolForm }));
    if (draft.adminForm && typeof draft.adminForm === 'object') {
      const safeAdminForm = { ...(draft.adminForm as Record<string, unknown>) };
      delete safeAdminForm.password;
      setAdminForm((prev) => ({ ...prev, ...safeAdminForm }));
    }
    if (draft.yearForm && typeof draft.yearForm === 'object') setYearForm((prev) => ({ ...prev, ...draft.yearForm }));
    if (draft.classForm && typeof draft.classForm === 'object') setClassForm((prev) => ({ ...prev, ...draft.classForm }));
    if (draft.teacherForm && typeof draft.teacherForm === 'object') {
      const safeTeacherForm = { ...(draft.teacherForm as Record<string, unknown>) };
      delete safeTeacherForm.password;
      setTeacherForm((prev) => ({ ...prev, ...safeTeacherForm }));
    }
    if (draft.sectionForm && typeof draft.sectionForm === 'object') setSectionForm((prev) => ({ ...prev, ...draft.sectionForm }));
    if (draft.subjectForm && typeof draft.subjectForm === 'object') setSubjectForm((prev) => ({ ...prev, ...draft.subjectForm }));
    if (draft.feeTypeForm && typeof draft.feeTypeForm === 'object') setFeeTypeForm((prev) => ({ ...prev, ...draft.feeTypeForm }));
    if (draft.feePlanForm && typeof draft.feePlanForm === 'object') setFeePlanForm((prev) => ({ ...prev, ...draft.feePlanForm }));
    if (draft.studentForm && typeof draft.studentForm === 'object') {
      const safeStudentForm = { ...(draft.studentForm as Record<string, unknown>) };
      delete safeStudentForm.password;
      delete safeStudentForm.parentPassword;
      setStudentForm((prev) => ({ ...prev, ...safeStudentForm }));
    }
    if (draft.ledgerForm && typeof draft.ledgerForm === 'object') setLedgerForm((prev) => ({ ...prev, ...draft.ledgerForm }));
  }, []);

  async function loadOrganizations() {
    setLoadingOrganizations(true);
    try {
      const data = await fetchOrganizations();
      setOrganizations(data);
    } finally {
      setLoadingOrganizations(false);
    }
  }

  async function loadSchools(orgId?: string) {
    setLoadingSchools(true);
    try {
      const data = await fetchSchools(orgId);
      setCoachingCenters(data);
    } finally {
      setLoadingSchools(false);
    }
  }

  async function loadAcademicYears(orgId?: string, schId?: string) {
    setLoadingAcademicYears(true);
    try {
      const data = await fetchAcademicYears(orgId, schId);
      setAcademicYears(data);
    } finally {
      setLoadingAcademicYears(false);
    }
  }

  async function loadClassMasters(orgId?: string, schId?: string) {
    setLoadingClassMasters(true);
    try {
      const data = await fetchClassMasters(orgId, schId);
      setClassMasters(data);
    } finally {
      setLoadingClassMasters(false);
    }
  }

  async function loadTeachers(orgId?: string, schId?: string) {
    setLoadingTeachers(true);
    try {
      const data = await fetchTeachers(orgId, schId);
      setTeachers(data);
    } finally {
      setLoadingTeachers(false);
    }
  }

  async function loadStudents(orgId?: string, schId?: string) {
    setLoadingStudents(true);
    try {
      const data = await fetchStudents(orgId, schId);
      setStudents(data);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadFeeTypes(orgId?: string, schId?: string) {
    setLoadingFeeTypes(true);
    try {
      const data = await fetchFeeTypes(orgId, schId);
      setFeeTypes(data);
    } finally {
      setLoadingFeeTypes(false);
    }
  }

  async function loadFeePlans(orgId?: string, schId?: string) {
    setLoadingFeePlans(true);
    try {
      const data = await fetchFeePlans(orgId, schId);
      setFeePlans(data);
    } finally {
      setLoadingFeePlans(false);
    }
  }

  const resetSchoolScopedSelections = useCallback(() => {
    setAcademicYearId('');
    setClassMasterId('');
    setSectionId('');
    setTeacherId('');
    setFeeTypeId('');
    setFeePlanId('');
    setStudentId('');
  }, []);

  const handleOrganizationChange = useCallback(
    (nextOrganizationId: string) => {
      if (nextOrganizationId === organizationId) return;
      setOrganizationId(nextOrganizationId);
      setSchoolId('');
      resetSchoolScopedSelections();
    },
    [organizationId, resetSchoolScopedSelections]
  );

  const handleSchoolChange = useCallback(
    (nextSchoolId: string) => {
      if (nextSchoolId === schoolId) return;
      setSchoolId(nextSchoolId);
      resetSchoolScopedSelections();
    },
    [schoolId, resetSchoolScopedSelections]
  );

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (!visibleStepIndexes.length) return;
    if (!canAccessStep(currentStep)) {
      setCurrentStep(visibleStepIndexes[0]);
    }
  }, [canAccessStep, currentStep, visibleStepIndexes]);

  useEffect(() => {
    if (status !== 'authenticated' || !actorRole) return;

    if (actorRole === UserRole.ORGANIZATION_ADMIN && actorOrganizationId) {
      setOrganizationId((prev) => (prev === actorOrganizationId ? prev : actorOrganizationId));
    }

    if (
      actorRole !== UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.ORGANIZATION_ADMIN
    ) {
      if (actorOrganizationId) {
        setOrganizationId((prev) => (prev === actorOrganizationId ? prev : actorOrganizationId));
      }
      if (actorSchoolId) {
        setSchoolId((prev) => (prev === actorSchoolId ? prev : actorSchoolId));
      }
    }
  }, [actorOrganizationId, actorRole, actorSchoolId, status]);

  useEffect(() => {
    if (!organizationId) {
      setCoachingCenters([]);
      if (canSelectSchool) {
        setSchoolId('');
      }
      return;
    }
    loadSchools(organizationId);
  }, [canSelectSchool, organizationId]);

  useEffect(() => {
    if (!canSelectSchool || !organizationId || !schoolId || loadingSchools) return;
    const existsInCurrentOrganization = coachingCenters.some(
      (item) => item.id === schoolId && item.organizationId === organizationId
    );
    if (!existsInCurrentOrganization) {
      handleSchoolChange('');
    }
  }, [canSelectSchool, handleSchoolChange, loadingSchools, organizationId, schoolId, coachingCenters]);

  useEffect(() => {
    if (!organizationId || !schoolId) {
      setAcademicYears([]);
      setClassMasters([]);
      setTeachers([]);
      setStudents([]);
      setFeeTypes([]);
      setFeePlans([]);
      return;
    }

    loadAcademicYears(organizationId, schoolId);
    loadClassMasters(organizationId, schoolId);
    loadTeachers(organizationId, schoolId);
    loadStudents(organizationId, schoolId);
    loadFeeTypes(organizationId, schoolId);
    loadFeePlans(organizationId, schoolId);
  }, [organizationId, schoolId]);

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
      adminForm: { ...adminForm, password: '' },
      yearForm,
      classForm,
      teacherForm: { ...teacherForm, password: '' },
      sectionForm,
      subjectForm,
      feeTypeForm,
      feePlanForm,
      studentForm: {
        ...studentForm,
        password: '',
        parentPassword: '',
      },
      ledgerForm,
    };
    saveDraft(DRAFT_KEY, draft);
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

  const hasText = (value: string) => value.trim().length > 0;
  const hasTenantContext = () => Boolean(organizationId && schoolId);
  const setStepError = (key: string, message: string) => {
    setStatusMap((prev) => ({ ...prev, [key]: { type: 'error', message } }));
  };
  const firstError = (errors: Record<string, string>) => Object.values(errors)[0] ?? null;

  const getCurrentStepErrors = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    const tenantSelected = Boolean(organizationId && schoolId);
    switch (currentStep) {
      case 1:
        if (!hasText(orgForm.organizationName)) errors.organizationName = 'Organization name is required.';
        if (!hasText(orgForm.type)) errors.type = 'Organization type is required.';
        if (!hasText(orgForm.contactEmail)) errors.contactEmail = 'Organization contact email is required.';
        break;
      case 2:
        if (!hasText(organizationId)) errors.organizationId = 'Select organization first from tenant selectors.';
        if (!hasText(schoolForm.schoolName)) errors.schoolName = 'Coaching center name is required.';
        if (!hasText(schoolForm.schoolCode)) errors.schoolCode = 'Coaching center code is required.';
        break;
      case 3:
        if (!tenantSelected) errors.tenant = 'Please select organization and coaching center from tenant selectors.';
        if (!hasText(adminForm.email)) errors.email = 'Admin email is required.';
        if (!hasText(adminForm.password)) errors.password = 'Admin password is required.';
        if (!hasText(adminForm.firstName)) errors.firstName = 'Admin first name is required.';
        if (!hasText(adminForm.lastName)) errors.lastName = 'Admin last name is required.';
        break;
      case 4:
        if (!tenantSelected) errors.tenant = 'Organization and coaching center context are required.';
        if (!hasText(yearForm.name)) errors.yearName = 'Academic year name is required.';
        if (!hasText(yearForm.startDate)) errors.yearStartDate = 'Start date is required.';
        if (!hasText(yearForm.endDate)) errors.yearEndDate = 'End date is required.';
        if (!hasText(classForm.name)) errors.className = 'Class name is required.';
        if (!hasText(classForm.level)) errors.classLevel = 'Class level is required.';
        break;
      case 5:
        if (!tenantSelected) errors.tenant = 'Organization and coaching center context are required.';
        if (!hasText(teacherForm.email)) errors.teacherEmail = 'Teacher email is required.';
        if (!hasText(teacherForm.password)) errors.teacherPassword = 'Teacher password is required.';
        if (!hasText(teacherForm.firstName)) errors.teacherFirstName = 'Teacher first name is required.';
        if (!hasText(teacherForm.lastName)) errors.teacherLastName = 'Teacher last name is required.';
        if (!hasText(classMasterId)) errors.classMasterId = 'Select class master before creating section.';
        if (!hasText(sectionForm.name)) errors.sectionName = 'Section name is required.';
        if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required for subject allocation.';
        if (!hasText(subjectForm.subjectName)) errors.subjectName = 'Subject name is required.';
        if (Number(subjectForm.weeklyPeriods || '0') <= 0) errors.weeklyPeriods = 'Weekly periods must be greater than 0.';
        break;
      case 6:
        if (!tenantSelected) errors.tenant = 'Organization and coaching center context are required.';
        if (!hasText(feeTypeForm.name)) errors.feeTypeName = 'Fee type name is required.';
        if (Number(feeTypeForm.amount || '0') <= 0) errors.feeTypeAmount = 'Fee amount must be greater than 0.';
        if (!hasText(feeTypeForm.frequency)) errors.feeTypeFrequency = 'Fee frequency is required.';
        if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required before creating fee plan.';
        if (!hasText(feePlanForm.name)) errors.feePlanName = 'Fee plan name is required.';
        try {
          const parsed = JSON.parse(feePlanForm.itemsJson);
          if (!Array.isArray(parsed) || parsed.length === 0) errors.feePlanItemsJson = 'Fee plan items JSON must contain at least one item.';
        } catch {
          errors.feePlanItemsJson = 'Fee plan items JSON is invalid.';
        }
        if (!hasText(feePlanId)) errors.feePlanId = 'Select or create a fee plan first.';
        break;
      case 7:
        if (!tenantSelected) errors.tenant = 'Organization and coaching center context are required.';
        if (!hasText(studentForm.email)) errors.studentEmail = 'Student email is required.';
        if (!hasText(studentForm.password)) errors.studentPassword = 'Student password is required.';
        if (!hasText(studentForm.firstName)) errors.studentFirstName = 'Student first name is required.';
        if (!hasText(studentForm.lastName)) errors.studentLastName = 'Student last name is required.';
        if (!hasText(studentForm.parentEmail)) errors.parentEmail = 'Parent email is required.';
        break;
      case 8:
        if (!tenantSelected) errors.tenant = 'Organization and coaching center context are required.';
        if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required.';
        if (!hasText(studentId)) errors.studentId = 'Student selection is required.';
        if (Number(ledgerForm.amount || '0') <= 0) errors.ledgerAmount = 'Ledger amount must be greater than 0.';
        if (!hasText(ledgerForm.dueDate)) errors.ledgerDueDate = 'Ledger due date is required.';
        break;
      default:
        break;
    }
    return errors;
  }, [
    academicYearId,
    adminForm.email,
    adminForm.firstName,
    adminForm.lastName,
    adminForm.password,
    classForm.level,
    classForm.name,
    classMasterId,
    currentStep,
    feePlanForm.itemsJson,
    feePlanForm.name,
    feePlanId,
    feeTypeForm.amount,
    feeTypeForm.frequency,
    feeTypeForm.name,
    ledgerForm.amount,
    ledgerForm.dueDate,
    orgForm.contactEmail,
    orgForm.organizationName,
    orgForm.type,
    organizationId,
    schoolId,
    schoolForm.schoolCode,
    schoolForm.schoolName,
    sectionForm.name,
    studentForm.email,
    studentForm.firstName,
    studentForm.lastName,
    studentForm.parentEmail,
    studentForm.password,
    studentId,
    subjectForm.subjectName,
    subjectForm.weeklyPeriods,
    teacherForm.email,
    teacherForm.firstName,
    teacherForm.lastName,
    teacherForm.password,
    yearForm.endDate,
    yearForm.name,
    yearForm.startDate,
  ]);

  useEffect(() => {
    if (!Object.keys(fieldErrors).length) return;
    const nextErrors = getCurrentStepErrors();
    const current = JSON.stringify(fieldErrors);
    const next = JSON.stringify(nextErrors);
    if (current !== next) {
      setFieldErrors(nextErrors);
    }
  }, [fieldErrors, getCurrentStepErrors]);

  useEffect(() => {
    if (!focusInvalidNonce) return;
    const container = stepContentRef.current;
    if (!container) return;

    const focusInvalid = () => {
      const invalidField = container.querySelector<HTMLElement>(
        'input.border-rose-300, select.border-rose-300, textarea.border-rose-300'
      );
      if (invalidField) {
        invalidField.focus({ preventScroll: true });
        invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const firstErrorMessage = container.querySelector<HTMLElement>('p.text-rose-600');
      if (!firstErrorMessage) return;
      firstErrorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nearbyField = firstErrorMessage
        .closest('div')
        ?.querySelector<HTMLElement>('input, select, textarea, button');
      nearbyField?.focus({ preventScroll: true });
    };

    const frame = window.requestAnimationFrame(focusInvalid);
    return () => window.cancelAnimationFrame(frame);
  }, [focusInvalidNonce]);

  function stepContent() {
    if (!canAccessStep(currentStep)) {
      return <NoAccessStep />;
    }

    switch (currentStep) {
      case 0:
        return <BootstrapStep onCheckBootstrap={checkBootstrap} status={statusMap.bootstrapCheck ?? initialStatus} />;
      case 1:
        return (
          <OrganizationStep
            orgForm={orgForm}
            setOrgForm={setOrgForm}
            onCreate={() => {
              const errors: Record<string, string> = {};
              if (!hasText(orgForm.organizationName)) errors.organizationName = 'Organization name is required.';
              if (!hasText(orgForm.type)) errors.type = 'Organization type is required.';
              if (!hasText(orgForm.contactEmail)) errors.contactEmail = 'Organization contact email is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('organization', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('organization', '/api/admin/organizations', orgForm, async (d) => {
                invalidateAdminOrganizations();
                invalidateAdminCoachingCenters();
                const id = extractId(d);
                if (id) {
                  setOrganizationId(id);
                  setRecentOrganizationId(id);
                }
                await loadOrganizations();
              });
            }}
            status={statusMap.organization ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 2:
        return (
          <CoachingCenterStep
            schoolForm={schoolForm}
            setSchoolForm={setSchoolForm}
            organizationId={organizationId}
            onCreate={() => {
              const errors: Record<string, string> = {};
              if (!hasText(organizationId)) errors.organizationId = 'Select organization first from tenant selectors.';
              if (!hasText(schoolForm.schoolName)) errors.schoolName = 'Coaching center name is required.';
              if (!hasText(schoolForm.schoolCode)) errors.schoolCode = 'Coaching center code is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('coachingCenter', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('coachingCenter', '/api/admin/coaching-centers', { ...schoolForm, organizationId }, async (d) => {
                invalidateAdminCoachingCenters(organizationId);
                const id = extractId(d);
                if (id) {
                  setSchoolId(id);
                  setRecentSchoolId(id);
                }
                await loadSchools(organizationId);
              });
            }}
            status={statusMap.coachingCenter ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 3:
        return (
          <AdminUserStep
            adminForm={adminForm}
            setAdminForm={setAdminForm}
            adminRoleSearch={adminRoleSearch}
            setAdminRoleSearch={setAdminRoleSearch}
            onCreate={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Please select organization and coaching center from tenant selectors.';
              if (!hasText(adminForm.email)) errors.email = 'Admin email is required.';
              if (!hasText(adminForm.password)) errors.password = 'Admin password is required.';
              if (!hasText(adminForm.firstName)) errors.firstName = 'Admin first name is required.';
              if (!hasText(adminForm.lastName)) errors.lastName = 'Admin last name is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('adminUser', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('adminUser', '/api/admin/users', { ...adminForm, organizationId, schoolId });
            }}
            status={statusMap.adminUser ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 4:
        return (
          <AcademicSetupStep
            organizationId={organizationId}
            schoolId={schoolId}
            academicYearId={academicYearId}
            classMasterId={classMasterId}
            setAcademicYearId={setAcademicYearId}
            setClassMasterId={setClassMasterId}
            yearForm={yearForm}
            setYearForm={setYearForm}
            classForm={classForm}
            setClassForm={setClassForm}
            classLevelOptions={classLevelOptions}
            classLevelSearch={classLevelSearch}
            setClassLevelSearch={setClassLevelSearch}
            academicYearSearch={academicYearSearch}
            setAcademicYearSearch={setAcademicYearSearch}
            classMasterSearch={classMasterSearch}
            setClassMasterSearch={setClassMasterSearch}
            tenantAcademicYearOptions={tenantAcademicYearOptions}
            tenantClassMasterOptions={tenantClassMasterOptions}
            onRefreshAcademicYears={() => loadAcademicYears(organizationId, schoolId)}
            onRefreshClasses={() => loadClassMasters(organizationId, schoolId)}
            onCreateAcademicYear={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(yearForm.name)) errors.yearName = 'Academic year name is required.';
              if (!hasText(yearForm.startDate)) errors.yearStartDate = 'Start date is required.';
              if (!hasText(yearForm.endDate)) errors.yearEndDate = 'End date is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('academicYear', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'academicYear',
                '/api/admin/academic-years',
                { organizationId, schoolId, ...yearForm },
                async (d) => {
                  setAcademicYearId(extractId(d));
                  await loadAcademicYears(organizationId, schoolId);
                }
              );
            }}
            onCreateClassMaster={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(classForm.name)) errors.className = 'Class name is required.';
              if (!hasText(classForm.level)) errors.classLevel = 'Class level is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('classMaster', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'classMaster',
                '/api/admin/class-masters',
                { organizationId, schoolId, ...classForm },
                async (d) => {
                  setClassMasterId(extractId(d));
                  await loadClassMasters(organizationId, schoolId);
                }
              );
            }}
            statusAcademicYear={statusMap.academicYear ?? initialStatus}
            statusClassMaster={statusMap.classMaster ?? initialStatus}
            inferClassLevelFromName={inferClassLevelFromName}
            errors={fieldErrors}
          />
        );
      case 5:
        return (
          <TeacherClassTeacherStep
            organizationId={organizationId}
            schoolId={schoolId}
            teacherForm={teacherForm}
            setTeacherForm={setTeacherForm}
            classMasterId={classMasterId}
            setClassMasterId={setClassMasterId}
            classMasterSearch={classMasterSearch}
            setClassMasterSearch={setClassMasterSearch}
            sectionForm={sectionForm}
            setSectionForm={setSectionForm}
            teacherId={teacherId}
            setTeacherId={setTeacherId}
            teacherSearch={teacherSearch}
            setTeacherSearch={setTeacherSearch}
            skipSubjectAllocation={skipSubjectAllocation}
            setSkipSubjectAllocation={setSkipSubjectAllocation}
            subjectForm={subjectForm}
            setSubjectForm={setSubjectForm}
            academicYearId={academicYearId}
            setAcademicYearId={setAcademicYearId}
            academicYearSearch={academicYearSearch}
            setAcademicYearSearch={setAcademicYearSearch}
            tenantClassMasterOptions={tenantClassMasterOptions}
            tenantTeacherOptions={tenantTeacherOptions}
            tenantAcademicYearOptions={tenantAcademicYearOptions}
            onRefreshClasses={() => loadClassMasters(organizationId, schoolId)}
            onRefreshTeachers={() => loadTeachers(organizationId, schoolId)}
            onCreateTeacher={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(teacherForm.email)) errors.teacherEmail = 'Teacher email is required.';
              if (!hasText(teacherForm.password)) errors.teacherPassword = 'Teacher password is required.';
              if (!hasText(teacherForm.firstName)) errors.teacherFirstName = 'Teacher first name is required.';
              if (!hasText(teacherForm.lastName)) errors.teacherLastName = 'Teacher last name is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('teacherUser', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'teacherUser',
                '/api/admin/users',
                { ...teacherForm, role: UserRole.TEACHER, organizationId, schoolId },
                async (d) => {
                  setTeacherId(extractId(d));
                  await loadTeachers(organizationId, schoolId);
                }
              );
            }}
            onCreateSectionAssignTeacher={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(classMasterId)) errors.classMasterId = 'Select class master before creating section.';
              if (!hasText(sectionForm.name)) errors.sectionName = 'Section name is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('section', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('section', '/api/admin/sections', { organizationId, schoolId, classMasterId, name: sectionForm.name, capacity: Number(sectionForm.capacity || '0'), roomNumber: sectionForm.roomNumber || undefined, shift: sectionForm.shift || undefined, classTeacherId: teacherId || undefined }, (d) => setSectionId(extractId(d)));
            }}
            onCreateSubjectAllocation={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required for subject allocation.';
              if (!hasText(classMasterId)) errors.classMasterId = 'Class master is required for subject allocation.';
              if (!hasText(subjectForm.subjectName)) errors.subjectName = 'Subject name is required.';
              if (Number(subjectForm.weeklyPeriods || '0') <= 0) errors.weeklyPeriods = 'Weekly periods must be greater than 0.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('subjectAllocation', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('subjectAllocation', '/api/admin/subject-allocations', { organizationId, schoolId, academicYearId, classMasterId, sectionId: sectionId || undefined, subjectName: subjectForm.subjectName, teacherId: teacherId || undefined, weeklyPeriods: Number(subjectForm.weeklyPeriods || '0') });
            }}
            statusTeacherUser={statusMap.teacherUser ?? initialStatus}
            statusSection={statusMap.section ?? initialStatus}
            statusSubjectAllocation={statusMap.subjectAllocation ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 6:
        return (
          <FeesSetupStep
            feeTypeForm={feeTypeForm}
            setFeeTypeForm={setFeeTypeForm}
            feeFrequencySearch={feeFrequencySearch}
            setFeeFrequencySearch={setFeeFrequencySearch}
            onCreateFeeType={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(feeTypeForm.name)) errors.feeTypeName = 'Fee type name is required.';
              if (Number(feeTypeForm.amount || '0') <= 0) errors.feeTypeAmount = 'Fee amount must be greater than 0.';
              if (!hasText(feeTypeForm.frequency)) errors.feeTypeFrequency = 'Fee frequency is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('feeType', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'feeType',
                '/api/admin/fee-types',
                { organizationId, schoolId, ...feeTypeForm, amount: Number(feeTypeForm.amount || '0') },
                async (d) => {
                  setFeeTypeId(extractId(d));
                  await loadFeeTypes(organizationId, schoolId);
                }
              );
            }}
            statusFeeType={statusMap.feeType ?? initialStatus}
            feePlanForm={feePlanForm}
            setFeePlanForm={setFeePlanForm}
            onCreateFeePlan={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required before creating fee plan.';
              if (!hasText(feePlanForm.name)) errors.feePlanName = 'Fee plan name is required.';
              try {
                const parsed = JSON.parse(feePlanForm.itemsJson);
                if (!Array.isArray(parsed) || parsed.length === 0) errors.feePlanItemsJson = 'Fee plan items JSON must contain at least one item.';
              } catch {
                errors.feePlanItemsJson = 'Fee plan items JSON is invalid.';
              }
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('feePlan', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'feePlan',
                '/api/admin/fee-plans',
                { organizationId, schoolId, academicYearId, name: feePlanForm.name, items: (() => { try { return JSON.parse(feePlanForm.itemsJson); } catch { return []; } })() },
                async (d) => {
                  setFeePlanId(extractId(d));
                  await loadFeePlans(organizationId, schoolId);
                }
              );
            }}
            statusFeePlan={statusMap.feePlan ?? initialStatus}
            skipAssignFeePlan={skipAssignFeePlan}
            setSkipAssignFeePlan={setSkipAssignFeePlan}
            onAssignFeePlan={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required before assigning fee plan.';
              if (!hasText(feePlanId)) errors.feePlanId = 'Select or create a fee plan first.';
              if (!hasText(classMasterId)) errors.classMasterId = 'Select class master before assigning fee plan.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('assignFeePlan', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('assignFeePlan', '/api/admin/fee-plan-assignments', { organizationId, schoolId, academicYearId, feePlanId, classMasterId, sectionId: sectionId || undefined });
            }}
            statusAssignFeePlan={statusMap.assignFeePlan ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 7:
        return (
          <StudentParentStep
            studentForm={studentForm}
            setStudentForm={setStudentForm}
            onCreate={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(studentForm.email)) errors.studentEmail = 'Student email is required.';
              if (!hasText(studentForm.password)) errors.studentPassword = 'Student password is required.';
              if (!hasText(studentForm.firstName)) errors.studentFirstName = 'Student first name is required.';
              if (!hasText(studentForm.lastName)) errors.studentLastName = 'Student last name is required.';
              if (!hasText(studentForm.parentEmail)) errors.parentEmail = 'Parent email is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('studentWithParent', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep(
                'studentWithParent',
                '/api/admin/users',
                { email: studentForm.email, password: studentForm.password, firstName: studentForm.firstName, lastName: studentForm.lastName, phone: studentForm.phone || undefined, role: UserRole.STUDENT, organizationId, schoolId, parent: { email: studentForm.parentEmail, password: studentForm.parentPassword, firstName: studentForm.parentFirstName, lastName: studentForm.parentLastName, phone: studentForm.parentPhone || undefined } },
                async (d) => {
                  setStudentId(extractId(d));
                  await loadStudents(organizationId, schoolId);
                }
              );
            }}
            status={statusMap.studentWithParent ?? initialStatus}
            errors={fieldErrors}
          />
        );
      case 8:
        return (
          <StudentLedgerStep
            organizationId={organizationId}
            schoolId={schoolId}
            tenantStudentOptions={tenantStudentOptions}
            studentId={studentId}
            setStudentId={setStudentId}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            tenantFeePlanOptions={tenantFeePlanOptions}
            feePlanId={feePlanId}
            setFeePlanId={setFeePlanId}
            feePlanSearch={feePlanSearch}
            setFeePlanSearch={setFeePlanSearch}
            tenantFeeTypeOptions={tenantFeeTypeOptions}
            feeTypeId={feeTypeId}
            setFeeTypeId={setFeeTypeId}
            feeTypeSearch={feeTypeSearch}
            setFeeTypeSearch={setFeeTypeSearch}
            ledgerForm={ledgerForm}
            setLedgerForm={setLedgerForm}
            onRefreshStudents={() => loadStudents(organizationId, schoolId)}
            onRefreshFeePlans={() => loadFeePlans(organizationId, schoolId)}
            onRefreshFeeTypes={() => loadFeeTypes(organizationId, schoolId)}
            onCreateLedger={() => {
              const errors: Record<string, string> = {};
              if (!hasTenantContext()) errors.tenant = 'Organization and coaching center context are required.';
              if (!hasText(academicYearId)) errors.academicYearId = 'Academic year is required.';
              if (!hasText(studentId)) errors.studentId = 'Student selection is required.';
              if (Number(ledgerForm.amount || '0') <= 0) errors.ledgerAmount = 'Ledger amount must be greater than 0.';
              if (!hasText(ledgerForm.dueDate)) errors.ledgerDueDate = 'Ledger due date is required.';
              const error = firstError(errors);
              if (error) {
                setFieldErrors(errors);
                setStepError('studentLedger', error);
                setFocusInvalidNonce((value) => value + 1);
                return;
              }
              setFieldErrors({});
              postStep('studentLedger', '/api/admin/student-fee-ledger', { organizationId, schoolId, academicYearId, studentId, feePlanId: feePlanId || undefined, feeTypeId: feeTypeId || undefined, amount: Number(ledgerForm.amount || '0'), dueDate: ledgerForm.dueDate });
            }}
            status={statusMap.studentLedger ?? initialStatus}
            errors={fieldErrors}
          />
        );
      default:
        return (
          <ParentHandoverStep
            summary={{
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
            }}
            parentEmail={studentForm.parentEmail}
            onExportSummary={() => {
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
            onClearDraft={() => clearDraft(DRAFT_KEY)}
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Onboarding Workspace</h1>
              <p className="mt-2 text-sm text-gray-600">
                <b>Note:</b> Use sequential mode for first-time onboarding and flexible mode for ongoing operations.              </p>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100" />
              <div className="h-10 w-10 rounded-lg bg-green-100" />
              <div className="h-10 w-10 rounded-lg bg-yellow-100" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px,1fr]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:overflow-auto xl:pr-1">
            <TenantSelectorsCard
              status={status}
              actorRole={actorRole}
              isLoadingOrganizations={loadingOrganizations}
              isLoadingSchools={loadingSchools}
              canSelectOrganization={canSelectOrganization}
              canSelectSchool={canSelectSchool}
              organizationId={organizationId}
              schoolId={schoolId}
              organizationSearch={organizationSearch}
              schoolSearch={schoolSearch}
              tenantOrganizationOptions={tenantOrganizationOptions}
              tenantSchoolOptions={tenantSchoolOptions}
              recentOrganizationId={recentOrganizationId}
              recentSchoolId={recentSchoolId}
              onOrganizationChange={handleOrganizationChange}
              onSchoolChange={handleSchoolChange}
              onOrganizationSearchChange={setOrganizationSearch}
              onSchoolSearchChange={setSchoolSearch}
              onRefreshOrganizations={() => loadOrganizations()}
              onRefreshSchools={() => loadSchools(organizationId)}
            />

            <StepTabsCard
              enforceSequence={enforceSequence}
              setEnforceSequence={setEnforceSequence}
              visibleStepIndexes={visibleStepIndexes}
              currentStep={currentStep}
              completion={completion}
              maxUnlockedVisiblePosition={maxUnlockedVisiblePosition}
              stepMeta={stepMeta}
              onSelectStep={setCurrentStep}
            />
          </aside>

          <section className="space-y-4" aria-busy={dataLoadingForCurrentStep}>
            <StepHeaderCard
              title={stepMeta[currentStep]?.title ?? 'Onboarding'}
              description={stepMeta[currentStep]?.description ?? 'Follow the onboarding flow.'}
              currentPosition={Math.max(currentVisibleStepPosition + 1, 1)}
              totalSteps={visibleStepIndexes.length}
              completionPercent={completionPercent}
            />

            {dataLoadingForCurrentStep ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                Refreshing reference data for this step...
              </div>
            ) : null}

            <div ref={stepContentRef}>{stepContent()}</div>

            <WizardNavigationCard
              currentVisibleStepPosition={currentVisibleStepPosition}
              visibleStepCount={visibleStepIndexes.length}
              onBack={() => {
                if (currentVisibleStepPosition > 0) {
                  setCurrentStep(visibleStepIndexes[currentVisibleStepPosition - 1]);
                }
              }}
              onNext={() => {
                if (currentVisibleStepPosition < visibleStepIndexes.length - 1) {
                  setCurrentStep(visibleStepIndexes[currentVisibleStepPosition + 1]);
                }
              }}
              canGoBack={currentVisibleStepPosition > 0}
              canGoNext={
                currentVisibleStepPosition >= 0 &&
                currentVisibleStepPosition < visibleStepIndexes.length - 1 &&
                (!enforceSequence || completion[currentStep])
              }
            />
          </section>
        </div>
      </main>
    </div>
  );
}
