"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MultiSelect } from "@/components/multi-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";

type FeeTypeItem = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  isMandatory?: boolean;
  isTaxable?: boolean;
  createdAt?: string;
};

type FeeTypesTabProps = {
  organizationId: string;
  coachingCenterId: string;
};

export default function FeeTypesTab({
  organizationId,
  coachingCenterId,
}: FeeTypesTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);
  const [feeTypesTotal, setFeeTypesTotal] = useState(0);
  const [feeTypesLoading, setFeeTypesLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [feeTypeName, setFeeTypeName] = useState("");
  const [feeTypeAmount, setFeeTypeAmount] = useState("");
  const [feeTypeFrequency, setFeeTypeFrequency] = useState("MONTHLY");
  const [feeTypeMandatory, setFeeTypeMandatory] = useState(true);
  const [feeTypeTaxable, setFeeTypeTaxable] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeTypeItem | null>(null);
  const [deletingFeeType, setDeletingFeeType] = useState<FeeTypeItem | null>(null);
  const [editFeeTypeName, setEditFeeTypeName] = useState("");
  const [editFeeTypeAmount, setEditFeeTypeAmount] = useState("");
  const [editFeeTypeFrequency, setEditFeeTypeFrequency] = useState("MONTHLY");
  const [editFeeTypeMandatory, setEditFeeTypeMandatory] = useState(true);
  const [editFeeTypeTaxable, setEditFeeTypeTaxable] = useState(false);

  const feeFrequencyOptions = [
    { value: "ONE_TIME", label: "One Time" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load fee types
  const loadFeeTypes = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setFeeTypes([]);
      setFeeTypesTotal(0);
      return;
    }

    setFeeTypesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (frequencyFilter.length > 0) params.set("frequency", frequencyFilter.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

      const response = await fetch(`/api/admin/fee-types?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as FeeTypeItem[]) ?? [])
        : ((data?.items as FeeTypeItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setFeeTypes(items);
      setFeeTypesTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setFeeTypesLoading(false);
    }
  }, [organizationId, coachingCenterId, frequencyFilter, debouncedSearchText, currentPage, itemsPerPage]);

  useEffect(() => {
    loadFeeTypes();
  }, [loadFeeTypes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, frequencyFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(feeTypesTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, feeTypesTotal);

  // Create fee type
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          name: feeTypeName,
          amount: feeTypeAmount ? Number(feeTypeAmount) : 0,
          frequency: feeTypeFrequency,
          isMandatory: feeTypeMandatory,
          isTaxable: feeTypeTaxable,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create fee type");
        return;
      }
      toastMessage("Fee type created successfully");
      setFeeTypeName("");
      setFeeTypeAmount("");
      setFeeTypeFrequency("MONTHLY");
      setFeeTypeMandatory(true);
      setFeeTypeTaxable(false);
      setShowCreateForm(false);
      await loadFeeTypes();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(item: FeeTypeItem) {
    setEditingFeeType(item);
    setEditFeeTypeName(item.name);
    setEditFeeTypeAmount(String(item.amount));
    setEditFeeTypeFrequency(item.frequency);
    setEditFeeTypeMandatory(item.isMandatory !== false);
    setEditFeeTypeTaxable(Boolean(item.isTaxable));
  }

  async function handleUpdate() {
    if (!editingFeeType) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFeeType.id,
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          name: editFeeTypeName,
          amount: editFeeTypeAmount ? Number(editFeeTypeAmount) : 0,
          frequency: editFeeTypeFrequency,
          isMandatory: editFeeTypeMandatory,
          isTaxable: editFeeTypeTaxable,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to update fee type");
        return;
      }
      toastMessage("Fee type updated successfully");
      setEditingFeeType(null);
      await loadFeeTypes();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingFeeType) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("id", deletingFeeType.id);
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      const response = await fetch(`/api/admin/fee-types?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to delete fee type");
        return;
      }
      toastMessage("Fee type deleted successfully");
      setDeletingFeeType(null);
      await loadFeeTypes();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="space-y-6">
      {/* Create Fee Type Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fee Types</h2>
            <p className="mt-1 text-sm text-gray-600">
              Define different types of fees for your coaching center
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showCreateForm ? "Cancel" : "+ Create Fee Type"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  value={feeTypeName}
                  onChange={(e) => setFeeTypeName(e.target.value)}
                  placeholder="e.g., Tuition Fee"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  value={feeTypeAmount}
                  onChange={(e) => setFeeTypeAmount(e.target.value)}
                  type="number"
                  placeholder="e.g., 5000"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <div className="mt-1">
                  <MultiSelect
                    options={feeFrequencyOptions}
                    value={feeTypeFrequency ? [feeTypeFrequency] : []}
                    onValueChange={(values) => setFeeTypeFrequency(values[0] || "")}
                    placeholder="Select frequency"
                    singleSelect
                  />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeTypeMandatory}
                    onChange={(e) => setFeeTypeMandatory(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Mandatory
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeTypeTaxable}
                    onChange={(e) => setFeeTypeTaxable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Taxable
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Fee Type"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFeeTypeName("");
                  setFeeTypeAmount("");
                  setFeeTypeFrequency("MONTHLY");
                  setFeeTypeMandatory(true);
                  setFeeTypeTaxable(false);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Fee Types List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Existing Fee Types</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {feeTypesTotal}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search Fee Type
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <MultiSelect
            options={[{ value: "", label: "All Frequencies" }, ...feeFrequencyOptions]}
            onValueChange={setFrequencyFilter}
            defaultValue={frequencyFilter}
            placeholder="Filter by frequency"
            className="w-full"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadFeeTypes()}
            disabled={feeTypesLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {feeTypesLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFrequencyFilter([]);
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Frequency</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mandatory</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Taxable</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            {feeTypesLoading ? (
              <TableLoader columns={6} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {feeTypes.map((item) => (
                  <tr key={item.id} className={editingFeeType?.id === item.id ? "bg-emerald-50/70" : undefined}>
                    <td className="px-3 py-2 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">INR {item.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.frequency.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {item.isMandatory !== false ? (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Yes</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {item.isTaxable ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Yes</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">No</span>
                      )}
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
                          onClick={() => setDeletingFeeType(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {feeTypes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !coachingCenterId
                        ? "Select organization and coaching center to view fee types."
                        : "No fee types found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {feeTypesTotal > 0 && (
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
              Showing {startItem} to {endItem} of {feeTypesTotal} fee types
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
                        ? "border-emerald-500 bg-emerald-500 text-white"
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

      <Dialog open={Boolean(editingFeeType)} onOpenChange={(open) => !open && setEditingFeeType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Type</DialogTitle>
            <DialogDescription>Update the fee type details for this coaching center.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                value={editFeeTypeName}
                onChange={(e) => setEditFeeTypeName(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                value={editFeeTypeAmount}
                onChange={(e) => setEditFeeTypeAmount(e.target.value)}
                type="number"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <div className="mt-1">
                <MultiSelect
                  options={feeFrequencyOptions}
                  value={editFeeTypeFrequency ? [editFeeTypeFrequency] : []}
                  onValueChange={(values) => setEditFeeTypeFrequency(values[0] || "")}
                  placeholder="Select frequency"
                  singleSelect
                />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFeeTypeMandatory}
                  onChange={(e) => setEditFeeTypeMandatory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Mandatory
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFeeTypeTaxable}
                  onChange={(e) => setEditFeeTypeTaxable(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Taxable
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingFeeType(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingFeeType)} onOpenChange={(open) => !open && setDeletingFeeType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Type</DialogTitle>
            <DialogDescription>
              {deletingFeeType ? `Delete ${deletingFeeType.name}? This cannot be undone.` : "Delete this fee type?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeletingFeeType(null)}
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
              {loading ? "Deleting..." : "Delete Fee Type"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
