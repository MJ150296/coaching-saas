"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MultiSelect } from "@/components/multi-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";

type AssignmentItem = {
  id: string;
  feePlanId: string;
  programId: string;
  batchId?: string;
  academicYearId: string;
  createdAt?: string;
};

type FeePlanOption = {
  id: string;
  name: string;
};

type ProgramOption = {
  id: string;
  name: string;
};

type BatchOption = {
  id: string;
  name: string;
  programId: string;
};

type AssignmentsTabProps = {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  academicYears: Array<{ id: string; name: string }>;
};

export default function AssignmentsTab({
  organizationId,
  coachingCenterId,
  academicYearId,
  academicYears,
}: AssignmentsTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [assignmentsTotal, setAssignmentsTotal] = useState(0);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [academicYearFilter, setAcademicYearFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentItem | null>(null);

  // Reference data
  const [feePlans, setFeePlans] = useState<FeePlanOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Create form state
  const [formFeePlanId, setFormFeePlanId] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [editAcademicYearId, setEditAcademicYearId] = useState("");
  const [editFeePlanId, setEditFeePlanId] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editBatchId, setEditBatchId] = useState("");

  const academicYearOptions = academicYears.map((ay) => ({
    value: ay.id,
    label: ay.name,
  }));

  const feePlanOptions = feePlans.map((fp) => ({
    value: fp.id,
    label: fp.name,
  }));

  const programOptions = programs.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const batchOptions = batches
    .filter((b) => !formProgramId || b.programId === formProgramId)
    .map((b) => ({
      value: b.id,
      label: b.name,
    }));

  const editBatchOptions = batches
    .filter((b) => !editProgramId || b.programId === editProgramId)
    .map((b) => ({
      value: b.id,
      label: b.name,
    }));

  // Load reference data
  useEffect(() => {
    if (!organizationId || !coachingCenterId) return;

    async function loadReferenceData() {
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("coachingCenterId", coachingCenterId);

        const [feePlansRes, programsRes, batchesRes] = await Promise.all([
          fetch(`/api/admin/fee-plans?${params.toString()}`),
          fetch(`/api/admin/coaching-programs?${params.toString()}`),
          fetch(`/api/admin/coaching-batches?${params.toString()}`),
        ]);

        const feePlansData = await feePlansRes.json();
        const programsData = await programsRes.json();
        const batchesData = await batchesRes.json();

        setFeePlans(
          Array.isArray(feePlansData)
            ? feePlansData.map((fp: { id: string; name: string }) => ({ id: fp.id, name: fp.name }))
            : (feePlansData?.items ?? []).map((fp: { id: string; name: string }) => ({ id: fp.id, name: fp.name }))
        );

        setPrograms(
          Array.isArray(programsData)
            ? programsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
            : (programsData?.items ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
        );

        setBatches(
          Array.isArray(batchesData)
            ? batchesData.map((b: { id: string; name: string; programId: string }) => ({ id: b.id, name: b.name, programId: b.programId }))
            : (batchesData?.items ?? []).map((b: { id: string; name: string; programId: string }) => ({ id: b.id, name: b.name, programId: b.programId }))
        );
      } catch {
        // Silently fail - reference data will be empty
      }
    }

    loadReferenceData();
  }, [organizationId, coachingCenterId]);

  // Load assignments
  const loadAssignments = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setAssignments([]);
      setAssignmentsTotal(0);
      return;
    }

    setAssignmentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (academicYearFilter.length > 0) params.set("academicYearId", academicYearFilter.join(","));

      const response = await fetch(`/api/admin/fee-assignments?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as AssignmentItem[]) ?? [])
        : ((data?.items as AssignmentItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setAssignments(items);
      setAssignmentsTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setAssignmentsLoading(false);
    }
  }, [organizationId, coachingCenterId, academicYearFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [academicYearFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(assignmentsTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, assignmentsTotal);

  // Create assignment
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          feePlanId: formFeePlanId,
          programId: formProgramId,
          batchId: formBatchId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create assignment");
        return;
      }
      toastMessage("Fee plan assignment created successfully");
      setFormFeePlanId("");
      setFormProgramId("");
      setFormBatchId("");
      setShowCreateForm(false);
      await loadAssignments();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(item: AssignmentItem) {
    setEditingAssignment(item);
    setEditAcademicYearId(item.academicYearId);
    setEditFeePlanId(item.feePlanId);
    setEditProgramId(item.programId);
    setEditBatchId(item.batchId || "");
  }

  async function handleUpdate() {
    if (!editingAssignment) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fee-assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAssignment.id,
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: editAcademicYearId || undefined,
          feePlanId: editFeePlanId,
          programId: editProgramId,
          batchId: editBatchId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to update assignment");
        return;
      }
      toastMessage("Assignment updated successfully");
      setEditingAssignment(null);
      await loadAssignments();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingAssignment) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("id", deletingAssignment.id);
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      const response = await fetch(`/api/admin/fee-assignments?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to delete assignment");
        return;
      }
      toastMessage("Assignment deleted successfully");
      setDeletingAssignment(null);
      await loadAssignments();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Assignment Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fee Plan Assignments</h2>
            <p className="mt-1 text-sm text-gray-600">
              Link fee plans to specific programs and batches
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            {showCreateForm ? "Cancel" : "+ Create Assignment"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Plan</label>
                <div className="mt-1">
                  <MultiSelect
                    options={feePlanOptions}
                    value={formFeePlanId ? [formFeePlanId] : []}
                    onValueChange={(values) => setFormFeePlanId(values[0] || "")}
                    placeholder="Select fee plan"
                    singleSelect
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Program</label>
                <div className="mt-1">
                  <MultiSelect
                    options={programOptions}
                    value={formProgramId ? [formProgramId] : []}
                    onValueChange={(values) => {
                      setFormProgramId(values[0] || "");
                      setFormBatchId("");
                    }}
                    placeholder="Select program"
                    singleSelect
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch (Optional)</label>
                <div className="mt-1">
                  <MultiSelect
                    options={batchOptions}
                    value={formBatchId ? [formBatchId] : []}
                    onValueChange={(values) => setFormBatchId(values[0] || "")}
                    placeholder="Select batch"
                    singleSelect
                    disabled={!formProgramId}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !formFeePlanId || !formProgramId}
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Assignment"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFormFeePlanId("");
                  setFormProgramId("");
                  setFormBatchId("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Assignments List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Existing Assignments</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {assignmentsTotal}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            onClick={() => loadAssignments()}
            disabled={assignmentsLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assignmentsLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAcademicYearFilter([]);
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fee Plan</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Program</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Batch</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            {assignmentsLoading ? (
              <TableLoader columns={6} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {assignments.map((item) => {
                  const feePlanName = feePlans.find((fp) => fp.id === item.feePlanId)?.name || item.feePlanId;
                  const programName = programs.find((p) => p.id === item.programId)?.name || item.programId;
                  const batchName = item.batchId ? (batches.find((b) => b.id === item.batchId)?.name || item.batchId) : "-";
                  const ayName = academicYears.find((ay) => ay.id === item.academicYearId)?.name || item.academicYearId;
                  return (
                    <tr key={item.id} className={editingAssignment?.id === item.id ? "bg-purple-50/70" : undefined}>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">{feePlanName}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                          {programName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{batchName}</td>
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
                            aria-label={`Edit assignment ${item.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAssignment(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Delete assignment ${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !coachingCenterId
                        ? "Select organization and coaching center to view assignments."
                        : "No fee plan assignments found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {assignmentsTotal > 0 && (
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
              Showing {startItem} to {endItem} of {assignmentsTotal} assignments
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
                        ? "border-purple-500 bg-purple-500 text-white"
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

      <Dialog open={Boolean(editingAssignment)} onOpenChange={(open) => !open && setEditingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Plan Assignment</DialogTitle>
            <DialogDescription>Update the fee plan, program, batch, or academic year for this assignment.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Plan</label>
              <div className="mt-1">
                <MultiSelect
                  options={feePlanOptions}
                  value={editFeePlanId ? [editFeePlanId] : []}
                  onValueChange={(values) => setEditFeePlanId(values[0] || "")}
                  placeholder="Select fee plan"
                  singleSelect
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <div className="mt-1">
                <MultiSelect
                  options={programOptions}
                  value={editProgramId ? [editProgramId] : []}
                  onValueChange={(values) => {
                    setEditProgramId(values[0] || "");
                    setEditBatchId("");
                  }}
                  placeholder="Select program"
                  singleSelect
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch (Optional)</label>
              <div className="mt-1">
                <MultiSelect
                  options={editBatchOptions}
                  value={editBatchId ? [editBatchId] : []}
                  onValueChange={(values) => setEditBatchId(values[0] || "")}
                  placeholder="Select batch"
                  singleSelect
                  disabled={!editProgramId}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingAssignment(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading || !editAcademicYearId || !editFeePlanId || !editProgramId}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingAssignment)} onOpenChange={(open) => !open && setDeletingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Remove this fee plan assignment from the selected scope? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeletingAssignment(null)}
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
              {loading ? "Deleting..." : "Delete Assignment"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
