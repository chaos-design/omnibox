'use client';

import { DownloadIcon, QrCodeIcon } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';

import chaosLogo from '../../../../public/chaos.png';
import { Button } from '../../../components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import {
  downloadCanvasQRCode,
  downloadSvgQRCode,
} from '../../../utils/tools/download';

import s from './index.module.scss';

const qrCodeId = 'omnibox-qr-code';
const defaultValue = 'https://chaos-design.github.io/omnibox/';
type RenderType = 'canvas' | 'svg';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

export default function QrCodePage() {
  const [input, setInput] = useState(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [renderType, setRenderType] = useState<RenderType>('canvas');
  const [level, setLevel] = useState<ErrorLevel>('M');

  const generateQrCode = () => {
    const nextValue = input.trim();

    if (!nextValue) {
      toast.error('请输入需要生成二维码的内容。');
      return;
    }

    setValue(nextValue);
    toast.success('二维码已更新');
  };

  const downloadQrCode = async () => {
    try {
      if (renderType === 'canvas') {
        downloadCanvasQRCode(qrCodeId, 'omnibox-qr-code.png');
      } else {
        await downloadSvgQRCode(qrCodeId, 'omnibox-qr-code.svg');
      }

      toast.success('下载已开始');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const QrCode = renderType === 'canvas' ? QRCodeCanvas : QRCodeSVG;

  return (
    <main aria-label="二维码生成器" className={s.page}>
      <section aria-label="二维码预览和参数" className={s.workspace}>
        <div className={s.previewPanel}>
          <span className={s.panelLabel}>PREVIEW</span>
          <div className={s.qrFrame} id={qrCodeId}>
            <QrCode
              bgColor="#ffffff"
              imageSettings={{
                excavate: true,
                height: 28,
                src: chaosLogo.src,
                width: 28,
              }}
              level={level}
              size={240}
              title="生成的二维码"
              value={value}
            />
          </div>
          <Button
            className={s.fullWidth}
            onClick={() => void downloadQrCode()}
            size="lg"
            variant="outline"
          >
            <DownloadIcon data-icon="inline-start" />
            下载 {renderType.toUpperCase()}
          </Button>
        </div>

        <div className={s.controls}>
          <span className={s.panelLabel}>CONTENT</span>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="qr-code-content">二维码内容</FieldLabel>
              <Textarea
                id="qr-code-content"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    generateQrCode();
                  }
                }}
                placeholder="输入 URL 或文本"
                rows={6}
                value={input}
              />
            </Field>
            <Field className={s.option} orientation="horizontal">
              <FieldContent>
                <FieldTitle>渲染格式</FieldTitle>
                <FieldDescription>
                  SVG 适合继续编辑，Canvas 适合直接使用。
                </FieldDescription>
              </FieldContent>
              <ToggleGroup
                aria-label="渲染格式"
                onValueChange={(nextType) => {
                  if (nextType) {
                    setRenderType(nextType as RenderType);
                  }
                }}
                spacing={0}
                type="single"
                value={renderType}
                variant="outline"
              >
                <ToggleGroupItem value="canvas">Canvas</ToggleGroupItem>
                <ToggleGroupItem value="svg">SVG</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field className={s.option} orientation="horizontal">
              <FieldContent>
                <FieldTitle>纠错级别</FieldTitle>
                <FieldDescription>
                  级别越高，二维码图形越密集。
                </FieldDescription>
              </FieldContent>
              <ToggleGroup
                aria-label="纠错级别"
                onValueChange={(nextLevel) => {
                  if (nextLevel) {
                    setLevel(nextLevel as ErrorLevel);
                  }
                }}
                spacing={0}
                type="single"
                value={level}
                variant="outline"
              >
                {(['L', 'M', 'Q', 'H'] as const).map((item) => (
                  <ToggleGroupItem key={item} value={item}>
                    {item}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Button className={s.fullWidth} onClick={generateQrCode} size="lg">
              <QrCodeIcon data-icon="inline-start" />
              生成二维码
            </Button>
            <span className={s.hint}>Cmd/Ctrl + Enter 快速生成</span>
          </FieldGroup>
        </div>
      </section>
    </main>
  );
}
