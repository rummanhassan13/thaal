export const DISMISS_KEY = "plated.install.dismissedAt";
export const DISMISS_DAYS = 14;

/** Banner stays hidden for 14 days after the owner dismisses it. */
export function dismissedRecently(dismissedAt: number | null, now = Date.now()) {
  return dismissedAt != null && now - dismissedAt < DISMISS_DAYS * 24 * 3600_000;
}

export function isIosSafari(ua: string) {
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|GSA/.test(ua);
}
