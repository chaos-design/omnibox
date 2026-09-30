'use client';

import {
  ClipboardIcon,
  FingerprintIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from 'lucide-react';
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
  generateRandomString,
  generateUuid,
  type HashAlgorithm,
  hashText,
} from '../../../utils/tools/hash-random';

import s from './index.module.scss';

type RandomMode = 'uuid' | 'string';
type AlphabetKey = keyof typeof alphabets;

const alphabets = {
  alphanumeric:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  hexadecimal: '0123456789abcdef',
  symbols:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+',
};

export default function HashRandomPage() {
  const [hashInput, setHashInput] = useState('Omnibox 工具箱');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hashResult, setHashResult] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [randomMode, setRandomMode] = useState<RandomMode>('uuid');
  const [length, setLength] = useState('32');
  const [alphabetKey, setAlphabetKey] = useState<AlphabetKey>('alphanumeric');
  const [randomResult, setRandomResult] = useState('');
  const [randomError, setRandomError] = useState('');

  const calculateHash = async () => {
    setCalculating(true);

    try {
      setHashResult(await hashText(hashInput, algorithm));
      toast.success(`${algorithm} 计算完成`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setCalculating(false);
    }
  };

  const generateValue = () => {
    try {
      const value =
        randomMode === 'uuid'
          ? generateUuid()
          : generateRandomString(Number(length), alphabets[alphabetKey]);

      setRandomResult(value);
      setRandomError('');
      toast.success(randomMode === 'uuid' ? 'UUID 已生成' : '随机字符串已生成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRandomError(message);
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
      description="使用浏览器 Web Crypto 计算标准哈希，并生成密码学安全的 UUID 与随机字符串。"
      title="哈希与随机值"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <Button
              aria-label="复制哈希结果"
              disabled={!hashResult}
              onClick={() => void copyValue(hashResult)}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="输出小写十六进制摘要"
          title="文本哈希"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="hash-input">原始文本</FieldLabel>
              <Textarea
                className={s.textarea}
                id="hash-input"
                onChange={(event) => setHashInput(event.target.value)}
                value={hashInput}
              />
            </Field>
            <Field>
              <FieldLabel>哈希算法</FieldLabel>
              <Select
                onValueChange={(value) => setAlgorithm(value as HashAlgorithm)}
                value={algorithm}
              >
                <SelectTrigger className={s.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const).map(
                      (item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                SHA-1 仅用于兼容校验，不适合安全签名。
              </FieldDescription>
            </Field>
            <Button
              disabled={calculating}
              onClick={() => void calculateHash()}
              size="lg"
            >
              {calculating ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <ShieldCheckIcon data-icon="inline-start" />
              )}
              {calculating ? '正在计算' : '计算哈希'}
            </Button>
            <output className={s.output}>
              {hashResult || '计算结果将在这里显示'}
            </output>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制随机值"
              disabled={!randomResult}
              onClick={() => void copyValue(randomResult)}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="随机值不会离开当前浏览器"
          title="安全随机值"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>生成类型</FieldLabel>
              <ToggleGroup
                aria-label="随机值类型"
                onValueChange={(value) => {
                  if (value) {
                    setRandomMode(value as RandomMode);
                    setRandomError('');
                  }
                }}
                spacing={0}
                type="single"
                value={randomMode}
                variant="outline"
              >
                <ToggleGroupItem value="uuid">UUID v4</ToggleGroupItem>
                <ToggleGroupItem value="string">随机字符串</ToggleGroupItem>
              </ToggleGroup>
            </Field>

            {randomMode === 'string' ? (
              <div className={s.randomSettings}>
                <Field data-invalid={Boolean(randomError)}>
                  <FieldLabel htmlFor="random-length">长度</FieldLabel>
                  <Input
                    aria-invalid={Boolean(randomError)}
                    id="random-length"
                    inputMode="numeric"
                    max={4096}
                    min={1}
                    onChange={(event) => setLength(event.target.value)}
                    type="number"
                    value={length}
                  />
                  <FieldError>{randomError}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>字符集</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      setAlphabetKey(value as AlphabetKey)
                    }
                    value={alphabetKey}
                  >
                    <SelectTrigger className={s.select}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="alphanumeric">
                          字母 + 数字
                        </SelectItem>
                        <SelectItem value="letters">仅字母</SelectItem>
                        <SelectItem value="numbers">仅数字</SelectItem>
                        <SelectItem value="hexadecimal">十六进制</SelectItem>
                        <SelectItem value="symbols">字母数字 + 符号</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : (
              <FieldDescription>
                UUID 使用浏览器原生 `crypto.randomUUID` 或安全随机数回退生成。
              </FieldDescription>
            )}

            <Button onClick={generateValue} size="lg">
              {randomMode === 'uuid' ? (
                <FingerprintIcon data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              生成{randomMode === 'uuid' ? ' UUID' : '随机字符串'}
            </Button>
            <output className={s.output}>
              {randomResult || '生成结果将在这里显示'}
            </output>
          </FieldGroup>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
