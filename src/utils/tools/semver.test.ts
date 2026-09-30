import { describe, expect, it } from 'vitest';

import {
  bumpSemver,
  compareSemver,
  parseSemver,
  satisfiesSemver,
} from './semver';

describe('SemVer tools', () => {
  it('parses prerelease and build metadata', () => {
    expect(parseSemver('1.2.3-rc.1+build.5')).toEqual({
      build: ['build', '5'],
      major: '1',
      minor: '2',
      patch: '3',
      prerelease: ['rc', '1'],
      version: '1.2.3-rc.1+build.5',
    });
  });

  it('compares prerelease identifiers by SemVer precedence', () => {
    const sequence = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ];

    sequence.slice(0, -1).forEach((version, index) => {
      expect(compareSemver(version, sequence[index + 1])).toBe(-1);
    });
    expect(compareSemver('1.0.0+one', '1.0.0+two')).toBe(0);
  });

  it('bumps stable and prerelease versions', () => {
    expect(bumpSemver('1.2.3', 'major')).toBe('2.0.0');
    expect(bumpSemver('1.2.3', 'minor')).toBe('1.3.0');
    expect(bumpSemver('1.2.3', 'patch')).toBe('1.2.4');
    expect(bumpSemver('1.2.3', 'prerelease')).toBe('1.2.4-rc.1');
    expect(bumpSemver('1.2.4-rc.9', 'prerelease')).toBe('1.2.4-rc.10');
    expect(bumpSemver('1.2.3-rc.1', 'patch')).toBe('1.2.3');
    expect(bumpSemver('1.0.0-rc.1', 'major')).toBe('1.0.0');
    expect(bumpSemver('1.2.0-rc.1', 'minor')).toBe('1.2.0');
  });

  it('evaluates comparators, caret, tilde, AND, and OR ranges', () => {
    expect(satisfiesSemver('1.5.0', '>=1.2.0 <2.0.0')).toBe(true);
    expect(satisfiesSemver('1.9.0', '^1.2.3')).toBe(true);
    expect(satisfiesSemver('2.0.0', '^1.2.3')).toBe(false);
    expect(satisfiesSemver('0.2.9', '^0.2.3')).toBe(true);
    expect(satisfiesSemver('1.2.9', '~1.2.3')).toBe(true);
    expect(satisfiesSemver('2.1.0', '<1.0.0 || >=2.0.0')).toBe(true);
    expect(satisfiesSemver('1.5.0-beta.1', '^1.2.3')).toBe(false);
    expect(satisfiesSemver('1.5.0-beta.1', '>=1.5.0-beta.0 <2.0.0')).toBe(true);
  });

  it('compares and increments core versions without losing precision', () => {
    expect(compareSemver('9007199254740992.0.0', '9007199254740993.0.0')).toBe(
      -1,
    );
    expect(bumpSemver('9007199254740993.0.0', 'major')).toBe(
      '9007199254740994.0.0',
    );
  });

  it('rejects invalid versions and unsupported range syntax', () => {
    expect(() => parseSemver('1.2')).toThrow('完整');
    expect(() => parseSemver('01.2.3')).toThrow('完整');
    expect(() => parseSemver('1.2.3-01')).toThrow('前导零');
    expect(() => bumpSemver('1.2.3', 'prerelease', '01')).toThrow('前导零');
    expect(() => satisfiesSemver('1.2.3', '1.x')).toThrow('有效的 SemVer');
    expect(() => satisfiesSemver('1.2.3', '1.2.3 ||')).toThrow('空的 OR');
    expect(() => satisfiesSemver('1.2.3', '1.2.3 || nope')).toThrow(
      '有效的 SemVer',
    );
  });
});
