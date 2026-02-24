"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/shared/components/ui/ToastProvider";
import {
  invalidateAdminTenantReferenceData,
} from "@/shared/lib/client/adminTenantReferenceData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrganizationItem = {
  id: string;
  name: string;
  type: string;
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

type OrganizationFormErrors = Partial<Record<
  | "organizationName"
  | "organizationType"
  | "street"
  | "city"
  | "state"
  | "zipCode"
  | "contactEmail"
  | "contactPhone",
  string
>>;

export default function OrganizationsPage() {
  const { toastMessage } = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [deleteOrganizationId, setDeleteOrganizationId] = useState<string | null>(null);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("Private");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [statusValue, setStatusValue] = useState<"active" | "inactive">("active");
  const [formErrors, setFormErrors] = useState<OrganizationFormErrors>({});

  const filteredOrganizations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [organizations, searchText]);

  async function loadOrganizations() {
    setListLoading(true);
    try {
      const response = await fetch("/api/admin/organizations");
      const data = await response.json();
      if (!response.ok) return;
      setOrganizations(((data as OrganizationItem[] | undefined) ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        address: item.address,
        contactInfo: item.contactInfo,
      })));
    } catch {
      // handled by server auth/permission response when needed
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  function clearForm() {
    setEditingOrganizationId(null);
    setOrganizationName("");
    setOrganizationType("Private");
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
    const errors: OrganizationFormErrors = {};
    if (!organizationName.trim()) errors.organizationName = "Organization name is required";
    if (!organizationType.trim()) errors.organizationType = "Type is required";
    if (!street.trim()) errors.street = "Street is required";
    if (!city.trim()) errors.city = "City is required";
    if (!stateValue.trim()) errors.state = "State is required";
    if (!zipCode.trim()) errors.zipCode = "Zip code is required";
    if (zipCode.trim() && zipCode.trim().length < 4) {
      errors.zipCode = "Zip code looks too short";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim()) errors.contactEmail = "Contact email is required";
    else if (!emailRegex.test(contactEmail.trim())) errors.contactEmail = "Invalid email format";
    if (!contactPhone.trim()) errors.contactPhone = "Contact phone is required";
    else if (contactPhone.replace(/\D/g, "").length < 7) errors.contactPhone = "Invalid phone number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Please fix highlighted form errors.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const isEditing = Boolean(editingOrganizationId);
      const response = await fetch("/api/admin/organizations", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOrganizationId || undefined,
          organizationName,
          type: organizationType,
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
        setMessage(data?.error || `Failed to ${isEditing ? "update" : "create"} organization`);
        return;
      }
      invalidateAdminTenantReferenceData();
      setMessage(`Organization ${isEditing ? "updated" : "created"} successfully.`);
      clearForm();
      await loadOrganizations();
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrganization(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("id", id);
      const response = await fetch(`/api/admin/organizations?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to delete organization");
        return;
      }
      invalidateAdminTenantReferenceData();
      setDeleteOrganizationId(null);
      if (editingOrganizationId === id) {
        clearForm();
      }
      setMessage("Organization deleted successfully.");
      await loadOrganizations();
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function startEditOrganization(item: OrganizationItem) {
    setEditingOrganizationId(item.id);
    setOrganizationName(item.name || "");
    setOrganizationType(item.type || "Private");
    setStreet(item.address?.street || "");
    setCity(item.address?.city || "");
    setStateValue(item.address?.state || "");
    setZipCode(item.address?.zipCode || "");
    setCountry(item.address?.country || "India");
    setContactEmail(item.contactInfo?.email || "");
    setContactPhone(item.contactInfo?.phone || "");
    setStatusValue(item.status || "active");
    setMessage("Editing selected organization. Update details and save.");
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-sky-100 bg-linear-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 shadow-lg shadow-sky-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Organization Management</h1>
              <p className="mt-2 text-sm text-sky-50">
                Create and review organizations for multi-tenant school operations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Organizations</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Tenant Setup</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Admin Scope</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingOrganizationId ? "Edit Organization" : "Create Organization"}
          </h2>
          <form onSubmit={handleSaveOrganization} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required className={inputClassName} />
                {formErrors.organizationName && <p className="mt-1 text-xs text-red-600">{formErrors.organizationName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <input value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} required className={inputClassName} />
                {formErrors.organizationType && <p className="mt-1 text-xs text-red-600">{formErrors.organizationType}</p>}
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

            {editingOrganizationId && (
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
                {loading ? (editingOrganizationId ? "Updating..." : "Creating...") : editingOrganizationId ? "Update Organization" : "Create Organization"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={clearForm}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingOrganizationId ? "Cancel Edit" : "Clear Form"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Existing Organizations</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Total: {organizations.length}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Visible: {filteredOrganizations.length}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, type, status or id"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={loadOrganizations}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Organization</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {filteredOrganizations.map((item) => (
                  <tr key={item.id} className={editingOrganizationId === item.id ? "bg-indigo-50/50" : ""}>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.type}</td>
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
                        onClick={() => startEditOrganization(item)}
                        disabled={loading}
                        className="mr-2 rounded-lg border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteOrganizationId(item.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrganizations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={Boolean(deleteOrganizationId)} onOpenChange={(open) => !open && setDeleteOrganizationId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Organization</DialogTitle>
              <DialogDescription>
                This action cannot be undone. If the organization has schools, deletion will be blocked.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteOrganizationId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !deleteOrganizationId}
                onClick={() => deleteOrganizationId && handleDeleteOrganization(deleteOrganizationId)}
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
