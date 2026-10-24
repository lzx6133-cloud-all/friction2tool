import type { Idea } from '../types';
import { CheckIcon } from './Icons';

interface IdeaCardProps {
  idea: Idea;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function IdeaCard({ idea, index, selected, onSelect }: IdeaCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-surface p-4 text-left transition-all sm:p-5 ${
        selected
          ? 'border-accent shadow-[0_0_0_1px_#e15a2b,0_16px_36px_-30px_rgba(225,90,43,0.75)]'
          : 'border-line shadow-card hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_16px_36px_-30px_rgba(29,29,25,0.45)]'
      }`}
    >
      {selected ? (
        <span className="absolute inset-x-0 top-0 h-[3px] bg-accent" aria-hidden="true" />
      ) : null}

      <span className="flex w-full items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Idea {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border transition-colors ${
            selected
              ? 'border-accent bg-accent text-white'
              : 'border-line bg-white text-transparent group-hover:border-ink/30'
          }`}
          aria-hidden="true"
        >
          <CheckIcon size={13} strokeWidth={2.4} />
        </span>
      </span>

      <h3 className="mt-4 text-base font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[17px]">
        {idea.title}
      </h3>

      <dl className="mt-4 flex flex-1 flex-col gap-3.5">
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
            解决的摩擦
          </dt>
          <dd className="mt-1 text-xs leading-relaxed text-ink/80">{idea.problem}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
            怎么用
          </dt>
          <dd className="mt-1 text-xs leading-relaxed text-ink/80">{idea.howItWorks}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line/80 pt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#846f5e]">
          为什么足够小
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{idea.whySmall}</p>
      </div>
    </button>
  );
}
