import type { MouseEvent } from 'react';

/**
 * Settings are a dialog, but the trigger is a real link with a `?settings=1`
 * fallback. If React's click/state path does not actually produce a dialog
 * (some browser/extension/cache states), hard-navigate to that URL where the
 * app opens settings during boot.
 */
export function openSettingsFromLink(
  event: MouseEvent<HTMLAnchorElement>,
  openSettings: () => void,
): void {
  // Keep standard new-tab / new-window behavior available.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  openSettings();

  let attempts = 0;
  const timer = window.setInterval(() => {
    if (document.querySelector('[role="dialog"]')) {
      window.clearInterval(timer);
      return;
    }

    attempts += 1;
    if (attempts < 8) return;

    window.clearInterval(timer);
    const url = new URL(window.location.href);
    url.searchParams.set('settings', '1');
    window.location.assign(url.toString());
  }, 50);
}
