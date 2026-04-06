'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/multi-select';
import { StatusBanner } from '@/app/admin-roles/admin/onboarding/components/StatusBanner';
import { FieldErrors, FormStatus, FeePlanFormData } from './types';
import { useState, useEffect, useCallback, useRef } from 'react';

type FeeTypeItem = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  isMandatory?: boolean;
};

type SelectedFeeType = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  customAmount?: number;
};

type FeePlanFormProps = {
  // Form data
  formData: FeePlanFormData;
  // Setters
  setFormData: (data: FeePlanFormData) => void;
  // Actions
  onCreate: () => void;
  // Status
  status: FormStatus;
  errors?: FieldErrors;
  // UI customization
  title?: string;
  description?: string;
  submitLabel?: string;
  // Fee type selection
  organizationId?: string;
  coachingCenterId?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

const FEE_PLAN_TEMPLATES = [
  {
    name: 'Standard Monthly Plan',
    description: 'Basic tuition with books and transport',
    items: ['Tuition Fee', 'Books & Materials', 'Transport Fee'],
  },
  {
    name: 'Annual Package',
    description: 'All fees bundled for the year',
    items: ['Tuition Fee', 'Books & Materials', 'Lab Fee', 'Exam Fee', 'Sports Fee'],
  },
  {
    name: 'Basic Plan',
    description: 'Tuition fee only',
    items: ['Tuition Fee'],
  },
];

export function FeePlanForm({
  formData,
  setFormData,
  onCreate,
  status,
  errors,
  title = 'Create Fee Plan',
  description = 'Group multiple fee types into a comprehensive fee plan',
  submitLabel = 'Create Fee Plan',
  organizationId,
  coachingCenterId,
}: FeePlanFormProps) {
  const isLoading = status.type === 'loading';
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);
  const [selectedFeeTypes, setSelectedFeeTypes] = useState<SelectedFeeType[]>([]);
  const [feeTypesLoading, setFeeTypesLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const latestFormDataRef = useRef(formData);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  // Load available fee types
  const loadFeeTypes = useCallback(async () => {
    if (!organizationId || !coachingCenterId) return;
    
    setFeeTypesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('organizationId', organizationId);
      params.set('coachingCenterId', coachingCenterId);
      params.set('limit', '100');
      
      const response = await fetch(`/api/admin/fee-types?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.items ?? [];
        setFeeTypes(items);
      }
    } catch (error) {
      console.error('Failed to load fee types:', error);
    } finally {
      setFeeTypesLoading(false);
    }
  }, [organizationId, coachingCenterId]);

  useEffect(() => {
    loadFeeTypes();
  }, [loadFeeTypes]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(formData.itemsJson || '[]');
      if (!Array.isArray(parsed)) return;

      const hydrated = parsed.map((item) => {
        const matchingFeeType = feeTypes.find((feeType) => feeType.id === item?.feeTypeId);
        return {
          id: String(item?.feeTypeId || matchingFeeType?.id || ''),
          name: String(item?.name || matchingFeeType?.name || ''),
          amount: Number(matchingFeeType?.amount ?? item?.amount ?? 0),
          frequency: String(item?.frequency || matchingFeeType?.frequency || 'MONTHLY'),
          customAmount:
            typeof item?.amount === 'number' && Number(item.amount) !== Number(matchingFeeType?.amount ?? item.amount)
              ? Number(item.amount)
              : undefined,
        };
      }).filter((item) => item.id && item.name);

      const nextSignature = JSON.stringify(hydrated);
      setSelectedFeeTypes((current) => {
        const currentSignature = JSON.stringify(current);
        return nextSignature === currentSignature ? current : hydrated;
      });
    } catch {
      setSelectedFeeTypes((current) => (current.length === 0 ? current : []));
    }
  }, [feeTypes, formData.itemsJson]);

  const syncSelectedFeeTypes = useCallback((nextSelectedFeeTypes: SelectedFeeType[]) => {
    const itemsJson = JSON.stringify(nextSelectedFeeTypes.map(ft => ({
      feeTypeId: ft.id,
      name: ft.name,
      amount: ft.customAmount ?? ft.amount,
      frequency: ft.frequency,
    })), null, 2);

    setSelectedFeeTypes(nextSelectedFeeTypes);
    if (latestFormDataRef.current.itemsJson !== itemsJson) {
      setFormData({ ...latestFormDataRef.current, itemsJson });
    }
  }, [setFormData]);

  const addFeeType = (feeType: FeeTypeItem) => {
    if (selectedFeeTypes.find(ft => ft.id === feeType.id)) return;
    syncSelectedFeeTypes([...selectedFeeTypes, {
      id: feeType.id,
      name: feeType.name,
      amount: feeType.amount,
      frequency: feeType.frequency,
    }]);
  };

  const removeFeeType = (id: string) => {
    syncSelectedFeeTypes(selectedFeeTypes.filter(ft => ft.id !== id));
  };

  const updateCustomAmount = (id: string, amount: number) => {
    syncSelectedFeeTypes(selectedFeeTypes.map(ft =>
      ft.id === id ? { ...ft, customAmount: amount } : ft
    ));
  };

  const applyTemplate = (template: typeof FEE_PLAN_TEMPLATES[0]) => {
    const matchingFeeTypes = feeTypes.filter(ft =>
      template.items.some(item => ft.name.toLowerCase().includes(item.toLowerCase()))
    );
    syncSelectedFeeTypes(matchingFeeTypes.map(ft => ({
      id: ft.id,
      name: ft.name,
      amount: ft.amount,
      frequency: ft.frequency,
    })));
    setFormData({ ...formData, name: template.name });
    setShowTemplates(false);
  };

  const totalAmount = selectedFeeTypes.reduce((sum, ft) => sum + (ft.customAmount ?? ft.amount), 0);
  const availableFeeTypes = feeTypes.filter(ft => !selectedFeeTypes.find(sft => sft.id === ft.id));

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Templates Section */}
        {showTemplates && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800 mb-3">Quick Start Templates</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {FEE_PLAN_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="text-left rounded-lg border border-blue-200 bg-white p-3 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fee Plan Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Fee Plan Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Standard Monthly Plan"
            className={`transition-all duration-200 ${errors?.feePlanName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`}
          />
          <FieldError message={errors?.feePlanName} />
        </div>

        {/* Fee Type Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Add Fee Types</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <MultiSelect
                options={availableFeeTypes.map(ft => ({
                  value: ft.id,
                  label: `${ft.name} (₹${ft.amount.toLocaleString()} - ${ft.frequency.replace('_', ' ')})`,
                }))}
                value={[]}
                onValueChange={(values) => {
                  const selected = feeTypes.find(ft => ft.id === values[0]);
                  if (selected) addFeeType(selected);
                }}
                singleSelect
                placeholder={feeTypesLoading ? "Loading fee types..." : "Select a fee type to add"}
                disabled={feeTypesLoading || availableFeeTypes.length === 0}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadFeeTypes}
              disabled={feeTypesLoading}
              className="shrink-0"
            >
              {feeTypesLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Selected Fee Types */}
        {selectedFeeTypes.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Selected Fee Types ({selectedFeeTypes.length})</Label>
            <div className="space-y-2">
              {selectedFeeTypes.map((ft) => (
                <div
                  key={ft.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ft.name}</p>
                    <p className="text-xs text-gray-500">{ft.frequency.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">₹</span>
                      <Input
                        type="number"
                        value={ft.customAmount ?? ft.amount}
                        onChange={(e) => updateCustomAmount(ft.id, Number(e.target.value))}
                        className="w-24 h-8 text-sm text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeeType(ft.id)}
                      className="rounded-full p-1 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Amount</p>
                  <p className="text-xs text-blue-600">{selectedFeeTypes.length} fee type(s) selected</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-blue-600">
                <span>Mandatory: {selectedFeeTypes.filter(ft => ft.frequency !== 'ONE_TIME').length}</span>
                <span>One-time: {selectedFeeTypes.filter(ft => ft.frequency === 'ONE_TIME').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedFeeTypes.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-600">No fee types added yet</p>
            <p className="mt-1 text-xs text-gray-400">Select fee types from the dropdown above or use a template</p>
          </div>
        )}

        <FieldError message={errors?.feePlanItemsJson} />

        <Button
          disabled={isLoading || selectedFeeTypes.length === 0 || !formData.name}
          onClick={onCreate}
          className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {submitLabel} - ₹{totalAmount.toLocaleString()}
            </>
          )}
        </Button>
        <StatusBanner status={status} />
      </CardContent>
    </Card>
  );
}
