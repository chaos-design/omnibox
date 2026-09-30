'use client';

import { ClipboardIcon, NetworkIcon } from 'lucide-react';
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
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  type CidrResult,
  calculateCidr,
  type IpClassification,
} from '../../../utils/tools/ip-cidr';

import s from './index.module.scss';

const classificationLabels: Record<IpClassification, string> = {
  private: 'RFC 1918 私网',
  loopback: '回环地址',
  'link-local': '链路本地',
  multicast: '组播地址',
  public: '公网地址',
  reserved: '保留或特殊用途地址',
};
const defaultResult = calculateCidr('192.168.1.42/24');

export default function IpCidrPage() {
  const [input, setInput] = useState('192.168.1.42/24');
  const [result, setResult] = useState<CidrResult>(defaultResult);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      setResult(calculateCidr(input));
      setError('');
      toast.success('CIDR 计算完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copySummary = async () => {
    const summary = [
      `Network: ${result.network}/${result.prefix}`,
      `Mask: ${result.subnetMask}`,
      `Broadcast: ${result.broadcast}`,
      `Hosts: ${result.firstHost} - ${result.lastHost}`,
    ].join('\n');

    try {
      await copyToClipboard(summary);
      toast.success('CIDR 结果已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const rows = [
    ['输入地址', result.address],
    ['地址类型', classificationLabels[result.classification]],
    ['网络地址', `${result.network}/${result.prefix}`],
    ['子网掩码', result.subnetMask],
    ['反向掩码', result.wildcardMask],
    ['广播地址', result.broadcast],
    ['首个主机', result.firstHost],
    ['最后主机', result.lastHost],
    ['地址总数', result.totalAddresses.toLocaleString('en-US')],
    ['可用地址', result.usableAddresses.toLocaleString('en-US')],
  ];

  return (
    <ToolWorkbench
      description="计算 IPv4 子网边界、掩码、主机范围和地址分类。"
      title="IPv4 / CIDR"
    >
      <ToolGrid>
        <ToolPanel description="支持 /0 到 /32 前缀" title="IPv4 网络">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="cidr-input">CIDR</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                className={s.input}
                id="cidr-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="192.168.1.42/24"
                value={input}
              />
              <FieldDescription>
                `/31` 按点对点链路保留两个地址，`/32` 表示单一主机。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <Button onClick={calculate} size="lg">
              <NetworkIcon data-icon="inline-start" />
              计算网络
            </Button>
            <div className={s.visual}>
              <span>{classificationLabels[result.classification]}</span>
              <strong>
                {result.network}/{result.prefix}
              </strong>
              <code>{result.subnetMask}</code>
            </div>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              aria-label="复制 CIDR 结果"
              onClick={() => void copySummary()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="按无符号 32 位地址计算"
          title="网络详情"
        >
          <dl className={s.results}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
