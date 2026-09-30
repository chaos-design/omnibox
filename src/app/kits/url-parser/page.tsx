'use client';

import {
  ClipboardIcon,
  LinkIcon,
  ListTreeIcon,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  objectToQuery,
  parseUrl,
  queryToObject,
} from '../../../utils/tools/url';

import s from './index.module.scss';

type QueryDirection = 'query-to-json' | 'json-to-query';

const defaultUrl =
  'https://user:pass@example.com:8443/tools?q=omnibox&tag=web&tag=local#result';
const defaultQuery = 'page=2&tag=web&tag=local&enabled=true';

export default function UrlParserPage() {
  const [urlInput, setUrlInput] = useState(defaultUrl);
  const [urlOutput, setUrlOutput] = useState(() =>
    JSON.stringify(parseUrl(defaultUrl), null, 2),
  );
  const [urlError, setUrlError] = useState('');
  const [queryDirection, setQueryDirection] =
    useState<QueryDirection>('query-to-json');
  const [queryInput, setQueryInput] = useState(defaultQuery);
  const [queryOutput, setQueryOutput] = useState(() =>
    JSON.stringify(queryToObject(defaultQuery), null, 2),
  );
  const [queryError, setQueryError] = useState('');

  const runUrlParser = () => {
    try {
      setUrlOutput(JSON.stringify(parseUrl(urlInput), null, 2));
      setUrlError('');
      toast.success('URL 解析完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setUrlError(message);
      toast.error(message);
    }
  };

  const runQueryConversion = () => {
    try {
      setQueryOutput(
        queryDirection === 'query-to-json'
          ? JSON.stringify(queryToObject(queryInput), null, 2)
          : objectToQuery(queryInput),
      );
      setQueryError('');
      toast.success('查询参数转换完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setQueryError(message);
      toast.error(message);
    }
  };

  const copyOutput = async (value: string) => {
    try {
      await copyToClipboard(value);
      toast.success('结果已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="拆解完整 URL，并在查询字符串与 JSON 对象之间无损转换重复参数。"
      title="URL 解析"
    >
      <Tabs className={s.tabs} defaultValue="url">
        <TabsList>
          <TabsTrigger value="url">
            <LinkIcon data-icon="inline-start" />
            URL 结构
          </TabsTrigger>
          <TabsTrigger value="query">
            <ListTreeIcon data-icon="inline-start" />
            查询参数
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <ToolGrid>
            <ToolPanel
              description="请输入包含协议与主机名的完整地址"
              title="URL"
            >
              <FieldGroup>
                <Field data-invalid={Boolean(urlError)}>
                  <FieldLabel htmlFor="url-parser-input">完整 URL</FieldLabel>
                  <Textarea
                    aria-invalid={Boolean(urlError)}
                    className={s.textarea}
                    id="url-parser-input"
                    onChange={(event) => setUrlInput(event.target.value)}
                    value={urlInput}
                  />
                  <FieldDescription>
                    用户名和密码仅解析展示，不会发起网络请求。
                  </FieldDescription>
                  <FieldError>{urlError}</FieldError>
                </Field>
                <Button onClick={runUrlParser} size="lg">
                  <WandSparklesIcon data-icon="inline-start" />
                  解析 URL
                </Button>
              </FieldGroup>
            </ToolPanel>

            <ToolPanel
              actions={
                <Button
                  aria-label="复制 URL 解析结果"
                  onClick={() => void copyOutput(urlOutput)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ClipboardIcon />
                </Button>
              }
              description="协议、主机、路径、查询参数与 hash"
              title="结构结果"
            >
              <Textarea
                aria-label="URL 结构结果"
                className={s.output}
                readOnly
                value={urlOutput}
              />
            </ToolPanel>
          </ToolGrid>
        </TabsContent>

        <TabsContent value="query">
          <ToolGrid>
            <ToolPanel description="重复键会保留为数组" title="查询参数输入">
              <FieldGroup>
                <Field>
                  <FieldLabel>转换方向</FieldLabel>
                  <ToggleGroup
                    aria-label="查询参数转换方向"
                    onValueChange={(value) => {
                      if (value) {
                        setQueryDirection(value as QueryDirection);
                        setQueryError('');
                      }
                    }}
                    spacing={0}
                    type="single"
                    value={queryDirection}
                    variant="outline"
                  >
                    <ToggleGroupItem value="query-to-json">
                      Query → JSON
                    </ToggleGroupItem>
                    <ToggleGroupItem value="json-to-query">
                      JSON → Query
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
                <Field data-invalid={Boolean(queryError)}>
                  <FieldLabel htmlFor="query-input">
                    {queryDirection === 'query-to-json'
                      ? '查询字符串'
                      : 'JSON 对象'}
                  </FieldLabel>
                  <Textarea
                    aria-invalid={Boolean(queryError)}
                    className={s.textarea}
                    id="query-input"
                    onChange={(event) => setQueryInput(event.target.value)}
                    value={queryInput}
                  />
                  <FieldError>{queryError}</FieldError>
                </Field>
                <Button onClick={runQueryConversion} size="lg">
                  <WandSparklesIcon data-icon="inline-start" />
                  转换查询参数
                </Button>
              </FieldGroup>
            </ToolPanel>

            <ToolPanel
              actions={
                <Button
                  aria-label="复制查询参数结果"
                  onClick={() => void copyOutput(queryOutput)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ClipboardIcon />
                </Button>
              }
              description="数组会展开为同名重复参数"
              title="转换结果"
            >
              <Textarea
                aria-label="查询参数转换结果"
                className={s.output}
                readOnly
                value={queryOutput}
              />
            </ToolPanel>
          </ToolGrid>
        </TabsContent>
      </Tabs>
    </ToolWorkbench>
  );
}
