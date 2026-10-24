import { describe, expect, it } from 'vitest';
import {
  detectProviderFromApiKey,
  findProviderByBaseUrl,
  looksLikeAmbiguousSkKey,
  looksLikeAnthropicKey,
  normalizeBaseUrl,
} from '../../src/lib/models';

describe('provider keys', () => {
  it('detects only strongly identifiable key prefixes', () => {
    expect(detectProviderFromApiKey('gsk_test')?.id).toBe('groq');
    expect(detectProviderFromApiKey('xai-test')?.id).toBe('xai');
    expect(detectProviderFromApiKey('sk-or-v1-test')?.id).toBe('openrouter');
    expect(detectProviderFromApiKey('AIzaTest')?.id).toBe('gemini');
    expect(detectProviderFromApiKey('sk-proj-test')?.id).toBe('openai');
  });

  it('does not guess for ambiguous sk- keys', () => {
    expect(detectProviderFromApiKey('sk-ordinary')).toBeNull();
    expect(looksLikeAmbiguousSkKey('sk-ordinary')).toBe(true);
    expect(looksLikeAmbiguousSkKey('gsk_test')).toBe(false);
    expect(looksLikeAnthropicKey('sk-ant-test')).toBe(true);
  });
});

describe('provider URLs', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeBaseUrl('https://api.deepseek.com/v1///')).toBe(
      'https://api.deepseek.com/v1',
    );
    expect(findProviderByBaseUrl('https://api.deepseek.com/v1/')?.id).toBe(
      'deepseek',
    );
    expect(findProviderByBaseUrl('https://my-proxy.example/v1')).toBeUndefined();
  });
});
