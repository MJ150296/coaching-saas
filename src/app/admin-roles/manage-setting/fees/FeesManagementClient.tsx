"use client";

import { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@/components/multi-select";
import { getAdminOrganizations, getAdminCoachingCenters } from "@/shared/lib/client/adminTenantReferenceData";
import FeeTypesTab from "./tabs/FeeTypesTab";
import FeePlansTab from "./tabs/FeePlansTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import StudentLedgerTab from "./tabs/StudentLedgerTab";
import PaymentsTab from "./tabs/PaymentsTab";
import CreditNotesTab from "./tabs/CreditNotesTab";

type OrganizationOption = {
  id: string;
  name: string;
};

type CoachingCenterOption = {
  id: string;
  name: string;
  organizationId: string;
};

type AcademicYearOption = {
  id: string;
  name: string;
};

type TabId = "fee-types" | "fee-plans" | "assignments" | "ledger" | "payments" | "credits";

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "fee-types", label: "Fee Types", icon: "💰" },
  { id: "fee-plans", label: "Fee Plans", icon: "📋" },
  { id: "assignments", label: "Assignments", icon: "🔗" },
  { id: "ledger", label: "Student Ledger", icon: "📒" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "credits", label: "Credit Notes", icon: "🎫" },
];

export default function FeesManagementClient() {
  const [activeTab, setActiveTab] = useState<TabId>("fee-types");
  const [organizationId, setOrganizationId] = useState("");
  const [coachingCenterId, setCoachingCenterId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [, setCoachingCenterSearch] = useState("");

  const [tenantLoading, setTenantLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  const organizationOptions = useMemo(
    () =>
      organizations.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [organizations]
  );

  const coachingCenterOptions = useMemo(
    () =>
      coachingCenters
        .filter((item) => !organizationId || item.organizationId === organizationId)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.id})`,
        })),
    [coachingCenters, organizationId]
  );

  const academicYearOptions = useMemo(
    () =>
      academicYears.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
      })),
    [academicYears]
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
      setCoachingCenters([]);
      setCoachingCenterId("");
      return;
    }

    let active = true;
    async function loadCoachingCenters() {
      setTenantLoading(true);
      try {
        const items = await getAdminCoachingCenters(organizationId);
        if (!active) return;
        setCoachingCenters(items);
        setCoachingCenterId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return "";
          return prev;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadCoachingCenters();
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const canLoad = Boolean(organizationId && coachingCenterId);
    if (!canLoad) {
      setAcademicYears([]);
      setAcademicYearId("");
      return;
    }

    let active = true;
    async function loadOptions() {
      setOptionLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        params.set("coachingCenterId", coachingCenterId);
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
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        if (active) setOptionLoading(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [organizationId, coachingCenterId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50/40 to-orange-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-6 shadow-lg shadow-orange-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Fee Management</h2>
              <p className="mt-2 text-sm text-orange-50">
                Manage fee types, plans, assignments, ledger entries, payments, and credit notes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Fee Setup</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Ledger</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Collections</span>
            </div>
          </div>
        </div>

        {/* Tenant Scope Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Tenant Scope</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <div className="mt-1">
                <MultiSelect
                  options={organizationOptions}
                  value={organizationId ? [organizationId] : []}
                  onValueChange={(values) => {
                    setOrganizationId(values[0] || "");
                    setCoachingCenterId("");
                    setCoachingCenterSearch("");
                  }}
                  placeholder="Select organization"
                  disabled={tenantLoading}
                  singleSelect
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Coaching Center</label>
              <div className="mt-1">
                <MultiSelect
                  options={coachingCenterOptions}
                  value={coachingCenterId ? [coachingCenterId] : []}
                  onValueChange={(values) => setCoachingCenterId(values[0] || "")}
                  placeholder="Select coaching center"
                  disabled={tenantLoading || !organizationId}
                  singleSelect
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <div className="mt-1">
                <MultiSelect
                  options={academicYearOptions}
                  value={academicYearId ? [academicYearId] : []}
                  onValueChange={(values) => setAcademicYearId(values[0] || "")}
                  placeholder="Select academic year"
                  disabled={optionLoading || !coachingCenterId}
                  singleSelect
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70">
          <div className="border-b border-slate-200">
            <nav className="flex gap-1 px-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "fee-types" && (
              <FeeTypesTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
              />
            )}
            {activeTab === "fee-plans" && (
              <FeePlansTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
                academicYearId={academicYearId}
                academicYears={academicYears}
              />
            )}
            {activeTab === "assignments" && (
              <AssignmentsTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
                academicYearId={academicYearId}
                academicYears={academicYears}
              />
            )}
            {activeTab === "ledger" && (
              <StudentLedgerTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
                academicYearId={academicYearId}
                academicYears={academicYears}
                optionLoading={optionLoading}
              />
            )}
            {activeTab === "payments" && (
              <PaymentsTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
                academicYearId={academicYearId}
                academicYears={academicYears}
                optionLoading={optionLoading}
              />
            )}
            {activeTab === "credits" && (
              <CreditNotesTab
                organizationId={organizationId}
                coachingCenterId={coachingCenterId}
                academicYearId={academicYearId}
                academicYears={academicYears}
                optionLoading={optionLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
