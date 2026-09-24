/**
 * Every write the game makes to the device goes through here (BACKLOG-8 phase 50), so none can
 * fail without the player being told. A write throws when the browser's storage is full,
 * blocked or gone. Each save used to swallow that where it happened, so the session went on
 * showing progress the next load had lost. Now a failed write is counted and reported, and
 * the game says so once. `tests/ui/storage.test.tsx` fails if anything in `src/` writes to
 * storage any other way.
 */

type Listener = () => void;

let failures = 0;
const listeners = new Set<Listener>();
/** Keys whose value is not the game's to replace, for now: every write to them fails. */
const held = new Set<string>();

/** A write that did not happen, however it failed. */
export function reportFailure(): void {
  failures++;
  for (const listener of listeners) listener();
}

/** Store a value. False, and reported, when the browser would not keep it. */
export function writeKey(key: string, value: string): boolean {
  if (held.has(key)) {
    reportFailure();
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    reportFailure();
    return false;
  }
}

/** Remove a value. False, and reported, when the browser would not let it go. */
export function removeKey(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    reportFailure();
    return false;
  }
}

/**
 * Refuse every write to a key until it is let go, reporting each as failed: what is stored
 * there has to be kept, and could not be kept anywhere else.
 */
export function holdKey(key: string): void {
  held.add(key);
}

export function releaseKey(key: string): void {
  held.delete(key);
}

/** How many writes have failed since the page loaded. */
export function writeFailures(): number {
  return failures;
}

/** Be told of each failed write from now on. Returns the way to stop. */
export function onWriteFailed(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let asked = false;

/**
 * Ask the browser to keep the game's storage rather than clear it when space runs short.
 * Called when a run ends, so only once there is progress to lose, and at most once a page:
 * Firefox asks the player, and Chrome decides by how the site is used. Whether it is kept is
 * the browser's call either way.
 */
export function askToBeKept(): void {
  if (asked) return;
  asked = true;
  const storage = typeof navigator === "undefined" ? undefined : navigator.storage;
  if (!storage?.persist) return;
  void (async () => {
    try {
      if (await storage.persisted?.()) return;
      await storage.persist();
    } catch {
      // Refused or unsupported: storage stays best-effort, as it was.
    }
  })();
}

/** Tests only: a fresh page, as far as this module knows. */
export function resetStorageReport(): void {
  failures = 0;
  asked = false;
  held.clear();
}
