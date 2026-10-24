import { describe, expect, it } from 'vitest';
import type { SavedTool } from '../../src/types';
import {
  mergeImportedTools,
  parseBackup,
  safeFilename,
  serializeBackup,
} from '../../src/lib/backup';

function makeTool(overrides: Partial<SavedTool> = {}): SavedTool {
  return {
    id: 'tool-1',
    title: '买菜清单',
    friction: '想不起冰箱里有什么',
    idea: {
      title: '买菜清单',
      problem: '重复购买',
      howItWorks: '勾选',
      whySmall: '一个页面',
    },
    html: '<!doctype html><html><body>ok</body></html>',
    tags: ['购物备忘'],
    createdAt: 1,
    updatedAt: 1,
    versions: [],
    ...overrides,
  };
}

describe('backup serialization', () => {
  it('round-trips tools and accepts the backup envelope', () => {
    const tool = makeTool();
    const parsed = parseBackup(serializeBackup([tool]));
    expect(parsed.tools).toHaveLength(1);
    expect(parsed.tools[0].id).toBe(tool.id);
    expect(parsed.invalidCount).toBe(0);
  });

  it('accepts a bare array and skips invalid records', () => {
    const parsed = parseBackup(JSON.stringify([makeTool(), { bad: true }]));
    expect(parsed.tools).toHaveLength(1);
    expect(parsed.invalidCount).toBe(1);
  });

  it('rejects malformed backups', () => {
    expect(() => parseBackup('not json')).toThrow(/JSON/);
    expect(() => parseBackup('{"tools":[]}')).toThrow(/没有有效/);
    expect(() => parseBackup('{"nope":true}')).toThrow(/tools/);
  });
});

describe('backup merge', () => {
  it('adds new tools and updates only newer copies', () => {
    const existing = makeTool({ updatedAt: 10 });
    const newer = makeTool({ title: '新版', updatedAt: 20 });
    const older = makeTool({ title: '旧版', updatedAt: 5 });
    const added = makeTool({ id: 'tool-2', title: '另一个', updatedAt: 15 });
    const result = mergeImportedTools(existing ? [existing] : [], [newer, older, added]);

    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.tools).toHaveLength(2);
    expect(result.tools.find((tool) => tool.id === 'tool-1')?.title).toBe('新版');
  });
});

describe('safeFilename', () => {
  it('removes characters that are invalid in filenames', () => {
    expect(safeFilename('a/b:c*?')).toBe('a-b-c--');
    expect(safeFilename('   ')).toBe('friction2tool');
    expect(safeFilename('x'.repeat(200))).toHaveLength(80);
  });
});
