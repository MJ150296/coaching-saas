"use client";

import { useState } from "react";
import { SearchableDropdown } from "@/shared/components/ui/SearchableDropdown";

export default function FeeManagementPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [feeTypeName, setFeeTypeName] = useState("");
  const [feeTypeAmount, setFeeTypeAmount] = useState("");
  const [feeTypeFrequency, setFeeTypeFrequency] = useState("MONTHLY");
  const [feeTypeFrequencySearch, setFeeTypeFrequencySearch] = useState("");
  const [feeTypeMandatory, setFeeTypeMandatory] = useState(true);
  const [feeTypeTaxable, setFeeTypeTaxable] = useState(false);

  const [feePlanName, setFeePlanName] = useState("");
  const [feePlanItems, setFeePlanItems] = useState("[]");

  const [feePlanId, setFeePlanId] = useState("");
  const [feePlanClassMasterId, setFeePlanClassMasterId] = useState("");
  const [feePlanSectionId, setFeePlanSectionId] = useState("");

  const [ledgerStudentId, setLedgerStudentId] = useState("");
  const [ledgerFeePlanId, setLedgerFeePlanId] = useState("");
  const [ledgerFeeTypeId, setLedgerFeeTypeId] = useState("");
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerDueDate, setLedgerDueDate] = useState("");

  const [paymentStudentId, setPaymentStudentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentMethodSearch, setPaymentMethodSearch] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentPaidAt, setPaymentPaidAt] = useState("");

  const [creditStudentId, setCreditStudentId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditCreatedOn, setCreditCreatedOn] = useState("");

  async function postJson(url: string, payload: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Request failed");
        return;
      }
      setMessage("Saved successfully.");
    } catch (error) {
      setMessage("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  }

  function tenantPayload() {
    return {
      organizationId: organizationId || undefined,
      schoolId: schoolId || undefined,
      academicYearId: academicYearId || undefined,
    };
  }

  function parseItems(input: string) {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const feeFrequencyOptions = [
    { value: "ONE_TIME", label: "ONE_TIME" },
    { value: "MONTHLY", label: "MONTHLY" },
    { value: "QUARTERLY", label: "QUARTERLY" },
    { value: "YEARLY", label: "YEARLY" },
  ];

  const paymentMethodOptions = [
    { value: "CASH", label: "CASH" },
    { value: "ONLINE", label: "ONLINE" },
    { value: "UPI", label: "UPI" },
    { value: "BANK_TRANSFER", label: "BANK_TRANSFER" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">Fee Management</h2>
          <p className="text-sm text-gray-600">Create fee structures, plans, ledger entries, payments, and credit notes.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a className="text-indigo-600 hover:underline" href="/admin-roles/users">Users</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/academic">Academic</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/schools">Schools</a>
            <a className="text-indigo-600 hover:underline" href="/admin-roles/organizations">Organizations</a>
          </div>
          {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Tenant Scope</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization ID</label>
              <input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School ID</label>
              <input value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year ID</label>
            <input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Fee Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={feeTypeName} onChange={(e) => setFeeTypeName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={feeTypeAmount} onChange={(e) => setFeeTypeAmount(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={feeFrequencyOptions}
                  value={feeTypeFrequency}
                  onChange={setFeeTypeFrequency}
                  search={feeTypeFrequencySearch}
                  onSearchChange={setFeeTypeFrequencySearch}
                  placeholder="Select frequency"
                  searchPlaceholder="Search frequency"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={feeTypeMandatory} onChange={(e) => setFeeTypeMandatory(e.target.checked)} />
                Mandatory
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={feeTypeTaxable} onChange={(e) => setFeeTypeTaxable(e.target.checked)} />
                Taxable
              </label>
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/fee-types", {
                ...tenantPayload(),
                name: feeTypeName,
                amount: feeTypeAmount ? Number(feeTypeAmount) : 0,
                frequency: feeTypeFrequency,
                isMandatory: feeTypeMandatory,
                isTaxable: feeTypeTaxable,
              })
            }
          >
            {loading ? "Saving..." : "Create Fee Type"}
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Fee Plan</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Name</label>
            <input value={feePlanName} onChange={(e) => setFeePlanName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items (JSON Array)</label>
            <textarea value={feePlanItems} onChange={(e) => setFeePlanItems(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2 h-28 font-mono text-xs" />
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/fee-plans", {
                ...tenantPayload(),
                name: feePlanName,
                items: parseItems(feePlanItems),
              })
            }
          >
            {loading ? "Saving..." : "Create Fee Plan"}
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Assign Fee Plan</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Plan ID</label>
              <input value={feePlanId} onChange={(e) => setFeePlanId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master ID</label>
              <input value={feePlanClassMasterId} onChange={(e) => setFeePlanClassMasterId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section ID (optional)</label>
              <input value={feePlanSectionId} onChange={(e) => setFeePlanSectionId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/fee-plan-assignments", {
                ...tenantPayload(),
                feePlanId,
                classMasterId: feePlanClassMasterId,
                sectionId: feePlanSectionId || undefined,
              })
            }
          >
            {loading ? "Saving..." : "Assign Fee Plan"}
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Create Student Fee Ledger Entry</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input value={ledgerStudentId} onChange={(e) => setLedgerStudentId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Plan ID (optional)</label>
              <input value={ledgerFeePlanId} onChange={(e) => setLedgerFeePlanId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Type ID (optional)</label>
              <input value={ledgerFeeTypeId} onChange={(e) => setLedgerFeeTypeId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={ledgerAmount} onChange={(e) => setLedgerAmount(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input value={ledgerDueDate} onChange={(e) => setLedgerDueDate(e.target.value)} type="date" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/student-fee-ledger", {
                ...tenantPayload(),
                studentId: ledgerStudentId,
                feePlanId: ledgerFeePlanId || undefined,
                feeTypeId: ledgerFeeTypeId || undefined,
                amount: ledgerAmount ? Number(ledgerAmount) : 0,
                dueDate: ledgerDueDate,
              })
            }
          >
            {loading ? "Saving..." : "Create Ledger Entry"}
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Record Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input value={paymentStudentId} onChange={(e) => setPaymentStudentId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={paymentMethodOptions}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  search={paymentMethodSearch}
                  onSearchChange={setPaymentMethodSearch}
                  placeholder="Select method"
                  searchPlaceholder="Search payment method"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference (optional)</label>
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Paid At</label>
              <input value={paymentPaidAt} onChange={(e) => setPaymentPaidAt(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/payments", {
                ...tenantPayload(),
                studentId: paymentStudentId,
                amount: paymentAmount ? Number(paymentAmount) : 0,
                method: paymentMethod,
                reference: paymentReference || undefined,
                paidAt: paymentPaidAt,
              })
            }
          >
            {loading ? "Saving..." : "Record Payment"}
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Issue Credit Note</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input value={creditStudentId} onChange={(e) => setCreditStudentId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created On</label>
              <input value={creditCreatedOn} onChange={(e) => setCreditCreatedOn(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
            onClick={() =>
              postJson("/api/admin/credit-notes", {
                ...tenantPayload(),
                studentId: creditStudentId,
                amount: creditAmount ? Number(creditAmount) : 0,
                reason: creditReason,
                createdOn: creditCreatedOn,
              })
            }
          >
            {loading ? "Saving..." : "Issue Credit Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
