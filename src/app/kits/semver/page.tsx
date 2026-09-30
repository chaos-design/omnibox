'use client';

import {
  ClipboardIcon,
  GitCompareArrowsIcon,
  TrendingUpIcon,
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
import { Input } from '../../../components/ui/input';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  bumpSemver,
  compareSemver,
  parseSemver,
  type Semver,
  type SemverBump,
  satisfiesSemver,
} from '../../../utils/tools/semver';

import s from './index.module.scss';

const defaultVersion = '1.2.3-rc.1+build.5';

export default function SemverPage() {
  const [version, setVersion] = useState(defaultVersion);
  const [parsed, setParsed] = useState<Semver>(() =>
    parseSemver(defaultVersion),
  );
  const [bumpType, setBumpType] = useState<SemverBump>('patch');
  const [bumped, setBumped] = useState('1.2.4');
  const [compareVersion, setCompareVersion] = useState('2.0.0');
  const [range, setRange] = useState('^1.2.3');
  const [comparison, setComparison] = useState(-1);
  const [satisfies, setSatisfies] = useState(false);
  const [error, setError] = useState('');

  const parseAndBump = () => {
    try {
      setParsed(parseSemver(version));
      setBumped(bumpSemver(version, bumpType));
      setError('');
      toast.success('SemVer 解析完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const evaluate = () => {
    try {
      setComparison(compareSemver(version, compareVersion));
      setSatisfies(satisfiesSemver(version, range));
      setError('');
      toast.success('SemVer 比较完成');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      toast.error(message);
    }
  };

  const copyBumped = async () => {
    try {
      await copyToClipboard(bumped);
      toast.success('新版本已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const comparisonText =
    comparison < 0
      ? `${version} < ${compareVersion}`
      : comparison > 0
        ? `${version} > ${compareVersion}`
        : `${version} = ${compareVersion}`;

  return (
    <ToolWorkbench
      description="解析、比较、递增 SemVer 2.0.0，并检查常用版本范围。"
      title="SemVer"
    >
      <ToolGrid>
        <ToolPanel
          actions={
            <Button
              aria-label="复制递增版本"
              onClick={() => void copyBumped()}
              size="icon-sm"
              variant="ghost"
            >
              <ClipboardIcon />
            </Button>
          }
          description="Build metadata 不参与版本优先级"
          title="解析与 Bump"
        >
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="semver-input">版本</FieldLabel>
              <Input
                aria-invalid={Boolean(error)}
                className={s.input}
                id="semver-input"
                onChange={(event) => setVersion(event.target.value)}
                value={version}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bump 类型</FieldLabel>
              <ToggleGroup
                aria-label="SemVer Bump 类型"
                onValueChange={(value) => {
                  if (value) {
                    setBumpType(value as SemverBump);
                  }
                }}
                spacing={0}
                type="single"
                value={bumpType}
                variant="outline"
              >
                <ToggleGroupItem value="major">Major</ToggleGroupItem>
                <ToggleGroupItem value="minor">Minor</ToggleGroupItem>
                <ToggleGroupItem value="patch">Patch</ToggleGroupItem>
                <ToggleGroupItem value="prerelease">Pre</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Button onClick={parseAndBump} size="lg">
              <TrendingUpIcon data-icon="inline-start" />
              解析并递增
            </Button>
            <dl className={s.parsed}>
              <div>
                <dt>Major</dt>
                <dd>{parsed.major}</dd>
              </div>
              <div>
                <dt>Minor</dt>
                <dd>{parsed.minor}</dd>
              </div>
              <div>
                <dt>Patch</dt>
                <dd>{parsed.patch}</dd>
              </div>
              <div>
                <dt>Prerelease</dt>
                <dd>{parsed.prerelease.join('.') || '无'}</dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{parsed.build.join('.') || '无'}</dd>
              </div>
            </dl>
            <output className={s.bumped}>{bumped}</output>
          </FieldGroup>
        </ToolPanel>

        <ToolPanel description="支持比较器、^、~、AND 和 OR" title="比较与范围">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="semver-compare">比较版本</FieldLabel>
              <Input
                className={s.input}
                id="semver-compare"
                onChange={(event) => setCompareVersion(event.target.value)}
                value={compareVersion}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="semver-range">版本范围</FieldLabel>
              <Input
                className={s.input}
                id="semver-range"
                onChange={(event) => setRange(event.target.value)}
                value={range}
              />
              <FieldDescription>
                例如 `&gt;=1.2.0 &lt;2.0.0`、`^1.2.3` 或 `&lt;1.0.0 ||
                &gt;=2.0.0`。
              </FieldDescription>
            </Field>
            <Button onClick={evaluate} size="lg">
              <GitCompareArrowsIcon data-icon="inline-start" />
              比较版本
            </Button>
            <div className={s.comparison}>
              <span>优先级比较</span>
              <strong>{comparisonText}</strong>
            </div>
            <div className={s.comparison}>
              <span>范围 `{range}`</span>
              <strong>{satisfies ? '满足' : '不满足'}</strong>
            </div>
          </FieldGroup>
        </ToolPanel>
      </ToolGrid>
    </ToolWorkbench>
  );
}
