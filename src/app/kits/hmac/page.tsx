'use client';

import { ClipboardIcon, KeyRoundIcon, ShieldCheckIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Spinner } from '../../../components/ui/spinner';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  generateHmac,
  type HmacAlgorithm,
  type HmacKeyEncoding,
  type HmacOutput,
} from '../../../utils/tools/hmac';

import s from './index.module.scss';

export default function HmacPage() {
  const [message, setMessage] = useState(
    'The quick brown fox jumps over the lazy dog',
  );
  const [key, setKey] = useState('key');
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>('SHA-256');
  const [keyEncoding, setKeyEncoding] = useState<HmacKeyEncoding>('text');
  const [outputFormat, setOutputFormat] = useState<HmacOutput>('hex');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);

    try {
      setResult(
        await generateHmac(message, key, {
          algorithm,
          keyEncoding,
          output: outputFormat,
        }),
      );
      setError('');
      toast.success('HMAC 计算完成');
    } catch (reason) {
      const errorMessage =
        reason instanceof Error ? reason.message : String(reason);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  const copyResult = async () => {
    try {
      await copyToClipboard(result);
      toast.success('HMAC 已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="使用浏览器 Web Crypto 生成 HMAC；密钥只保留在当前页面内存中。"
      title="HMAC"
    >
      <ToolGrid>
        <ToolPanel description="消息与密钥不会进入日志或本地存储" title="输入">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="hmac-message">消息</FieldLabel>
              <Textarea
                className={s.message}
                id="hmac-message"
                onChange={(event) => setMessage(event.target.value)}
                value={message}
              />
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="hmac-key">密钥</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                autoComplete="off"
                id="hmac-key"
                onChange={(event) => setKey(event.target.value)}
                spellCheck={false}
                value={key}
              />
              <FieldDescription>
                十六进制密钥必须由偶数个 0-9、A-F 字符组成。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <div className={s.settings}>
              <Field>
                <FieldLabel>密钥编码</FieldLabel>
                <ToggleGroup
                  aria-label="HMAC 密钥编码"
                  onValueChange={(value) => {
                    if (value) {
                      setKeyEncoding(value as HmacKeyEncoding);
                      setResult('');
                      setError('');
                    }
                  }}
                  spacing={0}
                  type="single"
                  value={keyEncoding}
                  variant="outline"
                >
                  <ToggleGroupItem value="text">UTF-8</ToggleGroupItem>
                  <ToggleGroupItem value="hex">Hex</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel>算法</FieldLabel>
                <Select
                  onValueChange={(value) => {
                    setAlgorithm(value as HmacAlgorithm);
                    setResult('');
                  }}
                  value={algorithm}
                >
                  <SelectTrigger className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(['SHA-256', 'SHA-384', 'SHA-512'] as const).map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button
              disabled={calculating}
              onClick={() => void calculate()}
              size="lg"
            >
              {calculating ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <KeyRoundIcon data-icon="inline-start" />
              )}
              {calculating ? '正在计算' : '生成 HMAC'}
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 HMAC"
              disabled={!result}
              onClick={() => void copyResult()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description={`${algorithm} · ${outputFormat.toUpperCase()}`}
          title="签名结果"
        >
          <Field>
            <FieldLabel>输出格式</FieldLabel>
            <ToggleGroup
              aria-label="HMAC 输出格式"
              onValueChange={(value) => {
                if (value) {
                  setOutputFormat(value as HmacOutput);
                  setResult('');
                }
              }}
              spacing={0}
              type="single"
              value={outputFormat}
              variant="outline"
            >
              <ToggleGroupItem value="hex">Hex</ToggleGroupItem>
              <ToggleGroupItem value="base64">Base64</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <output className={s.output}>
            {result || '生成结果将在这里显示'}
          </output>
          <div className={s.securityNote}>
            <ShieldCheckIcon aria-hidden="true" />
            <p>
              HMAC 用于消息完整性与身份校验，不是加密；接收方仍能看到原始消息。
            </p>
          </div>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
