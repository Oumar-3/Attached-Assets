import { syncBasicTablesAsync } from "@/services/sync/basicSync";

let backupTimer: ReturnType<typeof setTimeout> | null = null;
let isBackingUp = false;

export function scheduleCloudBackup(delayMs = 1200) {
  if (backupTimer) clearTimeout(backupTimer);

  backupTimer = setTimeout(async () => {
    if (isBackingUp) return;
    isBackingUp = true;
    try {
      await syncBasicTablesAsync();
    } catch {
      // Cloud backup is best-effort; local-first work must never be blocked.
    } finally {
      isBackingUp = false;
    }
  }, delayMs);
}

export function cancelCloudBackup() {
  if (backupTimer) {
    clearTimeout(backupTimer);
    backupTimer = null;
  }
}
