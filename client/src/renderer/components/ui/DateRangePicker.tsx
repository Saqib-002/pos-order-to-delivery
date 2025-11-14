import { useState, useEffect, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { CalendarIcon, CrossIcon } from "@/renderer/public/Svg";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  selectedDate?: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

interface ShortcutOption {
  label: string;
  getValue: () => { start: Dayjs; end: Dayjs };
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  selectedDate,
  onChange,
  className = "",
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Dayjs | null>(
    startDate ? dayjs(startDate) : null
  );
  const [tempEnd, setTempEnd] = useState<Dayjs | null>(
    endDate ? dayjs(endDate) : null
  );
  const [hoverDate, setHoverDate] = useState<Dayjs | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [nextMonth, setNextMonth] = useState<Dayjs>(dayjs().add(1, "month"));
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update temp dates when props change
  useEffect(() => {
    setTempStart(startDate ? dayjs(startDate) : null);
    setTempEnd(endDate ? dayjs(endDate) : null);
  }, [startDate, endDate]);

  useEffect(() => {
    if (open) {
      if (startDate) {
        const start = dayjs(startDate);
        setCurrentMonth(start);
        setNextMonth(start.add(1, "month"));
      } else if (endDate) {
        const end = dayjs(endDate);
        setCurrentMonth(end.subtract(1, "month"));
        setNextMonth(end);
      } else {
        setCurrentMonth(dayjs());
        setNextMonth(dayjs().add(1, "month"));
      }
    }
  }, [open, startDate, endDate]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const shortcuts: ShortcutOption[] = [
    {
      label: t("dateRangePicker.shortcuts.thisWeek") || "This Week",
      getValue: () => {
        const today = dayjs();
        return { start: today.startOf("week"), end: today.endOf("week") };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.lastWeek") || "Last Week",
      getValue: () => {
        const today = dayjs();
        const lastWeek = today.subtract(1, "week");
        return { start: lastWeek.startOf("week"), end: lastWeek.endOf("week") };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.last7Days") || "Last 7 Days",
      getValue: () => {
        const today = dayjs();
        return { start: today.subtract(6, "day"), end: today };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.currentMonth") || "Current Month",
      getValue: () => {
        const today = dayjs();
        return { start: today.startOf("month"), end: today.endOf("month") };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.nextMonth") || "Next Month",
      getValue: () => {
        const today = dayjs();
        const nextMonth = today.add(1, "month");
        return {
          start: nextMonth.startOf("month"),
          end: nextMonth.endOf("month"),
        };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.thisYear") || "This Year",
      getValue: () => {
        const today = dayjs();
        return { start: today.startOf("year"), end: today.endOf("year") };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.lastYear") || "Last Year",
      getValue: () => {
        const today = dayjs();
        const lastYear = today.subtract(1, "year");
        return { start: lastYear.startOf("year"), end: lastYear.endOf("year") };
      },
    },
    {
      label: t("dateRangePicker.shortcuts.reset") || "Reset",
      getValue: () => {
        return { start: dayjs(), end: dayjs() };
      },
    },
  ];

  const handleShortcutClick = (shortcut: ShortcutOption) => {
    const { start, end } = shortcut.getValue();
    setTempStart(start);
    setTempEnd(end);
  };

  const handleDateClick = (date: Dayjs) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date.isBefore(tempStart)) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const isShortcutActive = (shortcut: ShortcutOption) => {
    const currentStart =
      tempStart !== undefined ? tempStart : startDate ? dayjs(startDate) : null;
    const currentEnd =
      tempEnd !== undefined ? tempEnd : endDate ? dayjs(endDate) : null;

    if (!currentStart || !currentEnd) return false;

    const { start, end } = shortcut.getValue();

    return currentStart.isSame(start, "day") && currentEnd.isSame(end, "day");
  };

  const isInRange = (date: Dayjs) => {
    if (!tempStart) return false;
    const effectiveEnd = hoverDate || tempEnd;
    if (!effectiveEnd) {
      return date.isSame(tempStart, "day");
    }
    const start = tempStart.isBefore(effectiveEnd) ? tempStart : effectiveEnd;
    const end = tempStart.isBefore(effectiveEnd) ? effectiveEnd : tempStart;
    return (
      (date.isAfter(start, "day") || date.isSame(start, "day")) &&
      (date.isBefore(end, "day") || date.isSame(end, "day"))
    );
  };

  const isStartDate = (date: Dayjs) => {
    if (!tempStart) return false;
    const effectiveEnd = hoverDate || tempEnd;
    if (!effectiveEnd) return date.isSame(tempStart, "day");
    return date.isSame(
      tempStart.isBefore(effectiveEnd) ? tempStart : effectiveEnd,
      "day"
    );
  };

  const isEndDate = (date: Dayjs) => {
    if (!tempStart) return false;
    const effectiveEnd = hoverDate || tempEnd;
    if (!effectiveEnd) return false;
    return date.isSame(
      tempStart.isBefore(effectiveEnd) ? effectiveEnd : tempStart,
      "day"
    );
  };

  const getDaysInMonth = (month: Dayjs) => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const days: Dayjs[] = [];
    let current = start.startOf("week");

    while (
      current.isBefore(end.endOf("week")) ||
      current.isSame(end.endOf("week"), "day")
    ) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const newMonth = currentMonth.subtract(1, "month");
      setCurrentMonth(newMonth);
      setNextMonth(newMonth.add(1, "month"));
    } else {
      const newMonth = currentMonth.add(1, "month");
      setCurrentMonth(newMonth);
      setNextMonth(newMonth.add(1, "month"));
    }
  };

  const getTranslatedShortMonthName = (month: Dayjs) => {
    const monthIndex = month.month();
    const monthKeys = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    return (
      t(`dateRangePicker.monthsShort.${monthKeys[monthIndex]}`) ||
      month.format("MMM")
    );
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) {
      return t("dateRangePicker.selectDateRange") || "Select Date Range";
    }
    const startMonthShort = getTranslatedShortMonthName(dayjs(startDate));
    const endMonthShort = getTranslatedShortMonthName(dayjs(endDate));
    const startDay = dayjs(startDate).date();
    const endDay = dayjs(endDate).date();
    return `${startMonthShort} ${startDay} - ${endMonthShort} ${endDay}`;
  };

  const getTranslatedMonthName = (month: Dayjs) => {
    const monthIndex = month.month();
    const monthKeys = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    return (
      t(`dateRangePicker.months.${monthKeys[monthIndex]}`) ||
      month.format("MMMM")
    );
  };

  const weekDays = [
    t("dateRangePicker.days.sunday") || "S",
    t("dateRangePicker.days.monday") || "M",
    t("dateRangePicker.days.tuesday") || "T",
    t("dateRangePicker.days.wednesday") || "W",
    t("dateRangePicker.days.thursday") || "T",
    t("dateRangePicker.days.friday") || "F",
    t("dateRangePicker.days.saturday") || "S",
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div ref={pickerRef} className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
          className="w-full px-3 py-3 text-left border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 focus:border-transparent transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{formatDateRange()}</span>
            <span className="text-gray-500 flex items-center justify-center">
              <CalendarIcon className="size-5" />
            </span>
          </div>
        </button>

        {open && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("dateRangePicker.selectDateRange") || "SELECT DATE RANGE"}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                >
                  <CrossIcon className="size-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Show current selection */}
                {(tempStart !== undefined ||
                  tempEnd !== undefined ||
                  startDate ||
                  endDate) && (
                  <div className="mb-4 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const displayStart =
                          tempStart !== undefined
                            ? tempStart
                            : startDate
                              ? dayjs(startDate)
                              : null;
                        const displayEnd =
                          tempEnd !== undefined
                            ? tempEnd
                            : endDate
                              ? dayjs(endDate)
                              : null;

                        if (displayStart && displayEnd) {
                          return `${getTranslatedShortMonthName(displayStart)} ${displayStart.date()} - ${getTranslatedShortMonthName(displayEnd)} ${displayEnd.date()}`;
                        } else if (displayStart) {
                          return `${getTranslatedShortMonthName(displayStart)} ${displayStart.date()}`;
                        } else if (displayEnd) {
                          return `${getTranslatedShortMonthName(displayEnd)} ${displayEnd.date()}`;
                        }
                        return "";
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Shortcuts Panel */}
                  <div className="w-44 flex-shrink-0">
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => {
                        const isActive = isShortcutActive(shortcut);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleShortcutClick(shortcut)}
                            className={`w-full px-3 py-2.5 text-sm text-left rounded transition-colors duration-200 touch-manipulation ${
                              isActive
                                ? "bg-black text-white font-semibold hover:bg-gray-800"
                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {shortcut.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendar Panel - Two Months */}
                  <div className="flex-1 flex gap-3">
                    {/* First Calendar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => handleMonthChange("prev")}
                          className="p-3 hover:bg-gray-100 rounded touch-manipulation"
                        >
                          <span className="text-gray-600 text-2xl font-bold">
                            ‹
                          </span>
                        </button>
                        <div className="text-sm font-semibold text-gray-900">
                          {getTranslatedMonthName(currentMonth)}{" "}
                          {currentMonth.format("YYYY")}
                        </div>
                        <div className="w-12"></div>
                      </div>

                      {/* Week days header */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {weekDays.map((day, index) => (
                          <div
                            key={index}
                            className="text-xs font-medium text-gray-500 text-center py-1"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth).map((day, index) => {
                          const isCurrentMonth =
                            day.month() === currentMonth.month();
                          const inRange = isInRange(day);
                          const isStart = isStartDate(day);
                          const isEnd = isEndDate(day);
                          const isToday = day.isSame(dayjs(), "day");

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleDateClick(day)}
                              onMouseEnter={() => {
                                if (tempStart && !tempEnd) {
                                  setHoverDate(day);
                                }
                              }}
                              onMouseLeave={() => setHoverDate(null)}
                              className={`
                              h-10 text-sm rounded transition-colors touch-manipulation
                              ${
                                !isCurrentMonth
                                  ? "text-gray-300"
                                  : inRange
                                    ? isStart || isEnd
                                      ? "bg-black text-white font-semibold"
                                      : "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-100"
                              }
                              ${isToday && !inRange ? "border-2 border-gray-400" : ""}
                            `}
                            >
                              {day.date()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Second Calendar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-12"></div>
                        <div className="text-sm font-semibold text-gray-900">
                          {getTranslatedMonthName(nextMonth)}{" "}
                          {nextMonth.format("YYYY")}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMonthChange("next")}
                          className="p-3 hover:bg-gray-100 rounded touch-manipulation"
                        >
                          <span className="text-gray-600 text-2xl font-bold">
                            ›
                          </span>
                        </button>
                      </div>

                      {/* Week days header */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {weekDays.map((day, index) => (
                          <div
                            key={index}
                            className="text-xs font-medium text-gray-500 text-center py-1"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(nextMonth).map((day, index) => {
                          const isCurrentMonth =
                            day.month() === nextMonth.month();
                          const inRange = isInRange(day);
                          const isStart = isStartDate(day);
                          const isEnd = isEndDate(day);
                          const isToday = day.isSame(dayjs(), "day");

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleDateClick(day)}
                              onMouseEnter={() => {
                                if (tempStart && !tempEnd) {
                                  setHoverDate(day);
                                }
                              }}
                              onMouseLeave={() => setHoverDate(null)}
                              className={`
                              h-10 text-sm rounded transition-colors touch-manipulation
                              ${
                                !isCurrentMonth
                                  ? "text-gray-300"
                                  : inRange
                                    ? isStart || isEnd
                                      ? "bg-black text-white font-semibold"
                                      : "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-100"
                              }
                              ${isToday && !inRange ? "border-2 border-gray-400" : ""}
                            `}
                            >
                              {day.date()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setTempStart(startDate ? dayjs(startDate) : null);
                      setTempEnd(endDate ? dayjs(endDate) : null);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                  >
                    {t("common.cancel") || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tempStart && tempEnd) {
                        onChange(tempStart.toDate(), tempEnd.toDate());
                        setOpen(false);
                      }
                    }}
                    disabled={!tempStart || !tempEnd}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("common.apply") || "Apply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
};
