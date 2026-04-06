'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/multi-select';
import { StatusBanner } from '@/app/admin-roles/admin/onboarding/components/StatusBanner';
import { FieldErrors, FormStatus, SelectOption, AcademicYearFormData } from './types';

type AcademicYearFormProps = {
  // Form data
  formData: AcademicYearFormData;

  // Setters
  setFormData: (data: AcademicYearFormData) => void;

  // Actions
  onCreate: () => void;

  // Status
  status: FormStatus;
  errors?: FieldErrors;

  // Existing academic year selection (optional)
  academicYearId?: string;
  setAcademicYearId?: (value: string) => void;
  academicYearOptions?: SelectOption[];
  academicYearSearch?: string;
  setAcademicYearSearch?: (value: string) => void;
  onRefreshAcademicYears?: () => void;
  tenantDisabled?: boolean;

  // UI customization
  title?: string;
  description?: string;
  submitLabel?: string;
  showExistingSection?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function AcademicYearForm({
  formData,
  setFormData,
  onCreate,
  status,
  errors,
  academicYearId,
  setAcademicYearId,
  academicYearOptions = [],
  onRefreshAcademicYears,
  tenantDisabled = false,
  title = 'Academic Setup',
  description = 'Create academic years for your coaching center',
  submitLabel = 'Create Academic Year',
  showExistingSection = true,
}: AcademicYearFormProps) {
  const isLoading = status.type === 'loading';

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-100 p-2">
            <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showExistingSection && setAcademicYearId && (
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Use Existing (Optional)</p>
            <p className="mt-1 text-xs text-gray-600">Select existing academic year if already created.</p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <MultiSelect
                options={academicYearOptions}
                value={[academicYearId || '']}
                onValueChange={(values) => setAcademicYearId(values[0] || '')}
                singleSelect={true}
                placeholder="Select academic year"
                disabled={tenantDisabled}
              />
            </div>
            {onRefreshAcademicYears && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshAcademicYears}
                  disabled={tenantDisabled}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Refresh Academic Years
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="mb-3 text-sm font-semibold text-gray-800">
          {showExistingSection && setAcademicYearId ? 'Or Create New' : 'Create Academic Year'}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Academic Year Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Academic Year Name"
              className={`transition-all duration-200 ${errors?.yearName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`}
            />
            <FieldError message={errors?.yearName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`transition-all duration-200 ${errors?.yearStartDate ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`}
            />
            <FieldError message={errors?.yearStartDate} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={`transition-all duration-200 ${errors?.yearEndDate ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-sky-500 focus:ring-sky-100'}`}
            />
            <FieldError message={errors?.yearEndDate} />
          </div>
        </div>
        <Button
          disabled={isLoading}
          onClick={onCreate}
          className="mt-4 w-full bg-sky-600 hover:bg-sky-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
      </CardContent>
    </Card>
  );
}