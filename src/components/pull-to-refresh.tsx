import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const THRESHOLD = 72;
const MAX_PULL = 120;

function atTop() {
  if (typeof window === "undefined") return false;
  const el = document.scrollingElement || document.documentElement;
  return el.scrollTop <= 0;
}

export function PullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: 0, dragging: false, refreshing: false });

  const runRefresh = useCallback(async () => {
    if (state.current.refreshing) return;
    state.current.refreshing = true;
    setRefreshing(true);
    setPull(THRESHOLD);
    const started = Date.now();
    try {
      await Promise.all([queryClient.refetchQueries({ type: "active" }), router.invalidate()]);
    } catch {
      /* ignore */
    }
    const elapsed = Date.now() - started;
    if (elapsed < 550) await new Promise((r) => setTimeout(r, 550 - elapsed));
    state.current.refreshing = false;
    setRefreshing(false);
    setPull(0);
  }, [queryClient, router]);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (state.current.refreshing || !atTop() || e.touches.length !== 1) return;
      state.current.startY = e.touches[0]!.clientY;
      state.current.dragging = true;
    }
    function onTouchMove(e: TouchEvent) {
      if (!state.current.dragging) return;
      const delta = e.touches[0]!.clientY - state.current.startY;
      if (delta <= 0 || !atTop()) {
        state.current.dragging = false;
        setPull(0);
        return;
      }
      // resistência elástica
      const eased = Math.min(MAX_PULL, delta * 0.55);
      setPull(eased);
    }
    function onTouchEnd() {
      if (!state.current.dragging) return;
      state.current.dragging = false;
      setPull((p) => {
        if (p >= THRESHOLD) void runRefresh();
        else return 0;
        return p;
      });
    }

    // Web: overscroll com trackpad/scroll do mouse no topo
    let wheelAmount = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    function onWheel(e: WheelEvent) {
      if (state.current.refreshing || !atTop()) return;
      if (e.deltaY >= 0) {
        wheelAmount = 0;
        setPull(0);
        return;
      }
      wheelAmount = Math.min(MAX_PULL, wheelAmount + Math.abs(e.deltaY) * 0.45);
      setPull(wheelAmount);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        if (wheelAmount >= THRESHOLD) void runRefresh();
        else setPull(0);
        wheelAmount = 0;
      }, 140);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [runRefresh]);

  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;
  const active = pull > 0 || refreshing;

  return (
    <>
      <div
        aria-hidden={!active}
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
        style={{
          transform: `translate3d(0, ${active ? Math.min(pull, MAX_PULL) * 0.65 + 8 : -40}px, 0)`,
          opacity: active ? Math.max(0.25, progress) : 0,
          transition: state.current.dragging ? "none" : "transform 260ms cubic-bezier(.22,1,.36,1), opacity 200ms ease",
          willChange: "transform, opacity",
        }}
      >
        <div
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full border border-primary/60 bg-background/70 backdrop-blur-md",
            ready ? "shadow-[0_0_28px_6px_var(--color-primary)]" : "shadow-[0_0_14px_1px_var(--color-primary)]",
          )}
          style={{
            transform: `scale(${0.6 + progress * 0.4}) rotate(${refreshing ? 0 : progress * 180}deg)`,
            transition: state.current.dragging ? "none" : "transform 240ms cubic-bezier(.22,1,.36,1), box-shadow 240ms ease",
          }}
        >
          {/* brilho interno */}
          <span
            className="absolute inset-1 rounded-full bg-primary/30 blur-[6px]"
            style={{ opacity: ready ? 1 : progress * 0.6 }}
          />
          <svg viewBox="0 0 44 44" className={cn("relative h-8 w-8", refreshing && "animate-spin")}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" className="text-primary/20" strokeWidth="3" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={113}
              strokeDashoffset={refreshing ? 80 : 113 - 113 * progress}
              transform="rotate(-90 22 22)"
              style={{ transition: state.current.dragging ? "none" : "stroke-dashoffset 200ms ease" }}
            />
          </svg>
          <span className="absolute h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_3px_var(--color-primary)]" />
        </div>
      </div>

      <div
        style={{
          transform: `translate3d(0, ${active ? Math.min(pull, MAX_PULL) * 0.35 : 0}px, 0)`,
          transition: state.current.dragging ? "none" : "transform 280ms cubic-bezier(.22,1,.36,1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </>
  );
}
