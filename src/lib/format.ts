export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local-time date label: 2026.10.24 17:53 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '未知时间';

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(
    date.getDate(),
  )} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tool-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A small, deterministic label set. Kept local so API responses stay simple. */
export function deriveTags(friction: string): string[] {
  const text = friction.toLowerCase();
  let category = '日常效率';

  if (/买|购|超市|菜|冰箱|清单/.test(text)) category = '购物备忘';
  else if (/忘|记|提醒|备忘|会议/.test(text)) category = '记忆外挂';
  else if (/拖|开始|专注|分心|任务/.test(text)) category = '行动启动';
  else if (/时间|日程|安排|计划/.test(text)) category = '时间管理';

  return [category, '单文件'];
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
