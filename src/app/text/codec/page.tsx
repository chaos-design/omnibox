'use client';

import {
  ArrowRightLeftIcon,
  ClipboardIcon,
  EraserIcon,
  WandSparklesIcon,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import {
  decodeBase64,
  decodeBase64Url,
  decodeHtmlEntities,
  decodeUrl,
  encodeBase64,
  encodeBase64Url,
  encodeHtmlEntities,
  encodeUrl,
} from '../../../utils/tools/codec';
import { copyToClipboard } from '../../../utils/tools/copy';

import s from './index.module.scss';

type CodecKind = 'base64' | 'base64url' | 'url-component' | 'url' | 'html';
type Direction = 'encode' | 'decode';

const defaultInput = 'Omnibox 工具箱';

function transform(input: string, kind: CodecKind, direction: Direction) {
  if (direction === 'encode') {
    switch (kind) {
      case 'base64':
        return encodeBase64(input);
      case 'base64url':
        return encodeBase64Url(input);
      case 'url-component':
        return encodeUrl(input);
      case 'url':
        return encodeUrl(input, false);
      case 'html':
        return encodeHtmlEntities(input);
    }
  }

  switch (kind) {
    case 'base64':
      return decodeBase64(input);
    case 'base64url':
      return decodeBase64Url(input);
    case 'url-component':
      return decodeUrl(input);
    case 'url':
      return decodeUrl(input, false);
    case 'html':
      return decodeHtmlEntities(input);
  }
}

export default function CodecPage() {
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState(() => encodeBase64(defaultInput));
  const [kind, setKind] = useState<CodecKind>('base64');
  const [direction, setDirection] = useState<Direction>('encode');
  const [error, setError] = useState('');

  const runTransform = () => {
    try {
      setOutput(transform(input, kind, direction));
      setError('');
      toast.success(direction === 'encode' ? '编码完成' : '解码完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const swapContent = () => {
    setInput(output);
    setOutput(input);
    setDirection((value) => (value === 'encode' ? 'decode' : 'encode'));
    setError('');
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
      description="Base64、Base64URL、URL 与 HTML 实体双向转换，所有内容只在浏览器内处理。"
      title="文本编码"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <Button
              aria-label="清空输入"
              onClick={() => {
                setInput('');
                setError('');
              }}
              size="icon-sm"
              variant="ghost"
            >
              <EraserIcon />
            </Button>
          }
          description="选择编码协议与转换方向"
          title="输入"
        >
          <FieldGroup>
            <div className={s.settings}>
              <Field>
                <FieldLabel>编码类型</FieldLabel>
                <Select
                  onValueChange={(value) => setKind(value as CodecKind)}
                  value={kind}
                >
                  <SelectTrigger className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="base64">Base64</SelectItem>
                      <SelectItem value="base64url">Base64URL</SelectItem>
                      <SelectItem value="url-component">URL 组件</SelectItem>
                      <SelectItem value="url">完整 URL</SelectItem>
                      <SelectItem value="html">HTML 实体</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>转换方向</FieldLabel>
                <ToggleGroup
                  aria-label="转换方向"
                  onValueChange={(value) => {
                    if (value) {
                      setDirection(value as Direction);
                    }
                  }}
                  spacing={0}
                  type="single"
                  value={direction}
                  variant="outline"
                >
                  <ToggleGroupItem value="encode">编码</ToggleGroupItem>
                  <ToggleGroupItem value="decode">解码</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </div>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="codec-input">原始内容</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.textarea}
                id="codec-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入需要处理的文本"
                value={input}
              />
              <FieldDescription>
                Base64 与 Base64URL 会按 UTF-8 处理 Unicode 文本。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={runTransform} size="lg">
                <WandSparklesIcon data-icon="inline-start" />
                执行{direction === 'encode' ? '编码' : '解码'}
              </Button>
              <Button
                disabled={!output}
                onClick={swapContent}
                size="lg"
                variant="outline"
              >
                <ArrowRightLeftIcon data-icon="inline-start" />
                交换
              </Button>
            </div>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制结果"
              disabled={!output}
              onClick={() => void copyOutput()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="成功后才会替换当前结果"
          title="输出"
        >
          <Field>
            <FieldLabel htmlFor="codec-output">转换结果</FieldLabel>
            <Textarea
              className={s.textarea}
              id="codec-output"
              readOnly
              value={output}
            />
          </Field>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
