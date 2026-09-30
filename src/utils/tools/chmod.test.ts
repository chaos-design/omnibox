import { describe, expect, it } from 'vitest';

import { chmodFromOctal, chmodFromSymbolic, permissionsToChmod } from './chmod';

describe('chmod tools', () => {
  it('converts regular octal permissions', () => {
    expect(chmodFromOctal('755')).toMatchObject({
      octal: '0755',
      symbolic: 'rwxr-xr-x',
    });
    expect(chmodFromOctal('644').symbolic).toBe('rw-r--r--');
  });

  it('supports setuid, setgid, sticky, and inactive special bits', () => {
    expect(chmodFromOctal('4755').symbolic).toBe('rwsr-xr-x');
    expect(chmodFromOctal('2750').symbolic).toBe('rwxr-s---');
    expect(chmodFromOctal('1644').symbolic).toBe('rw-r--r-T');
  });

  it('parses symbolic permissions back to octal', () => {
    expect(chmodFromSymbolic('rwsr-sr-t').octal).toBe('7755');
    expect(chmodFromSymbolic('rw-r--r--').octal).toBe('0644');
  });

  it('generates values from permission flags', () => {
    expect(
      permissionsToChmod({
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: false, write: false, execute: false },
        special: { setuid: false, setgid: false, sticky: false },
      }),
    ).toMatchObject({ octal: '0640', symbolic: 'rw-r-----' });
  });

  it('rejects malformed octal and symbolic permissions', () => {
    expect(() => chmodFromOctal('888')).toThrow('八进制');
    expect(() => chmodFromOctal('75')).toThrow('3 或 4 位');
    expect(() => chmodFromSymbolic('rwx')).toThrow('9 个字符');
    expect(() => chmodFromSymbolic('rwxrwxrwq')).toThrow('格式无效');
  });
});
