'use client';

import { ClipboardIcon, ShieldCheckIcon } from 'lucide-react';
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
  FieldLegend,
  FieldSet,
} from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import {
  type ChmodResult,
  chmodFromOctal,
  chmodFromSymbolic,
  type PermissionBits,
  permissionsToChmod,
  type UnixPermissions,
} from '../../../utils/tools/chmod';
import { copyToClipboard } from '../../../utils/tools/copy';

import s from './index.module.scss';

type InputMode = 'octal' | 'symbolic';

interface PermissionToggleProps {
  label: string;
  onChange: (value: PermissionBits) => void;
  value: PermissionBits;
}

function PermissionToggle({ label, onChange, value }: PermissionToggleProps) {
  const selected = [
    value.read ? 'read' : null,
    value.write ? 'write' : null,
    value.execute ? 'execute' : null,
  ].filter((item): item is string => item !== null);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        aria-label={`${label}权限`}
        onValueChange={(values) =>
          onChange({
            read: values.includes('read'),
            write: values.includes('write'),
            execute: values.includes('execute'),
          })
        }
        spacing={0}
        type="multiple"
        value={selected}
        variant="outline"
      >
        <ToggleGroupItem value="read">读 r</ToggleGroupItem>
        <ToggleGroupItem value="write">写 w</ToggleGroupItem>
        <ToggleGroupItem value="execute">执行 x</ToggleGroupItem>
      </ToggleGroup>
    </Field>
  );
}

const defaultResult = chmodFromOctal('0755');

export default function ChmodPage() {
  const [mode, setMode] = useState<InputMode>('octal');
  const [input, setInput] = useState('0755');
  const [result, setResult] = useState<ChmodResult>(defaultResult);
  const [error, setError] = useState('');

  const parseInput = () => {
    try {
      const nextResult =
        mode === 'octal' ? chmodFromOctal(input) : chmodFromSymbolic(input);
      setResult(nextResult);
      setError('');
      toast.success('Unix 权限解析完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const updatePermissions = (permissions: UnixPermissions) => {
    const nextResult = permissionsToChmod(permissions);
    setResult(nextResult);
    setInput(mode === 'octal' ? nextResult.octal : nextResult.symbolic);
    setError('');
  };

  const copyValue = async (value: string) => {
    try {
      await copyToClipboard(value);
      toast.success('权限值已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const selectedSpecial = [
    result.permissions.special.setuid ? 'setuid' : null,
    result.permissions.special.setgid ? 'setgid' : null,
    result.permissions.special.sticky ? 'sticky' : null,
  ].filter((item): item is string => item !== null);

  return (
    <ToolWorkbench
      description="在四位八进制、符号权限和读写执行位之间双向转换。"
      title="Unix 权限"
    >
      <ToolGrid>
        <ToolPanel
          description="支持 setuid、setgid 与 sticky 位"
          title="权限输入"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>输入格式</FieldLabel>
              <ToggleGroup
                aria-label="Unix 权限输入格式"
                onValueChange={(value) => {
                  if (value) {
                    const nextMode = value as InputMode;
                    setMode(nextMode);
                    setInput(
                      nextMode === 'octal' ? result.octal : result.symbolic,
                    );
                    setError('');
                  }
                }}
                spacing={0}
                type="single"
                value={mode}
                variant="outline"
              >
                <ToggleGroupItem value="octal">八进制</ToggleGroupItem>
                <ToggleGroupItem value="symbolic">符号权限</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="chmod-input">
                {mode === 'octal' ? '八进制权限' : '符号权限'}
              </FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                className={s.input}
                id="chmod-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'octal' ? '0755' : 'rwxr-xr-x'}
                value={input}
              />
              <FieldDescription>
                八进制接受 755 或 0755；符号格式必须包含 9 个字符。
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <Button onClick={parseInput} size="lg">
              <ShieldCheckIcon data-icon="inline-start" />
              解析权限
            </Button>
            <dl className={s.summary}>
              <div>
                <dt>八进制</dt>
                <dd>
                  <code>{result.octal}</code>
                  <Button
                    aria-label="复制八进制权限"
                    onClick={() => void copyValue(result.octal)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ClipboardIcon />
                  </Button>
                </dd>
              </div>
              <div>
                <dt>符号权限</dt>
                <dd>
                  <code>{result.symbolic}</code>
                  <Button
                    aria-label="复制符号权限"
                    onClick={() => void copyValue(result.symbolic)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ClipboardIcon />
                  </Button>
                </dd>
              </div>
            </dl>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel description="切换权限位会实时更新结果" title="权限位">
          <FieldGroup>
            <PermissionToggle
              label="Owner"
              onChange={(owner) =>
                updatePermissions({ ...result.permissions, owner })
              }
              value={result.permissions.owner}
            />
            <PermissionToggle
              label="Group"
              onChange={(group) =>
                updatePermissions({ ...result.permissions, group })
              }
              value={result.permissions.group}
            />
            <PermissionToggle
              label="Others"
              onChange={(others) =>
                updatePermissions({ ...result.permissions, others })
              }
              value={result.permissions.others}
            />
            <FieldSet>
              <FieldLegend variant="label">特殊权限位</FieldLegend>
              <ToggleGroup
                aria-label="Unix 特殊权限位"
                onValueChange={(values) =>
                  updatePermissions({
                    ...result.permissions,
                    special: {
                      setuid: values.includes('setuid'),
                      setgid: values.includes('setgid'),
                      sticky: values.includes('sticky'),
                    },
                  })
                }
                spacing={0}
                type="multiple"
                value={selectedSpecial}
                variant="outline"
              >
                <ToggleGroupItem value="setuid">setuid</ToggleGroupItem>
                <ToggleGroupItem value="setgid">setgid</ToggleGroupItem>
                <ToggleGroupItem value="sticky">sticky</ToggleGroupItem>
              </ToggleGroup>
            </FieldSet>
            <div className={s.permissionPreview}>
              <span>当前权限</span>
              <strong>{result.symbolic}</strong>
              <code>{result.octal}</code>
            </div>
          </FieldGroup>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
