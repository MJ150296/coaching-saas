'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/multi-select';
import { FieldErrors, FormStatus, SelectOption, FeeTypeFormData, FeePlanFormData, FEE_FREQUENCY_OPTIONS } from './types';
import { FeePlanForm } from './FeePlanForm';

type FeesSetupFormProps = {
  // Fee Type Form Data
  feeTypeForm: FeeTypeFormData;
  setFeeTypeForm: (data: FeeTypeFormData) => void;
  
  // Fee Plan Form Data
  feePlanForm: FeePlanFormData;
  setFeePlanForm: (data: FeePlanFormData) => void;
  
  // Frequency options (can be customized)
  frequencyOptions?: SelectOption[];
  
  // Frequency search
  feeFrequencySearch?: string;
  setFeeFrequencySearch?: (value: string) => void;
  
  // Actions
  onCreateFeeType: () => void;
  onCreateFeePlan: () => void;
  onAssignFeePlan?: () => void;
  
  // Status
  statusFeeType: FormStatus;
  statusFeePlan: FormStatus;
  statusAssignFeePlan?: FormStatus;
  
  // Fee Plan Assignment
  skipAssignFeePlan?: boolean;
  setSkipAssignFeePlan?: (value: boolean) => void;
  
  // Errors
  errors?: FieldErrors;
  
  // UI customization
  title?: string;
  description?: string;
  showAssignmentSection?: boolean;
  
  // Tenant context for fee plan
  organizationId?: string;
  coachingCenterId?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

export function FeesSetupForm({
  feeTypeForm,
  setFeeTypeForm,
  feePlanForm,
  setFeePlanForm,
  frequencyOptions = FEE_FREQUENCY_OPTIONS,
  onCreateFeeType,
  onCreateFeePlan,
  onAssignFeePlan,
  statusFeeType,
  statusFeePlan,
  statusAssignFeePlan,
  skipAssignFeePlan = false,
  setSkipAssignFeePlan,
  errors,
  title = 'Fees Setup',
  description = 'Configure fee types and plans',
  showAssignmentSection = true,
  organizationId,
  coachingCenterId,
}: FeesSetupFormProps) {
  const isLoadingFeeType = statusFeeType.type === 'loading';
  const isLoadingAssign = statusAssignFeePlan?.type === 'loading';

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
        {/* Fee Type Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-green-500"></div>
            <p className="text-sm font-semibold text-gray-800">Fee Type</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Fee Type Name</Label>
              <Input
                value={feeTypeForm.name}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                placeholder="Fee Type Name"
                className={`transition-all duration-200 ${errors?.feeTypeName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-green-500 focus:ring-green-100'}`}
              />
              <FieldError message={errors?.feeTypeName} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Amount</Label>
              <Input
                value={feeTypeForm.amount}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })}
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
                value={[feeTypeForm.frequency]}
                onValueChange={(values) => setFeeTypeForm({ ...feeTypeForm, frequency: values[0] || '' })}
                singleSelect={true}
                placeholder="Select frequency"
              />
              <FieldError message={errors?.feeTypeFrequency} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={feeTypeForm.isMandatory}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, isMandatory: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Mandatory
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={feeTypeForm.isTaxable}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, isTaxable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Taxable
            </label>
          </div>
          <Button
            disabled={isLoadingFeeType}
            onClick={onCreateFeeType}
            className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isLoadingFeeType ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Fee Type'}
          </Button>
          {statusFeeType.type !== 'idle' && (
            <div className={`rounded-md px-3 py-2 text-sm font-medium ${
              statusFeeType.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              statusFeeType.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {statusFeeType.message}
            </div>
          )}
        </div>

        {/* Fee Plan Section */}
        <div className="mt-6">
          <FeePlanForm
            formData={feePlanForm}
            setFormData={setFeePlanForm}
            onCreate={onCreateFeePlan}
            status={statusFeePlan}
            errors={errors}
            organizationId={organizationId}
            coachingCenterId={coachingCenterId}
          />
        </div>

        {/* Fee Plan Assignment Section */}
        {showAssignmentSection && onAssignFeePlan && setSkipAssignFeePlan && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-purple-500"></div>
              <p className="text-sm font-semibold text-gray-800">Fee Plan Assignment (Optional)</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={skipAssignFeePlan}
                onChange={(e) => setSkipAssignFeePlan(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Skip fee plan assignment (optional)
            </label>
            <Button
              disabled={skipAssignFeePlan || isLoadingAssign}
              onClick={onAssignFeePlan}
              className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isLoadingAssign ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </span>
              ) : 'Assign Fee Plan to Program'}
            </Button>
            {statusAssignFeePlan && statusAssignFeePlan.type !== 'idle' && (
              <div className={`rounded-md px-3 py-2 text-sm font-medium ${
                statusAssignFeePlan.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                statusAssignFeePlan.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {statusAssignFeePlan.message}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}