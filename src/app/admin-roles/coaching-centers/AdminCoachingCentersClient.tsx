"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@/components/multi-select";
import { useToast } from "@/shared/components/ui/ToastProvider";
import {
  getAdminOrganizations,
  invalidateAdminCoachingCenters,
} from "@/shared/lib/client/adminTenantReferenceData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrganizationOption = {
  id: string;
  name: string;
};

type CoachingCenterItem = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
};

type CoachingCenterFormErrors = Partial<Record<
  | "organizationId"
  | "coachingCenterName"
  | "coachingCenterCode"
  | "street"
  | "city"
  | "state"
  | "zipCode"
  | "contactEmail"
  | "contactPhone",
  string
>>;

type AdminCoachingCentersClientProps = {
  initialOrganizationId?: string;
};

export default function AdminCoachingCentersClient({
  initialOrganizationId = "",
}: AdminCoachingCentersClientProps) {
  const { toastMessage } = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterItem[]>([]);
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);
  const [searchText, setSearchText] = useState("");
  const [editingCoachingCenterId, setEditingCoachingCenterId] = useState<string | null>(null);
  const [deleteCoachingCenterId, setDeleteCoachingCenterId] = useState<string | null>(null);
  const [coachingCenterName, setCoachingCenterName] = useState("");
  const [coachingCenterCode, setCoachingCenterCode] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [statusValue, setStatusValue] = useState<"active" | "inactive">("active");
  const [formErrors, setFormErrors] = useState<CoachingCenterFormErrors>({});

  const organizationMap = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations]
  );

  const organizationOptions = useMemo(
    () =>
      organizations.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [organizations]
  );

  const filteredCoachingCenters = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return coachingCenters.filter((item) => {
      if (organizationId && item.organizationId !== organizationId) return false;
      if (!q) return true;
      const orgName = organizationMap.get(item.organizationId)?.toLowerCase() || "";
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        orgName.includes(q)
      );
    });
  }, [coachingCenters, searchText, organizationId, organizationMap]);

  async function loadOrganizations() {
    setOrganizationsLoading(true);
    try {
      const items = await getAdminOrganizations();
      setOrganizations(items);
      if (items.length === 1) {
        setOrganizationId((prev) => prev || items[0].id);
      }
    } catch {
      // handled by server auth/permission response when needed
    } finally {
      setOrganizationsLoading(false);
    }
  }

  const loadCoachingCenters = useCallback(async (selectedOrganizationId = organizationId) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrganizationId) params.set("organizationId", selectedOrganizationId);
      const response = await fetch(`/api/admin/coaching-centers?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = ((data as CoachingCenterItem[] | undefined) ?? []).map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        name: item.name,
        code: item.code,
        status: item.status,
        address: item.address,
        contactInfo: item.contactInfo,
      }));
      setCoachingCenters(items);
    } catch {
      // handled by server auth/permission response when needed
    } finally {
      setListLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadCoachingCenters();
  }, [loadCoachingCenters]);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  function clearForm() {
    setEditingCoachingCenterId(null);
    setCoachingCenterName("");
    setCoachingCenterCode("");
    setStreet("");
    setCity("");
    setStateValue("");
    setZipCode("");
    setCountry("India");
    setContactEmail("");
    setContactPhone("");
    setStatusValue("active");
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: CoachingCenterFormErrors = {};
    if (!organizationId.trim()) errors.organizationId = "Organization is required";
    if (!coachingCenterName.trim()) errors.coachingCenterName = "Coaching center name is required";
    if (!coachingCenterCode.trim()) errors.coachingCenterCode = "Coaching center code is required";
    if (!street.trim()) errors.street = "Street is required";
    if (!city.trim()) errors.city = "City is required";
    if (!stateValue.trim()) errors.state = "State is required";
    if (!zipCode.trim()) errors.zipCode = "Zip code is required";
    else if (zipCode.trim().length < 4) errors.zipCode = "Zip code looks too short";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim()) errors.contactEmail = "Contact email is required";
    else if (!emailRegex.test(contactEmail.trim())) errors.contactEmail = "Invalid email format";
    if (!contactPhone.trim()) errors.contactPhone = "Contact phone is required";
    else if (contactPhone.replace(/\D/g, "").length < 7) errors.contactPhone = "Invalid phone number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveCoachingCenter(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Please fix highlighted form errors.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const isEditing = Boolean(editingCoachingCenterId);
      const response = await fetch("/api/admin/coaching-centers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCoachingCenterId || undefined,
          organizationId: organizationId || undefined,
          coachingCenterName,
          coachingCenterCode,
          street,
          city,
          state: stateValue,
          zipCode,
          country,
          contactEmail,
          contactPhone,
          status: statusValue,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || `Failed to ${isEditing ? "update" : "create"} coaching center`);
        return;
      }
      invalidateAdminCoachingCenters();
      setMessage(`Coaching center ${isEditing ? "updated" : "created"} successfully.`);
      clearForm();
      await loadCoachingCenters();
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCoachingCenter(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("id", id);
      const response = await fetch(`/api/admin/coaching-centers?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to delete coaching center");
        return;
      }
      invalidateAdminCoachingCenters();
      setDeleteCoachingCenterId(null);
      if (editingCoachingCenterId === id) {
        clearForm();
      }
      setMessage("Coaching center deleted successfully.");
      await loadCoachingCenters();
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function startEditCoachingCenter(item: CoachingCenterItem) {
    setEditingCoachingCenterId(item.id);
    setOrganizationId(item.organizationId || "");
    setCoachingCenterName(item.name || "");
    setCoachingCenterCode(item.code || "");
    setStreet(item.address?.street || "");
    setCity(item.address?.city || "");
    setStateValue(item.address?.state || "");
    setZipCode(item.address?.zipCode || "");
    setCountry(item.address?.country || "India");
    setContactEmail(item.contactInfo?.email || "");
    setContactPhone(item.contactInfo?.phone || "");
    setStatusValue(item.status || "active");
    setMessage("Editing selected coaching center. Update details and save.");
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-lg shadow-emerald-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Coaching Center Management</h1>
              <p className="mt-2 text-sm text-emerald-50">
                Create and manage coaching centers under selected organization scope.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Coaching Centers</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Organization Scope</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Tenant Setup</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingCoachingCenterId ? "Edit Coaching Center" : "Create Coaching Center"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Select organization first. Organization admin users can only create coaching centers in their own organization.
          </p>
          <form onSubmit={handleSaveCoachingCenter} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <MultiSelect
                options={organizationOptions}
                value={organizationId ? [organizationId] : []}
                onValueChange={(values) => setOrganizationId(values[0] || '')}
                placeholder="Select organization"
                disabled={organizationsLoading}
                singleSelect
              />
            </div>
            {formErrors.organizationId && <p className="-mt-2 text-xs text-red-600">{formErrors.organizationId}</p>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coaching Center Name</label>
                <input value={coachingCenterName} onChange={(e) => setCoachingCenterName(e.target.value)} required className={inputClassName} />
                {formErrors.coachingCenterName && <p className="mt-1 text-xs text-red-600">{formErrors.coachingCenterName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Coaching Center Code</label>
                <input value={coachingCenterCode} onChange={(e) => setCoachingCenterCode(e.target.value)} required className={inputClassName} />
                {formErrors.coachingCenterCode && <p className="mt-1 text-xs text-red-600">{formErrors.coachingCenterCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} required className={inputClassName} />
                {formErrors.street && <p className="mt-1 text-xs text-red-600">{formErrors.street}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} required className={inputClassName} />
                {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input value={stateValue} onChange={(e) => setStateValue(e.target.value)} required className={inputClassName} />
                {formErrors.state && <p className="mt-1 text-xs text-red-600">{formErrors.state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} required className={inputClassName} />
                {formErrors.zipCode && <p className="mt-1 text-xs text-red-600">{formErrors.zipCode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClassName} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required type="email" className={inputClassName} />
                {formErrors.contactEmail && <p className="mt-1 text-xs text-red-600">{formErrors.contactEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className={inputClassName} />
                {formErrors.contactPhone && <p className="mt-1 text-xs text-red-600">{formErrors.contactPhone}</p>}
              </div>
            </div>

            {editingCoachingCenterId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as "active" | "inactive")}
                  className={inputClassName}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (editingCoachingCenterId ? "Updating..." : "Creating...") : editingCoachingCenterId ? "Update Coaching Center" : "Create Coaching Center"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={clearForm}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingCoachingCenterId ? "Cancel Edit" : "Clear Form"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Existing Coaching Centers</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Total: {coachingCenters.length}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Visible: {filteredCoachingCenters.length}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by coaching center, code, org, status or id"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => loadCoachingCenters()}
                disabled={listLoading}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {listLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50"
              >
                Clear Search
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Coaching Center</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Organization</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {filteredCoachingCenters.map((item) => (
                  <tr key={item.id} className={editingCoachingCenterId === item.id ? "bg-indigo-50/50" : ""}>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.code}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {organizationMap.get(item.organizationId) || item.organizationId}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{item.id}</td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => startEditCoachingCenter(item)}
                        disabled={loading}
                        className="mr-2 rounded-lg border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCoachingCenterId(item.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCoachingCenters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                      No coaching centers found for selected scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={Boolean(deleteCoachingCenterId)} onOpenChange={(open) => !open && setDeleteCoachingCenterId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Coaching Center</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Confirm deletion of the selected coaching center.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteCoachingCenterId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !deleteCoachingCenterId}
                onClick={() => deleteCoachingCenterId && handleDeleteCoachingCenter(deleteCoachingCenterId)}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
