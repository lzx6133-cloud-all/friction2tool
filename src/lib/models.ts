export interface ApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
}

export interface ModelGroup {
  provider: string;
  models: string[];
}

/**
 * Common OpenAI-compatible providers. A provider may change its path or a
 * model may be retired; the selected values are still fully editable.
 */
export const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'o3-mini',
      'o4-mini',
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'qwen',
    name: 'Qwen / 阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k'],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4-plus'],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    models: ['Qwen/Qwen2.5-7B-Instruct', 'deepseek-ai/DeepSeek-V3'],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-large-latest', 'mistral-small-latest'],
  },
  {
    id: 'xai',
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3-mini',
    models: ['grok-3', 'grok-3-mini'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat',
      'google/gemini-2.5-flash',
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama / 本地',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:0.5b', 'llama3.2', 'qwen2.5:7b', 'deepseek-r1:7b', 'mistral'],
  },
];

export const COMMON_MODEL_GROUPS: ModelGroup[] = API_PROVIDERS.map((provider) => ({
  provider: provider.name,
  models: provider.models,
}));

const KEY_PROVIDER_RULES: Array<{ providerId: string; prefixes: string[] }> = [
  { providerId: 'openrouter', prefixes: ['sk-or-v1-'] },
  { providerId: 'groq', prefixes: ['gsk_'] },
  { providerId: 'xai', prefixes: ['xai-'] },
  { providerId: 'gemini', prefixes: ['AIza'] },
  { providerId: 'openai', prefixes: ['sk-proj-', 'sk-svcacct-'] },
];

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export function findProviderById(id: string): ApiProvider | undefined {
  return API_PROVIDERS.find((provider) => provider.id === id);
}

export function findProviderByBaseUrl(baseUrl: string): ApiProvider | undefined {
  const normalized = normalizeBaseUrl(baseUrl);
  return API_PROVIDERS.find(
    (provider) => normalizeBaseUrl(provider.baseUrl) === normalized,
  );
}

/**
 * Only infer from prefixes that are strongly associated with one provider.
 * A plain `sk-` key is intentionally ambiguous: OpenAI, DeepSeek, Moonshot,
 * SiliconFlow and others all use it.
 */
export function detectProviderFromApiKey(apiKey: string): ApiProvider | null {
  const key = apiKey.trim();
  if (!key) return null;

  for (const rule of KEY_PROVIDER_RULES) {
    if (rule.prefixes.some((prefix) => key.startsWith(prefix))) {
      return findProviderById(rule.providerId) ?? null;
    }
  }

  return null;
}

export function looksLikeAmbiguousSkKey(apiKey: string): boolean {
  const key = apiKey.trim();
  return key.startsWith('sk-') && detectProviderFromApiKey(key) === null;
}

export function looksLikeAnthropicKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('sk-ant-');
}
