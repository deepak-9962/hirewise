"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ProctoringViolation {
  type:
    | "tab_switch"
    | "fullscreen_exit"
    | "copy_paste"
    | "right_click"
    | "devtools"
    | "window_blur";
  timestamp: number;
  detail: string;
}

export interface ProctoringState {
  isFullscreen: boolean;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  copyPasteCount: number;
  violations: ProctoringViolation[];
  warningMessage: string | null;
  isTerminated: boolean;
}

interface UseProctoringOptions {
  enabled: boolean;
  maxTabSwitches?: number;
  maxViolations?: number;
  showWarningDurationMs?: number;
}

export function useProctoring(options: UseProctoringOptions) {
  const {
    enabled,
    maxTabSwitches = 3,
    maxViolations = 5,
    showWarningDurationMs = 4000,
  } = options;

  const [state, setState] = useState<ProctoringState>({
    isFullscreen: false,
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    copyPasteCount: 0,
    violations: [],
    warningMessage: null,
    isTerminated: false,
  });

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFullscreenRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // ── Show warning with auto-dismiss ───────────────────────
  const showWarning = useCallback(
    (message: string) => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      setState((prev) => ({ ...prev, warningMessage: message }));
      warningTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, warningMessage: null }));
      }, showWarningDurationMs);
    },
    [showWarningDurationMs]
  );

  // ── Add violation ────────────────────────────────────────
  const addViolation = useCallback(
    (type: ProctoringViolation["type"], detail: string) => {
      setState((prev) => {
        if (prev.isTerminated) return prev;

        const violation: ProctoringViolation = {
          type,
          timestamp: Date.now(),
          detail,
        };
        const newViolations = [...prev.violations, violation];
        let newTabSwitches = prev.tabSwitchCount;
        let newFullscreenExits = prev.fullscreenExitCount;
        let newCopyPaste = prev.copyPasteCount;

        if (type === "tab_switch" || type === "window_blur") newTabSwitches++;
        if (type === "fullscreen_exit") newFullscreenExits++;
        if (type === "copy_paste") newCopyPaste++;

        const totalViolations = newViolations.length;
        const isTerminated =
          newTabSwitches >= maxTabSwitches || totalViolations >= maxViolations;

        return {
          ...prev,
          violations: newViolations,
          tabSwitchCount: newTabSwitches,
          fullscreenExitCount: newFullscreenExits,
          copyPasteCount: newCopyPaste,
          isTerminated,
        };
      });
    },
    [maxTabSwitches, maxViolations]
  );

  // ── Request fullscreen ───────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((el as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen) {
        await (el as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("[Proctoring] Fullscreen request failed:", err);
    }
  }, []);

  // ── Exit fullscreen ──────────────────────────────────────
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Fullscreen change listener ───────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setState((prev) => ({ ...prev, isFullscreen: isFs }));

      if (!isFs && isFullscreenRef.current) {
        addViolation("fullscreen_exit", "Exited fullscreen mode");
        showWarning("⚠️ You exited fullscreen! This has been recorded.");
      }
      isFullscreenRef.current = isFs;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [enabled, addViolation, showWarning]);

  // ── Tab switch / visibility change ───────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("tab_switch", "Switched to another tab");
        showWarning("⚠️ Tab switch detected! This activity has been logged.");
      }
    };

    const handleWindowBlur = () => {
      if (!enabledRef.current) return;
      if (!document.hidden) {
        addViolation("window_blur", "Window lost focus (possible app switch / overlay)");
        showWarning("⚠️ Focus lost! Switching windows or using overlays is not allowed.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, addViolation, showWarning]);

  // ── Copy / Paste / Cut blocking ──────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_paste", "Attempted to copy content");
      showWarning("⚠️ Copy is disabled during the interview.");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_paste", "Attempted to paste content");
      showWarning("⚠️ Paste is disabled during the interview.");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_paste", "Attempted to cut content");
      showWarning("⚠️ Cut is disabled during the interview.");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
    };
  }, [enabled, addViolation, showWarning]);

  // ── Right-click blocking ─────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("right_click", "Attempted right-click context menu");
      showWarning("⚠️ Right-click is disabled during the interview.");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled, addViolation, showWarning]);

  // ── Keyboard shortcut blocking ───────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Block DevTools: Ctrl+Shift+I
      if (ctrlOrMeta && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        addViolation("devtools", "Attempted to open DevTools (Ctrl+Shift+I)");
        showWarning("⚠️ Developer tools are disabled during the interview.");
        return;
      }

      // Block DevTools: Ctrl+Shift+J (Console)
      if (ctrlOrMeta && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault();
        addViolation("devtools", "Attempted to open DevTools (Ctrl+Shift+J)");
        showWarning("⚠️ Developer tools are disabled during the interview.");
        return;
      }

      // Block F12
      if (e.key === "F12") {
        e.preventDefault();
        addViolation("devtools", "Attempted to open DevTools (F12)");
        showWarning("⚠️ Developer tools are disabled during the interview.");
        return;
      }

      // Block view source: Ctrl+U
      if (ctrlOrMeta && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Block save/print: Ctrl+S, Ctrl+P
      if (ctrlOrMeta && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, addViolation, showWarning]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  const dismissWarning = useCallback(() => {
    setState((prev) => ({ ...prev, warningMessage: null }));
  }, []);

  return {
    ...state,
    requestFullscreen,
    exitFullscreen,
    dismissWarning,
  };
}
