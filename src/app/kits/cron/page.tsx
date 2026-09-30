'use client';

import {
  CalendarClockIcon,
  ClipboardIcon,
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
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  buildCron,
  type CronFieldKey,
  type CronResult,
  parseCron,
} from '../../../utils/tools/cron';

import s from './index.module.scss';

const defaultExpression = '0 9 * * 1-5';
const defaultResult = parseCron(defaultExpression);
const fieldMeta: Array<{
  key: CronFieldKey;
  label: string;
  placeholder: string;
  range: string;
}> = [
  { key: 'minute', label: '分钟', placeholder: '0', range: '0-59' },
  { key: 'hour', label: '小时', placeholder: '9', range: '0-23' },
  { key: 'dayOfMonth', label: '日期', placeholder: '*', range: '1-31' },
  { key: 'month', label: '月份', placeholder: '*', range: '1-12' },
  { key: 'dayOfWeek', label: '星期', placeholder: '1-5', range: '0-7' },
];
const presets = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天', value: '0 0 * * *' },
  { label: '每周一', value: '0 0 * * 1' },
  { label: '每月 1 日', value: '0 0 1 * *' },
];

function fieldsFromResult(result: CronResult): Record<CronFieldKey, string> {
  return Object.fromEntries(
    result.fields.map((field) => [field.key, field.value]),
  ) as Record<CronFieldKey, string>;
}

export default function CronPage() {
  const [expression, setExpression] = useState(defaultExpression);
  const [fields, setFields] = useState(() => fieldsFromResult(defaultResult));
  const [result, setResult] = useState(defaultResult);
  const [error, setError] = useState('');

  const applyResult = (nextResult: CronResult) => {
    setExpression(nextResult.expression);
    setFields(fieldsFromResult(nextResult));
    setResult(nextResult);
    setError('');
  };

  const parseExpression = () => {
    try {
      applyResult(parseCron(expression));
      toast.success('Cron 表达式校验通过');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const buildExpression = () => {
    try {
      applyResult(buildCron(fields));
      toast.success('Cron 表达式已生成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const applyPreset = (value: string) => {
    applyResult(parseCron(value));
    toast.success('已应用 Cron 预设');
  };

  const copyExpression = async () => {
    try {
      await copyToClipboard(result.expression);
      toast.success('Cron 表达式已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="校验和生成标准五段 Cron 表达式，支持列表、范围和步长。"
      title="Cron"
    >
      <ToolGrid>
        <ToolPanel
          description="分钟 小时 日期 月份 星期"
          title="表达式与生成器"
        >
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="cron-expression">Cron 表达式</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                className={s.expression}
                id="cron-expression"
                onChange={(event) => setExpression(event.target.value)}
                spellCheck={false}
                value={expression}
              />
              <FieldDescription>
                不支持秒、年份、`?`、`L`、`W` 或 Quartz 扩展。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={parseExpression} size="lg">
                <CalendarClockIcon data-icon="inline-start" />
                校验表达式
              </Button>
              <Field>
                <FieldLabel className={s.visuallyHidden}>常用预设</FieldLabel>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger className={s.select}>
                    <SelectValue placeholder="选择预设" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className={s.fieldGrid}>
              {fieldMeta.map((field) => (
                <Field key={field.key}>
                  <FieldLabel htmlFor={`cron-${field.key}`}>
                    {field.label}
                    <span>{field.range}</span>
                  </FieldLabel>
                  <Input
                    id={`cron-${field.key}`}
                    onChange={(event) =>
                      setFields((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    value={fields[field.key]}
                  />
                </Field>
              ))}
            </div>
            <Button onClick={buildExpression} size="lg" variant="outline">
              <WandSparklesIcon data-icon="inline-start" />
              从字段生成
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 Cron 表达式"
              onClick={() => void copyExpression()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="逐字段解释，不计算未来执行时间"
          title="解析结果"
        >
          <div className={s.summary}>
            <code>{result.expression}</code>
            <strong>{result.summary}</strong>
          </div>
          <dl className={s.fields}>
            {result.fields.map((field) => (
              <div key={field.key}>
                <dt>
                  <span>{field.label}</span>
                  <code>{field.value}</code>
                </dt>
                <dd>{field.description}</dd>
              </div>
            ))}
          </dl>
          <p className={s.note}>
            星期字段中 0 和 7 都表示星期日。日期与星期同时受限时，实际行为可能因
            Cron 实现而异。
          </p>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
