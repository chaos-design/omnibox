'use client';

import { ClipboardIcon, DatabaseIcon } from 'lucide-react';
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  convertAllDataSizes,
  type DataSizeSystem,
  type DataSizeUnit,
  dataSizeUnits,
  type FormattedDataSize,
  formatDataSize,
} from '../../../utils/tools/data-size';

import s from './index.module.scss';

const defaultValues = convertAllDataSizes(1_536, 'B');
const defaultFormatted = formatDataSize(1_536, 'B', 'iec', 2);

export default function DataSizePage() {
  const [input, setInput] = useState('1536');
  const [unit, setUnit] = useState<DataSizeUnit>('B');
  const [system, setSystem] = useState<DataSizeSystem>('iec');
  const [decimals, setDecimals] = useState('2');
  const [values, setValues] = useState(defaultValues);
  const [formatted, setFormatted] =
    useState<FormattedDataSize>(defaultFormatted);
  const [error, setError] = useState('');

  const convert = () => {
    try {
      if (!input.trim()) {
        throw new Error('请输入数据大小。');
      }

      if (!decimals.trim()) {
        throw new Error('请输入小数位。');
      }

      const numericValue = Number(input);
      const precision = Number(decimals);
      const nextValues = convertAllDataSizes(numericValue, unit);
      const nextFormatted = formatDataSize(
        numericValue,
        unit,
        system,
        precision,
      );

      setValues(nextValues);
      setFormatted(nextFormatted);
      setError('');
      toast.success('数据大小换算完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await copyToClipboard(value);
      toast.success('换算结果已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="在十进制 SI 与二进制 IEC 数据单位之间换算，并自动选择易读单位。"
      title="数据大小"
    >
      <ToolGrid>
        <ToolPanel
          description="安全范围内保留 JavaScript 数值精度"
          title="输入"
        >
          <FieldGroup>
            <div className={s.inputRow}>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="data-size-input">数值</FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  id="data-size-input"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setInput(event.target.value)}
                  type="number"
                  value={input}
                />
                <FieldError>{error}</FieldError>
              </Field>
              <Field>
                <FieldLabel>输入单位</FieldLabel>
                <Select
                  onValueChange={(value) => setUnit(value as DataSizeUnit)}
                  value={unit}
                >
                  <SelectTrigger className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {dataSizeUnits.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className={s.inputRow}>
              <Field>
                <FieldLabel>自动格式体系</FieldLabel>
                <ToggleGroup
                  aria-label="数据大小单位体系"
                  onValueChange={(value) => {
                    if (value) {
                      setSystem(value as DataSizeSystem);
                    }
                  }}
                  spacing={0}
                  type="single"
                  value={system}
                  variant="outline"
                >
                  <ToggleGroupItem value="si">SI 1000</ToggleGroupItem>
                  <ToggleGroupItem value="iec">IEC 1024</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="data-size-decimals">小数位</FieldLabel>
                <Input
                  id="data-size-decimals"
                  max="8"
                  min="0"
                  onChange={(event) => setDecimals(event.target.value)}
                  type="number"
                  value={decimals}
                />
              </Field>
            </div>
            <FieldDescription>
              KB、MB 使用 1000 进制；KiB、MiB 使用 1024 进制。
            </FieldDescription>
            <Button onClick={convert} size="lg">
              <DatabaseIcon data-icon="inline-start" />
              换算数据大小
            </Button>
            <div className={s.formatted}>
              <span>自动格式化</span>
              <strong>{formatted.text}</strong>
            </div>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel description="同时展示全部 SI 与 IEC 单位" title="换算结果">
          <dl className={s.results}>
            {dataSizeUnits.map((item) => {
              const value = values[item];
              const displayValue = Number.isInteger(value)
                ? value.toString()
                : Number(value.toPrecision(12)).toString();
              const copyText = `${displayValue} ${item}`;

              return (
                <div key={item}>
                  <dt>{item}</dt>
                  <dd>
                    <code>{displayValue}</code>
                    <Button
                      aria-label={`复制 ${item} 结果`}
                      onClick={() => void copyValue(copyText)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ClipboardIcon />
                    </Button>
                  </dd>
                </div>
              );
            })}
          </dl>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
