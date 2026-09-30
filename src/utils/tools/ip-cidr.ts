export type IpClassification =
  | 'private'
  | 'loopback'
  | 'link-local'
  | 'multicast'
  | 'public'
  | 'reserved';

export interface CidrResult {
  address: string;
  broadcast: string;
  classification: IpClassification;
  firstHost: string;
  lastHost: string;
  network: string;
  prefix: number;
  subnetMask: string;
  totalAddresses: number;
  usableAddresses: number;
  wildcardMask: string;
}

const reservedRanges: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8],
  ['100.64.0.0', 10],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.31.196.0', 24],
  ['192.52.193.0', 24],
  ['192.88.99.0', 24],
  ['192.175.48.0', 24],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['240.0.0.0', 4],
];

export function parseIpv4(input: string): number {
  const parts = input.trim().split('.');

  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(?:0|[1-9]\d{0,2})$/u.test(part))
  ) {
    throw new Error('IPv4 地址必须包含 4 个十进制段。');
  }

  const values = parts.map(Number);

  if (values.some((value) => value > 255)) {
    throw new Error('IPv4 每个段必须在 0 到 255 之间。');
  }

  return (
    (values[0] * 2 ** 24 +
      values[1] * 2 ** 16 +
      values[2] * 2 ** 8 +
      values[3]) >>>
    0
  );
}

export function formatIpv4(value: number): string {
  const source = value >>> 0;

  return [
    (source >>> 24) & 255,
    (source >>> 16) & 255,
    (source >>> 8) & 255,
    source & 255,
  ].join('.');
}

function isInRange(value: number, network: string, prefix: number): boolean {
  const networkValue = parseIpv4(network);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) >>> 0 === (networkValue & mask) >>> 0;
}

export function classifyIpv4(value: number): IpClassification {
  if (isInRange(value, '10.0.0.0', 8)) {
    return 'private';
  }

  if (isInRange(value, '172.16.0.0', 12)) {
    return 'private';
  }

  if (isInRange(value, '192.168.0.0', 16)) {
    return 'private';
  }

  if (isInRange(value, '127.0.0.0', 8)) {
    return 'loopback';
  }

  if (isInRange(value, '169.254.0.0', 16)) {
    return 'link-local';
  }

  if (isInRange(value, '224.0.0.0', 4)) {
    return 'multicast';
  }

  if (
    reservedRanges.some(([network, prefix]) =>
      isInRange(value, network, prefix),
    )
  ) {
    return 'reserved';
  }

  return 'public';
}

export function calculateCidr(input: string): CidrResult {
  const segments = input.trim().split('/');

  if (segments.length !== 2 || !/^\d{1,2}$/u.test(segments[1])) {
    throw new Error('CIDR 必须使用 IPv4/前缀长度格式。');
  }

  const addressValue = parseIpv4(segments[0]);
  const prefix = Number(segments[1]);

  if (prefix < 0 || prefix > 32) {
    throw new Error('CIDR 前缀长度必须在 0 到 32 之间。');
  }

  const subnetMask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardMask = ~subnetMask >>> 0;
  const network = (addressValue & subnetMask) >>> 0;
  const broadcast = (network | wildcardMask) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  const usableAddresses =
    prefix <= 30 ? totalAddresses - 2 : prefix === 31 ? 2 : 1;
  const firstHost = prefix <= 30 ? network + 1 : network;
  const lastHost = prefix <= 30 ? broadcast - 1 : broadcast;

  return {
    address: formatIpv4(addressValue),
    broadcast: formatIpv4(broadcast),
    classification: classifyIpv4(addressValue),
    firstHost: formatIpv4(firstHost),
    lastHost: formatIpv4(lastHost),
    network: formatIpv4(network),
    prefix,
    subnetMask: formatIpv4(subnetMask),
    totalAddresses,
    usableAddresses,
    wildcardMask: formatIpv4(wildcardMask),
  };
}
