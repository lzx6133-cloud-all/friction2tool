import { useEffect, useRef, useState } from 'react';
import { RefreshIcon } from './Icons';

interface PreviewFrameProps {
  html: string;
  title: string;
  heightClass?: string;
}

export function PreviewFrame({
  html,
  title,
  heightClass = 'h-[480px] sm:h-[620px]',
}: PreviewFrameProps) {
  const [revision, setRevision] = useState(0);
  const lastHtmlRef = useRef(html);

  useEffect(() => {
    if (lastHtmlRef.current === html) return;
    lastHtmlRef.current = html;
    setRevision((current) => current + 1);
  }, [html]);

  return (
    <div className="overflow-hidden rounded-xl border border-ink/15 bg-white">
      <div className="flex h-9 items-center gap-2 border-b border-line/80 bg-[#efede6] px-3">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full border border-ink/15 bg-[#d8d3c7]" />
          <span className="h-2 w-2 rounded-full border border-ink/15 bg-[#d8d3c7]" />
          <span className="h-2 w-2 rounded-full border border-ink/15 bg-[#d8d3c7]" />
        </span>
        <span className="ml-1 truncate font-mono text-[9px] tracking-[0.04em] text-muted">
          preview.html
        </span>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6c8b5b]" aria-hidden="true" />
          sandbox · no same-origin
        </span>
        <button
          type="button"
          onClick={() => setRevision((current) => current + 1)}
          className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded border border-transparent text-muted transition-colors hover:border-line hover:bg-white hover:text-ink"
          aria-label="重新载入预览"
          title="重新载入预览（会清空工具内存状态）"
        >
          <RefreshIcon size={12} />
        </button>
      </div>

      <iframe
        key={revision}
        title={`${title} 预览`}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={html}
        referrerPolicy="no-referrer"
        className={`${heightClass} block w-full bg-white`}
      />
    </div>
  );
}
