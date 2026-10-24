import { useRef, useState, type ChangeEvent } from 'react';
import type { SavedTool } from '../types';
import { formatDateTime } from '../lib/format';
import {
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  LayersIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  UploadIcon,
} from './Icons';

interface MyToolsProps {
  tools: SavedTool[];
  onPreview: (tool: SavedTool) => void;
  onIterate: (tool: SavedTool) => void;
  onDelete: (tool: SavedTool) => void;
  onExportTool: (tool: SavedTool) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
}

export function MyTools({
  tools,
  onPreview,
  onIterate,
  onDelete,
  onExportTool,
  onExportBackup,
  onImportBackup,
}: MyToolsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      await onImportBackup(file);
    } finally {
      setImporting(false);
    }
  }

  return (
    <section id="my-tools" aria-labelledby="my-tools-title" className="mt-16 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-ink/15 pt-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">
            04 / Library
          </p>
          <div className="mt-2 flex items-baseline gap-2.5">
            <h2
              id="my-tools-title"
              className="text-xl font-semibold tracking-[-0.025em] text-ink"
            >
              我的工具
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {tools.length.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            保存在当前浏览器 localStorage，刷新页面后仍然在。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            <LayersIcon size={12} />
            local only
          </span>
          <button
            type="button"
            onClick={onExportBackup}
            disabled={tools.length === 0}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <DownloadIcon size={13} />
            导出备份
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            <UploadIcon size={13} />
            {importing ? '导入中…' : '导入备份'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(event) => void handleFileChange(event)}
            className="sr-only"
            tabIndex={-1}
            aria-label="选择备份 JSON 文件"
          />
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-surface/55 px-6 py-12 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted">
            <PlusIcon size={19} />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">还没有保存的工具</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
            在上方写下摩擦、选一个方案，生成后点击「保存工具」。你保存的工具会出现在这里，随时可以回来预览或迭代。
          </p>
          <a
            href="#compose"
            className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-ink/15 bg-surface px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
          >
            从一句话开始
          </a>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {tools.map((tool) => {
            const version = tool.versions.length + 1;
            return (
              <article
                key={tool.id}
                className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line bg-paper/80 px-2 py-0.5 text-[9px] leading-relaxed text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                      {tool.title}
                    </h3>
                  </div>
                  <span
                    className="shrink-0 rounded-md border border-ink/15 bg-paper px-1.5 py-1 font-mono text-[9px] text-muted"
                    title={`当前第 ${version} 版`}
                  >
                    v{version}
                  </span>
                </div>

                <p className="mt-3 border-l-2 border-accent/55 pl-2.5 text-xs leading-relaxed text-muted">
                  {tool.friction}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-[10px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon size={11} />
                    创建于 {formatDateTime(tool.createdAt)}
                  </span>
                  {tool.versions.length > 0 ? (
                    <span className="font-mono text-[9px]">
                      {tool.versions.length} 个历史版本
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-line/80 pt-3">
                  <button
                    type="button"
                    onClick={() => onPreview(tool)}
                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-[#34342e]"
                  >
                    <EyeIcon size={14} />
                    打开预览
                  </button>
                  <button
                    type="button"
                    onClick={() => onIterate(tool)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
                  >
                    <RefreshIcon size={14} />
                    迭代
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportTool(tool)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-transparent text-muted transition-colors hover:border-ink/20 hover:bg-white hover:text-ink"
                    aria-label={`导出「${tool.title}」HTML`}
                    title="导出单个 HTML"
                  >
                    <DownloadIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tool)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-transparent text-muted transition-colors hover:border-danger/30 hover:bg-[#fbeae6] hover:text-danger"
                    aria-label={`删除「${tool.title}」`}
                    title="删除工具"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
