'use client';

import { BinaryIcon, ClipboardIcon } from 'lucide-react';
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  convertRadix,
  type Radix,
  type RadixResult,
} from '../../../utils/tools/radix';

import s from './index.module.scss';

const resultFields: Array<{
  key: keyof RadixResult;
  label: string;
  prefix: string;
}> = [
  { key: 'binary', label: '二进制', prefix: '0b' },
  { key: 'octal', label: '八进制', prefix: '0o' },
  { key: 'decimal', label: '十进制', prefix: '' },
  { key: 'hexadecimal', label: '十六进制', prefix: '0x' },
];

export default function RadixPage() {
  const [input, setInput] = useState('255');
  const [radix, setRadix] = useState<Radix>(10);
  const [result, setResult] = useState<RadixResult>(() =>
    convertRadix('255', 10),
  );
  const [error, setError] = useState('');

  const runConversion = () => {
    try {
      setResult(convertRadix(input, radix));
      setError('');
      toast.success('进制转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await copyToClipboard(value);
      toast.success('结果已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="基于 BigInt 的二、八、十、十六进制大整数转换，不受安全整数范围限制。"
      title="进制转换"
    >
      <ToolGrid>
        <ToolPanel description="支持正负整数与常见进制前缀" title="输入整数">
          <FieldGroup>
            <Field>
              <FieldLabel>源进制</FieldLabel>
              <ToggleGroup
                aria-label="源进制"
                onValueChange={(value) => {
                  if (value) {
                    setRadix(Number(value) as Radix);
                    setError('');
                  }
                }}
                spacing={0}
                type="single"
                value={radix.toString()}
                variant="outline"
              >
                <ToggleGroupItem value="2">BIN</ToggleGroupItem>
                <ToggleGroupItem value="8">OCT</ToggleGroupItem>
                <ToggleGroupItem value="10">DEC</ToggleGroupItem>
                <ToggleGroupItem value="16">HEX</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="radix-input">整数</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                className={s.input}
                id="radix-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入整数"
                value={input}
              />
              <FieldDescription>
                例如 `0b1010`、`0o755`、`255` 或 `0xFF`。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <Button onClick={runConversion} size="lg">
              <BinaryIcon data-icon="inline-start" />
              转换进制
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel description="结果保留完整精度" title="转换结果">
          <dl className={s.results}>
            {resultFields.map((field) => {
              const value = result[field.key];
              const displayValue =
                value.startsWith('-') && field.prefix
                  ? `-${field.prefix}${value.slice(1)}`
                  : `${field.prefix}${value}`;

              return (
                <div key={field.key}>
                  <dt>
                    <span>{field.label}</span>
                    <code>{field.prefix || '10'}</code>
                  </dt>
                  <dd>
                    <code>{displayValue}</code>
                    <Button
                      aria-label={`复制${field.label}结果`}
                      onClick={() => void copyValue(displayValue)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ClipboardIcon />
                    </Button>
                  </dd>
                </div>
              );
            })}
          </dl>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
