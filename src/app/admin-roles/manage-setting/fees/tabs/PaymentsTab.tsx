"use client";

import { useCallback, useEffect, useState } from "react";
import { MultiSelect } from "@/components/multi-select";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";

type PaymentItem = {
  id: string;
  studentId: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
  createdAt?: string;
};

type StudentOption = {
  id: string;
  name: string;
};

type PaymentsTabProps = {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  academicYears: Array<{ id: string; name: string }>;
  optionLoading: boolean;
};

export default function PaymentsTab({
  organizationId,
  coachingCenterId,
  academicYearId,
  academicYears,
}: PaymentsTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [academicYearFilter, setAcademicYearFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Reference data
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Create form state
  const [formStudentId, setFormStudentId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("CASH");
  const [formReference, setFormReference] = useState("");
  const [formPaidAt, setFormPaidAt] = useState("");

  const academicYearOptions = academicYears.map((ay) => ({
    value: ay.id,
    label: ay.name,
  }));

  const methodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "ONLINE", label: "Online" },
    { value: "UPI", label: "UPI" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
  ];

  const methodColors: Record<string, string> = {
    CASH: "bg-green-100 text-green-700",
    ONLINE: "bg-blue-100 text-blue-700",
    UPI: "bg-purple-100 text-purple-700",
    BANK_TRANSFER: "bg-amber-100 text-amber-700",
  };

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

  // Load payments
  const loadPayments = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setPayments([]);
      setPaymentsTotal(0);
      return;
    }

    setPaymentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (academicYearFilter.length > 0) params.set("academicYearId", academicYearFilter.join(","));
      if (methodFilter.length > 0) params.set("method", methodFilter.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as PaymentItem[]) ?? [])
        : ((data?.items as PaymentItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setPayments(items);
      setPaymentsTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setPaymentsLoading(false);
    }
  }, [organizationId, coachingCenterId, academicYearFilter, methodFilter, debouncedSearchText, currentPage, itemsPerPage]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, methodFilter, academicYearFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(paymentsTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, paymentsTotal);

  // Calculate total amount
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  // Create payment
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          studentId: formStudentId,
          amount: Number(formAmount),
          method: formMethod,
          reference: formReference || undefined,
          paidAt: formPaidAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to record payment");
        return;
      }
      toastMessage("Payment recorded successfully");
      setFormStudentId("");
      setFormAmount("");
      setFormMethod("CASH");
      setFormReference("");
      setFormPaidAt("");
      setShowCreateForm(false);
      await loadPayments();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

  return (
    <div className="space-y-6">
      {/* Create Payment Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
            <p className="mt-1 text-sm text-gray-600">
              Record fee payments received from students
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {showCreateForm ? "Cancel" : "+ Record Payment"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  type="number"
                  placeholder="e.g., 5000"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="mt-1">
                  <MultiSelect
                    options={methodOptions}
                    value={formMethod ? [formMethod] : []}
                    onValueChange={(values) => setFormMethod(values[0] || "CASH")}
                    placeholder="Select method"
                    singleSelect
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input
                  value={formPaidAt}
                  onChange={(e) => setFormPaidAt(e.target.value)}
                  type="date"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                <input
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="e.g., Transaction ID"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !formStudentId || !formAmount || !formPaidAt}
                className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Recording..." : "Record Payment"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFormStudentId("");
                  setFormAmount("");
                  setFormMethod("CASH");
                  setFormReference("");
                  setFormPaidAt("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Payments List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {paymentsTotal}
            </span>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              Collected: INR {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by student or reference..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <MultiSelect
            options={[{ value: "", label: "All Academic Years" }, ...academicYearOptions]}
            onValueChange={setAcademicYearFilter}
            defaultValue={academicYearFilter}
            placeholder="Filter by academic year"
            className="w-full"
          />
          <MultiSelect
            options={[{ value: "", label: "All Methods" }, ...methodOptions]}
            onValueChange={setMethodFilter}
            defaultValue={methodFilter}
            placeholder="Filter by method"
            className="w-full"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadPayments()}
            disabled={paymentsLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentsLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAcademicYearFilter([]);
              setMethodFilter([]);
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Method</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
              </tr>
            </thead>
            {paymentsLoading ? (
              <TableLoader columns={5} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                      No payments found. Record your first payment above.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        {students.find((s) => s.id === payment.studentId)?.name || payment.studentId}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        INR {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${methodColors[payment.method] || "bg-gray-100 text-gray-700"}`}>
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {payment.reference || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {paymentsTotal > 0 && (
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
              Showing {startItem} to {endItem} of {paymentsTotal} payments
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
                        ? "border-teal-500 bg-teal-500 text-white"
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
