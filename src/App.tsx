import { useCallback, useState } from 'react';
import { FrictionComposer } from './components/FrictionComposer';
import { Header } from './components/Header';
import { IdeaCard } from './components/IdeaCard';
import { Modal } from './components/Modal';
import { MyTools } from './components/MyTools';
import { SettingsDialog } from './components/SettingsDialog';
import { Toast } from './components/Toast';
import { ToolDetailDialog } from './components/ToolDetailDialog';
import { ToolPreview } from './components/ToolPreview';
import {
  AlertIcon,
  ArrowRightIcon,
  SparkIcon,
  TrashIcon,
} from './components/Icons';
import { deriveTags, errorMessage, makeId, truncate } from './lib/format';
import { generateIdeas, generateTool } from './lib/llm';
import {
  loadSavedTools,
  loadSettings,
  persistSavedTools,
  persistSettings,
  storageErrorMessage,
} from './lib/storage';
import type {
  ApiSettings,
  Idea,
  SavedTool,
  ToastKind,
  ToastMessage,
} from './types';

function scrollToId(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function shouldOpenSettingsFromUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('settings') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [settings, setSettings] = useState<ApiSettings>(() => loadSettings());
  const [savedTools, setSavedTools] = useState<SavedTool[]>(() => loadSavedTools());

  const [friction, setFriction] = useState('');
  const [activeFriction, setActiveFriction] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);

  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatingTool, setGeneratingTool] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);
  const [toolSaved, setToolSaved] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(() =>
    shouldOpenSettingsFromUrl(),
  );
  const [detailToolId, setDetailToolId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedTool | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const mockMode = !settings.apiKey.trim();
  const selectedIdea =
    selectedIndex !== null ? (ideas[selectedIndex] ?? null) : null;
  const activeTool = savedTools.find((tool) => tool.id === detailToolId) ?? null;
  const plansStale =
    ideas.length > 0 && Boolean(activeFriction) && friction.trim() !== activeFriction;

  const notify = useCallback((kind: ToastKind, message: string) => {
    setToast({ id: Date.now(), kind, message });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('settings') === '1') {
        url.searchParams.delete('settings');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // URL cleanup is best-effort; closing the dialog must still work.
    }
  }, []);

  async function handleGenerateIdeas() {
    const trimmed = friction.trim();
    if (!trimmed) {
      setIdeasError('先写一句具体的摩擦，再生成方案。');
      return;
    }

    setIdeasLoading(true);
    setIdeasError(null);
    setIdeas([]);
    setSelectedIndex(null);
    setGeneratedHtml(null);
    setGeneratingTool(false);
    setToolError(null);
    setToolSaved(false);

    try {
      const nextIdeas = await generateIdeas(trimmed, settings);
      setIdeas(nextIdeas);
      setActiveFriction(trimmed);
      scrollToId('ideas');
    } catch (error) {
      setIdeasError(errorMessage(error, '生成方案失败，请稍后重试。'));
    } finally {
      setIdeasLoading(false);
    }
  }

  function handleSelectIdea(index: number) {
    setSelectedIndex(index);
    setGeneratedHtml(null);
    setToolError(null);
    setToolSaved(false);
  }

  async function handleGenerateTool() {
    if (!selectedIdea || generatingTool) return;

    const sourceFriction = activeFriction || friction.trim();
    setGeneratingTool(true);
    setToolError(null);
    setGeneratedHtml(null);
    setToolSaved(false);
    scrollToId('preview');

    try {
      const html = await generateTool(
        { friction: sourceFriction, idea: selectedIdea },
        settings,
      );
      setGeneratedHtml(html);
    } catch (error) {
      setToolError(errorMessage(error, '生成工具失败，请重试。'));
    } finally {
      setGeneratingTool(false);
    }
  }

  function handleSaveTool() {
    if (!selectedIdea || !generatedHtml || toolSaved) return;

    const now = Date.now();
    const sourceFriction = activeFriction || friction.trim();
    const tool: SavedTool = {
      id: makeId(),
      title: selectedIdea.title,
      friction: sourceFriction,
      idea: selectedIdea,
      html: generatedHtml,
      tags: deriveTags(sourceFriction),
      createdAt: now,
      updatedAt: now,
      versions: [],
    };
    const next = [tool, ...savedTools];

    try {
      persistSavedTools(next);
    } catch (error) {
      notify('error', storageErrorMessage(error, '保存工具'));
      return;
    }

    setSavedTools(next);
    setToolSaved(true);
    notify('success', '工具已保存到本地，可在「我的工具」中继续迭代。');
  }

  function handleSaveSettings(next: ApiSettings) {
    try {
      persistSettings(next);
    } catch (error) {
      throw new Error(storageErrorMessage(error, '设置保存'));
    }

    setSettings(next);
    notify(
      'success',
      next.apiKey.trim()
        ? '设置已保存，已切换到 API 模式。'
        : '设置已保存，当前为 Mock 模式。',
    );
  }

  function handleSaveVersion(toolId: string, html: string, feedback: string) {
    const existing = savedTools.find((tool) => tool.id === toolId);
    if (!existing) throw new Error('找不到这个工具，可能已被删除。');

    const now = Date.now();
    const updated: SavedTool = {
      ...existing,
      html,
      updatedAt: now,
      versions: [
        ...existing.versions,
        {
          html: existing.html,
          feedback,
          createdAt: existing.updatedAt,
        },
      ],
    };
    const next = savedTools.map((tool) => (tool.id === toolId ? updated : tool));

    try {
      persistSavedTools(next);
    } catch (error) {
      throw new Error(storageErrorMessage(error, '保存新版本'));
    }

    setSavedTools(next);
    notify(
      'success',
      `新版本已保存为 v${updated.versions.length + 1}。`,
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    const next = savedTools.filter((tool) => tool.id !== pendingDelete.id);
    try {
      persistSavedTools(next);
    } catch (error) {
      notify('error', storageErrorMessage(error, '删除工具'));
      return;
    }

    setSavedTools(next);
    if (detailToolId === pendingDelete.id) setDetailToolId(null);
    setPendingDelete(null);
    notify('success', '工具已删除。');
  }

  return (
    <div className="min-h-screen">
      <Header
        mockMode={mockMode}
        model={settings.model}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-11 lg:px-8">
        <section aria-labelledby="page-title">
          <div className="flex flex-col gap-6 border-b border-ink/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="text-accent">Friction → Tool</span>
                <span className="h-px w-5 bg-line" aria-hidden="true" />
                <span>单文件微工具工作台</span>
              </p>
              <h1 className="mt-3 max-w-2xl text-balance text-[32px] font-semibold leading-[1.12] tracking-[-0.045em] text-ink sm:text-[44px]">
                把小摩擦，做成顺手的小工具。
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
                写下一句具体的烦恼，先拿到 3 个足够小的方案；选一个，生成可以直接运行的单文件
                HTML。无需登录，无需后端。
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.09em] text-muted/85">
                <span>no login</span>
                <span className="text-line">/</span>
                <span>no backend</span>
                <span className="text-line">/</span>
                <span>local-first</span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 pb-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted lg:flex">
              <span className="rounded border border-line bg-surface px-2 py-1">输入</span>
              <ArrowRightIcon size={12} className="text-line" />
              <span className="rounded border border-line bg-surface px-2 py-1">3 个方案</span>
              <ArrowRightIcon size={12} className="text-line" />
              <span className="rounded border border-line bg-surface px-2 py-1">单文件工具</span>
              <ArrowRightIcon size={12} className="text-line" />
              <span className="rounded border border-ink/20 bg-ink px-2 py-1 text-paper">本地保存</span>
            </div>
          </div>

          <FrictionComposer
            friction={friction}
            onFrictionChange={setFriction}
            onSubmit={handleGenerateIdeas}
            onOpenSettings={() => setSettingsOpen(true)}
            loading={ideasLoading}
            error={ideasError}
            mockMode={mockMode}
          />
        </section>

        <section id="ideas" aria-labelledby="ideas-title" className="mt-12 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                02 / Select
              </p>
              <h2
                id="ideas-title"
                className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink"
              >
                选一个足够小的方案
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                不需要最全面，选最可能今天就真正用上的那个。
              </p>
            </div>
            {ideas.length > 0 ? (
              <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                3 ideas · pick one
              </span>
            ) : null}
          </div>

          {plansStale ? (
            <div
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#ead0c1] bg-accent-soft/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#7a402b]"
            >
              <AlertIcon size={14} className="mt-0.5 shrink-0" />
              <p>
                输入框已修改。当前方案仍基于「{truncate(activeFriction, 34)}」；如需匹配新描述，请重新生成方案。
              </p>
            </div>
          ) : null}

          {ideasLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="正在生成方案">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="min-h-[280px] rounded-xl border border-line bg-surface p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-14 animate-soft-pulse rounded bg-line" />
                    <div className="h-6 w-6 animate-soft-pulse rounded-full bg-line/70" />
                  </div>
                  <div className="mt-5 h-4 w-4/5 animate-soft-pulse rounded bg-line" />
                  <div className="mt-6 space-y-2.5">
                    <div className="h-2 w-1/3 animate-soft-pulse rounded bg-line/70" />
                    <div className="h-2.5 w-full animate-soft-pulse rounded bg-line/50" />
                    <div className="h-2.5 w-5/6 animate-soft-pulse rounded bg-line/50" />
                  </div>
                  <div className="mt-5 space-y-2.5">
                    <div className="h-2 w-1/4 animate-soft-pulse rounded bg-line/70" />
                    <div className="h-2.5 w-full animate-soft-pulse rounded bg-line/50" />
                    <div className="h-2.5 w-2/3 animate-soft-pulse rounded bg-line/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-surface/55 px-6 py-9">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-accent">
                  <SparkIcon size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">3 张方案卡会出现在这里</p>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                    先在上面写下一句摩擦并点击「生成 3 个方案」。即使没有 API Key，Mock
                    模式也能完整走通生成、预览、保存和迭代。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {ideas.map((idea, index) => (
                  <IdeaCard
                    key={`${idea.title}-${index}`}
                    idea={idea}
                    index={index}
                    selected={selectedIndex === index}
                    onSelect={() => handleSelectIdea(index)}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-ink/10 bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
                    {selectedIdea ? 'Selected idea' : 'Selection required'}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-ink">
                    {selectedIdea ? selectedIdea.title : '先选一张方案卡片'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateTool}
                  disabled={!selectedIdea || generatingTool}
                  className="group inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-[#34342e] disabled:bg-ink/35"
                >
                  {generatingTool ? (
                    <>
                      <span
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                        aria-hidden="true"
                      />
                      正在生成工具…
                    </>
                  ) : (
                    <>
                      生成这个工具
                      <ArrowRightIcon
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>

        {selectedIdea && (generatingTool || toolError || generatedHtml) ? (
          <ToolPreview
            idea={selectedIdea}
            html={generatedHtml}
            generating={generatingTool}
            error={toolError}
            saved={toolSaved}
            onRetry={handleGenerateTool}
            onSave={handleSaveTool}
          />
        ) : null}

        <MyTools
          tools={savedTools}
          onPreview={(tool) => setDetailToolId(tool.id)}
          onIterate={(tool) => setDetailToolId(tool.id)}
          onDelete={(tool) => setPendingDelete(tool)}
        />

        <footer className="mt-16 flex flex-col gap-2 border-t border-ink/10 py-7 font-mono text-[9px] uppercase tracking-[0.07em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Friction2Tool · local-first MVP</p>
          <p className="flex flex-wrap items-center gap-x-2">
            <span>API Key 仅存本地 · iframe 已沙箱隔离 · 生成工具不联网</span>
            <a
              href="?settings=1"
              className="underline decoration-line underline-offset-2 transition-colors hover:text-ink"
            >
              设置 API
            </a>
          </p>
        </footer>
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={closeSettings}
        onSave={handleSaveSettings}
      />

      <ToolDetailDialog
        open={Boolean(activeTool)}
        tool={activeTool}
        settings={settings}
        onClose={() => setDetailToolId(null)}
        onSaveVersion={handleSaveVersion}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        eyebrow="Confirm"
        title="删除这个工具？"
        maxWidthClass="max-w-md"
      >
        {pendingDelete ? (
          <div>
            <p className="text-sm leading-relaxed text-ink">
              「{pendingDelete.title}」及其 {pendingDelete.versions.length}{' '}
              个历史版本会从本地永久删除，无法撤销。
            </p>
            <p className="mt-2 rounded-lg border border-line bg-paper/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
              只影响当前浏览器 localStorage 中的数据，不会发送到任何服务器。
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="min-h-10 rounded-lg border border-ink/15 bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-white"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#982b1c]"
              >
                <TrashIcon size={14} />
                确认删除
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
