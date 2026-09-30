export type SemverBump = 'major' | 'minor' | 'patch' | 'prerelease';

export interface Semver {
  build: string[];
  major: string;
  minor: string;
  patch: string;
  prerelease: string[];
  version: string;
}

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/u;

function validatePrerelease(identifiers: string[]): void {
  if (
    identifiers.some(
      (identifier) => /^\d+$/u.test(identifier) && /^0\d+/u.test(identifier),
    )
  ) {
    throw new Error('SemVer 数字预发布标识不能包含前导零。');
  }
}

export function parseSemver(input: string): Semver {
  const source = input.trim();
  const match = semverPattern.exec(source);

  if (!match) {
    throw new Error('请输入完整且有效的 SemVer，例如 1.2.3 或 1.2.3-rc.1。');
  }

  const prerelease = match[4]?.split('.') ?? [];
  validatePrerelease(prerelease);

  return {
    build: match[5]?.split('.') ?? [],
    major: match[1],
    minor: match[2],
    patch: match[3],
    prerelease,
    version: source,
  };
}

function compareNumeric(left: string, right: string): number {
  if (left.length !== right.length) {
    return left.length < right.length ? -1 : 1;
  }

  return left === right ? 0 : left < right ? -1 : 1;
}

function compareIdentifiers(left: string[], right: string[]): number {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }

  if (left.length === 0) {
    return 1;
  }

  if (right.length === 0) {
    return -1;
  }

  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    if (leftValue === undefined) {
      return -1;
    }

    if (rightValue === undefined) {
      return 1;
    }

    if (leftValue === rightValue) {
      continue;
    }

    const leftNumeric = /^\d+$/u.test(leftValue);
    const rightNumeric = /^\d+$/u.test(rightValue);

    if (leftNumeric && rightNumeric) {
      return compareNumeric(leftValue, rightValue);
    }

    if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    }

    return leftValue < rightValue ? -1 : 1;
  }

  return 0;
}

export function compareSemver(leftInput: string, rightInput: string): number {
  const left = parseSemver(leftInput);
  const right = parseSemver(rightInput);
  const numericKeys = ['major', 'minor', 'patch'] as const;

  for (const key of numericKeys) {
    const comparison = compareNumeric(left[key], right[key]);

    if (comparison !== 0) {
      return comparison;
    }
  }

  return compareIdentifiers(left.prerelease, right.prerelease);
}

function formatSemver(
  major: string,
  minor: string,
  patch: string,
  prerelease: string[] = [],
): string {
  const base = `${major}.${minor}.${patch}`;
  return prerelease.length > 0 ? `${base}-${prerelease.join('.')}` : base;
}

function incrementNumeric(value: string): string {
  return (BigInt(value) + 1n).toString();
}

export function bumpSemver(
  input: string,
  type: SemverBump,
  prereleaseLabel = 'rc',
): string {
  const current = parseSemver(input);

  if (type === 'major') {
    const major =
      current.prerelease.length > 0 &&
      current.minor === '0' &&
      current.patch === '0'
        ? current.major
        : incrementNumeric(current.major);
    return formatSemver(major, '0', '0');
  }

  if (type === 'minor') {
    const minor =
      current.prerelease.length > 0 && current.patch === '0'
        ? current.minor
        : incrementNumeric(current.minor);
    return formatSemver(current.major, minor, '0');
  }

  if (type === 'patch') {
    const patch =
      current.prerelease.length > 0
        ? current.patch
        : incrementNumeric(current.patch);
    return formatSemver(current.major, current.minor, patch);
  }

  if (!/^[\dA-Za-z-]+$/u.test(prereleaseLabel)) {
    throw new Error('预发布标签只能包含字母、数字和连字符。');
  }

  validatePrerelease([prereleaseLabel]);

  if (current.prerelease.length === 0) {
    return formatSemver(
      current.major,
      current.minor,
      incrementNumeric(current.patch),
      [prereleaseLabel, '1'],
    );
  }

  const prerelease = [...current.prerelease];
  const last = prerelease.at(-1);

  if (last && /^\d+$/u.test(last)) {
    prerelease[prerelease.length - 1] = String(BigInt(last) + 1n);
  } else {
    prerelease.push('1');
  }

  return formatSemver(current.major, current.minor, current.patch, prerelease);
}

function testComparator(version: string, comparator: string): boolean {
  const match = /^(>=|<=|>|<|=)?(.+)$/u.exec(comparator);

  if (!match) {
    throw new Error(`SemVer 比较器“${comparator}”无效。`);
  }

  const operator = match[1] ?? '=';
  const comparison = compareSemver(version, match[2]);

  switch (operator) {
    case '>':
      return comparison > 0;
    case '>=':
      return comparison >= 0;
    case '<':
      return comparison < 0;
    case '<=':
      return comparison <= 0;
    default:
      return comparison === 0;
  }
}

function expandShortcut(comparator: string): string[] {
  if (!comparator.startsWith('^') && !comparator.startsWith('~')) {
    return [comparator];
  }

  const operator = comparator[0];
  const version = parseSemver(comparator.slice(1));
  let upper: string;

  if (operator === '~') {
    upper = formatSemver(version.major, incrementNumeric(version.minor), '0');
  } else if (version.major !== '0') {
    upper = formatSemver(incrementNumeric(version.major), '0', '0');
  } else if (version.minor !== '0') {
    upper = formatSemver('0', incrementNumeric(version.minor), '0');
  } else {
    upper = formatSemver('0', '0', incrementNumeric(version.patch));
  }

  return [`>=${version.version}`, `<${upper}`];
}

export function satisfiesSemver(version: string, range: string): boolean {
  const candidate = parseSemver(version);

  if (!range.trim()) {
    throw new Error('请输入 SemVer 范围。');
  }

  const clauses = range.split('||').map((clause) => {
    const comparators = clause.trim().split(/\s+/u).filter(Boolean);

    if (comparators.length === 0) {
      throw new Error('SemVer 范围包含空的 OR 分支。');
    }

    const expanded = comparators.flatMap(expandShortcut);

    expanded.forEach((comparator) => {
      const match = /^(?:>=|<=|>|<|=)?(.+)$/u.exec(comparator);

      if (!match) {
        throw new Error(`SemVer 比较器“${comparator}”无效。`);
      }

      parseSemver(match[1]);
    });

    return expanded;
  });

  return clauses.some((expanded) => {
    const includesPrerelease =
      candidate.prerelease.length === 0 ||
      expanded.some((comparator) => {
        const match = /^(?:>=|<=|>|<|=)?(.+)$/u.exec(comparator);
        const compared = match ? parseSemver(match[1]) : null;

        return (
          compared?.prerelease.length &&
          compared.major === candidate.major &&
          compared.minor === candidate.minor &&
          compared.patch === candidate.patch
        );
      });

    return (
      Boolean(includesPrerelease) &&
      expanded.every((comparator) => testComparator(version, comparator))
    );
  });
}
