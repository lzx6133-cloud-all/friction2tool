import type { Idea } from '../types';

const CSP_META =
  "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';\" />";

const VIEWPORT_META = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';

function stripOuterFence(raw: string): string {
  const trimmed = raw.trim();
  const fence = /```[a-zA-Z0-9_-]*[ \t]*\r?\n?([\s\S]*?)```/.exec(trimmed);
  if (fence?.[1]) return fence[1].trim();
  return trimmed;
}

function findBalancedObject(text: string): string {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('响应中没有找到 JSON 对象。');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  throw new Error('JSON 结构不完整。');
}

/**
 * Accept raw JSON, fenced JSON, or JSON embedded in prose.
 * Only the first complete object is used.
 */
export function extractJsonObject(raw: string): unknown {
  const text = stripOuterFence(raw);

  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Fall through to balanced extraction.
  }

  let candidate = findBalancedObject(text);

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // A common model slip is a trailing comma before a closing brace/bracket.
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      throw new Error('模型返回的方案不是有效 JSON，请重试。');
    }
  }
}

export function normalizeIdeas(raw: unknown): Idea[] {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('模型返回的方案格式不正确，请重试。');
  }

  const ideas = (raw as { ideas?: unknown }).ideas;
  if (!Array.isArray(ideas)) {
    throw new Error('模型返回的数据缺少 ideas 数组，请重试。');
  }

  const fields: (keyof Idea)[] = ['title', 'problem', 'howItWorks', 'whySmall'];
  const valid = ideas
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const record = item as Record<string, unknown>;
      const idea = {} as Idea;

      for (const field of fields) {
        const value = record[field];
        if (typeof value !== 'string' || !value.trim()) return null;
        idea[field] = value.trim();
      }
      return idea;
    })
    .filter((idea): idea is Idea => idea !== null);

  if (valid.length < 3) {
    throw new Error(`模型只返回了 ${valid.length} 个完整方案，不足 3 个，请重试。`);
  }

  return valid.slice(0, 3);
}

/**
 * Extract a complete HTML document from model output, reject fragments, and
 * enforce a no-network CSP. The CSP is a second line of defense after sandboxing.
 */
export function prepareGeneratedHtml(raw: string): string {
  let text = stripOuterFence(raw);
  const htmlStart = text.search(/<!doctype\s+html|<html[\s>]/i);
  const htmlEnd = /<\/html\s*>/i.exec(text);

  if (htmlStart < 0 || !htmlEnd) {
    throw new Error('模型没有返回完整的 HTML 文档（需要 <html> 到 </html>），请重试。');
  }

  text = text.slice(htmlStart, htmlEnd.index + htmlEnd[0].length).trim();

  // Replace any CSP supplied by the model with our stricter no-network policy.
  text = text.replace(
    /<meta\b[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*>/gi,
    '',
  );

  const headTags = [CSP_META];
  if (!/<meta[^>]+name\s*=\s*["']viewport["'][^>]*>/i.test(text)) {
    headTags.push(VIEWPORT_META);
  }
  const injected = headTags.join('\n    ');

  if (/<head\b[^>]*>/i.test(text)) {
    return text.replace(/<head\b[^>]*>/i, (match) => `${match}\n    ${injected}`);
  }

  if (/<html\b[^>]*>/i.test(text)) {
    return text.replace(/<html\b[^>]*>/i, (match) => `${match}\n  <head>${injected}</head>`);
  }

  throw new Error('模型返回的 HTML 缺少 <head> 或 <html>，请重试。');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
