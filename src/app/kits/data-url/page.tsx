'use client';

import {
  ClipboardIcon,
  DownloadIcon,
  FileUpIcon,
  LinkIcon,
} from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
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
  dataUrlToBlob,
  decodeDataUrlText,
  encodeBytesDataUrl,
  encodeTextDataUrl,
  type ParsedDataUrl,
  parseDataUrl,
} from '../../../utils/tools/data-url';
import { downloadBlob } from '../../../utils/tools/download';

import s from './index.module.scss';

type Encoding = 'percent' | 'base64';

const defaultText = 'Omnibox 本地工具箱';
const defaultUrl = encodeTextDataUrl(defaultText);

export default function DataUrlPage() {
  const importRequest = useRef(0);
  const [text, setText] = useState(defaultText);
  const [mediaType, setMediaType] = useState('text/plain');
  const [encoding, setEncoding] = useState<Encoding>('percent');
  const [url, setUrl] = useState(defaultUrl);
  const [decodedText, setDecodedText] = useState(defaultText);
  const [metadata, setMetadata] = useState<ParsedDataUrl>(() =>
    parseDataUrl(defaultUrl),
  );
  const [error, setError] = useState('');

  const encodeText = () => {
    importRequest.current += 1;

    try {
      const result = encodeTextDataUrl(text, mediaType, encoding === 'base64');
      setUrl(result);
      setMetadata(parseDataUrl(result));
      setDecodedText(text);
      setError('');
      toast.success('Data URL 已生成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.currentTarget;
    const file = element.files?.[0];
    element.value = '';

    if (!file) {
      return;
    }

    const request = importRequest.current + 1;
    importRequest.current = request;

    try {
      const result = encodeBytesDataUrl(
        new Uint8Array(await file.arrayBuffer()),
        file.type || 'application/octet-stream',
      );

      if (request !== importRequest.current) {
        return;
      }

      setUrl(result);
      setMediaType(file.type || 'application/octet-stream');
      setMetadata(parseDataUrl(result));
      setDecodedText('');
      setError('');
      toast.success(`已编码 ${file.name}`);
    } catch (reason) {
      if (request !== importRequest.current) {
        return;
      }

      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const decode = () => {
    importRequest.current += 1;

    try {
      const result = parseDataUrl(url);
      setMetadata(result);
      setDecodedText(
        result.mediaType.startsWith('text/') ||
          result.mediaType.includes('json') ||
          result.mediaType.includes('xml')
          ? decodeDataUrlText(url)
          : '二进制内容，请使用下载按钮保存。',
      );
      setError('');
      toast.success('Data URL 解析完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyUrl = async () => {
    try {
      await copyToClipboard(url);
      toast.success('Data URL 已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const download = () => {
    try {
      const currentMetadata = parseDataUrl(url);
      const extension =
        currentMetadata.mediaType.split('/')[1]?.split('+')[0] || 'bin';
      downloadBlob(dataUrlToBlob(url), `omnibox-data.${extension}`);
      toast.success('下载已开始');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="将 UTF-8 文本或本地文件编码为 Data URL，并解析、预览和下载。"
      title="Data URL"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <>
              <Input
                aria-label="导入文件生成 Data URL"
                className={s.fileInput}
                id="data-url-file"
                onChange={(event) => void importFile(event)}
                type="file"
              />
              <Button asChild size="icon-sm" variant="ghost">
                <label aria-label="导入文件" htmlFor="data-url-file">
                  <FileUpIcon />
                </label>
              </Button>
            </>
          }
          description="文件始终使用 Base64 编码"
          title="编码"
        >
          <FieldGroup>
            <div className={s.settings}>
              <Field>
                <FieldLabel htmlFor="data-url-mime">MIME type</FieldLabel>
                <Input
                  id="data-url-mime"
                  onChange={(event) => {
                    importRequest.current += 1;
                    setMediaType(event.target.value);
                  }}
                  value={mediaType}
                />
              </Field>
              <Field>
                <FieldLabel>文本编码</FieldLabel>
                <ToggleGroup
                  aria-label="Data URL 文本编码"
                  onValueChange={(value) => {
                    if (value) {
                      importRequest.current += 1;
                      setEncoding(value as Encoding);
                    }
                  }}
                  spacing={0}
                  type="single"
                  value={encoding}
                  variant="outline"
                >
                  <ToggleGroupItem value="percent">Percent</ToggleGroupItem>
                  <ToggleGroupItem value="base64">Base64</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="data-url-text">文本内容</FieldLabel>
              <Textarea
                className={s.text}
                id="data-url-text"
                onChange={(event) => {
                  importRequest.current += 1;
                  setText(event.target.value);
                }}
                value={text}
              />
              <FieldDescription>
                文件内容不会上传，编码在当前浏览器内完成。
              </FieldDescription>
            </Field>
            <Button onClick={encodeText} size="lg">
              <LinkIcon data-icon="inline-start" />
              生成 Data URL
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <>
              <Button
                aria-label="复制 Data URL"
                disabled={!url}
                onClick={() => void copyUrl()}
                size="icon-sm"
                variant="ghost"
              >
                <ClipboardIcon />
              </Button>
              <Button
                aria-label="下载 Data URL 内容"
                disabled={!url}
                onClick={download}
                size="icon-sm"
                variant="ghost"
              >
                <DownloadIcon />
              </Button>
            </>
          }
          description={`${metadata.mediaType} · ${metadata.size} bytes`}
          title="解析与解码"
        >
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="data-url-input">Data URL</FieldLabel>
            <Textarea
              aria-invalid={Boolean(error)}
              className={s.url}
              id="data-url-input"
              onChange={(event) => {
                importRequest.current += 1;
                setUrl(event.target.value);
              }}
              value={url}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <Button onClick={decode} size="lg" variant="outline">
            解析 Data URL
          </Button>
          <dl className={s.metadata}>
            <div>
              <dt>MIME</dt>
              <dd>{metadata.mediaType}</dd>
            </div>
            <div>
              <dt>Charset</dt>
              <dd>{metadata.charset ?? '未指定'}</dd>
            </div>
            <div>
              <dt>编码</dt>
              <dd>{metadata.base64 ? 'Base64' : 'Percent'}</dd>
            </div>
            <div>
              <dt>字节</dt>
              <dd>{metadata.size}</dd>
            </div>
          </dl>
          <Textarea
            aria-label="Data URL 文本预览"
            className={s.preview}
            readOnly
            value={decodedText}
          />
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
