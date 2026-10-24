import { EXAMPLE_FRICTIONS, FRICTION_MAX_LENGTH } from '../constants';
import { openSettingsFromLink } from '../lib/settingsLink';
import { AlertIcon, ArrowRightIcon, SettingsIcon, SparkIcon } from './Icons';

interface FrictionComposerProps {
  friction: string;
  onFrictionChange: (value: string) => void;
  onSubmit: () => void;
  onOpenSettings: () => void;
  loading: boolean;
  error: string | null;
  mockMode: boolean;
}

export function FrictionComposer({
  friction,
  onFrictionChange,
  onSubmit,
  onOpenSettings,
  loading,
  error,
  mockMode,
}: FrictionComposerProps) {
  const canSubmit = Boolean(friction.trim()) && !loading;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <section
      id="compose"
      aria-labelledby="compose-title"
      className="mt-8 scroll-mt-24 rounded-2xl border border-ink/15 bg-surface p-5 shadow-card sm:p-7"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              01 / Input
            </p>
            <h2
              id="compose-title"
              className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink"
            >
              一句话写下你的小摩擦
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
              描述具体场景和卡住的瞬间。越具体，方案越容易真正被用起来。
            </p>
          </div>
          <a
            href="?settings=1"
            onClick={(event) => openSettingsFromLink(event, onOpenSettings)}
            aria-haspopup="dialog"
            className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-ink/30 hover:bg-white hover:text-ink"
            title="打开 API 设置"
          >
            <SettingsIcon size={11} />
            {mockMode ? 'mock · 设置 API' : 'live api · 设置'}
          </a>
        </div>

        <div className="relative mt-5">
          <label htmlFor="friction-input" className="sr-only">
            描述你的日常小摩擦
          </label>
          <textarea
            id="friction-input"
            value={friction}
            onChange={(event) => onFrictionChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            maxLength={FRICTION_MAX_LENGTH}
            rows={4}
            placeholder="例如：每次买菜前都想不起家里还有什么。"
            disabled={loading}
            aria-describedby="friction-help"
            className="scrollbar-thin min-h-[122px] w-full resize-y rounded-xl border border-line bg-white px-4 py-3.5 pb-9 text-[15px] leading-relaxed text-ink placeholder:text-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:bg-paper/60"
          />
          <span
            className={`pointer-events-none absolute bottom-3 right-3.5 font-mono text-[10px] tabular-nums ${
              friction.length > FRICTION_MAX_LENGTH - 40 ? 'text-accent' : 'text-muted/60'
            }`}
          >
            {friction.length}/{FRICTION_MAX_LENGTH}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5" id="friction-help">
          <span className="mr-1 text-[11px] text-muted">不知道怎么写？试试：</span>
          {EXAMPLE_FRICTIONS.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => onFrictionChange(example)}
              className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[11px] leading-relaxed text-muted transition-colors hover:border-ink/30 hover:bg-white hover:text-ink disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-[#fbeae6] px-3.5 py-3 text-xs leading-relaxed text-danger"
          >
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line/80 pt-4 sm:flex-row sm:items-center">
          <p className="text-[11px] text-muted">
            <span className="hidden sm:inline">Ctrl / ⌘ + Enter 提交 · </span>
            一次只生成 3 个方案
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-[#34342e] disabled:bg-ink/40"
          >
            {loading ? (
              <>
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                  aria-hidden="true"
                />
                正在生成方案…
              </>
            ) : (
              <>
                <SparkIcon size={16} className="text-[#f0a27f]" />
                生成 3 个方案
                <ArrowRightIcon
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
