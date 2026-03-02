"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableDropdown } from "@/shared/components/ui/SearchableDropdown";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { getAdminOrganizations, getAdminSchools } from "@/shared/lib/client/adminTenantReferenceData";

type OrganizationOption = {
  id: string;
  name: string;
};

type SchoolOption = {
  id: string;
  name: string;
  organizationId: string;
};

type AcademicYearOption = {
  id: string;
  name: string;
};

type ClassMasterOption = {
  id: string;
  name: string;
  level?: string;
};

type SectionOption = {
  id: string;
  name: string;
  classMasterId: string;
};

type StudentOption = {
  id: string;
  name: string;
  email: string;
};

type FeeTypeOption = {
  id: string;
  name: string;
};

type FeePlanOption = {
  id: string;
  name: string;
};

export default function FeeManagementPage() {
  const { toastMessage } = useToast();
  const [organizationId, setOrganizationId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [academicYearSearch, setAcademicYearSearch] = useState("");
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
  const [feePlanSearch, setFeePlanSearch] = useState("");
  const [feePlanClassMasterId, setFeePlanClassMasterId] = useState("");
  const [feePlanClassMasterSearch, setFeePlanClassMasterSearch] = useState("");
  const [feePlanSectionId, setFeePlanSectionId] = useState("");
  const [feePlanSectionSearch, setFeePlanSectionSearch] = useState("");

  const [ledgerStudentId, setLedgerStudentId] = useState("");
  const [ledgerStudentSearch, setLedgerStudentSearch] = useState("");
  const [ledgerFeePlanId, setLedgerFeePlanId] = useState("");
  const [ledgerFeePlanSearch, setLedgerFeePlanSearch] = useState("");
  const [ledgerFeeTypeId, setLedgerFeeTypeId] = useState("");
  const [ledgerFeeTypeSearch, setLedgerFeeTypeSearch] = useState("");
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerDueDate, setLedgerDueDate] = useState("");
  const [ledgerDiscountType, setLedgerDiscountType] = useState("NONE");
  const [ledgerDiscountTypeSearch, setLedgerDiscountTypeSearch] = useState("");
  const [ledgerDiscountMode, setLedgerDiscountMode] = useState("FLAT");
  const [ledgerDiscountModeSearch, setLedgerDiscountModeSearch] = useState("");
  const [ledgerDiscountValue, setLedgerDiscountValue] = useState("");
  const [ledgerDiscountReason, setLedgerDiscountReason] = useState("");

  const [paymentStudentId, setPaymentStudentId] = useState("");
  const [paymentStudentSearch, setPaymentStudentSearch] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentMethodSearch, setPaymentMethodSearch] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentPaidAt, setPaymentPaidAt] = useState("");

  const [creditStudentId, setCreditStudentId] = useState("");
  const [creditStudentSearch, setCreditStudentSearch] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditCreatedOn, setCreditCreatedOn] = useState("");
  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [classMasters, setClassMasters] = useState<ClassMasterOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlanOption[]>([]);

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
  const discountTypeOptions = [
    { value: "NONE", label: "NONE" },
    { value: "SCHOLARSHIP", label: "SCHOLARSHIP" },
    { value: "SIBLING", label: "SIBLING" },
    { value: "STAFF", label: "STAFF" },
    { value: "CUSTOM", label: "CUSTOM" },
  ];
  const discountModeOptions = [
    { value: "FLAT", label: "FLAT" },
    { value: "PERCENT", label: "PERCENT" },
  ];
  const ledgerNetAmountPreview = useMemo(() => {
    const amount = Number(ledgerAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (ledgerDiscountType === "NONE") return amount;
    const value = Number(ledgerDiscountValue || 0);
    if (!Number.isFinite(value) || value <= 0) return amount;
    const discount =
      ledgerDiscountMode === "PERCENT" ? (amount * Math.min(100, value)) / 100 : value;
    return Math.max(0, Number((amount - discount).toFixed(2)));
  }, [ledgerAmount, ledgerDiscountMode, ledgerDiscountType, ledgerDiscountValue]);

  const organizationOptions = useMemo(
    () =>
      organizations.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [organizations]
  );

  const schoolOptions = useMemo(
    () =>
      schools
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [schools, organizationId]
  );

  const academicYearOptions = useMemo(
    () =>
      academicYears.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [academicYears]
  );

  const classMasterOptions = useMemo(
    () =>
      classMasters.map((item) => ({
        value: item.id,
        label: `${item.name}${item.level ? ` - ${item.level}` : ""} (${item.id})`,
      })),
    [classMasters]
  );

  const sectionOptions = useMemo(
    () =>
      sections
        .filter((item) => !feePlanClassMasterId || item.classMasterId === feePlanClassMasterId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [sections, feePlanClassMasterId]
  );

  const studentOptions = useMemo(
    () =>
      students.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.email})`,
      })),
    [students]
  );

  const feeTypeOptions = useMemo(
    () =>
      feeTypes.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [feeTypes]
  );

  const feePlanOptions = useMemo(
    () =>
      feePlans.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [feePlans]
  );

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setTenantLoading(true);
      try {
        const items = await getAdminOrganizations();
        if (!active) return;
        setOrganizations(items);
        if (items.length === 1) {
          setOrganizationId((prev) => prev || items[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setSchools([]);
      setSchoolId("");
      return;
    }

    let active = true;
    async function loadSchools() {
      setTenantLoading(true);
      try {
        const items = await getAdminSchools(organizationId);
        if (!active) return;
        setSchools(items);
        setSchoolId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return "";
          return prev;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadSchools();
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const canLoad = Boolean(organizationId && schoolId);
    if (!canLoad) {
      setAcademicYears([]);
      setClassMasters([]);
      setSections([]);
      setStudents([]);
      setFeeTypes([]);
      setFeePlans([]);
      setAcademicYearId("");
      return;
    }

    let active = true;
    async function loadOptions() {
      setOptionLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("schoolId", schoolId);
        params.set("includeStudents", "true");
        params.set("includeFees", "true");
        const response = await fetch(`/api/admin/academic/options?${params.toString()}`);
        const data = await response.json();

        if (!active) return;
        if (!response.ok) return;

        setAcademicYears(
          ((data?.academicYears as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
        setClassMasters(
          ((data?.classMasters as Array<{ id: string; name: string; level?: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            level: item.level,
          }))
        );
        setSections(
          ((data?.sections as Array<{ id: string; name: string; classMasterId: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            classMasterId: item.classMasterId,
          }))
        );
        setStudents(
          ((data?.students as Array<{ id: string; firstName?: string; lastName?: string; email: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || item.email,
            email: item.email,
          }))
        );
        setFeeTypes(
          ((data?.feeTypes as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
        setFeePlans(
          ((data?.feePlans as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setOptionLoading(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [organizationId, schoolId]);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-6 shadow-lg shadow-orange-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Fee Management</h2>
              <p className="mt-2 text-sm text-orange-50">Create fee types, plans, assignments, ledger entries, payments, and credit notes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Fee Setup</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Ledger</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Collections</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Tenant Scope</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={organizationOptions}
                  value={organizationId}
                  onChange={(value) => {
                    setOrganizationId(value);
                    setSchoolId("");
                    setSchoolSearch("");
                  }}
                  search={organizationSearch}
                  onSearchChange={setOrganizationSearch}
                  placeholder="Select organization"
                  searchPlaceholder="Search organization"
                  disabled={tenantLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Coaching Center</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={schoolOptions}
                  value={schoolId}
                  onChange={setSchoolId}
                  search={schoolSearch}
                  onSearchChange={setSchoolSearch}
                  placeholder="Select coaching center"
                  searchPlaceholder="Search coaching center"
                  disabled={tenantLoading || !organizationId}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <div className="mt-1">
              <SearchableDropdown
                options={academicYearOptions}
                value={academicYearId}
                onChange={setAcademicYearId}
                search={academicYearSearch}
                onSearchChange={setAcademicYearSearch}
                placeholder="Select academic year"
                searchPlaceholder="Search academic year"
                disabled={optionLoading || !schoolId}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Fee Type</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={feeTypeName} onChange={(e) => setFeeTypeName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={feeTypeAmount} onChange={(e) => setFeeTypeAmount(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Fee Plan</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Name</label>
            <input value={feePlanName} onChange={(e) => setFeePlanName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items (JSON Array)</label>
            <textarea value={feePlanItems} onChange={(e) => setFeePlanItems(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 h-28 font-mono" />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Assign Fee Plan</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Plan</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={feePlanOptions}
                  value={feePlanId}
                  onChange={setFeePlanId}
                  search={feePlanSearch}
                  onSearchChange={setFeePlanSearch}
                  placeholder="Select fee plan"
                  searchPlaceholder="Search fee plan"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Master</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={classMasterOptions}
                  value={feePlanClassMasterId}
                  onChange={(value) => {
                    setFeePlanClassMasterId(value);
                    setFeePlanSectionId("");
                    setFeePlanSectionSearch("");
                  }}
                  search={feePlanClassMasterSearch}
                  onSearchChange={setFeePlanClassMasterSearch}
                  placeholder="Select class master"
                  searchPlaceholder="Search class master"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section (optional)</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={sectionOptions}
                  value={feePlanSectionId}
                  onChange={setFeePlanSectionId}
                  search={feePlanSectionSearch}
                  onSearchChange={setFeePlanSectionSearch}
                  placeholder="Select section"
                  searchPlaceholder="Search section"
                  disabled={optionLoading || !feePlanClassMasterId}
                />
              </div>
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Create Student Fee Ledger Entry</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={studentOptions}
                  value={ledgerStudentId}
                  onChange={setLedgerStudentId}
                  search={ledgerStudentSearch}
                  onSearchChange={setLedgerStudentSearch}
                  placeholder="Select student"
                  searchPlaceholder="Search student"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Plan (optional)</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={feePlanOptions}
                  value={ledgerFeePlanId}
                  onChange={setLedgerFeePlanId}
                  search={ledgerFeePlanSearch}
                  onSearchChange={setLedgerFeePlanSearch}
                  placeholder="Select fee plan"
                  searchPlaceholder="Search fee plan"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Type (optional)</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={feeTypeOptions}
                  value={ledgerFeeTypeId}
                  onChange={setLedgerFeeTypeId}
                  search={ledgerFeeTypeSearch}
                  onSearchChange={setLedgerFeeTypeSearch}
                  placeholder="Select fee type"
                  searchPlaceholder="Search fee type"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={ledgerAmount} onChange={(e) => setLedgerAmount(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input value={ledgerDueDate} onChange={(e) => setLedgerDueDate(e.target.value)} type="date" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Type</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={discountTypeOptions}
                  value={ledgerDiscountType}
                  onChange={setLedgerDiscountType}
                  search={ledgerDiscountTypeSearch}
                  onSearchChange={setLedgerDiscountTypeSearch}
                  placeholder="Select discount type"
                  searchPlaceholder="Search discount type"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Mode</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={discountModeOptions}
                  value={ledgerDiscountMode}
                  onChange={setLedgerDiscountMode}
                  search={ledgerDiscountModeSearch}
                  onSearchChange={setLedgerDiscountModeSearch}
                  placeholder="Select discount mode"
                  searchPlaceholder="Search discount mode"
                  disabled={ledgerDiscountType === "NONE"}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Value {ledgerDiscountMode === "PERCENT" ? "(%)" : ""}
              </label>
              <input
                value={ledgerDiscountValue}
                onChange={(e) => setLedgerDiscountValue(e.target.value)}
                type="number"
                min="0"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                disabled={ledgerDiscountType === "NONE"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Reason (optional)</label>
              <input
                value={ledgerDiscountReason}
                onChange={(e) => setLedgerDiscountReason(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                disabled={ledgerDiscountType === "NONE"}
              />
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Net payable preview: INR {ledgerNetAmountPreview.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() =>
              postJson("/api/admin/student-fee-ledger", {
                ...tenantPayload(),
                studentId: ledgerStudentId,
                feePlanId: ledgerFeePlanId || undefined,
                feeTypeId: ledgerFeeTypeId || undefined,
                amount: ledgerAmount ? Number(ledgerAmount) : 0,
                dueDate: ledgerDueDate,
                discountType: ledgerDiscountType,
                discountMode: ledgerDiscountType === "NONE" ? undefined : ledgerDiscountMode,
                discountValue:
                  ledgerDiscountType === "NONE" ? undefined : ledgerDiscountValue ? Number(ledgerDiscountValue) : 0,
                discountReason:
                  ledgerDiscountType === "NONE" ? undefined : ledgerDiscountReason || undefined,
              })
            }
          >
            {loading ? "Saving..." : "Create Ledger Entry"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Record Payment</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={studentOptions}
                  value={paymentStudentId}
                  onChange={setPaymentStudentId}
                  search={paymentStudentSearch}
                  onSearchChange={setPaymentStudentSearch}
                  placeholder="Select student"
                  searchPlaceholder="Search student"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
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
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Paid At</label>
              <input value={paymentPaidAt} onChange={(e) => setPaymentPaidAt(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 space-y-4">
          <h3 className="text-lg font-semibold">Issue Credit Note</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={studentOptions}
                  value={creditStudentId}
                  onChange={setCreditStudentId}
                  search={creditStudentSearch}
                  onSearchChange={setCreditStudentSearch}
                  placeholder="Select student"
                  searchPlaceholder="Search student"
                  disabled={optionLoading || !schoolId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} type="number" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created On</label>
              <input value={creditCreatedOn} onChange={(e) => setCreditCreatedOn(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
