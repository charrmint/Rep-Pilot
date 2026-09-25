"use client";

import { useEffect } from "react";

export function useLeaveWarning(dirty: boolean, pending: boolean) {
  useEffect(() => {
    if (!dirty && !pending) return;
    function _beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function _onLink(event: MouseEvent) {
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !link ||
        link.target === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (
        pending ||
        !window.confirm(
          "Leave this workout? Unlogged changes will be lost. Logged sets are saved.",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", _beforeUnload);
    document.addEventListener("click", _onLink, true);
    return () => {
      window.removeEventListener("beforeunload", _beforeUnload);
      document.removeEventListener("click", _onLink, true);
    };
  }, [dirty, pending]);
}
