import {
  CONNECTION_TIMEOUT_MS,
  HTML_TEMPERATURE,
  HTML_TIMEOUT_MS,
  IDEAS_TEMPERATURE,
  IDEAS_TIMEOUT_MS,
} from '../constants';
import type { ApiSettings, GenerateToolInput, Idea } from '../types';
import { errorMessage, truncate } from './format';
import { extractJsonObject, normalizeIdeas, prepareGeneratedHtml } from './html';
import type { ChatMessage } from './llm-types';
import { buildMockIdeas, buildMockTool } from './mock';
import { buildIdeaMessages, buildToolMessages } from './prompts';

interface ChatRequestOptions {
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export class LlmError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isMockMode(settings: ApiSettings): boolean {
  return !settings.apiKey.trim();
}

/**
 * Reasoning models may reject sampling controls or the legacy `max_tokens`
 * field. The preset list includes GPT-5 and o-series models, so keep their
 * request payload minimal for broad OpenAI-compatible provider support.
 */
export function isReasoningModel(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return (
    /(^|\/)(o[1-9](?:[-:.]|$)|gpt-5(?:[-:.]|$))/.test(normalized) ||
    normalized.includes('reasoner')
  );
}

export function buildChatRequestBody(
  model: string,
  messages: ChatMessage[],
  options: Pick<ChatRequestOptions, 'temperature' | 'maxTokens'>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: model.trim(),
    messages,
  };

  if (!isReasoningModel(model)) {
    body.temperature = options.temperature;
    body.max_tokens = options.maxTokens;
  }

  return body;
}

function buildEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) throw new LlmError('API Base URL 不能为空，请到设置中填写。');
  const endpoint = /\/chat\/completions$/i.test(trimmed)
    ? trimmed
    : `${trimmed}/chat/completions`;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new LlmError('API Base URL 不合法，请填写完整的 http(s) 地址。');
  }

  return endpoint;
}

function extractContent(payload: unknown, allowEmpty = false): string {
  if (typeof payload !== 'object' || payload === null) {
    throw new LlmError('API 返回格式不正确。');
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmError('API 没有返回任何生成结果。');
  }

  const first = choices[0];
  if (typeof first !== 'object' || first === null) {
    throw new LlmError('API 返回的 choices 格式不正确。');
  }

  const message = (first as { message?: unknown }).message;
  if (typeof message !== 'object' || message === null) {
    throw new LlmError('API 返回结果缺少 message。');
  }

  const content = (message as { content?: unknown }).content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part === 'object' && part !== null) {
          const value = (part as { text?: unknown }).text;
          return typeof value === 'string' ? value : '';
        }
        return '';
      })
      .join('')
      .trim();

    if (text) return text;
  }

  if (allowEmpty) return '';
  throw new LlmError('API 返回了空内容，请重试。');
}

async function createApiError(response: Response): Promise<LlmError> {
  const status = response.status;
  let detail = '';

  try {
    const text = await response.text();
    if (text) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null) {
          const error = (parsed as { error?: unknown }).error;
          if (typeof error === 'object' && error !== null) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string') detail = message;
          } else if (typeof error === 'string') {
            detail = error;
          }
          if (!detail) {
            const message = (parsed as { message?: unknown }).message;
            if (typeof message === 'string') detail = message;
          }
        }
      } catch {
        detail = text;
      }
    }
  } catch {
    // Ignore body read failures; the HTTP status is still useful.
  }

  const suffix = detail ? ` 详情：${truncate(detail.replace(/\s+/g, ' '), 240)}` : '';

  if (status === 401 || status === 403) {
    return new LlmError(
      `API 鉴权失败（${status}）。请检查 API Key 是否有权限。${suffix}`,
      status,
    );
  }
  if (status === 404) {
    return new LlmError(
      `API 接口不存在（404）。请检查 Base URL 是否包含正确的版本路径（如 /v1）。${suffix}`,
      status,
    );
  }
  if (status === 429) {
    return new LlmError(
      `API 请求过于频繁或额度不足（429）。请稍后重试。${suffix}`,
      status,
    );
  }
  if (status >= 500) {
    return new LlmError(
      `API 服务暂时不可用（${status}）。请稍后重试。${suffix}`,
      status,
    );
  }
  return new LlmError(`API 请求失败（${status}）。${suffix}`, status);
}

async function performChatRequest(
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  allowEmptyContent = false,
): Promise<string> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new LlmError('API 请求超时。请检查网络，或在设置中更换响应更快的模型。');
    }
    throw new LlmError(
      '无法连接 API。请检查 Base URL、网络，以及 API 服务是否允许浏览器跨域（CORS）访问。',
    );
  }

  try {
    if (!response.ok) {
      throw await createApiError(response);
    }

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch (error) {
      if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
        throw new LlmError('API 请求超时。请检查网络，或在设置中更换响应更快的模型。');
      }
      throw new LlmError('API 返回的内容不是有效 JSON，请检查接口地址是否指向 Chat Completions。');
    }

    return extractContent(payload, allowEmptyContent);
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new LlmError('API 请求超时。请检查网络，或在设置中更换响应更快的模型。');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestChat(
  settings: ApiSettings,
  messages: ChatMessage[],
  options: ChatRequestOptions,
): Promise<string> {
  const endpoint = buildEndpoint(settings.apiBaseUrl);
  const model = settings.model.trim();
  const apiKey = settings.apiKey.trim();
  if (!model) {
    throw new LlmError('Model 不能为空，请到设置中填写。');
  }

  const primaryBody = buildChatRequestBody(model, messages, options);

  try {
    return await performChatRequest(
      endpoint,
      apiKey,
      primaryBody,
      options.timeoutMs,
    );
  } catch (error) {
    const canRetryWithMinimalPayload =
      error instanceof LlmError &&
      (error.status === 400 || error.status === 422) &&
      !isReasoningModel(model);

    if (!canRetryWithMinimalPayload) throw error;

    try {
      return await performChatRequest(
        endpoint,
        apiKey,
        { model, messages },
        options.timeoutMs,
      );
    } catch (fallbackError) {
      if (fallbackError instanceof LlmError) {
        throw new LlmError(
          `${fallbackError.message}（已自动使用兼容参数重试）`,
          fallbackError.status,
        );
      }
      throw fallbackError;
    }
  }
}

/**
 * Send a minimal, no-sampling request to verify URL, CORS, auth and model name.
 * This still uses provider quota; the UI labels it as a test request.
 */
export async function testApiConnection(settings: ApiSettings): Promise<string> {
  if (isMockMode(settings)) {
    throw new LlmError('Mock 模式不需要连接测试。填写 API Key 后再测试。');
  }

  const endpoint = buildEndpoint(settings.apiBaseUrl);
  const model = settings.model.trim();
  if (!model) throw new LlmError('Model 不能为空，请先填写模型名称。');

  const content = await performChatRequest(
    endpoint,
    settings.apiKey.trim(),
    {
      model,
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly: OK',
        },
      ],
    },
    CONNECTION_TIMEOUT_MS,
    true,
  );

  return content ? truncate(content, 80) : 'HTTP 200 OK';
}

export async function generateIdeas(
  friction: string,
  settings: ApiSettings,
): Promise<Idea[]> {
  if (isMockMode(settings)) {
    await delay(700);
    return buildMockIdeas(friction);
  }

  const content = await requestChat(settings, buildIdeaMessages(friction), {
    temperature: IDEAS_TEMPERATURE,
    maxTokens: 1600,
    timeoutMs: IDEAS_TIMEOUT_MS,
  });

  try {
    return normalizeIdeas(extractJsonObject(content));
  } catch (error) {
    throw new LlmError(
      `方案解析失败：${errorMessage(error, '模型没有返回预期的 JSON，请重试。')}`,
    );
  }
}

export async function generateTool(
  input: GenerateToolInput,
  settings: ApiSettings,
): Promise<string> {
  if (isMockMode(settings)) {
    await delay(input.feedback ? 1000 : 850);
    return prepareGeneratedHtml(buildMockTool(input));
  }

  const content = await requestChat(settings, buildToolMessages(input), {
    temperature: HTML_TEMPERATURE,
    maxTokens: 8000,
    timeoutMs: HTML_TIMEOUT_MS,
  });

  try {
    return prepareGeneratedHtml(content);
  } catch (error) {
    throw new LlmError(
      `HTML 生成失败：${errorMessage(error, '模型没有返回完整 HTML，请重试。')}`,
    );
  }
}
