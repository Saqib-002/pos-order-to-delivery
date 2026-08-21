import React, { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface TranslateButtonProps {
  value: string;
  direction: "en→es" | "es→en";
  label?: string;
  onTranslated: (result: string) => void;
  className?: string;
}

let lastTranslatedAt = 0;
const RATE_LIMIT_MS = 1500;

export const translateText = async (
  text: string,
  to: "en" | "es"
): Promise<string | null> => {
  if (!text || !text.trim()) return "";
  try {
    const sl = to === "es" ? "en" : "es";
    const tl = to;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
      text.trim()
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Translation request failed");
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join("");
    }
    return null;
  } catch (err) {
    console.error("translateText error:", err);
    return null;
  }
};

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  value,
  direction,
  label,
  onTranslated,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const to = direction === "en→es" ? "es" : "en";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = value ? value.trim() : "";
    if (!trimmed) {
      toast.info(to === "es" ? "El campo está vacío" : "Field is empty");
      return;
    }

    const now = Date.now();
    const elapsed = now - lastTranslatedAt;
    if (elapsed < RATE_LIMIT_MS) {
      return;
    }

    setLoading(true);
    try {
      const result = await translateText(trimmed, to);
      if (result) {
        lastTranslatedAt = Date.now();
        onTranslated(result);
      } else {
        toast.error("Translation error");
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || !value?.trim()}
      title={`Translate to ${to.toUpperCase()}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-gray-300 text-gray-700 bg-gray-50 hover:bg-black hover:text-white hover:border-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin text-current" />
      ) : (
        <Languages className="w-3 h-3 text-current" />
      )}
      <span>{label || direction}</span>
    </button>
  );
};

export default TranslateButton;
