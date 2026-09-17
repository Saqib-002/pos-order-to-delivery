/**
 * SupportNotificationBubble
 *
 * Fixed bottom-right button that appears whenever unreadCount > 0.
 * Slides in with a scale+opacity transition and two staggered ping rings.
 * Clicking navigates to the support tab and resets the count.
 */

import { useSupportNotification } from "@/renderer/contexts/SupportNotificationContext";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SupportNotificationBubbleProps {
  onOpen: () => void;
}

export const SupportNotificationBubble: React.FC<
  SupportNotificationBubbleProps
> = ({ onOpen }) => {
  const { unreadCount, clearUnread } = useSupportNotification();

  // Whether the button is in the DOM
  const [mounted, setMounted] = useState(false);
  // Whether to apply the "visible" CSS classes (drives the enter/exit animation)
  const [show, setShow] = useState(false);
  // Track the previous count so we know when it genuinely goes 0 → positive
  const prevCountRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = unreadCount;

    if (unreadCount > 0) {
      // Cancel any in-progress hide
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      // Mount first, then set show on the next frame so the CSS transition fires
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else if (prev > 0 && unreadCount === 0) {
      // Animate out, then unmount after transition completes
      setShow(false);
      hideTimerRef.current = setTimeout(() => {
        setMounted(false);
        hideTimerRef.current = null;
      }, 300);
    }
  }, [unreadCount]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    clearUnread();
    onOpen();
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center justify-center transition-all duration-300 ${
        show
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-75"
      }`}
      style={{ willChange: "transform, opacity" }}
    >
      {/* outer pulse rings */}
      <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
      <span className="absolute inline-flex size-[calc(100%+12px)] rounded-full bg-emerald-400 opacity-15 animate-ping [animation-delay:0.4s]" />

      <button
        type="button"
        onClick={handleClick}
        className="relative flex items-center justify-center size-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 shadow-2xl shadow-emerald-500/50 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
        aria-label={`${unreadCount} new support message${unreadCount !== 1 ? "s" : ""}`}
      >
        <MessageCircle className="size-6 text-white" strokeWidth={2} />

        {/* unread badge */}
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md select-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </button>
    </div>
  );
};
