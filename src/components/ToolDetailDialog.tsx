import { useEffect, useRef, useState } from 'react';
import type { ApiSettings, SavedTool } from '../types';
import { errorMessage, formatDateTime } from '../lib/format';
import { generateTool } from '../lib/llm';
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  LayersIcon,
  RefreshIcon,
  SaveIcon,
} from './Icons';
import { Modal } from './Modal';
import { PreviewFrame } from './PreviewFrame';

interface ToolDetailDialogProps {
  open: boolean;
  tool: SavedTool | null;
  settings: ApiSettings;
  onClose: () => void;
  onSaveVersion: (toolId: string, html: string, feedback: string) => void;
}

export function ToolDetailDialog({
  open,
  tool,
  settings,
  onClose,
  onSaveVersion,
}: ToolDetailDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const generationSeq = useRef(0);

  useEffect(() => {
    generationSeq.current += 1;
    if (!open) return;
    setFeedback('');
    setAppliedFeedback(null);
    setDraftHtml(null);
    setGenerating(false);
    setSaving(false);
    setError(null);
    setNotice(null);
  }, [open, tool?.id]);

  if (!tool) return null;

  const currentVersion = tool.versions.length + 1;
  const displayHtml = draftHtml ?? tool.html;
  const busy = generating || saving;
  const mockMode = !settings.apiKey.trim();
  const feedbackDirty = Boolean(
    draftHtml && appliedFeedback !== null && feedback.trim() !== appliedFeedback,
  );

  async function handleGenerate() {
    if (!tool || busy) return;
    const instruction = feedback.trim();
    if (!instruction) {
      setError('先写一句希望怎么改，再生成新版本。');
      return;
    }

    const sequence = generationSeq.current + 1;
    generationSeq.current = sequence;
    setGenerating(true);
    setError(null);
    setNotice(null);

    try {
      const nextHtml = await generateTool(
        {
          friction: tool.friction,
          idea: tool.idea,
          feedback: instruction,
          previousHtml: tool.html,
        },
        settings,
      );
      if (generationSeq.current !== sequence) return;
      setDraftHtml(nextHtml);
      setAppliedFeedback(instruction);
    } catch (generationError) {
      if (generationSeq.current !== sequence) return;
      setError(errorMessage(generationError, '新版本生成失败，请重试。'));
    } finally {
      if (generationSeq.current === sequence) setGenerating(false);
    }
  }

  function handleSaveVersion() {
    if (!tool || !draftHtml || !appliedFeedback || busy || feedbackDirty) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      onSaveVersion(tool.id, draftHtml, appliedFeedback);
      setNotice(`已保存为 v${currentVersion + 1}。旧版本保留在版本记录中。`);
      setDraftHtml(null);
      setAppliedFeedback(null);
      setFeedback('');
    } catch (saveError) {
      setError(errorMessage(saveError, '新版本保存失败，请重试。'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Saved tool"
      title={tool.title}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
              原始摩擦
            </p>
            <p className="mt-1.5 max-w-2xl border-l-2 border-accent/55 pl-2.5 text-xs leading-relaxed text-ink/80">
              {tool.friction}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1">
              <LayersIcon size={11} />
              当前 v{currentVersion}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1">
              <ClockIcon size={11} />
              {formatDateTime(tool.updatedAt)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.05em] ${
                mockMode
                  ? 'border-[#ebc9b9] bg-accent-soft text-[#933e22]'
                  : 'border-[#c6d2ba] bg-sage text-[#435a36]'
              }`}
            >
              {mockMode ? 'mock' : 'api'}
            </span>
          </div>
        </div>

        <PreviewFrame
          html={displayHtml}
          title={`${tool.title}${draftHtml ? ' 新版本' : ''}`}
          heightClass="h-[360px] sm:h-[520px]"
        />

        {draftHtml ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-[#e4c0ad] bg-accent-soft/70 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#7b3d26]">
            <AlertIcon size={14} className="mt-0.5 shrink-0" />
            <p>这是尚未保存的新版本。关闭弹窗会丢弃预览，点击下方按钮才会写入 localStorage。</p>
          </div>
        ) : null}

        <section
          aria-labelledby="iterate-title"
          className="rounded-xl border border-line bg-paper/55 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="iterate-title"
              className="text-sm font-semibold tracking-[-0.015em] text-ink"
            >
              基于反馈迭代
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              keep it small
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            描述要改的地方，AI 会在当前版本基础上重新生成完整 HTML。原版本会留在记录里。
          </p>
          <label htmlFor="iteration-feedback" className="sr-only">
            迭代反馈
          </label>
          <textarea
            id="iteration-feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            disabled={busy}
            rows={3}
            maxLength={500}
            placeholder="例如：把按钮做得更大；再加一个「清空全部」按钮。"
            className="scrollbar-thin mt-3 min-h-[88px] w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-xs leading-relaxed text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:bg-paper/60"
          />
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-muted">
              {feedback.length}/500
              {feedbackDirty
                ? ' · 反馈已修改，需重新生成后保存'
                : appliedFeedback && draftHtml
                  ? ' · 反馈已应用'
                  : ''}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {draftHtml ? (
                <>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={busy}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white disabled:opacity-50"
                  >
                    <RefreshIcon size={14} />
                    {generating ? '生成中…' : '重新生成'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVersion}
                    disabled={busy || feedbackDirty}
                    title={feedbackDirty ? '反馈已修改，请先重新生成' : undefined}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-[#34342e] disabled:bg-ink/40"
                  >
                    <SaveIcon size={14} />
                    {saving ? '保存中…' : '保存为新版本'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy || !feedback.trim()}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-[#34342e] disabled:bg-ink/40"
                >
                  {generating ? (
                    <>
                      <span
                        className="h-3 w-3 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                        aria-hidden="true"
                      />
                      正在生成…
                    </>
                  ) : (
                    <>
                      <RefreshIcon size={14} />
                      生成新版本
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-lg border border-danger/25 bg-[#fbeae6] px-3 py-2.5 text-[11px] leading-relaxed text-danger"
            >
              <AlertIcon size={14} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {notice ? (
            <div
              role="status"
              className="mt-3 flex items-start gap-2 rounded-lg border border-[#c6d2ba] bg-sage/60 px-3 py-2.5 text-[11px] leading-relaxed text-[#405638]"
            >
              <CheckIcon size={14} className="mt-0.5 shrink-0" />
              <p>{notice}</p>
            </div>
          ) : null}
        </section>

        <details className="group rounded-xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs text-ink">
            <span className="flex items-center gap-2">
              <LayersIcon size={14} className="text-muted" />
              版本记录
              <span className="font-mono text-[9px] text-muted">
                v{currentVersion} · {tool.versions.length} 个历史版本
              </span>
            </span>
            <ChevronDownIcon
              size={14}
              className="shrink-0 text-muted transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-line px-4 py-3">
            {tool.versions.length === 0 ? (
              <p className="text-[11px] leading-relaxed text-muted">
                还没有历史版本。生成并保存一次迭代后，这里会记录旧版本和触发它的反馈。
              </p>
            ) : (
              <ol className="space-y-3">
                {[...tool.versions].reverse().map((version, reverseIndex) => {
                  const versionNumber = tool.versions.length - reverseIndex;
                  return (
                    <li
                      key={`${version.createdAt}-${versionNumber}`}
                      className="border-l-2 border-line pl-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink">
                          v{versionNumber}
                        </span>
                        <span className="text-[10px] text-muted">
                          {formatDateTime(version.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        迭代要求：{version.feedback || '（无反馈记录）'}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </details>
      </div>
    </Modal>
  );
}
