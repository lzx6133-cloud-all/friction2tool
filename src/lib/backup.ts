import type { SavedTool } from '../types';
import { isSavedTool } from './storage';

interface BackupPayload {
  app: 'Friction2Tool';
  version: 1;
  exportedAt: string;
  tools: SavedTool[];
}

export interface ParsedBackup {
  tools: SavedTool[];
  invalidCount: number;
}

export interface MergeResult {
  tools: SavedTool[];
  added: number;
  updated: number;
}

export function serializeBackup(tools: SavedTool[]): string {
  const payload: BackupPayload = {
    app: 'Friction2Tool',
    version: 1,
    exportedAt: new Date().toISOString(),
    tools,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Accepts either the Friction2Tool backup object or a bare SavedTool[] array.
 * Invalid records are skipped rather than allowing malformed storage data in.
 */
export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('备份文件不是有效 JSON。');
  }

  const candidates =
    Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          Array.isArray((parsed as { tools?: unknown }).tools)
        ? ((parsed as { tools: unknown[] }).tools)
        : null;

  if (!candidates) {
    throw new Error('备份文件格式不正确：缺少 tools 数组。');
  }

  const valid = candidates.filter(isSavedTool);
  if (valid.length === 0) {
    throw new Error('备份文件中没有有效的工具记录。');
  }

  return {
    tools: valid,
    invalidCount: candidates.length - valid.length,
  };
}

/**
 * Never deletes existing tools on import. Existing IDs are replaced only when
 * the imported copy is at least as new.
 */
export function mergeImportedTools(
  existing: SavedTool[],
  imported: SavedTool[],
): MergeResult {
  const byId = new Map(existing.map((tool) => [tool.id, tool]));
  let added = 0;
  let updated = 0;

  for (const tool of imported) {
    const previous = byId.get(tool.id);
    if (!previous) {
      byId.set(tool.id, tool);
      added += 1;
      continue;
    }

    if (tool.updatedAt > previous.updatedAt) {
      byId.set(tool.id, tool);
      updated += 1;
    }
  }

  return {
    tools: [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt),
    added,
    updated,
  };
}

export function safeFilename(name: string, fallback = 'friction2tool'): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
