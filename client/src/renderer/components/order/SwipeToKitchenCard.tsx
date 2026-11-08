import React, { ReactNode, useRef, useState } from "react";
import { SentToKitchenIcon } from "@/renderer/public/Svg";

// Finger (or mouse) travel before the card starts to follow it; less than
// this is still a tap (about the browser's own tap allowance)
const START_DRAG_PX = 16;
// Release past this point sends the order: 35% of the card, at least 110px
const TRIGGER_RATIO = 0.35;
const MIN_TRIGGER_PX = 110;

interface SwipeToKitchenCardProps {
  /** Swipe right is allowed for this card (pending web/app order) */
  enabled: boolean;
  /** The order is being sent: the card stays slid out and ignores taps */
  busy: boolean;
  actionLabel: string;
  busyLabel: string;
  onSwipe: () => void;
  onTap: () => void;
  /** Classes of the card itself (it slides; keep a background so it hides the action behind) */
  className: string;
  /** Classes of the fixed outer box, e.g. spacing between cards */
  wrapperClassName?: string;
  children: ReactNode;
}

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  width: number;
  mode: "undecided" | "swipe" | "scroll";
};

/**
 * An order card that opens on tap and, when enabled, sends the order to the
 * kitchen on a swipe to the right. Vertical moves are left to the list's
 * scrolling (touch-action: pan-y).
 */
const SwipeToKitchenCard: React.FC<SwipeToKitchenCardProps> = ({
  enabled,
  busy,
  actionLabel,
  busyLabel,
  onSwipe,
  onTap,
  className,
  wrapperClassName = "",
  children,
}) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  // A drag is never a tap (a mouse fires click after a drag), on any card
  const swallowClick = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swallowClick.current = false;
    if (busy) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      width: e.currentTarget.offsetWidth,
      mode: "undecided",
    };
  };

  const dropGesture = () => {
    gesture.current = null;
    setDragging(false);
    setOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId || g.mode === "scroll") return;
    // Mouse button already released somewhere else: a stale press, not a drag
    if (e.pointerType === "mouse" && (e.buttons & 1) === 0) {
      dropGesture();
      return;
    }
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.mode === "undecided") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= START_DRAG_PX) return;
      swallowClick.current = true;
      if (!enabled || dx <= Math.abs(dy)) {
        // Scrolling, a left drag, or a card that cannot be swiped
        g.mode = "scroll";
        return;
      }
      g.mode = "swipe";
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }

    setOffset(Math.max(0, Math.min(dx, g.width)));
  };

  const endGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    // enabled is read again here: the list may have refreshed during the drag
    // (e.g. the order was processed or locked on another screen)
    const triggered =
      !cancelled &&
      enabled &&
      !busy &&
      g.mode === "swipe" &&
      dx >= Math.max(MIN_TRIGGER_PX, g.width * TRIGGER_RATIO);
    dropGesture();
    if (triggered) onSwipe();
  };

  // Left the card before it became a swipe (the release may land elsewhere)
  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g && g.pointerId === e.pointerId && g.mode !== "swipe") {
      gesture.current = null;
    }
  };

  // Capture lost without a release here (e.g. the window lost focus).
  // Only the card's own capture counts: on a touch screen the browser first
  // captures the finger to the inner element that was touched (the ticket
  // number, a pill...), and handing it to the card when the swipe starts fires
  // lostpointercapture on that inner element, which bubbles up to here.
  const handleLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const g = gesture.current;
    if (g && g.pointerId === e.pointerId) dropGesture();
  };

  const handleClick = () => {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    if (busy) return;
    onTap();
  };

  // Once the order has left "pending" (list refreshed) the card slides back
  const sending = enabled && busy;
  const showAction = enabled && (sending || offset > 0);
  const transform = sending
    ? "translateX(100%)"
    : offset > 0
      ? `translateX(${offset}px)`
      : undefined;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {showAction && (
        <div className="absolute inset-0 flex items-center gap-3 pl-5 bg-green-600 text-white text-lg font-semibold select-none">
          {sending ? (
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <SentToKitchenIcon className="size-6" />
          )}
          <span>{sending ? busyLabel : actionLabel}</span>
        </div>
      )}
      <div
        className={`${className}${enabled ? " select-none" : ""}`}
        style={{
          transform,
          // Follow the finger exactly; otherwise the card's own transition
          // classes animate the snap back
          transition: dragging ? "none" : undefined,
          touchAction: enabled ? "pan-y" : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => endGesture(e, false)}
        onPointerCancel={(e) => endGesture(e, true)}
        onPointerLeave={handlePointerLeave}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeToKitchenCard;
