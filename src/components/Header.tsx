import { openSettingsFromLink } from '../lib/settingsLink';
import { SettingsIcon } from './Icons';

interface HeaderProps {
  mockMode: boolean;
  model: string;
  onOpenSettings: () => void;
}

export function Header({ mockMode, model, onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5 rounded-md"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-[9px] bg-ink text-[13px] font-semibold text-paper shadow-[inset_0_-2px_0_rgba(255,255,255,0.12)]"
            aria-hidden="true"
          >
            F<span className="text-accent">.</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-[-0.025em] text-ink">
              Friction2Tool
            </span>
            <span
              className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted sm:inline"
              aria-hidden="true"
            >
              MVP
            </span>
            <span className="sr-only">首页</span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="?settings=1"
            onClick={(event) => openSettingsFromLink(event, onOpenSettings)}
            aria-haspopup="dialog"
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] transition-colors ${
              mockMode
                ? 'border-[#ebc9b9] bg-accent-soft text-[#933e22] hover:border-[#d9a98f]'
                : 'border-[#c6d2ba] bg-sage text-[#435a36] hover:border-[#aebfa0]'
            }`}
            title={
              mockMode
                ? '未填写 API Key，当前使用本地 Mock 演示。点击配置 API'
                : `API 模式：${model}。点击修改设置`
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                mockMode ? 'bg-accent' : 'bg-[#567847]'
              }`}
              aria-hidden="true"
            />
            {mockMode ? 'Mock 模式' : 'API 模式'}
          </a>

          <a
            href="?settings=1"
            onClick={(event) => openSettingsFromLink(event, onOpenSettings)}
            aria-haspopup="dialog"
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white active:translate-y-px sm:min-h-9 sm:px-3"
          >
            <SettingsIcon size={15} />
            <span>设置</span>
          </a>
        </div>
      </div>
    </header>
  );
}
