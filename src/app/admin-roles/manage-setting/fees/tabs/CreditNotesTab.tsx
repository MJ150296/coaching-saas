"use client";

import { useCallback, useEffect, useState } from "react";
import { MultiSelect } from "@/components/multi-select";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";

type CreditNoteItem = {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  createdOn: string;
  createdAt?: string;
};

type StudentOption = {
  id: string;
  name: string;
};

type CreditNotesTabProps = {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  academicYears: Array<{ id: string; name: string }>;
};

export default function CreditNotesTab({
  organizationId,
  coachingCenterId,
  academicYearId,
  academicYears,
}: CreditNotesTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [creditNotes, setCreditNotes] = useState<CreditNoteItem[]>([]);
  const [creditNotesTotal, setCreditNotesTotal] = useState(0);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Reference data
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Create form state
  const [formStudentId, setFormStudentId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formCreatedOn, setFormCreatedOn] = useState("");

  const academicYearOptions = academicYears.map((ay) => ({
    value: ay.id,
    label: ay.name,
  }));

  // Load students
  useEffect(() => {
    if (!organizationId || !coachingCenterId) return;

    async function loadStudents() {
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("coachingCenterId", coachingCenterId);
        params.set("role", "STUDENT");

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await response.json();

        setStudents(
          Array.isArray(data)
            ? data.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name }))
            : (data?.items ?? []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name }))
        );
      } catch {
        // Silently fail
      }
    }

    loadStudents();
  }, [organizationId, coachingCenterId]);

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load credit notes
  const loadCreditNotes = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setCreditNotes([]);
      setCreditNotesTotal(0);
      return;
    }

    setCreditNotesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (academicYearFilter.length > 0) params.set("academicYearId", academicYearFilter.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

      const response = await fetch(`/api/admin/credit-notes?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as CreditNoteItem[]) ?? [])
        : ((data?.items as CreditNoteItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setCreditNotes(items);
      setCreditNotesTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setCreditNotesLoading(false);
    }
  }, [organizationId, coachingCenterId, academicYearFilter, debouncedSearchText, currentPage, itemsPerPage]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, academicYearFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(creditNotesTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, creditNotesTotal);

  // Calculate total credit amount
  const totalCreditAmount = creditNotes.reduce((sum, cn) => sum + cn.amount, 0);

  // Create credit note
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/credit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          studentId: formStudentId,
          amount: Number(formAmount),
          reason: formReason,
          createdOn: formCreatedOn,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create credit note");
        return;
      }
      toastMessage("Credit note created successfully");
      setFormStudentId("");
      setFormAmount("");
      setFormReason("");
      setFormCreatedOn("");
      setShowCreateForm(false);
      await loadCreditNotes();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100";

  return (
    <div className="space-y-6">
      {/* Create Credit Note Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Credit Notes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Issue credit notes for fee adjustments or refunds
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {showCreateForm ? "Cancel" : "+ Issue Credit Note"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student</label>
                <div className="mt-1">
                  <MultiSelect
                    options={studentOptions}
                    value={formStudentId ? [formStudentId] : []}
                    onValueChange={(values) => setFormStudentId(values[0] || "")}
                    placeholder="Select student"
                    singleSelect
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Credit Amount</label>
                <input
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  type="number"
                  placeholder="e.g., 2000"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  value={formCreatedOn}
                  onChange={(e) => setFormCreatedOn(e.target.value)}
                  type="date"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g., Fee adjustment for mid-term withdrawal"
                  required
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !formStudentId || !formAmount || !formReason || !formCreatedOn}
                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Issue Credit Note"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFormStudentId("");
                  setFormAmount("");
                  setFormReason("");
                  setFormCreatedOn("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Credit Notes List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Issued Credit Notes</h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {creditNotesTotal}
            </span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              Credits: INR {totalCreditAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by student or reason..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
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
            onClick={() => loadCreditNotes()}
            disabled={creditNotesLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creditNotesLoading ? "Refreshing..." : "Refresh"}
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
              </tr>
            </thead>
            {creditNotesLoading ? (
              <TableLoader columns={4} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {creditNotes.map((item) => {
                  const studentName = students.find((s) => s.id === item.studentId)?.name || item.studentId;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">{studentName}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-rose-600">INR {item.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {new Date(item.createdOn).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {creditNotes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !coachingCenterId
                        ? "Select organization and coaching center to view credit notes."
                        : "No credit notes found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {creditNotesTotal > 0 && (
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
              Showing {startItem} to {endItem} of {creditNotesTotal} credit notes
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
                        ? "border-rose-500 bg-rose-500 text-white"
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
    </div>
  );
}