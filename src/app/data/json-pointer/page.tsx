'use client';

import { ClipboardIcon, LocateFixedIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ToolGrid,
  ToolPanel,
  ToolWorkbench,
} from '../../../components/tool-workbench';
import { Button } from '../../../components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  type JsonPointerOperation,
  mutateJsonPointer,
  resolveJsonPointer,
} from '../../../utils/tools/json-pointer';

import s from './index.module.scss';

type PointerMode = 'query' | JsonPointerOperation;

const defaultJson = `{
  "items": [
    { "name": "first", "enabled": true },
    { "name": "second", "enabled": false }
  ],
  "a/b": { "~key": "escaped" }
}`;

function formatValue(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function JsonPointerPage() {
  const [input, setInput] = useState(defaultJson);
  const [pointer, setPointer] = useState('/items/0/name');
  const [mode, setMode] = useState<PointerMode>('query');
  const [valueInput, setValueInput] = useState('"updated"');
  const [output, setOutput] = useState('"first"');
  const [error, setError] = useState('');

  const execute = () => {
    try {
      const result =
        mode === 'query'
          ? formatValue(resolveJsonPointer(input, pointer))
          : mutateJsonPointer(
              input,
              pointer,
              mode,
              mode === 'remove' ? undefined : JSON.parse(valueInput),
            );

      setOutput(result);
      setError('');
      toast.success(mode === 'query' ? 'Pointer 查询完成' : 'JSON 修改完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyOutput = async () => {
    try {
      await copyToClipboard(output);
      toast.success('结果已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="使用 RFC 6901 Pointer 查询和不可变修改 JSON 对象或数组。"
      title="JSON Pointer"
    >
      <ToolGrid>
        <ToolPanel description="~1 表示 /，~0 表示 ~" title="JSON 与 Pointer">
          <FieldGroup>
            <Field>
              <FieldLabel>操作</FieldLabel>
              <ToggleGroup
                aria-label="JSON Pointer 操作"
                onValueChange={(value) => {
                  if (value) {
                    setMode(value as PointerMode);
                    setError('');
                  }
                }}
                spacing={0}
                type="single"
                value={mode}
                variant="outline"
              >
                <ToggleGroupItem value="query">查询</ToggleGroupItem>
                <ToggleGroupItem value="add">添加</ToggleGroupItem>
                <ToggleGroupItem value="replace">替换</ToggleGroupItem>
                <ToggleGroupItem value="remove">删除</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="json-pointer-input">JSON 内容</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.json}
                id="json-pointer-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="json-pointer-path">Pointer</FieldLabel>
              <Input
                id="json-pointer-path"
                onChange={(event) => setPointer(event.target.value)}
                placeholder="/items/0/name"
                value={pointer}
              />
              <FieldDescription>
                空 Pointer 表示根值；添加到数组末尾可使用 `-`。
              </FieldDescription>
            </Field>
            {mode !== 'query' && mode !== 'remove' ? (
              <Field>
                <FieldLabel htmlFor="json-pointer-value">JSON 值</FieldLabel>
                <Textarea
                  className={s.value}
                  id="json-pointer-value"
                  onChange={(event) => setValueInput(event.target.value)}
                  value={valueInput}
                />
              </Field>
            ) : null}
            <Button onClick={execute} size="lg">
              <LocateFixedIcon data-icon="inline-start" />
              执行{mode === 'query' ? '查询' : '修改'}
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 JSON Pointer 结果"
              disabled={!output}
              onClick={() => void copyOutput()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="修改操作返回新的完整 JSON"
          title="结果"
        >
          <Textarea
            aria-label="JSON Pointer 结果"
            className={s.output}
            readOnly
            value={output}
          />
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
