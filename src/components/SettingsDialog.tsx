import { useEffect, useState, type FormEvent } from 'react';
import type { ApiSettings } from '../types';
import { errorMessage } from '../lib/format';
import {
  detectProviderFromApiKey,
  findProviderByBaseUrl,
  looksLikeAmbiguousSkKey,
  looksLikeAnthropicKey,
  normalizeBaseUrl,
} from '../lib/models';
import { BaseUrlCombobox } from './BaseUrlCombobox';
import { EyeIcon, EyeOffIcon, KeyIcon } from './Icons';
import { Modal } from './Modal';
import { ModelCombobox } from './ModelCombobox';

interface SettingsDialogProps {
  open: boolean;
  settings: ApiSettings;
  onClose: () => void;
  onSave: (settings: ApiSettings) => void;
}

export function SettingsDialog({
  open,
  settings,
  onClose,
  onSave,
}: SettingsDialogProps) {
  const [draft, setDraft] = useState<ApiSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setShowKey(false);
    setError(null);
  }, [open, settings]);

  const mockMode = !draft.apiKey.trim();
  const detectedProvider = detectProviderFromApiKey(draft.apiKey);
  const baseUrlMatchesDetected =
    detectedProvider !== null &&
    normalizeBaseUrl(draft.apiBaseUrl) === normalizeBaseUrl(detectedProvider.baseUrl);
  const ambiguousSkKey = looksLikeAmbiguousSkKey(draft.apiKey);
  const anthropicKey = looksLikeAnthropicKey(draft.apiKey);
  const baseProvider = findProviderByBaseUrl(draft.apiBaseUrl);
  const modelMatchesBase =
    !baseProvider ||
    !draft.model.trim() ||
    baseProvider.models.includes(draft.model.trim());

  function handleApiKeyChange(value: string) {
    const provider = detectProviderFromApiKey(value);

    setDraft((current) => {
      if (!provider) return { ...current, apiKey: value };

      const currentBase = normalizeBaseUrl(current.apiBaseUrl);
      const alreadyMatches =
        currentBase === normalizeBaseUrl(provider.baseUrl);
      const currentIsCustom =
        Boolean(currentBase) && findProviderByBaseUrl(currentBase) === undefined;

      if (currentIsCustom && !alreadyMatches) {
        // Never overwrite a custom Base URL/proxy just because a key has a
        // recognizable prefix. The user can still choose it below.
        return { ...current, apiKey: value };
      }

      return {
        ...current,
        apiKey: value,
        apiBaseUrl: provider.baseUrl,
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const next: ApiSettings = {
      apiBaseUrl: draft.apiBaseUrl.trim().replace(/\/+$/, ''),
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
    };

    if (!next.apiBaseUrl) {
      setError('请填写 API Base URL。');
      return;
    }

    try {
      const url = new URL(next.apiBaseUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('protocol');
      }
    } catch {
      setError('API Base URL 需要是完整的 http(s) 地址。');
      return;
    }

    if (!next.model) {
      setError('请填写模型名称。');
      return;
    }

    try {
      onSave(next);
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError, '设置保存失败，请重试。'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Local config" title="设置">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-line bg-paper/70 p-3.5">
          <div className="flex items-start gap-2.5">
            <KeyIcon size={16} className="mt-0.5 shrink-0 text-muted" />
            <div>
              <p className="text-xs font-medium text-ink">
                API Key 仅保存在本地浏览器
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                使用 localStorage 保存，并直接发送到你填写的 API 地址；本项目没有后端。
                公共电脑上请勿保存真实 Key。
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="api-base-url" className="mb-1.5 block text-xs font-medium text-ink">
            API Base URL
          </label>
          <BaseUrlCombobox
            value={draft.apiBaseUrl}
            onChange={(apiBaseUrl) =>
              setDraft((current) => ({ ...current, apiBaseUrl }))
            }
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="api-key" className="block text-xs font-medium text-ink">
              API Key
            </label>
            <span className="rounded-full border border-[#e4c0ad] bg-accent-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#963f22]">
              仅本地保存
            </span>
          </div>
          <div className="relative">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              spellCheck={false}
              autoComplete="off"
              value={draft.apiKey}
              onChange={(event) => handleApiKeyChange(event.target.value)}
              placeholder="留空则自动使用 Mock 模式"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-3.5 pr-11 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted/55 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
            <button
              type="button"
              onClick={() => setShowKey((current) => !current)}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted transition-colors hover:text-ink"
              aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}
            >
              {showKey ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
            </button>
          </div>

          {draft.apiKey.trim() ? (
            anthropicKey ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-danger">
                检测到 Anthropic 原生 Key（sk-ant-）。本项目只支持 OpenAI-compatible
                接口，请改用兼容网关或对应服务的 Key。
              </p>
            ) : detectedProvider ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#456037]">
                已根据 Key 前缀识别为 {detectedProvider.name}。
                {baseUrlMatchesDetected
                  ? ' Base URL 已自动匹配。'
                  : ' 当前 Base URL 为自定义地址，未自动覆盖；可从上方列表选择对应地址。'}
              </p>
            ) : ambiguousSkKey ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                通用 sk- 前缀无法唯一判断服务商（OpenAI、DeepSeek、Kimi 等都可能使用），
                Base URL 以上方选择为准。
              </p>
            ) : null
          ) : null}
        </div>

        <div>
          <label htmlFor="api-model" className="mb-1.5 block text-xs font-medium text-ink">
            Model
          </label>
          <ModelCombobox
            value={draft.model}
            onChange={(model) =>
              setDraft((current) => ({ ...current, model }))
            }
          />
          {baseProvider && !modelMatchesBase ? (
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-[#e7d8c2] bg-[#faf5e9] px-3 py-2 text-[11px] leading-relaxed text-[#6d5a3a] sm:flex-row sm:items-center sm:justify-between">
              <span>
                当前 Base URL 对应 {baseProvider.name}，推荐模型{' '}
                <span className="font-mono">{baseProvider.defaultModel}</span>。
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    model: baseProvider.defaultModel,
                  }))
                }
                className="shrink-0 text-left font-medium underline decoration-[#c9b89d] underline-offset-2 transition-colors hover:text-ink"
              >
                填入推荐模型
              </button>
            </div>
          ) : null}
        </div>

        <div
          className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[11px] leading-relaxed ${
            mockMode
              ? 'border-[#ead0c1] bg-accent-soft/60 text-[#7a402b]'
              : 'border-[#cbd7c0] bg-sage/55 text-[#405638]'
          }`}
        >
          <span
            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
              mockMode ? 'bg-accent' : 'bg-[#567847]'
            }`}
            aria-hidden="true"
          />
          <p>
            {mockMode
              ? '未填写 API Key：保存后将使用 Mock 模式，不发起任何网络请求，也能完整走通全流程。'
              : '保存后将使用真实 API。浏览器直连要求服务端允许 CORS；若请求失败，请检查 API 地址、Key 与跨域配置。'}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/25 bg-[#fbeae6] px-3.5 py-2.5 text-xs leading-relaxed text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-white"
          >
            取消
          </button>
          <button
            type="submit"
            className="min-h-10 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-[#33332d]"
          >
            保存设置
          </button>
        </div>
      </form>
    </Modal>
  );
}
