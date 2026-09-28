import React, { useState, useEffect, useCallback } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { Clock, RotateCcw, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeString = string; // "HH:MM"

interface SessionTimes {
  start: TimeString;
  end: TimeString;
}

interface DaySchedule {
  isOpen: boolean;
  session1: SessionTimes;
  session2: SessionTimes;
}

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_KEYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface OpeningHoursContent {
  timezone: string;
  schedule: Record<DayKey, DaySchedule>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Lisbon",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Athens",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Oslo",
  "Europe/Zurich",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Asia/Dubai",
  "Asia/Istanbul",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

const DEFAULT_DAY: DaySchedule = {
  isOpen: true,
  session1: { start: "13:00", end: "17:00" },
  session2: { start: "19:00", end: "23:59" },
};

const DEFAULT_OPENING_HOURS: OpeningHoursContent = {
  timezone: "Europe/Madrid",
  schedule: Object.fromEntries(
    DAY_KEYS.map((d) => [d, { ...DEFAULT_DAY }])
  ) as OpeningHoursContent["schedule"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDayjs(t: string): Dayjs {
  return dayjs(`2000-01-01T${t}:00`);
}

function toTimeStr(d: Dayjs | null): string {
  return d ? d.format("HH:mm") : "00:00";
}

// ─── MUI theme (neutral, matches POS white card style) ────────────────────────

const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#374151", contrastText: "#ffffff" },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "0.5rem",
          fontSize: "0.8125rem",
          fontWeight: 500,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#374151",
            borderWidth: "1.5px",
          },
        },
        input: { padding: "8px 12px", color: "#111827" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#9ca3af",
          "&:hover": { color: "#374151", backgroundColor: "#f3f4f6" },
        },
      },
    },
    MuiClockPointer: {
      styleOverrides: {
        root: { backgroundColor: "#374151" },
        thumb: { borderColor: "#374151", backgroundColor: "#374151" },
      },
    },
    MuiClock: { styleOverrides: { pin: { backgroundColor: "#374151" } } },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: "none",
          color: "#374151",
          "&:hover": { backgroundColor: "#f3f4f6" },
        },
      },
    },
  },
} as any);

// ─── Sub-component: TimePickerCell ────────────────────────────────────────────

interface TimePickerCellProps {
  value: string;
  onChange: (v: Dayjs | null) => void;
  disabled?: boolean;
}

const TimePickerCell: React.FC<TimePickerCellProps> = ({ value, onChange, disabled }) => (
  <MuiThemeProvider theme={muiTheme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MobileTimePicker
        value={toDayjs(value)}
        onChange={onChange}
        ampm={false}
        disabled={disabled}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            sx: {
              "& .MuiInputBase-input": {
                fontSize: "0.8125rem",
                fontWeight: 500,
                padding: "8px 12px",
                color: "#111827",
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "0.5rem",
                "& fieldset": { borderColor: "#e5e7eb" },
                "&:hover fieldset": { borderColor: "#9ca3af" },
                "&.Mui-focused fieldset": { borderColor: "#374151", borderWidth: "1.5px" },
              },
              "& .MuiInputAdornment-root, & .MuiIconButton-root": { color: "#9ca3af" },
            },
          },
        }}
      />
    </LocalizationProvider>
  </MuiThemeProvider>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
      checked ? "bg-gray-700" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      }`}
    />
  </button>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface OpeningHoursTabProps {
  initialContent?: any;
  onSaveSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OpeningHoursTab: React.FC<OpeningHoursTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();

  const [schedule, setSchedule] = useState<OpeningHoursContent>(DEFAULT_OPENING_HOURS);
  const [saving, setSaving] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  // Track which mobile day cards are expanded
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // ── Populate from initialContent ──────────────────────────────────────────

  useEffect(() => {
    if (initialContent && initialContent.schedule) {
      setSchedule({
        timezone: initialContent.timezone || DEFAULT_OPENING_HOURS.timezone,
        schedule: { ...DEFAULT_OPENING_HOURS.schedule, ...initialContent.schedule },
      });
    }
  }, [initialContent]);

  // ── Updaters ──────────────────────────────────────────────────────────────

  const setDayOpen = useCallback((day: DayKey, isOpen: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], isOpen } },
    }));
  }, []);

  const setSessionTime = useCallback(
    (
      day: DayKey,
      session: "session1" | "session2",
      field: "start" | "end",
      value: Dayjs | null
    ) => {
      setSchedule((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            [session]: { ...prev.schedule[day][session], [field]: toTimeStr(value) },
          },
        },
      }));
    },
    []
  );

  const resetDay = useCallback((day: DayKey) => {
    setSchedule((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: { ...DEFAULT_DAY } },
    }));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "opening-hours",
          schedule
        );
        if (res?.status) {
          toast.success(t("webAdmin.messages.saveSuccess"));
          onSaveSuccess?.();
        } else {
          toast.error(res?.message || t("webAdmin.messages.saveError"));
        }
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const s = (t("webAdmin.openingHours", { returnObjects: true }) as any) || {};

  const dayLabel = (day: DayKey): string => s.days?.[day] ?? day;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-full">
      {/* ── Section header ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {s.title ?? t("webAdmin.openingHours.title", "Opening Hours Schedule")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {s.subtitle ?? t("webAdmin.openingHours.subtitle", "Set opening times for each day of the week")}
            </p>
          </div>
        </div>

        {/* ── Timezone selector ── */}
        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {s.timezoneLabel ?? "Timezone"}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTzOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <span>{schedule.timezone}</span>
              {tzOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              )}
            </button>
            {tzOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {TIMEZONES.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => {
                      setSchedule((prev) => ({ ...prev, timezone: tz }));
                      setTzOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                      schedule.timezone === tz
                        ? "font-semibold text-gray-900 bg-gray-50"
                        : "text-gray-700"
                    }`}
                  >
                    {tz}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[13%]">
                {s.dayCol ?? "Day"}
              </th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[8%]">
                {s.openCol ?? "Open"}
              </th>
              <th className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[19%]">
                {s.session1StartCol ?? "Session 1 Open"}
              </th>
              <th className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[19%]">
                {s.session1EndCol ?? "Session 1 Close"}
              </th>
              <th className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[19%]">
                {s.session2StartCol ?? "Session 2 Open"}
              </th>
              <th className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[19%]">
                {s.session2EndCol ?? "Session 2 Close"}
              </th>
              <th className="px-2 py-3 w-[8%]" />
            </tr>
          </thead>
          <tbody>
            {DAY_KEYS.map((day) => {
              const dayData = schedule.schedule[day];
              const isOpen = dayData?.isOpen ?? false;
              return (
                <tr
                  key={day}
                  className={`border-b border-gray-100 last:border-0 transition-opacity ${
                    isOpen ? "" : "opacity-40"
                  }`}
                >
                  <td className="px-5 py-3 font-semibold text-gray-800 whitespace-nowrap">
                    {dayLabel(day)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Toggle checked={isOpen} onChange={(v) => setDayOpen(day, v)} />
                  </td>
                  <td className="px-2 py-2">
                    <TimePickerCell
                      value={dayData?.session1?.start ?? "13:00"}
                      onChange={(v) => setSessionTime(day, "session1", "start", v)}
                      disabled={!isOpen}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TimePickerCell
                      value={dayData?.session1?.end ?? "17:00"}
                      onChange={(v) => setSessionTime(day, "session1", "end", v)}
                      disabled={!isOpen}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TimePickerCell
                      value={dayData?.session2?.start ?? "19:00"}
                      onChange={(v) => setSessionTime(day, "session2", "start", v)}
                      disabled={!isOpen}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TimePickerCell
                      value={dayData?.session2?.end ?? "23:59"}
                      onChange={(v) => setSessionTime(day, "session2", "end", v)}
                      disabled={!isOpen}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => resetDay(day)}
                      title={s.resetBtn ?? "Reset to default"}
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile stacked cards ── */}
      <div className="lg:hidden space-y-3">
        {DAY_KEYS.map((day) => {
          const dayData = schedule.schedule[day];
          const isOpen = dayData?.isOpen ?? false;
          const expanded = expandedDays[day] ?? false;

          return (
            <div
              key={day}
              className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${
                isOpen ? "" : "opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Toggle checked={isOpen} onChange={(v) => setDayOpen(day, v)} />
                  <span className="font-semibold text-gray-800 text-sm">{dayLabel(day)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resetDay(day)}
                    title={s.resetBtn ?? "Reset"}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }))
                      }
                      className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {expanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed summary */}
              {isOpen && !expanded && (
                <div className="px-4 pb-3 flex gap-3 text-xs text-gray-500">
                  <span>
                    {s.session1Label ?? "S1"}:{" "}
                    <span className="font-medium text-gray-700">
                      {dayData?.session1?.start} – {dayData?.session1?.end}
                    </span>
                  </span>
                  <span>
                    {s.session2Label ?? "S2"}:{" "}
                    <span className="font-medium text-gray-700">
                      {dayData?.session2?.start} – {dayData?.session2?.end}
                    </span>
                  </span>
                </div>
              )}

              {/* Expanded time pickers */}
              {isOpen && expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {s.session1Label ?? "Session 1"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          {s.openLabel ?? "Open"}
                        </p>
                        <TimePickerCell
                          value={dayData?.session1?.start ?? "13:00"}
                          onChange={(v) => setSessionTime(day, "session1", "start", v)}
                        />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          {s.closeLabel ?? "Close"}
                        </p>
                        <TimePickerCell
                          value={dayData?.session1?.end ?? "17:00"}
                          onChange={(v) => setSessionTime(day, "session1", "end", v)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {s.session2Label ?? "Session 2"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          {s.openLabel ?? "Open"}
                        </p>
                        <TimePickerCell
                          value={dayData?.session2?.start ?? "19:00"}
                          onChange={(v) => setSessionTime(day, "session2", "start", v)}
                        />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          {s.closeLabel ?? "Close"}
                        </p>
                        <TimePickerCell
                          value={dayData?.session2?.end ?? "23:59"}
                          onChange={(v) => setSessionTime(day, "session2", "end", v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          <span>
            {saving
              ? t("webAdmin.actions.saving")
              : t("webAdmin.actions.save")}
          </span>
        </button>
      </div>
    </div>
  );
};

export default OpeningHoursTab;
