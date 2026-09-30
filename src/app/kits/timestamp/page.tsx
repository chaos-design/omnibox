'use client';

import { ClipboardIcon, Clock3Icon, RefreshCwIcon } from 'lucide-react';
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
  dateToTimestamp,
  formatDateTimeLocalInput,
  type TimestampResult,
  type TimestampUnit,
  timestampToDate,
} from '../../../utils/tools/timestamp';

import s from './index.module.scss';

interface TimeResultProps {
  result: TimestampResult | null;
}

function TimeResult({ result }: TimeResultProps) {
  if (!result) {
    return <p className={s.empty}>转换结果将在这里显示</p>;
  }

  return (
    <dl className={s.result}>
      <div>
        <dt>本地时间</dt>
        <dd>{result.local}</dd>
      </div>
      <div>
        <dt>UTC / ISO</dt>
        <dd>{result.iso}</dd>
      </div>
      <div>
        <dt>秒</dt>
        <dd>{result.seconds}</dd>
      </div>
      <div>
        <dt>毫秒</dt>
        <dd>{result.milliseconds}</dd>
      </div>
    </dl>
  );
}

export default function TimestampPage() {
  const [timestamp, setTimestamp] = useState('1722470400');
  const [unit, setUnit] = useState<TimestampUnit>('seconds');
  const [timestampResult, setTimestampResult] =
    useState<TimestampResult | null>(null);
  const [timestampError, setTimestampError] = useState('');
  const [dateInput, setDateInput] = useState('2026-08-01T12:00:00');
  const [dateResult, setDateResult] = useState<TimestampResult | null>(null);
  const [dateError, setDateError] = useState('');

  const convertTimestamp = () => {
    try {
      setTimestampResult(timestampToDate(timestamp, unit));
      setTimestampError('');
      toast.success('时间戳转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setTimestampError(message);
      toast.error(message);
    }
  };

  const convertDate = () => {
    try {
      setDateResult(dateToTimestamp(dateInput));
      setDateError('');
      toast.success('日期转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setDateError(message);
      toast.error(message);
    }
  };

  const fillCurrentTimestamp = () => {
    const milliseconds = Date.now();
    setTimestamp(
      unit === 'seconds'
        ? Math.floor(milliseconds / 1000).toString()
        : milliseconds.toString(),
    );
    setTimestampError('');
  };

  const fillCurrentDate = () => {
    setDateInput(formatDateTimeLocalInput(new Date()));
    setDateError('');
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
      description="在秒、毫秒时间戳与本地、UTC 日期之间双向转换。"
      title="时间戳"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <Button
              aria-label="复制 ISO 时间"
              disabled={!timestampResult}
              onClick={() => void copyValue(timestampResult?.iso ?? '')}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="时间戳转日期时间"
          title="Timestamp → Date"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>时间戳单位</FieldLabel>
              <ToggleGroup
                aria-label="时间戳单位"
                onValueChange={(value) => {
                  if (value) {
                    setUnit(value as TimestampUnit);
                  }
                }}
                spacing={0}
                type="single"
                value={unit}
                variant="outline"
              >
                <ToggleGroupItem value="seconds">秒</ToggleGroupItem>
                <ToggleGroupItem value="milliseconds">毫秒</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(timestampError)}>
              <FieldLabel htmlFor="timestamp-input">时间戳</FieldLabel>
              <Input
                aria-invalid={Boolean(timestampError)}
                id="timestamp-input"
                inputMode="decimal"
                onChange={(event) => setTimestamp(event.target.value)}
                value={timestamp}
              />
              <FieldError>{timestampError}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={convertTimestamp} size="lg">
                <Clock3Icon data-icon="inline-start" />
                转换时间戳
              </Button>
              <Button
                onClick={fillCurrentTimestamp}
                size="lg"
                variant="outline"
              >
                <RefreshCwIcon data-icon="inline-start" />
                当前时间
              </Button>
            </div>
            <TimeResult result={timestampResult} />
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制毫秒时间戳"
              disabled={!dateResult}
              onClick={() => void copyValue(dateResult?.milliseconds ?? '')}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="本地日期时间转时间戳"
          title="Date → Timestamp"
        >
          <FieldGroup>
            <Field data-invalid={Boolean(dateError)}>
              <FieldLabel htmlFor="date-input">本地日期时间</FieldLabel>
              <Input
                aria-invalid={Boolean(dateError)}
                id="date-input"
                onChange={(event) => setDateInput(event.target.value)}
                step="1"
                type="datetime-local"
                value={dateInput}
              />
              <FieldError>{dateError}</FieldError>
            </Field>
            <div className={s.actions}>
              <Button onClick={convertDate} size="lg">
                <Clock3Icon data-icon="inline-start" />
                转换日期
              </Button>
              <Button onClick={fillCurrentDate} size="lg" variant="outline">
                <RefreshCwIcon data-icon="inline-start" />
                当前时间
              </Button>
            </div>
            <TimeResult result={dateResult} />
          </FieldGroup>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
