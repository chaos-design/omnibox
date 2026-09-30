'use client';

import { ClipboardIcon, SearchIcon, WandSparklesIcon } from 'lucide-react';
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
  formatXml,
  minifyXml,
  queryXml,
  type XPathQueryResult,
} from '../../../utils/tools/xml';

import s from './index.module.scss';

type XmlMode = 'format' | 'minify';

const defaultXml =
  '<catalog><book id="1"><title>Omnibox</title></book><book id="2"><title>Local Tools</title></book></catalog>';

export default function XmlPage() {
  const [input, setInput] = useState(defaultXml);
  const [mode, setMode] = useState<XmlMode>('format');
  const [output, setOutput] = useState(defaultXml);
  const [xpath, setXpath] = useState('//book/@id');
  const [queryResult, setQueryResult] = useState<XPathQueryResult | null>(null);
  const [error, setError] = useState('');

  const transform = () => {
    try {
      setOutput(mode === 'format' ? formatXml(input) : minifyXml(input));
      setError('');
      toast.success(mode === 'format' ? 'XML 格式化完成' : 'XML 压缩完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const runQuery = () => {
    try {
      setQueryResult(queryXml(input, xpath));
      setError('');
      toast.success('XPath 查询完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyOutput = async () => {
    try {
      await copyToClipboard(output);
      toast.success('XML 已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="安全校验、格式化、压缩 XML，并使用浏览器原生 XPath 查询。"
      title="XML"
    >
      <ToolGrid>
        <ToolPanel description="DOCTYPE 与实体声明会被拒绝" title="XML 输入">
          <FieldGroup>
            <Field>
              <FieldLabel>转换模式</FieldLabel>
              <ToggleGroup
                aria-label="XML 转换模式"
                onValueChange={(value) => {
                  if (value) {
                    setMode(value as XmlMode);
                  }
                }}
                spacing={0}
                type="single"
                value={mode}
                variant="outline"
              >
                <ToggleGroupItem value="format">格式化</ToggleGroupItem>
                <ToggleGroupItem value="minify">压缩</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="xml-input">XML 内容</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.xml}
                id="xml-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Button onClick={transform} size="lg">
              <WandSparklesIcon data-icon="inline-start" />
              {mode === 'format' ? '格式化 XML' : '压缩 XML'}
            </Button>
            <Field>
              <FieldLabel htmlFor="xpath-input">XPath</FieldLabel>
              <Input
                id="xpath-input"
                onChange={(event) => setXpath(event.target.value)}
                value={xpath}
              />
              <FieldDescription>
                节点结果最多展示 200 项，支持 string()、count() 等标量查询。
              </FieldDescription>
            </Field>
            <Button onClick={runQuery} size="lg" variant="outline">
              <SearchIcon data-icon="inline-start" />
              执行 XPath
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 XML 结果"
              disabled={!output}
              onClick={() => void copyOutput()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="转换结果与 XPath 查询"
          title="输出"
        >
          <Textarea
            aria-label="XML 转换结果"
            className={s.output}
            readOnly
            value={output}
          />
          <section aria-label="XPath 查询结果" className={s.query}>
            <div className={s.queryHeading}>
              <h3>XPath 结果</h3>
              <span>
                {queryResult
                  ? `${queryResult.type} · ${queryResult.values.length}`
                  : '尚未查询'}
              </span>
            </div>
            {queryResult?.values.length ? (
              <ol>
                {queryResult.values.map((value, index) => (
                  <li key={`${index}-${value}`}>
                    <code>{value}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p>没有查询结果</p>
            )}
          </section>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
