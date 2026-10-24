import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  extractJsonObject,
  normalizeIdeas,
  prepareGeneratedHtml,
} from '../../src/lib/html';

const idea = {
  title: '工具名',
  problem: '解决什么',
  howItWorks: '怎么用',
  whySmall: '为什么小',
};

describe('extractJsonObject', () => {
  it('parses fenced JSON embedded in prose', () => {
    const content = `这是结果：\n\`\`\`json\n${JSON.stringify({
      ideas: [idea, idea, idea],
    })}\n\`\`\``;
    expect(extractJsonObject(content)).toMatchObject({ ideas: expect.any(Array) });
  });

  it('repairs a trailing comma in the extracted object', () => {
    expect(
      extractJsonObject('prefix {"ideas":[{"title":"a",},],} suffix'),
    ).toEqual({ ideas: [{ title: 'a' }] });
  });

  it('throws a readable error for non-JSON content', () => {
    expect(() => extractJsonObject('not json at all')).toThrow(/JSON/);
  });
});

describe('normalizeIdeas', () => {
  it('accepts exactly three complete ideas and trims values', () => {
    const ideas = normalizeIdeas({
      ideas: [
        { ...idea, title: ' A ' },
        { ...idea, title: 'B' },
        { ...idea, title: 'C' },
        { ...idea, title: 'D' },
      ],
    });
    expect(ideas).toHaveLength(3);
    expect(ideas[0].title).toBe('A');
  });

  it('rejects incomplete results', () => {
    expect(() => normalizeIdeas({ ideas: [idea, idea] })).toThrow(/不足 3 个/);
    expect(() => normalizeIdeas({})).toThrow(/ideas/);
  });
});

describe('prepareGeneratedHtml', () => {
  it('strips fences and prose, injects CSP and viewport', () => {
    const source = `Here is the tool:
\`\`\`html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta http-equiv="Content-Security-Policy" content="old-policy" />
  <title>Test</title>
</head>
<body><h1>Hello</h1></body>
</html>
\`\`\``;

    const html = prepareGeneratedHtml(source);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Hello');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain('name="viewport"');
    expect(html).not.toContain('old-policy');
    expect(html).not.toContain('Here is the tool');
  });

  it('rejects fragments that are not complete documents', () => {
    expect(() => prepareGeneratedHtml('<div>fragment</div>')).toThrow(/完整/);
  });

  it('escapes injected text for the mock tool templates', () => {
    expect(escapeHtml('<script>"x" & y</script>')).toBe(
      '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;',
    );
  });
});
