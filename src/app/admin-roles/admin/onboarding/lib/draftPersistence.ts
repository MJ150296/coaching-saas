export function loadDraft<T extends Record<string, unknown>>(key: string): Partial<T> | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Partial<T>;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, data: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore draft persistence errors.
  }
}

export function clearDraft(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore draft persistence errors.
  }
}
