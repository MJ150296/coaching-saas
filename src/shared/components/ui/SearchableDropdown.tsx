'use client';

import { useMemo } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  search,
  onSearchChange,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
}: SearchableDropdownProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
        className="w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded border bg-white px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {filtered.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
