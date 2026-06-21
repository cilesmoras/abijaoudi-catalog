"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCIES, getCurrency, getCurrencySymbol } from "@/lib/currencies";

interface CurrencyComboboxProps {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  className?: string;
}

// Searchable currency picker (combobox). Mirrors CountryCombobox: a styled
// trigger that opens a filterable list. Filters by currency name, ISO code, or
// symbol so owners can type instead of scrolling the full list.
export function CurrencyCombobox({
  value,
  onChange,
  id,
  className,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  const selected = getCurrency(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        getCurrencySymbol(c.code).toLowerCase().includes(q),
    );
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  // Focus the search box once the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the highlighted option scrolled into view as the user navigates.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function openPanel() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  function choose(code: string) {
    onChange(code);
    setOpen(false);
  }

  function onSearchChange(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const currency = filtered[activeIndex];
      if (currency) choose(currency.code);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="flex h-9 w-full items-center justify-between gap-1 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected
            ? `${getCurrencySymbol(selected.code)} · ${selected.code} — ${selected.name}`
            : "Select a currency"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-1 w-full min-w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search currency, code, or symbol…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded={open}
              aria-controls="currency-listbox"
              aria-autocomplete="list"
            />
          </div>
          <ul
            id="currency-listbox"
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-sm text-muted-foreground">
                No match
              </li>
            ) : (
              filtered.map((currency, index) => {
                const isSelected = currency.code === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={currency.code}
                    ref={isActive ? activeRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(currency.code)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="w-5 shrink-0 text-center">
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span className="w-8 shrink-0 text-center">
                      {getCurrencySymbol(currency.code)}
                    </span>
                    <span className="flex-1 truncate">{currency.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {currency.code}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
