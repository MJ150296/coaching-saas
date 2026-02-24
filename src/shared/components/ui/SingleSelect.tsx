"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SingleSelectOption = {
  label: string;
  value: string;
};

interface SingleSelectProps {
  options: SingleSelectOption[];

  value?: string;

  onValueChange: (value: string | undefined) => void;

  placeholder?: string;

  disabled?: boolean;

  className?: string;

  searchPlaceholder?: string;

  emptyText?: string;

  allowClear?: boolean;
}

export function SingleSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  disabled,
  className,
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  allowClear = true,
}: SingleSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (selectedValue === value) {
        if (allowClear) {
          onValueChange(undefined);
        }
      } else {
        onValueChange(selectedValue);
      }
      setOpen(false);
    },
    [value, onValueChange, allowClear]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange(undefined);
    },
    [onValueChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>

          <div className="flex items-center gap-1">
            {allowClear && value && !disabled && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}

            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue: string) =>
                    handleSelect(currentValue)
                  }
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />

                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}