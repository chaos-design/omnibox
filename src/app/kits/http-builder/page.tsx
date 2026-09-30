'use client';

import { ClipboardIcon, Code2Icon } from 'lucide-react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  generateHttpRequest,
  type HttpRequestArtifacts,
  parseHeadersJson,
} from '../../../utils/tools/http-builder';

import s from './index.module.scss';

type OutputType = keyof HttpRequestArtifacts;

const defaultHeaders = `{
  "Accept": "application/json",
  "Content-Type": "application/json"
}`;
const defaultBody = `{
  "name": "Omnibox",
  "local": true
}`;
const defaultArtifacts = generateHttpRequest({
  body: defaultBody,
  headers: parseHeadersJson(defaultHeaders),
  method: 'POST',
  url: 'https://api.example.com/tools?source=omnibox',
});

export default function HttpBuilderPage() {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState(
    'https://api.example.com/tools?source=omnibox',
  );
  const [headersInput, setHeadersInput] = useState(defaultHeaders);
  const [body, setBody] = useState(defaultBody);
  const [artifacts, setArtifacts] =
    useState<HttpRequestArtifacts>(defaultArtifacts);
  const [outputType, setOutputType] = useState<OutputType>('curl');
  const [error, setError] = useState('');
  const bodyDisabled = method === 'GET' || method === 'HEAD';

  const generate = () => {
    try {
      setArtifacts(
        generateHttpRequest({
          body,
          headers: parseHeadersJson(headersInput),
          method,
          url,
        }),
      );
      setError('');
      toast.success('HTTP 代码已生成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyOutput = async () => {
    try {
      await copyToClipboard(artifacts[outputType]);
      toast.success('代码已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="生成 cURL、Fetch 和原始 HTTP/1.1 请求文本，不实际发送网络请求。"
      title="HTTP 代码生成"
    >
      <ToolGrid>
        <ToolPanel description="Headers 使用 JSON 对象输入" title="请求配置">
          <FieldGroup>
            <div className={s.requestLine}>
              <Field>
                <FieldLabel>方法</FieldLabel>
                <Select onValueChange={setMethod} value={method}>
                  <SelectTrigger className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="http-url">绝对 URL</FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  id="http-url"
                  onChange={(event) => setUrl(event.target.value)}
                  value={url}
                />
              </Field>
            </div>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="http-headers">Headers JSON</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.headers}
                id="http-headers"
                onChange={(event) => setHeadersInput(event.target.value)}
                value={headersInput}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field data-disabled={bodyDisabled}>
              <FieldLabel htmlFor="http-body">Body</FieldLabel>
              <Textarea
                className={s.body}
                disabled={bodyDisabled}
                id="http-body"
                onChange={(event) => setBody(event.target.value)}
                value={body}
              />
              <FieldDescription>
                GET 和 HEAD 请求不会生成 Body 或 Content-Length。
              </FieldDescription>
            </Field>
            <Button onClick={generate} size="lg">
              <Code2Icon data-icon="inline-start" />
              生成请求代码
            </Button>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 HTTP 代码"
              onClick={() => void copyOutput()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="POSIX shell、浏览器 JavaScript 与 HTTP/1.1"
          title="生成结果"
        >
          <Tabs
            className={s.tabs}
            onValueChange={(value) => setOutputType(value as OutputType)}
            value={outputType}
          >
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="fetch">Fetch</TabsTrigger>
              <TabsTrigger value="raw">Raw HTTP</TabsTrigger>
            </TabsList>
            {(['curl', 'fetch', 'raw'] as const).map((type) => (
              <TabsContent key={type} value={type}>
                <Textarea
                  aria-label={`${type} 生成结果`}
                  className={s.output}
                  readOnly
                  value={artifacts[type]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
