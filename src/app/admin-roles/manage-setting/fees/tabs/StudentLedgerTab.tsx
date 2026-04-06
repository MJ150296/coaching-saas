"use client";

import { useCallback, useEffect, useState } from "react";
import { MultiSelect } from "@/components/multi-select";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";

type LedgerItem = {
  id: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  originalAmount: number;
  amount: number;
  discount?: {
    type: string;
    mode: string;
    value: number;
    amount: number;
    reason?: string;
  };
  dueDate: string;
  status: string;
  createdAt?: string;
};

type StudentOption = {
  id: string;
  name: string;
};

type StudentLedgerTabProps = {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  academicYears: Array<{ id: string; name: string }>;
};

export default function StudentLedgerTab({
  organizationId,
  coachingCenterId,
  academicYearId,
  academicYears,
}: StudentLedgerTabProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [academicYearFilter, setAcademicYearFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Reference data
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Create form state
  const [formStudentId, setFormStudentId] = useState("");
  const [formFeeTypeId, setFormFeeTypeId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDiscountType, setFormDiscountType] = useState("NONE");
  const [formDiscountMode, setFormDiscountMode] = useState("FLAT");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formDiscountReason, setFormDiscountReason] = useState("");
  
  // Bulk form state
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [bulkFeeTypeId, setBulkFeeTypeId] = useState("");
  const [bulkDiscountType, setBulkDiscountType] = useState("NONE");
  const [bulkDiscountMode, setBulkDiscountMode] = useState("FLAT");
  const [bulkDiscountValue, setBulkDiscountValue] = useState("");
  const [bulkDiscountReason, setBulkDiscountReason] = useState("");
  const [bulkMode, setBulkMode] = useState(false);

  const academicYearOptions = academicYears.map((ay) => ({
    value: ay.id,
    label: ay.name,
  }));

  const statusOptions = [
    { value: "DUE", label: "Due" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const discountTypeOptions = [
    { value: "NONE", label: "None" },
    { value: "SCHOLARSHIP", label: "Scholarship" },
    { value: "SIBLING", label: "Sibling" },
    { value: "STAFF", label: "Staff" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const discountModeOptions = [
    { value: "FLAT", label: "Flat Amount" },
    { value: "PERCENT", label: "Percentage" },
  ];

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

  // Load ledger entries
  const loadLedgerEntries = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setLedgerEntries([]);
      setLedgerTotal(0);
      return;
    }

    setLedgerLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (academicYearFilter.length > 0) params.set("academicYearId", academicYearFilter.join(","));
      if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

      const response = await fetch(`/api/admin/student-ledger?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as LedgerItem[]) ?? [])
        : ((data?.items as LedgerItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setLedgerEntries(items);
      setLedgerTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setLedgerLoading(false);
    }
  }, [organizationId, coachingCenterId, academicYearFilter, statusFilter, debouncedSearchText, currentPage, itemsPerPage]);

  useEffect(() => {
    loadLedgerEntries();
  }, [loadLedgerEntries]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, statusFilter, academicYearFilter, organizationId, coachingCenterId]);

  // Pagination
  const totalPages = Math.ceil(ledgerTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, ledgerTotal);

  // Calculate discount amount
  function calculateDiscount(): number {
    const amount = Number(formAmount) || 0;
    const value = Number(formDiscountValue) || 0;
    if (formDiscountType === "NONE" || !value) return 0;
    if (formDiscountMode === "FLAT") return value;
    return (amount * value) / 100;
  }

  // Calculate bulk discount amount
  function calculateBulkDiscount(): number {
    const amount = Number(bulkAmount) || 0;
    const value = Number(bulkDiscountValue) || 0;
    if (bulkDiscountType === "NONE" || !value) return 0;
    if (bulkDiscountMode === "FLAT") return value;
    return (amount * value) / 100;
  }

  // Bulk create ledger entries
  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const discountAmount = calculateBulkDiscount();
      const originalAmount = Number(bulkAmount);

      const response = await fetch("/api/admin/student-ledger", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          studentIds: bulkStudentIds,
          feeTypeId: bulkFeeTypeId || undefined,
          amount: originalAmount,
          dueDate: bulkDueDate,
          discount: bulkDiscountType !== "NONE" ? {
            type: bulkDiscountType,
            mode: bulkDiscountMode,
            value: Number(bulkDiscountValue),
            amount: discountAmount,
            reason: bulkDiscountReason || undefined,
          } : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create bulk ledger entries");
        return;
      }
      toastMessage(`Successfully created ${data.created} ledger entries`);
      setBulkStudentIds([]);
      setBulkAmount("");
      setBulkDueDate("");
      setBulkFeeTypeId("");
      setBulkDiscountType("NONE");
      setBulkDiscountMode("FLAT");
      setBulkDiscountValue("");
      setBulkDiscountReason("");
      setBulkMode(false);
      await loadLedgerEntries();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  // Create ledger entry
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const discountAmount = calculateDiscount();
      const originalAmount = Number(formAmount);
      const finalAmount = originalAmount - discountAmount;

      const response = await fetch("/api/admin/student-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId || undefined,
          coachingCenterId: coachingCenterId || undefined,
          academicYearId: academicYearId || undefined,
          studentId: formStudentId,
          feeTypeId: formFeeTypeId || undefined,
          originalAmount,
          amount: finalAmount,
          dueDate: formDueDate,
          discount: formDiscountType !== "NONE" ? {
            type: formDiscountType,
            mode: formDiscountMode,
            value: Number(formDiscountValue),
            amount: discountAmount,
            reason: formDiscountReason || undefined,
          } : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || "Failed to create ledger entry");
        return;
      }
      toastMessage("Ledger entry created successfully");
      setFormStudentId("");
      setFormFeeTypeId("");
      setFormAmount("");
      setFormDueDate("");
      setFormDiscountType("NONE");
      setFormDiscountMode("FLAT");
      setFormDiscountValue("");
      setFormDiscountReason("");
      setShowCreateForm(false);
      await loadLedgerEntries();
    } catch (error) {
      toastMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="space-y-6">
      {/* Create Ledger Entry Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Student Fee Ledger</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add fee charges to student accounts with optional discounts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setShowCreateForm(false);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                bulkMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {bulkMode ? "Single Mode" : "Bulk Mode"}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setBulkMode(false);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {showCreateForm ? "Cancel" : "+ Add Ledger Entry"}
            </button>
          </div>
        </div>

        {bulkMode && (
          <form onSubmit={handleBulkCreate} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Select Students</label>
                <div className="mt-1">
                  <MultiSelect
                    options={studentOptions}
                    value={bulkStudentIds}
                    onValueChange={setBulkStudentIds}
                    placeholder="Select multiple students"
                  />
                </div>
                {bulkStudentIds.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{bulkStudentIds.length} student(s) selected</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (per student)</label>
                <input
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  type="number"
                  placeholder="e.g., 5000"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                  type="date"
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Type (Optional)</label>
                <input
                  value={bulkFeeTypeId}
                  onChange={(e) => setBulkFeeTypeId(e.target.value)}
                  placeholder="Fee type ID"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Discount (Optional)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <div className="mt-1">
                    <MultiSelect
                      options={discountTypeOptions}
                      value={bulkDiscountType ? [bulkDiscountType] : []}
                      onValueChange={(values) => setBulkDiscountType(values[0] || "NONE")}
                      placeholder="Select type"
                      singleSelect
                    />
                  </div>
                </div>
                {bulkDiscountType !== "NONE" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mode</label>
                      <div className="mt-1">
                        <MultiSelect
                          options={discountModeOptions}
                          value={bulkDiscountMode ? [bulkDiscountMode] : []}
                          onValueChange={(values) => setBulkDiscountMode(values[0] || "FLAT")}
                          placeholder="Select mode"
                          singleSelect
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {bulkDiscountMode === "PERCENT" ? "Percentage" : "Amount"}
                      </label>
                      <input
                        value={bulkDiscountValue}
                        onChange={(e) => setBulkDiscountValue(e.target.value)}
                        type="number"
                        placeholder={bulkDiscountMode === "PERCENT" ? "e.g., 10" : "e.g., 500"}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <input
                        value={bulkDiscountReason}
                        onChange={(e) => setBulkDiscountReason(e.target.value)}
                        placeholder="e.g., Merit scholarship"
                        className={inputClassName}
                      />
                    </div>
                  </>
                )}
              </div>
              {bulkDiscountType !== "NONE" && bulkAmount && bulkDiscountValue && (
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                  <span className="font-semibold">Bulk Calculation: </span>
                  {bulkStudentIds.length} students × INR {Number(bulkAmount).toLocaleString()} = INR {(bulkStudentIds.length * Number(bulkAmount)).toLocaleString()} total
                  <br />
                  Discount per student: INR {calculateBulkDiscount().toLocaleString()} | Final per student: INR {(Number(bulkAmount) - calculateBulkDiscount()).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || bulkStudentIds.length === 0 || !bulkAmount || !bulkDueDate}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : `Create ${bulkStudentIds.length} Entries`}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setBulkStudentIds([]);
                  setBulkAmount("");
                  setBulkDueDate("");
                  setBulkFeeTypeId("");
                  setBulkDiscountType("NONE");
                  setBulkDiscountMode("FLAT");
                  setBulkDiscountValue("");
                  setBulkDiscountReason("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}

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
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  type="date"
                  required
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Discount (Optional)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <div className="mt-1">
                    <MultiSelect
                      options={discountTypeOptions}
                      value={formDiscountType ? [formDiscountType] : []}
                      onValueChange={(values) => setFormDiscountType(values[0] || "NONE")}
                      placeholder="Select type"
                      singleSelect
                    />
                  </div>
                </div>
                {formDiscountType !== "NONE" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mode</label>
                      <div className="mt-1">
                        <MultiSelect
                          options={discountModeOptions}
                          value={formDiscountMode ? [formDiscountMode] : []}
                          onValueChange={(values) => setFormDiscountMode(values[0] || "FLAT")}
                          placeholder="Select mode"
                          singleSelect
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {formDiscountMode === "PERCENT" ? "Percentage" : "Amount"}
                      </label>
                      <input
                        value={formDiscountValue}
                        onChange={(e) => setFormDiscountValue(e.target.value)}
                        type="number"
                        placeholder={formDiscountMode === "PERCENT" ? "e.g., 10" : "e.g., 500"}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <input
                        value={formDiscountReason}
                        onChange={(e) => setFormDiscountReason(e.target.value)}
                        placeholder="e.g., Merit scholarship"
                        className={inputClassName}
                      />
                    </div>
                  </>
                )}
              </div>
              {formDiscountType !== "NONE" && formAmount && formDiscountValue && (
                <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm">
                  <span className="font-semibold">Calculated: </span>
                  Original: INR {Number(formAmount).toLocaleString()} | Discount: INR {calculateDiscount().toLocaleString()} | Final: INR {(Number(formAmount) - calculateDiscount()).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !formStudentId || !formAmount || !formDueDate}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Entry"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFormStudentId("");
                  setFormFeeTypeId("");
                  setFormAmount("");
                  setFormDueDate("");
                  setFormDiscountType("NONE");
                  setFormDiscountMode("FLAT");
                  setFormDiscountValue("");
                  setFormDiscountReason("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Ledger List Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Ledger Entries</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Total: {ledgerTotal}
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
              placeholder="Search by student..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
            options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
            onValueChange={setStatusFilter}
            defaultValue={statusFilter}
            placeholder="Filter by status"
            className="w-full"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadLedgerEntries()}
            disabled={ledgerLoading || !organizationId || !coachingCenterId}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ledgerLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAcademicYearFilter([]);
              setStatusFilter([]);
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
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Original</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Discount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Due Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            {ledgerLoading ? (
              <TableLoader columns={6} rows={8} className="bg-white/80" />
            ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {ledgerEntries.map((item) => {
                  const studentName = students.find((s) => s.id === item.studentId)?.name || item.studentId;
                  const statusColor = item.status === "PAID" ? "bg-green-100 text-green-700" : item.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">{studentName}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">INR {item.originalAmount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {item.discount ? (
                          <span className="text-indigo-600 font-medium">-INR {item.discount.amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-900">INR {item.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {ledgerEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !coachingCenterId
                        ? "Select organization and coaching center to view ledger entries."
                        : "No ledger entries found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {ledgerTotal > 0 && (
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
              Showing {startItem} to {endItem} of {ledgerTotal} entries
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
                        ? "border-indigo-500 bg-indigo-500 text-white"
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