'use client';

import {
  ArrowRightLeftIcon,
  ClipboardIcon,
  DownloadIcon,
  UploadIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
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
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  type CsvDelimiter,
  csvToJson,
  jsonToCsv,
} from '../../../utils/tools/csv';
import { downloadText } from '../../../utils/tools/download';

import s from './index.module.scss';

type Direction = 'csv-to-json' | 'json-to-csv';

const defaultInput = `name,category,note
Omnibox,toolbox,"local, fast"
JSON,format,"supports ""quotes"""`;

export default function CsvJsonPage() {
  const [direction, setDirection] = useState<Direction>('csv-to-json');
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(',');
  const [header, setHeader] = useState(true);
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState(() => csvToJson(defaultInput));
  const [error, setError] = useState('');

  const runConversion = () => {
    try {
      const result =
        direction === 'csv-to-json'
          ? csvToJson(input, { delimiter, header })
          : jsonToCsv(input, { delimiter });

      setOutput(result);
      setError('');
      toast.success('数据转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const swapContent = () => {
    setInput(output);
    setOutput('');
    setDirection((value) =>
      value === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json',
    );
    setError('');
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.currentTarget;
    const file = element.files?.[0];
    element.value = '';

    if (!file) {
      return;
    }

    try {
      setInput(await file.text());
      setError('');
      toast.success(`已导入 ${file.name}`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
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

  const downloadOutput = () => {
    if (!output) {
      toast.error('没有可下载的内容。');
      return;
    }

    const extension = direction === 'csv-to-json' ? 'json' : 'csv';
    downloadText(output, `omnibox-data.${extension}`);
    toast.success('下载已开始');
  };

  return (
    <ToolWorkbench
      description="在 CSV 与扁平 JSON 数组之间转换，支持引号、字段换行和多种分隔符。"
      title="CSV / JSON"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <>
              <Input
                accept=".csv,.json,text/csv,application/json"
                aria-label="导入 CSV 或 JSON 文件"
                className={s.fileInput}
                id="csv-json-file"
                onChange={(event) => void importFile(event)}
                type="file"
              />
              <Button asChild size="icon-sm" variant="ghost">
                <label aria-label="导入文件" htmlFor="csv-json-file">
                  <UploadIcon />
                </label>
              </Button>
            </>
          }
          description="对象数组使用首行表头"
          title="输入数据"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>转换方向</FieldLabel>
              <ToggleGroup
                aria-label="CSV JSON 转换方向"
                onValueChange={(value) => {
                  if (value) {
                    setDirection(value as Direction);
                    setError('');
                  }
                }}
                spacing={0}
                type="single"
                value={direction}
                variant="outline"
              >
                <ToggleGroupItem value="csv-to-json">
                  CSV → JSON
                </ToggleGroupItem>
                <ToggleGroupItem value="json-to-csv">
                  JSON → CSV
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <div className={s.settings}>
              <Field>
                <FieldLabel>分隔符</FieldLabel>
                <Select
                  onValueChange={(value) => setDelimiter(value as CsvDelimiter)}
                  value={delimiter}
                >
                  <SelectTrigger className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value=",">逗号</SelectItem>
                      <SelectItem value=";">分号</SelectItem>
                      <SelectItem value={'\t'}>Tab</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {direction === 'csv-to-json' ? (
                <Field>
                  <FieldLabel>CSV 首行</FieldLabel>
                  <ToggleGroup
                    aria-label="CSV 首行用途"
                    onValueChange={(value) => {
                      if (value) {
                        setHeader(value === 'header');
                      }
                    }}
                    spacing={0}
                    type="single"
                    value={header ? 'header' : 'data'}
                    variant="outline"
                  >
                    <ToggleGroupItem value="header">表头</ToggleGroupItem>
                    <ToggleGroupItem value="data">数据</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              ) : null}
            </div>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="csv-json-input">
                {direction === 'csv-to-json' ? 'CSV 内容' : 'JSON 数组'}
              </FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.textarea}
                id="csv-json-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <FieldDescription>
                JSON 仅接受对象数组或二维标量数组，不会隐式展开嵌套值。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={runConversion} size="lg">
                <WandSparklesIcon data-icon="inline-start" />
                执行转换
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
            <>
              <Button
                aria-label="复制结果"
                disabled={!output}
                onClick={() => void copyOutput()}
                size="icon-sm"
                variant="ghost"
              >
                <ClipboardIcon />
              </Button>
              <Button
                aria-label="下载结果"
                disabled={!output}
                onClick={downloadOutput}
                size="icon-sm"
                variant="ghost"
              >
                <DownloadIcon />
              </Button>
            </>
          }
          description="成功后才会替换当前结果"
          title="转换结果"
        >
          <Textarea
            aria-label="CSV JSON 转换结果"
            className={s.output}
            readOnly
            value={output}
          />
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
