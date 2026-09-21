import { useCallback, useEffect, useState } from "react";

/**
 * Registers the offline worker and surfaces an update without ever swapping the bundle
 * mid-run: a new worker installs and waits, the player is offered a reload, and only then
 * does it take over (TRANSFER.md phase 7).
 */
export function useServiceWorker(): { updateReady: boolean; applyUpdate: () => void } {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (!import.meta.env.PROD) return;

    let cancelled = false;
    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          // A worker that reaches "installed" while one is already in control is an update.
          if (next.state === "installed" && navigator.serviceWorker.controller) setWaiting(next);
        });
      });
    };

    // BASE_URL, not import.meta.url: the built bundle lives under assets/, and the worker
    // must be registered from the app root or its scope will not cover the app.
    const base = import.meta.env.BASE_URL || "/";
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        if (!cancelled) watch(reg);
      })
      .catch(() => {
        // No offline support in this browser or context; the game still runs online.
      });

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    waiting?.postMessage("SKIP_WAITING");
  }, [waiting]);

  return { updateReady: waiting !== null, applyUpdate };
}
