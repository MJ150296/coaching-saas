"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MultiSelect } from "@/components/multi-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { FeePlanForm } from "@/shared/components/forms";

type FeePlanItem = {
  id: string;
  name: string;
  academicYearId: string;
  items?: Array<{ feeTypeId: string; name: string; amount: number }>;
  createdAt?: string;
};

type FeePlansTabProps = {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  academicYears: Array<{ id: string; name: string }>;
};

export default function FeePlansTab({
  organizationId,
  coachingCenterId,
  academicYearId,
  academicYears,
}: FeePlansTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [feePlans, setFeePlans] = useState<FeePlanItem[]>([]);
  const [feePlansTotal, setFeePlansTotal] = useState(0);
  const [feePlansLoading, setFeePlansLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeePlan, setEditingFeePlan] = useState<FeePlanItem | null>(null);
  const [deletingFeePlan, setDeletingFeePlan] = useState<FeePlanItem | null>(null);

  // Create form state - using FeePlanForm component
  const [feePlanForm, setFeePlanForm] = useState({
    name: "",
    itemsJson: "[]"
  });
  const [editFeePlanForm, setEditFeePlanForm] = useState({
    name: "",
    itemsJson: "[]"
  });
  const [editAcademicYearId, setEditAcademicYearId] = useState("");

  const academicYearOptions = academicYears.map((ay) => ({
    value: ay.id,
    label: ay.name,
  }));

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load fee plans
  const loadFeePlans = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setFeePlans([]);
      setFeePlansTotal(0);
      return;
    }

    setFeePlansLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (academicYearFilter.length > 0) params.set("academicYearId", academicYearFilter.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

      const response = await fetch(`/api/admin/fee-plans?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as FeePlanItem[]) ?? [])
        : ((data?.items as FeePlanItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setFeePlans(items);
      setFeePlansTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setFeePlansLoading(false);
    }
  }, [organizationId, coachingCenterId, academicYearFilter, debouncedSearchText, currentPage, itemsPerPage]);

  useEffect(() => {
    loadFeePlans();
  }, [loadFeePlans]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, academicYearFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(feePlansTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, feePlansTotal);

  function parseItems(input: string) {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Create fee plan
  async function handleCreate() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          name: feePlanForm.name,
          items: parseItems(feePlanForm.itemsJson),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create fee plan");
        return;
      }
      toastMessage("Fee plan created successfully");
      setFeePlanForm({ name: "", itemsJson: "[]" });
      setShowCreateForm(false);
      await loadFeePlans();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(item: FeePlanItem) {
    setEditingFeePlan(item);
    setEditAcademicYearId(item.academicYearId);
    setEditFeePlanForm({
      name: item.name,
      itemsJson: JSON.stringify(item.items ?? [], null, 2),
    });
  }

  async function handleUpdate() {
    if (!editingFeePlan) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFeePlan.id,
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: editAcademicYearId || undefined,
          name: editFeePlanForm.name,
          items: parseItems(editFeePlanForm.itemsJson),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to update fee plan");
        return;
      }
      toastMessage("Fee plan updated successfully");
      setEditingFeePlan(null);
      await loadFeePlans();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingFeePlan) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("id", deletingFeePlan.id);
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      const response = await fetch(`/api/admin/fee-plans?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to delete fee plan");
        return;
      }
      toastMessage("Fee plan deleted successfully");
      setDeletingFeePlan(null);
      await loadFeePlans();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Fee Plan Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fee Plans</h2>
            <p className="mt-1 text-sm text-gray-600">
              Group multiple fee types into comprehensive fee plans
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "+ Create Fee Plan"}
          </button>
        </div>

        {showCreateForm && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <FeePlanForm
              formData={feePlanForm}
              setFormData={setFeePlanForm}
              onCreate={handleCreate}
              status={{ type: loading ? 'loading' : 'idle', message: '' }}
              organizationId={organizationId}
              coachingCenterId={coachingCenterId}
            />
          </div>
        )}
      </div>

      {/* Fee Plans List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Existing Fee Plans</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {feePlansTotal}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search Fee Plan
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <MultiSelect
            options={[{ value: "", label: "All Academic Years" }, ...academicYearOptions]}
            onValueChange={setAcademicYearFilter}
            defaultValue={academicYearFilter}
            placeholder="Filter by academic year"
            className="w-full"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadFeePlans()}
            disabled={feePlansLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {feePlansLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAcademicYearFilter([]);
              setSearchText("");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Items</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            {feePlansLoading ? (
              <TableLoader columns={5} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {feePlans.map((item) => {
                  const ayName = academicYears.find((ay) => ay.id === item.academicYearId)?.name || item.academicYearId;
                  return (
                    <tr key={item.id} className={editingFeePlan?.id === item.id ? "bg-blue-50/70" : undefined}>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {item.items?.length ?? 0} items
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{ayName}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingFeePlan(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {feePlans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !coachingCenterId
                        ? "Select organization and coaching center to view fee plans."
                        : "No fee plans found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {feePlansTotal > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            <div className="text-sm text-gray-600">
              Showing {startItem} to {endItem} of {feePlansTotal} fee plans
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-md border px-2 py-1 text-sm ${
                      currentPage === pageNum
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={Boolean(editingFeePlan)} onOpenChange={(open) => !open && setEditingFeePlan(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Fee Plan</DialogTitle>
            <DialogDescription>Update the fee plan name, academic year, and included fee types.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <div className="mt-1">
                <MultiSelect
                  options={academicYearOptions}
                  value={editAcademicYearId ? [editAcademicYearId] : []}
                  onValueChange={(values) => setEditAcademicYearId(values[0] || "")}
                  placeholder="Select academic year"
                  singleSelect
                />
              </div>
            </div>
            <FeePlanForm
              formData={editFeePlanForm}
              setFormData={setEditFeePlanForm}
              onCreate={handleUpdate}
              status={{ type: loading ? "loading" : "idle", message: "" }}
              title="Update Fee Plan"
              description="Refine the plan structure and included fee types."
              submitLabel="Save Changes"
              organizationId={organizationId}
              coachingCenterId={coachingCenterId}
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingFeePlan(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingFeePlan)} onOpenChange={(open) => !open && setDeletingFeePlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Plan</DialogTitle>
            <DialogDescription>
              {deletingFeePlan ? `Delete ${deletingFeePlan.name}? This cannot be undone.` : "Delete this fee plan?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeletingFeePlan(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Delete Fee Plan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
