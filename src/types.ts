export interface Idea {
  title: string;
  problem: string;
  howItWorks: string;
  whySmall: string;
}

export interface ApiSettings {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
}

export interface ToolVersion {
  html: string;
  feedback: string;
  createdAt: number;
}

export interface SavedTool {
  id: string;
  title: string;
  friction: string;
  idea: Idea;
  html: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  versions: ToolVersion[];
}

export interface GenerateToolInput {
  friction: string;
  idea: Idea;
  feedback?: string;
  previousHtml?: string;
}

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}
