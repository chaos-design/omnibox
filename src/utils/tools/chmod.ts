export interface PermissionBits {
  execute: boolean;
  read: boolean;
  write: boolean;
}

export interface UnixPermissions {
  group: PermissionBits;
  others: PermissionBits;
  owner: PermissionBits;
  special: {
    setgid: boolean;
    setuid: boolean;
    sticky: boolean;
  };
}

export interface ChmodResult {
  octal: string;
  permissions: UnixPermissions;
  symbolic: string;
}

function digitToBits(digit: number): PermissionBits {
  return {
    read: (digit & 4) !== 0,
    write: (digit & 2) !== 0,
    execute: (digit & 1) !== 0,
  };
}

function bitsToDigit(bits: PermissionBits): number {
  return (bits.read ? 4 : 0) + (bits.write ? 2 : 0) + (bits.execute ? 1 : 0);
}

function executeSymbol(
  execute: boolean,
  special: boolean,
  active: string,
  inactive: string,
): string {
  if (special) {
    return execute ? active : inactive;
  }

  return execute ? 'x' : '-';
}

function bitsToSymbolic(
  bits: PermissionBits,
  executeCharacter: string,
): string {
  return `${bits.read ? 'r' : '-'}${bits.write ? 'w' : '-'}${executeCharacter}`;
}

export function permissionsToChmod(permissions: UnixPermissions): ChmodResult {
  const specialDigit =
    (permissions.special.setuid ? 4 : 0) +
    (permissions.special.setgid ? 2 : 0) +
    (permissions.special.sticky ? 1 : 0);
  const octal = [
    specialDigit,
    bitsToDigit(permissions.owner),
    bitsToDigit(permissions.group),
    bitsToDigit(permissions.others),
  ].join('');
  const symbolic = [
    bitsToSymbolic(
      permissions.owner,
      executeSymbol(
        permissions.owner.execute,
        permissions.special.setuid,
        's',
        'S',
      ),
    ),
    bitsToSymbolic(
      permissions.group,
      executeSymbol(
        permissions.group.execute,
        permissions.special.setgid,
        's',
        'S',
      ),
    ),
    bitsToSymbolic(
      permissions.others,
      executeSymbol(
        permissions.others.execute,
        permissions.special.sticky,
        't',
        'T',
      ),
    ),
  ].join('');

  return { octal, permissions, symbolic };
}

export function chmodFromOctal(input: string): ChmodResult {
  const source = input.trim();

  if (!/^[0-7]{3,4}$/u.test(source)) {
    throw new Error('Unix 权限必须是 3 或 4 位八进制数字。');
  }

  const digits = source.padStart(4, '0').split('').map(Number);
  const permissions: UnixPermissions = {
    owner: digitToBits(digits[1]),
    group: digitToBits(digits[2]),
    others: digitToBits(digits[3]),
    special: {
      setuid: (digits[0] & 4) !== 0,
      setgid: (digits[0] & 2) !== 0,
      sticky: (digits[0] & 1) !== 0,
    },
  };

  return permissionsToChmod(permissions);
}

function parsePermissionGroup(
  value: string,
  specialType: 'setuid' | 'setgid' | 'sticky',
): { bits: PermissionBits; special: boolean } {
  const [read, write, execute] = value;
  const specialCharacters =
    specialType === 'sticky' ? new Set(['t', 'T']) : new Set(['s', 'S']);
  const expectedExecute = specialType === 'sticky' ? ['x', 't'] : ['x', 's'];

  if (
    !['r', '-'].includes(read) ||
    !['w', '-'].includes(write) ||
    !['x', '-', ...specialCharacters].includes(execute)
  ) {
    throw new Error('符号权限格式无效。');
  }

  return {
    bits: {
      read: read === 'r',
      write: write === 'w',
      execute: expectedExecute.includes(execute),
    },
    special: specialCharacters.has(execute),
  };
}

export function chmodFromSymbolic(input: string): ChmodResult {
  const source = input.trim();

  if (source.length !== 9) {
    throw new Error('符号权限必须包含 9 个字符。');
  }

  const owner = parsePermissionGroup(source.slice(0, 3), 'setuid');
  const group = parsePermissionGroup(source.slice(3, 6), 'setgid');
  const others = parsePermissionGroup(source.slice(6, 9), 'sticky');

  return permissionsToChmod({
    owner: owner.bits,
    group: group.bits,
    others: others.bits,
    special: {
      setuid: owner.special,
      setgid: group.special,
      sticky: others.special,
    },
  });
}
