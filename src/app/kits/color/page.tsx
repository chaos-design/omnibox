'use client';

import { ClipboardIcon, ContrastIcon, PaletteIcon } from 'lucide-react';
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
  type ContrastResult,
  getColorContrast,
  type ParsedColor,
  parseColor,
} from '../../../utils/tools/color';
import { copyToClipboard } from '../../../utils/tools/copy';

import s from './index.module.scss';

const defaultColor = '#2563EB';

function formatRgb(color: ParsedColor): string {
  return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
}

function formatHsl(color: ParsedColor): string {
  return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
}

export default function ColorPage() {
  const [input, setInput] = useState(defaultColor);
  const [color, setColor] = useState<ParsedColor>(() =>
    parseColor(defaultColor),
  );
  const [error, setError] = useState('');
  const [foreground, setForeground] = useState('#172033');
  const [background, setBackground] = useState('#FFFFFF');
  const [contrast, setContrast] = useState<ContrastResult>(() =>
    getColorContrast('#172033', '#FFFFFF'),
  );
  const [contrastError, setContrastError] = useState('');

  const convertColor = (source = input) => {
    try {
      const result = parseColor(source);
      setColor(result);
      setInput(source);
      setError('');
      toast.success('颜色转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const calculateContrast = () => {
    try {
      setContrast(getColorContrast(foreground, background));
      setContrastError('');
      toast.success('对比度计算完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setContrastError(message);
      toast.error(message);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await copyToClipboard(value);
      toast.success('颜色值已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const colorValues = [
    { label: 'HEX', value: color.hex },
    { label: 'RGB', value: formatRgb(color) },
    { label: 'HSL', value: formatHsl(color) },
  ];

  return (
    <ToolWorkbench
      description="转换 HEX、RGB、HSL，并按 WCAG 2.x 判断文本与背景的对比度。"
      title="颜色与对比度"
    >
      <ToolGrid>
        <ToolPanel
          description="支持 #RGB、#RRGGBB、rgb() 与 hsl()"
          title="颜色转换"
        >
          <FieldGroup>
            <div className={s.colorInput}>
              <Input
                aria-label="选择颜色"
                onChange={(event) => convertColor(event.target.value)}
                type="color"
                value={color.hex}
              />
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="color-input">颜色值</FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  id="color-input"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      convertColor();
                    }
                  }}
                  value={input}
                />
                <FieldError>{error}</FieldError>
              </Field>
            </div>
            <Button onClick={() => convertColor()} size="lg">
              <PaletteIcon data-icon="inline-start" />
              转换颜色
            </Button>
            <div
              aria-label={`颜色预览 ${color.hex}`}
              className={s.preview}
              style={{ backgroundColor: color.hex }}
            />
            <dl className={s.values}>
              {colorValues.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>
                    <code>{item.value}</code>
                    <Button
                      aria-label={`复制 ${item.label}`}
                      onClick={() => void copyValue(item.value)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ClipboardIcon />
                    </Button>
                  </dd>
                </div>
              ))}
            </dl>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel description="仅计算不透明颜色" title="WCAG 对比度">
          <FieldGroup>
            <div className={s.contrastInputs}>
              <Field data-invalid={Boolean(contrastError)}>
                <FieldLabel htmlFor="foreground-color">前景色</FieldLabel>
                <Input
                  aria-invalid={Boolean(contrastError)}
                  id="foreground-color"
                  onChange={(event) => setForeground(event.target.value)}
                  value={foreground}
                />
              </Field>
              <Field data-invalid={Boolean(contrastError)}>
                <FieldLabel htmlFor="background-color">背景色</FieldLabel>
                <Input
                  aria-invalid={Boolean(contrastError)}
                  id="background-color"
                  onChange={(event) => setBackground(event.target.value)}
                  value={background}
                />
              </Field>
            </div>
            <FieldError>{contrastError}</FieldError>
            <Button onClick={calculateContrast} size="lg">
              <ContrastIcon data-icon="inline-start" />
              计算对比度
            </Button>
            <div
              className={s.contrastPreview}
              style={{ backgroundColor: background, color: foreground }}
            >
              <strong>Omnibox</strong>
              <span>开发工具应该清晰、准确、可访问。</span>
            </div>
            <div className={s.ratio}>
              <span>对比度</span>
              <strong>{contrast.ratio}:1</strong>
            </div>
            <dl className={s.levels}>
              <div>
                <dt>普通文本 AA</dt>
                <dd>{contrast.normalAA ? '通过' : '未通过'}</dd>
              </div>
              <div>
                <dt>普通文本 AAA</dt>
                <dd>{contrast.normalAAA ? '通过' : '未通过'}</dd>
              </div>
              <div>
                <dt>大文本 AA</dt>
                <dd>{contrast.largeAA ? '通过' : '未通过'}</dd>
              </div>
              <div>
                <dt>大文本 AAA</dt>
                <dd>{contrast.largeAAA ? '通过' : '未通过'}</dd>
              </div>
            </dl>
            <FieldDescription>
              AA 普通文本要求 4.5:1，大文本要求 3:1。
            </FieldDescription>
          </FieldGroup>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
