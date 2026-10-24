import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildChatRequestBody,
  generateIdeas,
  isReasoningModel,
  testApiConnection,
} from '../../src/lib/llm';
import type { ChatMessage } from '../../src/lib/llm-types';

const messages: ChatMessage[] = [{ role: 'user', content: 'hello' }];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function errorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    async text() {
      return JSON.stringify({ error: { message } });
    },
  };
}

function successResponse(content: string) {
  return {
    ok: true,
    status: 200,
    async json() {
      return { choices: [{ message: { role: 'assistant', content } }] };
    },
  };
}

describe('reasoning-model detection', () => {
  it('recognizes GPT-5, o-series and reasoner model names', () => {
    for (const model of [
      'gpt-5',
      'gpt-5-mini',
      'o3-mini',
      'o4-mini',
      'openai/o3-mini',
      'deepseek-reasoner',
    ]) {
      expect(isReasoningModel(model), model).toBe(true);
    }
  });

  it('does not classify regular chat models as reasoning models', () => {
    for (const model of ['gpt-4o-mini', 'deepseek-chat', 'qwen-plus', 'llama3.2']) {
      expect(isReasoningModel(model), model).toBe(false);
    }
  });
});

describe('chat request payload', () => {
  it('omits sampling and token limits for reasoning models', () => {
    const body = buildChatRequestBody('o3-mini', messages, {
      temperature: 0.8,
      maxTokens: 1600,
    });
    expect(body).toEqual({ model: 'o3-mini', messages });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('max_tokens');
  });

  it('sends sampling and token limits for regular chat models', () => {
    const body = buildChatRequestBody('gpt-4o-mini', messages, {
      temperature: 0.8,
      maxTokens: 1600,
    });
    expect(body).toEqual({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 1600,
    });
  });
});

describe('chat request fallback and connection test', () => {
  const settings = {
    apiBaseUrl: 'https://api.example.test/v1',
    apiKey: 'gsk_test',
    model: 'llama-3.3-70b-versatile',
  };

  it('retries with a minimal payload after a parameter-related 400', async () => {
    vi.stubGlobal('window', globalThis);
    const ideas = [
      {
        title: '工具 1',
        problem: '问题 1',
        howItWorks: '用法 1',
        whySmall: '很小 1',
      },
      {
        title: '工具 2',
        problem: '问题 2',
        howItWorks: '用法 2',
        whySmall: '很小 2',
      },
      {
        title: '工具 3',
        problem: '问题 3',
        howItWorks: '用法 3',
        whySmall: '很小 3',
      },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(400, 'max_tokens is not supported'))
      .mockResolvedValueOnce(successResponse(JSON.stringify({ ideas })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateIdeas('每次买菜前都想不起家里还有什么。', settings);
    expect(result).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(firstBody).toHaveProperty('temperature');
    expect(firstBody).toHaveProperty('max_tokens');
    expect(secondBody).not.toHaveProperty('temperature');
    expect(secondBody).not.toHaveProperty('max_tokens');
  });

  it('uses a minimal, non-empty connection probe and returns model text', async () => {
    vi.stubGlobal('window', globalThis);
    const fetchMock = vi.fn().mockResolvedValueOnce(successResponse('OK'));
    vi.stubGlobal('fetch', fetchMock);

    const answer = await testApiConnection(settings);
    expect(answer).toBe('OK');

    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(request.body as string);
    expect(body).toEqual({
      model: settings.model,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/v1/chat/completions',
    );
    expect(request.headers.Authorization).toBe('Bearer gsk_test');
  });
});
