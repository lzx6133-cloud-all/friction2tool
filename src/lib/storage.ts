import { DEFAULT_SETTINGS } from '../constants';
import type { ApiSettings, Idea, SavedTool, ToolVersion } from '../types';

const SETTINGS_KEY = 'friction2tool.settings.v1';
const TOOLS_KEY = 'friction2tool.tools.v1';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIdea(value: unknown): value is Idea {
  if (!isRecord(value)) return false;
  return (
    typeof value.title === 'string' &&
    typeof value.problem === 'string' &&
    typeof value.howItWorks === 'string' &&
    typeof value.whySmall === 'string'
  );
}

function isToolVersion(value: unknown): value is ToolVersion {
  if (!isRecord(value)) return false;
  return (
    typeof value.html === 'string' &&
    typeof value.feedback === 'string' &&
    typeof value.createdAt === 'number'
  );
}

function isSavedTool(value: unknown): value is SavedTool {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.friction === 'string' &&
    isIdea(value.idea) &&
    typeof value.html === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number' &&
    Array.isArray(value.versions) &&
    value.versions.every(isToolVersion)
  );
}

export function loadSettings(): ApiSettings {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_SETTINGS };

  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_SETTINGS };

    return {
      apiBaseUrl:
        typeof parsed.apiBaseUrl === 'string' && parsed.apiBaseUrl.trim()
          ? parsed.apiBaseUrl
          : DEFAULT_SETTINGS.apiBaseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model
          : DEFAULT_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function persistSettings(settings: ApiSettings): void {
  const storage = getStorage();
  if (!storage) throw new Error('浏览器禁用了本地存储，设置无法保存。');
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSavedTools(): SavedTool[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(TOOLS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSavedTool)
      .map((tool) => ({ ...tool, tags: [...tool.tags], versions: [...tool.versions] }));
  } catch {
    return [];
  }
}

export function persistSavedTools(tools: SavedTool[]): void {
  const storage = getStorage();
  if (!storage) throw new Error('浏览器禁用了本地存储，无法保存工具。');
  storage.setItem(TOOLS_KEY, JSON.stringify(tools));
}

export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: number }).code;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014 ||
    /quota/i.test(error.message)
  );
}

export function storageErrorMessage(error: unknown, action = '保存'): string {
  if (isQuotaError(error)) {
    return `本地存储空间可能已满，${action}失败。请先删除一些工具后重试。`;
  }
  if (error instanceof Error && error.message) {
    return `${action}失败：${error.message}`;
  }
  return `${action}失败，请检查浏览器是否禁用了 localStorage。`;
}

export { SETTINGS_KEY, TOOLS_KEY };
