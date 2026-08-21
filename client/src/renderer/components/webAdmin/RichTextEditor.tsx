import React, { useMemo, useEffect, useRef } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export function parseBlocks(raw: string): PartialBlock[] | undefined {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as PartialBlock[];
  } catch {
    // If it's not valid BlockNote JSON, convert plain text lines into paragraphs
    const lines = raw.split("\n").filter((l) => l.trim() !== "");
    if (lines.length > 0) {
      return lines.map((line) => ({
        type: "paragraph",
        content: [{ type: "text", text: line, styles: {} }],
      })) as PartialBlock[];
    }
  }
  return undefined;
}

export function blocknoteToPlainText(json: string): string {
  if (!json || typeof json !== "string" || json.trim() === "") return "";
  try {
    const blocks = JSON.parse(json);
    if (!Array.isArray(blocks)) return json;

    function extractText(node: unknown): string {
      if (!node || typeof node !== "object") return "";
      const n = node as Record<string, unknown>;
      if (n.type === "text" && typeof n.text === "string") return n.text;
      let out = "";
      if (Array.isArray(n.content)) {
        out += (n.content as unknown[]).map(extractText).join("");
      }
      if (Array.isArray(n.children)) {
        out += "\n" + (n.children as unknown[]).map(extractText).join("\n");
      }
      return out;
    }

    return blocks.map(extractText).join("\n\n").trim();
  } catch {
    return json;
  }
}

export function plainTextToBlocknote(text: string): string {
  if (!text || typeof text !== "string") return JSON.stringify([{ type: "paragraph", content: [] }]);
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const blocks = lines.map((line) => ({
    type: "paragraph",
    content: [{ type: "text", text: line, styles: {} }],
  }));
  return JSON.stringify(blocks.length ? blocks : [{ type: "paragraph", content: [] }]);
}

interface RichTextEditorProps {
  value: string;
  onChange: (jsonString: string) => void;
  label?: string;
  labelAction?: React.ReactNode;
  hint?: string;
  minHeight?: string;
  maxHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  labelAction,
  hint,
  minHeight = "160px",
  maxHeight = "360px",
}) => {
  const isInternalChangeRef = useRef(false);
  const lastLoadedValueRef = useRef<string>("");

  const editor = useMemo(
    () => BlockNoteEditor.create({ initialContent: parseBlocks(value) }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Sync external value updates (e.g. when initialContent loads asynchronously)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (value && value !== lastLoadedValueRef.current) {
      const blocks = parseBlocks(value);
      if (blocks && blocks.length > 0) {
        lastLoadedValueRef.current = value;
        try {
          editor.replaceBlocks(editor.document, blocks);
        } catch {
          // ignore replace error
        }
      }
    }
  }, [value, editor]);

  const handleEditorChange = () => {
    isInternalChangeRef.current = true;
    const jsonStr = JSON.stringify(editor.document);
    lastLoadedValueRef.current = jsonStr;
    onChange(jsonStr);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(label || labelAction) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {label}
            </label>
          )}
          {labelAction && <span className="flex items-center">{labelAction}</span>}
        </div>
      )}

      <div className="rounded-lg border border-gray-300 focus-within:border-black focus-within:ring-2 focus-within:ring-black/20 transition-all duration-150 overflow-hidden flex flex-col bg-white shadow-2xs">
        <style>{`
          .bn-editor {
            background: #ffffff !important;
            color: #1f2937 !important;
            padding: 10px 14px !important;
            min-height: ${minHeight};
            font-size: 13px !important;
          }
          .bn-editor .ProseMirror { min-height: ${minHeight}; }
          .bn-toolbar {
            background: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
            flex-shrink: 0;
          }
          .bn-toolbar button:hover { background: #f3f4f6 !important; }
          .bn-side-menu { background: #ffffff !important; }
        `}</style>

        <div style={{ maxHeight, overflowY: "auto" }} className="flex-1">
          <BlockNoteView
            editor={editor}
            theme="light"
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
};

export default RichTextEditor;
