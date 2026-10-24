import { useMemo } from 'react';
import { API_PROVIDERS } from '../lib/models';
import { PresetCombobox, type PresetGroup } from './PresetCombobox';

interface BaseUrlComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function BaseUrlCombobox({ value, onChange }: BaseUrlComboboxProps) {
  const groups = useMemo<PresetGroup[]>(
    () => [
      {
        label: '常用服务商',
        options: API_PROVIDERS.map((provider) => ({
          value: provider.baseUrl,
          label: provider.name,
          description: provider.baseUrl,
        })),
      },
    ],
    [],
  );

  return (
    <PresetCombobox
      id="api-base-url"
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder="https://api.openai.com/v1"
      panelTitle="常用 API 服务"
      footer={
        <>
          选择服务商会填入对应 Base URL；请求会自动追加{' '}
          <span className="font-mono">/chat/completions</span>，也可以直接输入自定义代理地址。
        </>
      }
    />
  );
}
