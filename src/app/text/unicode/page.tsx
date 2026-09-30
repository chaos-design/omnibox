'use client';

import { ClipboardIcon, ScanTextIcon, WandSparklesIcon } from 'lucide-react';
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
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  countUnicodeCodePoints,
  decodeUnicodeEscapes,
  encodeUnicodeEscapes,
  inspectUnicode,
  normalizeUnicode,
  type UnicodeEscapes,
  type UnicodeNormalization,
} from '../../../utils/tools/unicode';

import s from './index.module.scss';

const defaultInput = 'Omnibox e\u0301 🚀';
const detailLimit = 500;
const maxInputLength = 100_000;
const defaultNormalized = normalizeUnicode(defaultInput, 'NFC');

export default function UnicodePage() {
  const [input, setInput] = useState(defaultInput);
  const [normalization, setNormalization] =
    useState<UnicodeNormalization>('NFC');
  const [output, setOutput] = useState(defaultNormalized);
  const [escapes, setEscapes] = useState<UnicodeEscapes>(() =>
    encodeUnicodeEscapes(defaultNormalized),
  );
  const [characters, setCharacters] = useState(() =>
    inspectUnicode(defaultNormalized, detailLimit),
  );
  const [characterCount, setCharacterCount] = useState(() =>
    countUnicodeCodePoints(defaultNormalized),
  );
  const [error, setError] = useState('');

  const analyze = (value: string) => {
    if (value.length > maxInputLength) {
      throw new Error(
        `Unicode 分析最多支持 ${maxInputLength} 个 UTF-16 单元。`,
      );
    }

    const normalized = normalizeUnicode(value, normalization);
    setOutput(normalized);
    setEscapes(encodeUnicodeEscapes(normalized));
    setCharacters(inspectUnicode(normalized, detailLimit));
    setCharacterCount(countUnicodeCodePoints(normalized));
    setError('');
  };

  const normalize = () => {
    try {
      analyze(input);
      toast.success(`${normalization} 归一化完成`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const decodeEscapes = () => {
    try {
      const decoded = decodeUnicodeEscapes(input);
      analyze(decoded);
      toast.success('Unicode 转义解码完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyOutput = async () => {
    try {
      await copyToClipboard(output);
      toast.success('文本已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="检查代码点和编码形式，并执行 Unicode 归一化与转义解码。"
      title="Unicode"
    >
      <ToolGrid>
        <ToolPanel description="按代码点处理，不拆散代理对" title="文本输入">
          <FieldGroup>
            <Field>
              <FieldLabel>归一化形式</FieldLabel>
              <ToggleGroup
                aria-label="Unicode 归一化形式"
                onValueChange={(value) => {
                  if (value) {
                    setNormalization(value as UnicodeNormalization);
                  }
                }}
                spacing={0}
                type="single"
                value={normalization}
                variant="outline"
              >
                {(['NFC', 'NFD', 'NFKC', 'NFKD'] as const).map((form) => (
                  <ToggleGroupItem key={form} value={form}>
                    {form}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="unicode-input">文本或转义</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.input}
                id="unicode-input"
                maxLength={maxInputLength}
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <FieldDescription>
                支持 `\uXXXX`、代理对和 `\u&#123;1F680&#125;`。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={normalize} size="lg">
                <WandSparklesIcon data-icon="inline-start" />
                归一化并分析
              </Button>
              <Button onClick={decodeEscapes} size="lg" variant="outline">
                <ScanTextIcon data-icon="inline-start" />
                解码转义
              </Button>
            </div>
            <Field>
              <FieldLabel htmlFor="unicode-output">处理结果</FieldLabel>
              <Textarea
                className={s.output}
                id="unicode-output"
                readOnly
                value={output}
              />
            </Field>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 Unicode 结果"
              disabled={!output}
              onClick={() => void copyOutput()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description={`${characterCount} 个代码点${characterCount > detailLimit ? `，仅展示前 ${detailLimit} 个` : ''}`}
          title="编码详情"
        >
          <dl className={s.escapes}>
            <div>
              <dt>Code Point</dt>
              <dd>{escapes.codePoint}</dd>
            </div>
            <div>
              <dt>UTF-16</dt>
              <dd>{escapes.utf16}</dd>
            </div>
            <div>
              <dt>HTML</dt>
              <dd>{escapes.html}</dd>
            </div>
          </dl>
          <div className={s.characterList}>
            {characters.map((item) => (
              <article key={`${item.index}-${item.codePoint}`}>
                <strong>{item.character || '∅'}</strong>
                <dl>
                  <div>
                    <dt>位置</dt>
                    <dd>{item.index}</dd>
                  </div>
                  <div>
                    <dt>代码点</dt>
                    <dd>{item.codePoint}</dd>
                  </div>
                  <div>
                    <dt>类别</dt>
                    <dd>{item.category}</dd>
                  </div>
                  <div>
                    <dt>UTF-8</dt>
                    <dd>{item.utf8}</dd>
                  </div>
                  <div>
                    <dt>UTF-16</dt>
                    <dd>{item.utf16}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
