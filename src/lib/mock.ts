import { escapeHtml } from './html';
import { truncate } from './format';
import type { GenerateToolInput, Idea } from '../types';

function frictionTagline(friction: string): string {
  return `围绕「${truncate(friction.replace(/[。！？!?]+$/, ''), 32)}」`;
}

/**
 * Deterministic, useful mock content. It changes with the friction keywords so
 * the no-key demo feels connected to what the user typed.
 */
export function buildMockIdeas(friction: string): Idea[] {
  const tagline = frictionTagline(friction);

  if (/买|购物|超市|菜|冰箱|清单/.test(friction)) {
    return [
      {
        title: '买菜前 · 60 秒冰箱快扫',
        problem: `解决「${truncate(friction, 26)}」导致重复购买或漏买的问题。`,
        howItWorks:
          '出门前打开，按冰箱、冷冻、调料柜、本周菜单四项快速勾选；到超市后只看没勾的部分。',
        whySmall:
          '不需要库存系统，只有一个勾选清单和 60 秒倒计时，打开就能用。',
      },
      {
        title: '常买清单 · 漏买检查卡',
        problem: '真正需要的不是完整库存，而是别把盐、纸巾、葱姜蒜这类高频消耗品漏掉。',
        howItWorks:
          '把最常买的十几样东西做成固定清单，出门前点亮本周缺的，买完逐项划掉。',
        whySmall:
          '一个页面、一份静态清单，不需要同步、分类或账号。',
      },
      {
        title: '一餐反推 · 买菜清单',
        problem: '买了一堆菜，回家却凑不出一顿完整的饭。',
        howItWorks:
          '先写这周最想吃的两顿饭，再按每顿饭倒推 3 到 5 样食材，只买清单里的东西。',
        whySmall:
          '输入两行菜单，输出一张短清单；没有菜谱库，也没有多余设置。',
      },
    ];
  }

  if (/忘|记|提醒|备忘|会议|想法/.test(friction)) {
    return [
      {
        title: '一句话捕获卡',
        problem: `解决「${truncate(friction, 26)}」之后想法丢失的问题。`,
        howItWorks:
          '打开就聚焦输入框，写一句、按回车，进入待办列表；处理完直接勾掉。',
        whySmall:
          '没有账户、标签和分类，只有输入框和一个列表，三秒内能记下。',
      },
      {
        title: '三格回看板',
        problem: '事情记下来了，但散落在不同地方，回想时没有抓手。',
        howItWorks:
          '只保留三个格子：刚刚想到、这周要做、等别人回复。每格最多放五条。',
        whySmall:
          '用空间限制代替复杂分类，一眼看完，不需要整理系统。',
      },
      {
        title: '临门提醒条',
        problem: '重要的事常常在离开某个场景后才想起来。',
        howItWorks:
          '把一句话提醒贴在页面顶部，设置一个当时的检查点；完成前它一直留在视线里。',
        whySmall:
          '一条提醒、一句检查条件，状态放在内存里，刷新即清空。',
      },
    ];
  }

  if (/拖|开始|专注|分心|任务|不想/.test(friction)) {
    return [
      {
        title: '两分钟启动卡',
        problem: `解决「${truncate(friction, 26)}」时迟迟无法开始的问题。`,
        howItWorks:
          '写下一件要做的事，点开始，只做两分钟；计时结束后再决定继续还是停。',
        whySmall:
          '只有一个倒计时和一句任务描述，门槛低到可以先启动。',
      },
      {
        title: '最小一步拆解卡',
        problem: '任务在脑子里是一团，所以总想等到“状态好了再做”。',
        howItWorks:
          '把任务写成三个动作，第一个必须小到 1 分钟内能完成，然后只勾第一步。',
        whySmall:
          '三步就停止拆解，避免把准备工作变成新的拖延。',
      },
      {
        title: '单任务专注块',
        problem: '频繁切窗口让每件事都只推进一点点。',
        howItWorks:
          '开始前写下一句“现在只做”，在固定时间内只勾这一件事，结束时记下卡点。',
        whySmall:
          '一个任务、一块时间、一个结束动作，没有复杂统计。',
      },
    ];
  }

  return [
    {
      title: '摩擦捕获卡',
      problem: `${tagline}，先把反复出现的麻烦说清楚。`,
      howItWorks:
        '写下此刻卡住的瞬间，再补一句最希望它变成什么；每次只保留一条。',
      whySmall:
        '没有分类与流程，只有一个输入框，适合把模糊烦恼变成可处理的句子。',
    },
    {
      title: '下一步微行动卡',
      problem: '知道哪里不对，但不知道今天能做什么。',
      howItWorks:
        '把摩擦拆成三个候选动作，选一个 60 秒内能做完的，勾掉后观察变化。',
      whySmall:
        '三个候选、一个选择、一次勾选，没有项目管理和进度看板。',
    },
    {
      title: '做完就关 · 复盘卡',
      problem: '试过很多方法，却没有留下哪个真正有用的记录。',
      howItWorks:
        '用完工具后用一句话记下有效或无效，再决定这个工具是否值得留下。',
      whySmall:
        '只保留一句结论，不需要图表和长期数据。',
    },
  ];
}

function getChecklistItems(friction: string, idea: Idea): string[] {
  const haystack = `${friction} ${idea.title} ${idea.howItWorks}`;

  if (/买|购物|超市|菜|冰箱/.test(haystack)) {
    return [
      '扫一眼冰箱冷藏区，有哪些菜这周必须先用掉？',
      '检查冷冻区、鸡蛋和主食，是否还有余量？',
      '调料、纸巾、清洁用品里，哪一样已经见底？',
      '这周最想做的两顿饭，还缺哪 1–2 样关键食材？',
    ];
  }

  if (/忘|记|提醒|备忘|会议|想法/.test(haystack)) {
    return [
      '现在脑中挂着的那件事，用一句话写下来',
      '它真正需要推进的下一步是什么？',
      '有没有需要等人或等材料的环节？',
      '什么时候回看它最合适？',
    ];
  }

  if (/拖|开始|专注|分心|任务|不想/.test(haystack)) {
    return [
      '把要做的事改写成一句动词开头的行动',
      '找到 60 秒内就能完成的第一步',
      '关掉一个最容易让你分心的窗口',
      '开始后只做这一件事，完成再决定下一步',
    ];
  }

  return [
    '这件事具体发生在什么时刻？',
    '现在最卡的那一步是什么？',
    '有没有一个 60 秒内能试的小动作？',
    '做完后，什么信号说明它确实帮上忙？',
  ];
}

function itemsMarkup(items: string[]): string {
  return items
    .map(
      (item, index) => `
        <li class="item">
          <label>
            <input type="checkbox" aria-label="${escapeHtml(item)}" />
            <span class="check" aria-hidden="true"></span>
            <span class="item-text"><span class="item-no">0${index + 1}</span>${escapeHtml(item)}</span>
          </label>
        </li>`,
    )
    .join('');
}

/**
 * A real interactive demo tool: checklist, add-item form, 60-second timer.
 * Everything is inline, offline and in-memory.
 */
export function buildMockTool({ friction, idea, feedback }: GenerateToolInput): string {
  const title = escapeHtml(idea.title);
  const problem = escapeHtml(idea.problem);
  const howItWorks = escapeHtml(idea.howItWorks);
  const whySmall = escapeHtml(idea.whySmall);
  const frictionLabel = escapeHtml(truncate(friction, 80));
  const items = getChecklistItems(friction, idea);
  const cleanedFeedback = feedback?.trim() ?? '';
  const feedbackMarkup = cleanedFeedback
    ? `<aside class="feedback" aria-label="已应用反馈">
        <span class="feedback-label">已应用你的反馈</span>
        <p>${escapeHtml(truncate(cleanedFeedback, 260))}</p>
      </aside>`
    : '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f3efe6;
      --card: #fffdf8;
      --ink: #1e1d19;
      --muted: #6f6a5f;
      --line: #d8d1c2;
      --accent: #e15a2b;
      --accent-soft: #f8e3d8;
      --sage: #dfe8d7;
      --radius: 16px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      background:
        radial-gradient(circle at 1px 1px, rgba(30, 29, 25, 0.07) 1px, transparent 0) 0 0 / 18px 18px,
        var(--paper);
      color: var(--ink);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    button, input { font: inherit; }
    button { cursor: pointer; }
    button:focus-visible, input:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .shell {
      width: min(100%, 700px);
      margin: 0 auto;
      padding: clamp(20px, 5vw, 44px) 18px 26px;
    }
    .kicker {
      margin: 0 0 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1.4;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .hero h1 {
      margin: 0;
      max-width: 18ch;
      font-size: clamp(26px, 6vw, 40px);
      line-height: 1.16;
      letter-spacing: -0.035em;
      font-weight: 700;
    }
    .problem {
      margin: 14px 0 0;
      max-width: 58ch;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.75;
    }
    .friction {
      display: inline-flex;
      gap: 7px;
      align-items: baseline;
      margin-top: 18px;
      max-width: 100%;
      padding: 8px 11px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 253, 248, 0.65);
      font-size: 12px;
      color: var(--muted);
    }
    .friction b {
      flex: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--ink);
    }
    .friction span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .feedback {
      margin-top: 20px;
      padding: 12px 14px;
      border-left: 3px solid var(--accent);
      background: var(--accent-soft);
      border-radius: 0 10px 10px 0;
    }
    .feedback-label {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.12em;
      color: #9a3b1d;
    }
    .feedback p {
      margin: 5px 0 0;
      font-size: 12px;
      line-height: 1.6;
    }
    .panel {
      margin-top: 24px;
      padding: clamp(16px, 4vw, 24px);
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 18px 40px -34px rgba(30, 29, 25, 0.55);
    }
    .panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    .step {
      margin: 0 0 7px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .panel h2 {
      margin: 0;
      font-size: clamp(17px, 3.6vw, 21px);
      letter-spacing: -0.02em;
    }
    .timer {
      flex: none;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 5px 5px 11px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #f7f3ea;
    }
    .clock {
      min-width: 39px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--muted);
    }
    .timer button {
      min-height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      font-size: 11px;
    }
    .timer button:hover { background: var(--accent); }
    .list {
      list-style: none;
      padding: 0;
      margin: 4px 0 0;
    }
    .item { border-bottom: 1px solid rgba(216, 209, 194, 0.7); }
    .item:last-child { border-bottom: 0; }
    .item label {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 2px;
      cursor: pointer;
      font-size: 13px;
      line-height: 1.65;
    }
    .item input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
    .check {
      flex: none;
      width: 19px;
      height: 19px;
      margin-top: 2px;
      border: 1.5px solid #b9b1a1;
      border-radius: 5px;
      background: #fff;
      transition: background 120ms ease, border-color 120ms ease;
    }
    .item input:checked + .check {
      border-color: var(--accent);
      background:
        linear-gradient(135deg, transparent 44%, #fff 44%, #fff 56%, transparent 56%) 3px 8px / 6px 6px no-repeat,
        linear-gradient(45deg, transparent 42%, #fff 42%, #fff 58%, transparent 58%) 8px 8px / 7px 7px no-repeat,
        var(--accent);
    }
    .item input:focus-visible + .check {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .item input:checked ~ .item-text {
      color: #9c978c;
      text-decoration: line-through;
      text-decoration-color: rgba(156, 151, 140, 0.5);
    }
    .item-no {
      margin-right: 8px;
      color: #b4ad9f;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
    }
    .add {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .add input {
      min-width: 0;
      flex: 1;
      min-height: 42px;
      padding: 0 13px;
      color: var(--ink);
      background: #fbf8f1;
      border: 1px solid var(--line);
      border-radius: 9px;
      font-size: 12px;
    }
    .add input::placeholder { color: #a8a194; }
    .add button {
      flex: none;
      min-height: 42px;
      padding: 0 15px;
      color: var(--ink);
      background: var(--sage);
      border: 1px solid #b6c4aa;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
    }
    .add button:hover { background: #d3dfc8; }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 20px;
      color: var(--muted);
      font-size: 11px;
    }
    .reset {
      padding: 0;
      color: var(--muted);
      background: transparent;
      border: 0;
      text-decoration: underline;
      text-underline-offset: 3px;
      font-size: 11px;
    }
    .reset:hover { color: var(--ink); }
    .progress-track {
      height: 5px;
      margin-top: 8px;
      overflow: hidden;
      background: #e9e3d7;
      border-radius: 999px;
    }
    .progress-bar {
      display: block;
      width: 0%;
      height: 100%;
      background: var(--accent);
      border-radius: inherit;
      transition: width 160ms ease;
    }
    .hint {
      display: flex;
      gap: 10px;
      margin-top: 16px;
      padding: 14px 16px;
      color: var(--muted);
      background: rgba(223, 232, 215, 0.58);
      border: 1px solid #ccd7c2;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.65;
    }
    .hint span {
      flex: none;
      color: #5d754d;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .hint p { margin: 0; }
    .why {
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.65;
    }
    .why b { color: var(--ink); font-weight: 600; }
    .page-footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 18px;
      color: #9b9588;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.04em;
    }
    @media (max-width: 480px) {
      .panel-head { display: block; }
      .timer { margin-top: 14px; width: fit-content; }
      .add { flex-direction: column; }
      .add button { width: 100%; }
      .page-footer { display: block; line-height: 1.8; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition: none !important; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <p class="kicker">Friction2Tool / micro tool</p>
      <h1>${title}</h1>
      <p class="problem">${problem}</p>
      <div class="friction" title="${frictionLabel}">
        <b>FRICTION</b>
        <span>${frictionLabel}</span>
      </div>
    </header>
    ${feedbackMarkup}
    <section class="panel" aria-labelledby="work-title">
      <div class="panel-head">
        <div>
          <p class="step">01 / quick check</p>
          <h2 id="work-title">扫一遍，再做下一步</h2>
        </div>
        <div class="timer">
          <span class="clock" id="clock" aria-live="off">01:00</span>
          <button type="button" id="timerBtn">开始 60 秒</button>
        </div>
      </div>
      <ul class="list" id="list">
        ${itemsMarkup(items)}
      </ul>
      <form class="add" id="addForm">
        <input
          id="newItem"
          type="text"
          maxlength="80"
          autocomplete="off"
          placeholder="补一条只属于你的检查项…"
          aria-label="新增检查项"
        />
        <button type="submit">添加</button>
      </form>
      <div class="footer">
        <span id="progressText" aria-live="polite">0 / ${items.length} 已完成</span>
        <button type="button" class="reset" id="resetBtn">重置勾选</button>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span class="progress-bar" id="progressBar"></span>
      </div>
    </section>
    <aside class="hint">
      <span>↳</span>
      <p>${howItWorks}</p>
    </aside>
    <p class="why"><b>为什么够小：</b>${whySmall}</p>
    <footer class="page-footer">
      <span>OFFLINE · SINGLE FILE · NO STORED DATA</span>
      <span>状态随页面刷新清空</span>
    </footer>
  </main>
  <script>
    (function () {
      var list = document.getElementById('list');
      var form = document.getElementById('addForm');
      var input = document.getElementById('newItem');
      var resetBtn = document.getElementById('resetBtn');
      var progressText = document.getElementById('progressText');
      var progressBar = document.getElementById('progressBar');
      var clock = document.getElementById('clock');
      var timerBtn = document.getElementById('timerBtn');
      var remaining = 60;
      var timerId = null;

      function updateProgress() {
        var boxes = list.querySelectorAll('input[type="checkbox"]');
        var checked = list.querySelectorAll('input[type="checkbox"]:checked');
        var total = boxes.length;
        var done = checked.length;
        progressText.textContent = done + ' / ' + total + ' 已完成';
        progressBar.style.width = total === 0 ? '0%' : Math.round((done / total) * 100) + '%';
      }

      function bindItem(item) {
        var checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.addEventListener('change', updateProgress);
      }

      Array.prototype.forEach.call(list.querySelectorAll('.item'), bindItem);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = input.value.trim();
        if (!value) return;

        var item = document.createElement('li');
        item.className = 'item';
        var label = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.setAttribute('aria-label', value);
        var check = document.createElement('span');
        check.className = 'check';
        check.setAttribute('aria-hidden', 'true');
        var text = document.createElement('span');
        text.className = 'item-text';
        var no = document.createElement('span');
        no.className = 'item-no';
        no.textContent = 'NEW';
        text.appendChild(no);
        text.appendChild(document.createTextNode(value));
        label.appendChild(checkbox);
        label.appendChild(check);
        label.appendChild(text);
        item.appendChild(label);
        list.appendChild(item);
        bindItem(item);
        input.value = '';
        input.focus();
        updateProgress();
      });

      resetBtn.addEventListener('click', function () {
        var boxes = list.querySelectorAll('input[type="checkbox"]');
        Array.prototype.forEach.call(boxes, function (box) { box.checked = false; });
        updateProgress();
      });

      function renderClock() {
        var minutes = Math.floor(remaining / 60);
        var seconds = remaining % 60;
        clock.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      }

      function stopTimer(label) {
        if (timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
        timerBtn.textContent = label;
      }

      timerBtn.addEventListener('click', function () {
        if (timerId !== null) {
          stopTimer('继续');
          return;
        }
        if (remaining <= 0) remaining = 60;
        renderClock();
        timerBtn.textContent = '暂停';
        timerId = setInterval(function () {
          remaining -= 1;
          if (remaining <= 0) {
            remaining = 0;
            renderClock();
            stopTimer('再来 60 秒');
            return;
          }
          renderClock();
        }, 1000);
      });

      renderClock();
      updateProgress();
    })();
  </script>
</body>
</html>`;
}
