import React from "react";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/en";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  label?: string;
  value?: string | Date;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "0.5rem",
    backgroundColor: "white",
    "& fieldset": {
      borderColor: "#d1d5db", // gray-300
    },
    "&:hover fieldset": {
      borderColor: "#9ca3af", // gray-400
    },
    "&.Mui-focused fieldset": {
      borderColor: "#000000",
      borderWidth: "2px",
    },
  },
  "& .MuiInputBase-input": {
    padding: "0.75rem 0.75rem", // py-3 equivalent
    fontSize: "0.875rem",
    color: "#111827", // gray-900
    "&::placeholder": {
      color: "#9ca3af", // gray-400
      opacity: 1,
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
    color: "#374151", // gray-700
    "&.Mui-focused": {
      color: "#000000",
    },
  },
}));

export function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
}: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === "es" ? "es" : "en";

  React.useEffect(() => {
    dayjs.locale(currentLocale);
  }, [currentLocale]);

  const defaultPlaceholder =
    placeholder || t("datePicker.selectDate", "Select date");
  const cancelLabel = t("common.cancel", "Cancel");
  const acceptLabel = t("datePicker.accept", "OK");

  const [dateValue, setDateValue] = React.useState<Dayjs | null>(() => {
    if (!value) return null;
    if (value instanceof Date) {
      return dayjs(value);
    }
    if (typeof value === "string") {
      if (value === "") return null;
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed : null;
    }
    return null;
  });

  React.useEffect(() => {
    if (!value) {
      setDateValue(null);
      return;
    }
    if (value instanceof Date) {
      setDateValue(dayjs(value));
      return;
    }
    if (typeof value === "string") {
      if (value === "") {
        setDateValue(null);
        return;
      }
      const parsed = dayjs(value);
      setDateValue(parsed.isValid() ? parsed : null);
      return;
    }
    setDateValue(null);
  }, [value]);

  const handleChange = (newValue: Dayjs | null) => {
    setDateValue(newValue);
    if (newValue && newValue.isValid()) {
      const formattedDate = newValue.format("YYYY-MM-DD");
      onChange(formattedDate);
    } else {
      onChange("");
    }
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={currentLocale}
    >
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <style>{`
          .MuiPickersYear-yearButton.Mui-selected,
          .MuiYearCalendar-root button.Mui-selected,
          .MuiPickersLayout-root button.Mui-selected {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          .MuiPickersYear-yearButton.Mui-selected:hover,
          .MuiYearCalendar-root button.Mui-selected:hover,
          .MuiPickersLayout-root button.Mui-selected:hover {
            background-color: #1f2937 !important;
          }
        `}</style>
        <MobileDatePicker
          value={dateValue}
          onChange={handleChange}
          enableAccessibleFieldDOMStructure={false}
          localeText={{
            cancelButtonLabel: cancelLabel,
            okButtonLabel: acceptLabel,
          }}
          slotProps={{
            textField: {
              placeholder: defaultPlaceholder,
              className: inputClassName,
              fullWidth: true,
            },
            dialog: {
              PaperProps: {
                sx: {
                  borderRadius: "0.75rem",
                  backgroundColor: "#ffffff",
                  "& .MuiPickersLayout-root": {
                    "& .MuiPickersCalendarHeader-root": {
                      backgroundColor: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "16px",
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#111827",
                        fontWeight: 600,
                        fontSize: "1rem",
                      },
                      "& .MuiIconButton-root": {
                        color: "#374151",
                        "&:hover": {
                          backgroundColor: "#f3f4f6",
                        },
                      },
                    },
                    "& .MuiDayCalendar-root": {
                      padding: "8px",
                      "& .MuiDayCalendar-weekContainer": {
                        "& .MuiPickersDay-root": {
                          color: "#111827",
                          fontSize: "0.875rem",
                          "&.Mui-selected": {
                            backgroundColor: "#000000 !important",
                            color: "#ffffff !important",
                            "&:hover": {
                              backgroundColor: "#1f2937 !important",
                            },
                            "&:focus": {
                              backgroundColor: "#000000 !important",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "#f3f4f6",
                          },
                          "&.MuiPickersDay-today": {
                            border: "1px solid #000000 !important",
                            fontWeight: 600,
                          },
                        },
                      },
                    },
                    "& .MuiPickersActionBar-root": {
                      padding: "16px",
                      borderTop: "1px solid #e5e7eb",
                      "& .MuiButton-root": {
                        color: "#000000",
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "#f3f4f6",
                        },
                      },
                    },
                  },
                },
              },
            },
            actionBar: {
              actions: ["cancel", "accept"],
              sx: {
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                "& .MuiButton-root": {
                  color: "#000000 !important",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                  },
                },
              },
            },
          }}
          slots={{
            textField: StyledTextField,
          }}
        />
      </div>
    </LocalizationProvider>
  );
}
