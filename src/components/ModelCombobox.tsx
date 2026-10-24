import { useMemo } from 'react';
import { COMMON_MODEL_GROUPS } from '../lib/models';
import { PresetCombobox, type PresetGroup } from './PresetCombobox';

interface ModelComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelCombobox({ value, onChange }: ModelComboboxProps) {
  const groups = useMemo<PresetGroup[]>(
    () =>
      COMMON_MODEL_GROUPS.map((group) => ({
        label: group.provider,
        options: group.models.map((model) => ({ value: model })),
      })),
    [],
  );

  return (
    <PresetCombobox
      id="api-model"
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder="gpt-4o-mini"
      panelTitle="常用模型"
      footer="常用模型仅作填写参考，实际可用性取决于服务商；也可以直接输入任意模型名。"
    />
  );
}
