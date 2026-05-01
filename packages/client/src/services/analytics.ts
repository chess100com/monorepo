const COUNTER_ID = 109_004_089;

declare global {
  // eslint-disable-next-line no-var -- `declare global` requires `var`
  var ym: ((counterId: number, action: string, ...args: unknown[]) => void) | undefined;
}

export function trackPageview(url: string): void {
  globalThis.ym?.(COUNTER_ID, 'hit', url, { referer: document.referrer });
}

export function trackGoal(name: string): void {
  globalThis.ym?.(COUNTER_ID, 'reachGoal', name);
}
