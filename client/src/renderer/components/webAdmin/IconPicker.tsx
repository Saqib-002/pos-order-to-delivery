import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { Search, X, HelpCircle } from "lucide-react";
import { CrossIcon } from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";

// Build the icon list once
const ALL_ICONS = Object.keys(Icons)
  .filter(
    (key) =>
      /^[A-Z]/.test(key) &&
      !["createLucideIcon", "LucideIcon", "Lucide", "Icon", "icons"].includes(key)
  )
  .sort();

const DISPLAY_LIMIT = 180;

export type IconName = string;

interface IconPickerProps {
  value: IconName;
  onChange: (name: IconName) => void;
  label?: string;
}

export function DynamicIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon =
    name && name !== "Icon" && name !== "LucideIcon"
      ? ((Icons as Record<string, unknown>)[name] as React.ComponentType<{ className?: string }> | undefined)
      : undefined;
  const Fallback = HelpCircle as React.ComponentType<{ className?: string }>;
  const Component = Icon ?? Fallback;
  return <Component className={className} />;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? ALL_ICONS.filter((n) => n.toLowerCase().includes(q)) : ALL_ICONS;
  }, [search]);

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg bg-white border border-gray-300 hover:border-black hover:shadow-md transition-all cursor-pointer shadow-2xs text-xs hover:ring-black hover:ring-2"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <DynamicIcon name={value} className="w-4 h-4 text-black shrink-0" />
          <span className="truncate text-gray-800 font-medium">
            {value || "Select icon…"}
          </span>
        </div>
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-linear-to-r from-black to-gray-800 px-6 py-4 text-white flex items-center justify-between rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2">
                <DynamicIcon name={value} className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold">Select Icon</h3>
              </div>
              <CustomButton
                type="button"
                variant="transparent"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                }}
                Icon={<CrossIcon className="size-5" />}
                className="text-white hover:text-gray-300 p-1.5! rounded-full! hover:bg-white/20"
              />
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  autoFocus
                  placeholder={`Search ${ALL_ICONS.length} icons…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-white border border-gray-300 text-xs text-gray-900 placeholder:text-gray-400 pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-[10px] text-gray-500 mt-1.5 px-1">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Grid */}
            <div className="p-4 overflow-y-auto max-h-[380px] grid grid-cols-6 sm:grid-cols-8 gap-2">
              {(search ? filtered : filtered.slice(0, DISPLAY_LIMIT)).map((name) => {
                const isActive = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => handleSelect(name)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all border cursor-pointer ${
                      isActive
                        ? "bg-black border-black text-white shadow-xs"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black"
                    }`}
                  >
                    <DynamicIcon name={name} className="w-5 h-5" />
                    <span className="text-[8px] truncate w-full text-center mt-1 opacity-70">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
              <CustomButton
                type="button"
                label="Close"
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IconPicker;
