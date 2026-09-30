'use client';

import { CircleAlertIcon, PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ToolGrid,
  ToolPanel,
  ToolWorkbench,
} from '../../../components/tool-workbench';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert';
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
import {
  type RegexTestResult,
  replaceRegex,
  replaceRegexAsync,
  testRegex,
  testRegexAsync,
} from '../../../utils/tools/regex';

import s from './index.module.scss';

const flagOrder = ['g', 'i', 'm', 's', 'u', 'y'];
const defaultPattern = '(?<name>[A-Za-z]+)-(\\d+)';
const defaultInput = 'item-12\nnext-7\ninvalid';

export default function RegexPage() {
  const [pattern, setPattern] = useState(defaultPattern);
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState(defaultInput);
  const [replacement, setReplacement] = useState('$<name>[$2]');
  const [result, setResult] = useState<RegexTestResult>(() =>
    testRegex(defaultPattern, 'g', defaultInput),
  );
  const [preview, setPreview] = useState(() =>
    replaceRegex(defaultPattern, 'g', defaultInput, '$<name>[$2]'),
  );
  const [error, setError] = useState('');

  const runTest = async () => {
    try {
      const [nextResult, nextPreview] = await Promise.all([
        testRegexAsync(pattern, flags, input),
        replaceRegexAsync(pattern, flags, input, replacement),
      ]);
      setResult(nextResult);
      setPreview(nextPreview);
      setError('');
      toast.success('正则测试完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  return (
    <ToolWorkbench
      description="检查匹配位置、捕获组与替换预览；单次最多展示 200 条结果。"
      title="正则测试"
    >
      <ToolGrid>
        <ToolPanel
          description="JavaScript RegExp 语法"
          title="表达式与测试文本"
        >
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="regex-pattern">正则表达式</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                id="regex-pattern"
                onChange={(event) => setPattern(event.target.value)}
                placeholder="例如：(?<name>\\w+)-(\\d+)"
                value={pattern}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Flags</FieldLabel>
              <ToggleGroup
                aria-label="正则 flags"
                onValueChange={(values) => {
                  const nextFlags = flagOrder
                    .filter((flag) => values.includes(flag))
                    .join('');
                  setFlags(nextFlags);
                }}
                spacing={0}
                type="multiple"
                value={Array.from(flags)}
                variant="outline"
              >
                {flagOrder.map((flag) => (
                  <ToggleGroupItem key={flag} value={flag}>
                    {flag}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>
                `g` 展示全部匹配；`u` 按 Unicode 代码点处理零宽匹配。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="regex-input">测试文本</FieldLabel>
              <Textarea
                className={s.source}
                id="regex-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="regex-replacement">替换模板</FieldLabel>
              <Input
                id="regex-replacement"
                onChange={(event) => setReplacement(event.target.value)}
                placeholder="支持 $1 与 $<name>"
                value={replacement}
              />
            </Field>
            <Button onClick={runTest} size="lg">
              <PlayIcon data-icon="inline-start" />
              运行测试
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          description={`${result.matches.length} 条匹配${result.truncated ? '，结果已截断' : ''}`}
          title="匹配与替换结果"
        >
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>无法执行表达式</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section aria-label="匹配列表" className={s.resultSection}>
            <h3>匹配列表</h3>
            {result.matches.length > 0 ? (
              <ol className={s.matches}>
                {result.matches.map((match, index) => (
                  <li key={`${match.index}-${index}`}>
                    <div className={s.matchHeading}>
                      <code>#{index + 1}</code>
                      <span>位置 {match.index}</span>
                    </div>
                    <code className={s.matchValue}>{match.value || '∅'}</code>
                    {match.captures.length > 0 ? (
                      <dl className={s.captures}>
                        {match.captures.map((capture, captureIndex) => (
                          <div key={captureIndex}>
                            <dt>${captureIndex + 1}</dt>
                            <dd>{capture ?? '未匹配'}</dd>
                          </div>
                        ))}
                        {Object.entries(match.groups).map(([name, value]) => (
                          <div key={name}>
                            <dt>{name}</dt>
                            <dd>{value ?? '未匹配'}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className={s.empty}>没有匹配结果</p>
            )}
          </section>

          <Field>
            <FieldLabel htmlFor="regex-preview">替换预览</FieldLabel>
            <Textarea
              className={s.preview}
              id="regex-preview"
              readOnly
              value={preview}
            />
          </Field>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
