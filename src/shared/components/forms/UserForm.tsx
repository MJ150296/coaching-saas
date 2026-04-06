'use client';

import { UserRole } from '@/domains/user-management/domain/entities/User';
import { MultiSelect } from '@/components/multi-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBanner } from '@/app/admin-roles/admin/onboarding/components/StatusBanner';
import { FieldErrors, FormStatus, SelectOption, ADMIN_ROLE_OPTIONS } from './types';

type UserFormProps = {
  // Form data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;

  // Setters
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPhone: (value: string) => void;
  setRole: (value: UserRole) => void;

  // Role options (can be customized per context)
  roleOptions?: SelectOption[];

  // Role search
  roleSearch?: string;
  setRoleSearch?: (value: string) => void;

  // Actions
  onCreate: () => void;

  // Status
  status: FormStatus;
  errors?: FieldErrors;

  // UI customization
  title?: string;
  description?: string;
  submitLabel?: string;
  accentColor?: 'blue' | 'purple' | 'amber' | 'emerald';
  showCard?: boolean;
};

const colorMap = {
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    focusBorder: 'focus:border-blue-500',
    focusRing: 'focus:ring-blue-100',
    errorBorder: 'border-rose-300 focus:border-rose-500 focus:ring-rose-100',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    focusBorder: 'focus:border-purple-500',
    focusRing: 'focus:ring-purple-100',
    errorBorder: 'border-rose-300 focus:border-rose-500 focus:ring-rose-100',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    focusBorder: 'focus:border-amber-500',
    focusRing: 'focus:ring-amber-100',
    errorBorder: 'border-rose-300 focus:border-rose-500 focus:ring-rose-100',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    focusBorder: 'focus:border-emerald-500',
    focusRing: 'focus:ring-emerald-100',
    errorBorder: 'border-rose-300 focus:border-rose-500 focus:ring-rose-100',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function UserForm({
  email,
  password,
  firstName,
  lastName,
  phone,
  role,
  setEmail,
  setPassword,
  setFirstName,
  setLastName,
  setPhone,
  setRole,
  roleOptions = ADMIN_ROLE_OPTIONS,
  onCreate,
  status,
  errors,
  title = 'Create User',
  description = 'Set up a new user account',
  submitLabel = 'Create User',
  accentColor = 'blue',
  showCard = true,
}: UserFormProps) {
  const isLoading = status.type === 'loading';
  const colors = colorMap[accentColor];

  const getInputClassName = (errorKey?: string) =>
    `transition-all duration-200 ${errorKey && errors?.[errorKey] ? colors.errorBorder : `${colors.focusBorder} ${colors.focusRing}`}`;

  const formContent = (
    <>
      <FieldError message={errors?.tenant} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={getInputClassName('email')}
          />
          <FieldError message={errors?.email} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={getInputClassName('password')}
          />
          <FieldError message={errors?.password} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">First Name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className={getInputClassName('firstName')}
          />
          <FieldError message={errors?.firstName} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Last Name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className={getInputClassName('lastName')}
          />
          <FieldError message={errors?.lastName} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className={`transition-all duration-200 ${colors.focusBorder} ${colors.focusRing}`}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Role</Label>
          <MultiSelect
            options={roleOptions}
            value={[role]}
            onValueChange={(values) => setRole(values[0] as UserRole)}
            singleSelect={true}
            placeholder="Select role"
          />
          <FieldError message={errors?.role} />
        </div>
      </div>
      <Button
        disabled={isLoading}
        onClick={onCreate}
        className={`mt-6 w-full ${colors.buttonBg} transition-all duration-200 shadow-md hover:shadow-lg`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </span>
        ) : submitLabel}
      </Button>
      <StatusBanner status={status} />
    </>
  );

  if (!showCard) {
    return <div className="space-y-4">{formContent}</div>;
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${colors.iconBg} p-2`}>
            <svg className={`h-5 w-5 ${colors.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}