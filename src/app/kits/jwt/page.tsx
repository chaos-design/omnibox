'use client';

import { ClipboardIcon, ScanSearchIcon, ShieldAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ToolGrid,
  ToolPanel,
  ToolWorkbench,
} from '../../../components/tool-workbench';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { encodeBase64Url } from '../../../utils/tools/codec';
import { copyToClipboard } from '../../../utils/tools/copy';
import { type DecodedJwt, decodeJwt } from '../../../utils/tools/jwt';

import s from './index.module.scss';

const defaultToken = [
  encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
  encodeBase64Url(
    JSON.stringify({
      aud: 'developers',
      exp: 2_000_000_000,
      iat: 1_700_000_000,
      iss: 'Omnibox',
      name: '本地工具箱',
      sub: 'demo-user',
    }),
  ),
  'signature-not-verified',
].join('.');

const statusLabels: Record<DecodedJwt['status'], string> = {
  active: '当前有效',
  expired: '已经过期',
  'not-yet-valid': '尚未生效',
  unknown: '未提供有效期',
};

export default function JwtPage() {
  const [token, setToken] = useState(defaultToken);
  const [result, setResult] = useState<DecodedJwt>(() =>
    decodeJwt(defaultToken),
  );
  const [error, setError] = useState('');

  const decodeToken = () => {
    try {
      setResult(decodeJwt(token));
      setError('');
      toast.success('JWT 解码完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyJson = async (value: unknown) => {
    try {
      await copyToClipboard(JSON.stringify(value, null, 2));
      toast.success('JSON 已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <ToolWorkbench
      description="本地解码 JWT Header、Payload 和时间 Claims；不会验证签名或发送令牌。"
      title="JWT 解码"
    >
      <Alert>
        <ShieldAlertIcon />
        <AlertTitle>解码结果不代表令牌可信</AlertTitle>
        <AlertDescription>
          本工具不持有密钥，也不验证签名。授权判断必须由可信服务端完成。
        </AlertDescription>
      </Alert>

      <ToolGrid>
        <ToolPanel description="标准 Header.Payload.Signature 结构" title="JWT">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="jwt-input">令牌内容</FieldLabel>
              <Textarea
                aria-invalid={Boolean(error)}
                className={s.token}
                id="jwt-input"
                onChange={(event) => setToken(event.target.value)}
                spellCheck={false}
                value={token}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Button onClick={decodeToken} size="lg">
              <ScanSearchIcon data-icon="inline-start" />
              解码 JWT
            </Button>
            <div className={s.status} data-status={result.status}>
              <span>Token 状态</span>
              <strong>{statusLabels[result.status]}</strong>
            </div>
            <dl className={s.claims}>
              <div>
                <dt>算法</dt>
                <dd>{String(result.header.alg ?? '未提供')}</dd>
              </div>
              <div>
                <dt>签发者</dt>
                <dd>{String(result.payload.iss ?? '未提供')}</dd>
              </div>
              <div>
                <dt>主题</dt>
                <dd>{String(result.payload.sub ?? '未提供')}</dd>
              </div>
              <div>
                <dt>受众</dt>
                <dd>
                  {Array.isArray(result.payload.aud)
                    ? result.payload.aud.join(', ')
                    : String(result.payload.aud ?? '未提供')}
                </dd>
              </div>
              <div>
                <dt>签发时间</dt>
                <dd>{result.times.iat?.iso ?? '未提供'}</dd>
              </div>
              <div>
                <dt>生效时间</dt>
                <dd>{result.times.nbf?.iso ?? '未提供'}</dd>
              </div>
              <div>
                <dt>过期时间</dt>
                <dd>{result.times.exp?.iso ?? '未提供'}</dd>
              </div>
            </dl>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          description="仅展示解码后的未验证内容"
          title="Header / Payload"
        >
          <section className={s.jsonSection}>
            <div className={s.jsonHeading}>
              <h3>Header</h3>
              <Button
                aria-label="复制 JWT Header"
                onClick={() => void copyJson(result.header)}
                size="icon-sm"
                variant="ghost"
              >
                <ClipboardIcon />
              </Button>
            </div>
            <Textarea
              aria-label="JWT Header JSON"
              className={s.json}
              readOnly
              value={JSON.stringify(result.header, null, 2)}
            />
          </section>
          <section className={s.jsonSection}>
            <div className={s.jsonHeading}>
              <h3>Payload</h3>
              <Button
                aria-label="复制 JWT Payload"
                onClick={() => void copyJson(result.payload)}
                size="icon-sm"
                variant="ghost"
              >
                <ClipboardIcon />
              </Button>
            </div>
            <Textarea
              aria-label="JWT Payload JSON"
              className={s.json}
              readOnly
              value={JSON.stringify(result.payload, null, 2)}
            />
          </section>
          <Field>
            <FieldLabel htmlFor="jwt-signature">原始签名段</FieldLabel>
            <Textarea
              className={s.signature}
              id="jwt-signature"
              readOnly
              value={result.signature}
            />
          </Field>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
