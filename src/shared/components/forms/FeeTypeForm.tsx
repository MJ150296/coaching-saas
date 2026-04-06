'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/multi-select';
import { StatusBanner } from '@/app/admin-roles/admin/onboarding/components/StatusBanner';
import { FieldErrors, FormStatus, SelectOption, FeeTypeFormData, FEE_FREQUENCY_OPTIONS } from './types';

type FeeTypeFormProps = {
  // Form data
  formData: FeeTypeFormData;

  // Setters
  setFormData: (data: FeeTypeFormData) => void;

  // Frequency options (can be customized)
  frequencyOptions?: SelectOption[];

  // Frequency search
  frequencySearch?: string;
  setFrequencySearch?: (value: string) => void;

  // Actions
  onCreate: () => void;

  // Status
  status: FormStatus;
  errors?: FieldErrors;

  // UI customization
  title?: string;
  description?: string;
  submitLabel?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function FeeTypeForm({
  formData,
  setFormData,
  frequencyOptions = FEE_FREQUENCY_OPTIONS,
  onCreate,
  status,
  errors,
  title = 'Create Fee Type',
  description = 'Define a new fee type for your coaching center',
  submitLabel = 'Create Fee Type',
}: FeeTypeFormProps) {
  const isLoading = status.type === 'loading';

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Fee Type Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Fee Type Name"
              className={`transition-all duration-200 ${errors?.feeTypeName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-green-500 focus:ring-green-100'}`}
            />
            <FieldError message={errors?.feeTypeName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Amount</Label>
            <Input
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              type="number"
              placeholder="Amount"
              className={`transition-all duration-200 ${errors?.feeTypeAmount ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-green-500 focus:ring-green-100'}`}
            />
            <FieldError message={errors?.feeTypeAmount} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Frequency</Label>
            <MultiSelect
              options={frequencyOptions}
              value={[formData.frequency]}
              onValueChange={(values) => setFormData({ ...formData, frequency: values[0] || '' })}
              singleSelect={true}
              placeholder="Select frequency"
            />
            <FieldError message={errors?.feeTypeFrequency} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isMandatory}
              onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Mandatory
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isTaxable}
              onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Taxable
          </label>
        </div>
        <Button
          disabled={isLoading}
          onClick={onCreate}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
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