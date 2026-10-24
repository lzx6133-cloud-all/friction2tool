import type { Idea } from '../types';
import {
  AlertIcon,
  CheckIcon,
  RefreshIcon,
  SaveIcon,
  SparkIcon,
} from './Icons';
import { PreviewFrame } from './PreviewFrame';

interface ToolPreviewProps {
  idea: Idea;
  html: string | null;
  generating: boolean;
  error: string | null;
  saved: boolean;
  onRetry: () => void;
  onSave: () => void;
}

export function ToolPreview({
  idea,
  html,
  generating,
  error,
  saved,
  onRetry,
  onSave,
}: ToolPreviewProps) {
  return (
    <section id="preview" aria-labelledby="preview-title" className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            03 / Preview
          </p>
          <h2
            id="preview-title"
            className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink"
          >
            工具预览
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            单文件 HTML 在隔离 iframe 中运行。所有状态只留在这个工具页面内。
          </p>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          allow-scripts · no allow-same-origin
        </span>
      </div>

      {generating ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <SparkIcon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">正在生成单文件工具…</p>
              <p className="mt-0.5 text-[11px] text-muted">
                内联 CSS 与 JS · 无外部依赖 · 通常需要几秒到几十秒
              </p>
            </div>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.1em] text-muted sm:inline">
              building
            </span>
          </div>
          <div className="space-y-3 p-6" aria-hidden="true">
            <div className="h-3 w-1/3 animate-soft-pulse rounded bg-line" />
            <div className="h-2.5 w-2/3 animate-soft-pulse rounded bg-line/75" />
            <div className="mt-5 space-y-3 rounded-xl border border-line/70 bg-paper/40 p-4">
              <div className="h-10 animate-soft-pulse rounded-lg bg-line/70" />
              <div className="h-10 animate-soft-pulse rounded-lg bg-line/55" />
              <div className="h-10 animate-soft-pulse rounded-lg bg-line/40" />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
              <span className="block h-full w-1/2 animate-soft-pulse rounded-full bg-accent/70" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-danger/25 bg-[#fbeae6] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <AlertIcon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-danger">工具生成失败</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#7d3328]">{error}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#955044]">
                方案选择已保留。可以重试，不会丢失当前输入。
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-danger/30 bg-white px-3.5 py-2 text-xs font-medium text-danger transition-colors hover:bg-[#fff6f3]"
              >
                <RefreshIcon size={14} />
                重新生成
              </button>
            </div>
          </div>
        </div>
      ) : html ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-ink/15 bg-surface shadow-card">
          <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-paper">
                  ready
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  单文件 · 离线运行
                </span>
              </div>
              <h3 className="mt-2 truncate text-base font-semibold tracking-[-0.02em] text-ink">
                {idea.title}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
              >
                <RefreshIcon size={14} />
                重新生成
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saved}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  saved
                    ? 'cursor-default border border-[#bccdb1] bg-sage text-[#456037]'
                    : 'bg-ink text-paper hover:bg-[#34342e]'
                }`}
              >
                {saved ? <CheckIcon size={14} /> : <SaveIcon size={14} />}
                {saved ? '已保存' : '保存工具'}
              </button>
            </div>
          </div>

          <div className="bg-[#e9e5da] p-3 sm:p-4">
            <PreviewFrame html={html} title={idea.title} />
          </div>

          <div className="flex flex-col gap-2 border-t border-line px-4 py-3 text-[11px] leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>
              {saved
                ? '已保存到「我的工具」，可在下方继续预览、删除或基于反馈迭代。'
                : '满意的话保存到本地；之后还能基于反馈生成新版本。'}
            </p>
            <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em]">
              state: in-memory
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
