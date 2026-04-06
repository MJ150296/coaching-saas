'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBanner } from '@/app/admin-roles/admin/onboarding/components/StatusBanner';
import { FieldErrors, FormStatus, OrganizationFormData } from './types';

type OrganizationFormProps = {
  // Form data
  formData: OrganizationFormData;

  // Setters
  setFormData: (data: OrganizationFormData) => void;

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

export function OrganizationForm({
  formData,
  setFormData,
  onCreate,
  status,
  errors,
  title = 'Create Organization',
  description = 'Set up a new organization in the system',
  submitLabel = 'Create Organization',
}: OrganizationFormProps) {
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
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
            <Input
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              placeholder="Organization Name"
              className={`transition-all duration-200 ${errors?.organizationName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`}
            />
            <FieldError message={errors?.organizationName} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <Input
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Type"
              className={`transition-all duration-200 ${errors?.type ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`}
            />
            <FieldError message={errors?.type} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Street</Label>
            <Input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Street"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">City</Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">State</Label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Zip Code</Label>
            <Input
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="Zip Code"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Country</Label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Email</Label>
            <Input
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="Contact Email"
              className={`transition-all duration-200 ${errors?.contactEmail ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'focus:border-blue-500 focus:ring-blue-100'}`}
            />
            <FieldError message={errors?.contactEmail} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
            <Input
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="Contact Phone"
              className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-100"
            />
          </div>
        </div>
        <Button
          disabled={isLoading}
          onClick={onCreate}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
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