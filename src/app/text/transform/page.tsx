'use client';

import { ClipboardIcon, EraserIcon, WandSparklesIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  collapseWhitespace,
  convertTextCase,
  getTextStatistics,
  type LineMode,
  type TextCaseMode,
  transformLines,
  trimLines,
  trimText,
} from '../../../utils/tools/text';

import s from './index.module.scss';

type TextOperation =
  | TextCaseMode
  | 'trim'
  | 'collapse-whitespace'
  | 'trim-lines'
  | LineMode;

const defaultInput = `helloWorld HTTP server
item10
item2
item2`;

function runOperation(input: string, operation: TextOperation): string {
  if (
    [
      'upper',
      'lower',
      'title',
      'camel',
      'pascal',
      'snake',
      'kebab',
      'constant',
    ].includes(operation)
  ) {
    return convertTextCase(input, operation as TextCaseMode);
  }

  if (['sort-asc', 'sort-desc', 'deduplicate', 'reverse'].includes(operation)) {
    return transformLines(input, operation as LineMode);
  }

  switch (operation) {
    case 'trim':
      return trimText(input);
    case 'collapse-whitespace':
      return collapseWhitespace(input);
    case 'trim-lines':
      return trimLines(input);
    default:
      return input;
  }
}

export default function TextTransformPage() {
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState(defaultInput);
  const [operation, setOperation] = useState<TextOperation>('camel');
  const statistics = useMemo(() => getTextStatistics(output), [output]);

  const applyOperation = () => {
    setOutput(runOperation(input, operation));
    toast.success('文本处理完成');
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
      description="命名格式、空白和行级处理集中在一个工作台，并实时统计处理结果。"
      title="文本处理"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <Button
              aria-label="清空输入"
              onClick={() => setInput('')}
              size="icon-sm"
              variant="ghost"
            >
              <EraserIcon />
            </Button>
          }
          description="选择操作后处理当前文本"
          title="原始文本"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>处理方式</FieldLabel>
              <Select
                onValueChange={(value) => setOperation(value as TextOperation)}
                value={operation}
              >
                <SelectTrigger className={s.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>命名与大小写</SelectLabel>
                    <SelectItem value="upper">全部大写</SelectItem>
                    <SelectItem value="lower">全部小写</SelectItem>
                    <SelectItem value="title">Title Case</SelectItem>
                    <SelectItem value="camel">camelCase</SelectItem>
                    <SelectItem value="pascal">PascalCase</SelectItem>
                    <SelectItem value="snake">snake_case</SelectItem>
                    <SelectItem value="kebab">kebab-case</SelectItem>
                    <SelectItem value="constant">CONSTANT_CASE</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>空白处理</SelectLabel>
                    <SelectItem value="trim">清理首尾空白</SelectItem>
                    <SelectItem value="collapse-whitespace">
                      合并连续空白
                    </SelectItem>
                    <SelectItem value="trim-lines">清理每行首尾空白</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>行处理</SelectLabel>
                    <SelectItem value="sort-asc">行升序</SelectItem>
                    <SelectItem value="sort-desc">行降序</SelectItem>
                    <SelectItem value="deduplicate">行去重</SelectItem>
                    <SelectItem value="reverse">反转行序</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="text-transform-input">输入内容</FieldLabel>
              <Textarea
                className={s.textarea}
                id="text-transform-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <FieldDescription>
                行去重保留首次出现位置，排序支持数字自然顺序。
              </FieldDescription>
            </Field>
            <Button onClick={applyOperation} size="lg">
              <WandSparklesIcon data-icon="inline-start" />
              应用处理
            </Button>
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
          description="统计基于 Unicode 字符与 UTF-8 字节"
          title="处理结果"
        >
          <Field>
            <FieldLabel htmlFor="text-transform-output">输出内容</FieldLabel>
            <Textarea
              className={s.textarea}
              id="text-transform-output"
              readOnly
              value={output}
            />
          </Field>
          <dl className={s.statistics}>
            <div>
              <dt>字符</dt>
              <dd>{statistics.characters}</dd>
            </div>
            <div>
              <dt>非空白</dt>
              <dd>{statistics.charactersWithoutWhitespace}</dd>
            </div>
            <div>
              <dt>单词</dt>
              <dd>{statistics.words}</dd>
            </div>
            <div>
              <dt>行</dt>
              <dd>{statistics.lines}</dd>
            </div>
            <div>
              <dt>字节</dt>
              <dd>{statistics.bytes}</dd>
            </div>
          </dl>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
