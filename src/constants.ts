import type { ApiSettings } from './types';

export const APP_NAME = 'Friction2Tool';

export const FRICTION_MAX_LENGTH = 300;

export const DEFAULT_SETTINGS: ApiSettings = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export const EXAMPLE_FRICTIONS = [
  '每次买菜前都想不起家里还有什么。',
  '开会时想到要做的事，散会就忘了。',
  '明明知道该开始，却总在切窗口。',
];

export const IDEAS_TEMPERATURE = 0.8;
export const HTML_TEMPERATURE = 0.4;

export const IDEAS_TIMEOUT_MS = 45_000;
export const HTML_TIMEOUT_MS = 120_000;
