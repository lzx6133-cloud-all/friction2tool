import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CheckIcon, ChevronDownIcon } from './Icons';

export interface PresetOption {
  value: string;
  label?: string;
  description?: string;
}

export interface PresetGroup {
  label: string;
  options: PresetOption[];
}

interface PresetComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onOptionSelected?: (option: PresetOption) => void;
  groups: PresetGroup[];
  placeholder?: string;
  panelTitle: string;
  panelHint?: string;
  footer?: ReactNode;
  required?: boolean;
}

interface IndexedOption {
  group: string;
  option: PresetOption;
}

export function PresetCombobox({
  id,
  value,
  onChange,
  onOptionSelected,
  groups,
  placeholder,
  panelTitle,
  panelHint = '滚动选择',
  footer,
  required = true,
}: PresetComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${useId().replace(/:/g, '')}-listbox`;

  const entries = useMemo<IndexedOption[]>(
    () =>
      groups.flatMap((group) =>
        group.options.map((option) => ({ group: group.label, option })),
      ),
    [groups],
  );

  const indexByValue = useMemo(
    () => new Map(entries.map((entry, index) => [entry.option.value, index])),
    [entries],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${listboxId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listboxId, open]);

  function openMenu() {
    setOpen(true);
    setActiveIndex(indexByValue.get(value.trim()) ?? 0);
  }

  function chooseOption(option: PresetOption) {
    onOptionSelected?.(option);
    onChange(option.value);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIndex((current) =>
        current < entries.length - 1 ? current + 1 : entries.length - 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIndex((current) => (current > 0 ? current - 1 : 0));
      return;
    }

    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      chooseOption(entries[activeIndex].option);
      return;
    }

    if (event.key === 'Escape' && open) {
      // Keep the outer modal open: close only this picker.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          spellCheck={false}
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            if (open) setOpen(false);
          }}
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-white py-2.5 pl-3.5 pr-11 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted/55 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              openMenu();
              inputRef.current?.focus();
            }
          }}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted transition-colors hover:text-ink"
          aria-label={open ? `收起${panelTitle}` : `展开${panelTitle}`}
          aria-expanded={open}
          aria-controls={listboxId}
        >
          <ChevronDownIcon
            size={15}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-paper/70 px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              {panelTitle}
            </span>
            <span className="text-[10px] text-muted">{panelHint}</span>
          </div>
          <div
            id={listboxId}
            role="listbox"
            aria-label={panelTitle}
            className="scrollbar-thin max-h-60 overflow-y-auto overscroll-contain"
          >
            {groups.map((group) => (
              <div key={group.label}>
                <div className="sticky top-0 z-10 border-b border-line/70 bg-[#f7f4ec] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  {group.label}
                </div>
                {group.options.map((option) => {
                  const index = indexByValue.get(option.value) ?? 0;
                  const selected = value.trim() === option.value;
                  const active = activeIndex === index;

                  return (
                    <button
                      key={option.value}
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseOption(option)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-line/40 px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                        active
                          ? 'bg-accent-soft/70 text-ink'
                          : 'text-ink/80 hover:bg-paper/80'
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-xs ${
                            option.label ? 'font-medium' : 'font-mono'
                          }`}
                        >
                          {option.label ?? option.value}
                        </span>
                        {option.description ? (
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-muted">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {selected ? (
                        <CheckIcon size={13} className="shrink-0 text-accent" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {footer ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{footer}</p>
      ) : null}
    </div>
  );
}
