import { describe, expect, it } from 'vitest';

import { calculateCidr, classifyIpv4, parseIpv4 } from './ip-cidr';

describe('IPv4 CIDR tools', () => {
  it('calculates a regular subnet', () => {
    expect(calculateCidr('192.168.1.42/24')).toMatchObject({
      address: '192.168.1.42',
      broadcast: '192.168.1.255',
      classification: 'private',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      network: '192.168.1.0',
      subnetMask: '255.255.255.0',
      totalAddresses: 256,
      usableAddresses: 254,
      wildcardMask: '0.0.0.255',
    });
  });

  it('handles /0, /31, and /32 edge cases', () => {
    expect(calculateCidr('8.8.8.8/0')).toMatchObject({
      network: '0.0.0.0',
      broadcast: '255.255.255.255',
      totalAddresses: 4_294_967_296,
      usableAddresses: 4_294_967_294,
    });
    expect(calculateCidr('10.0.0.4/31')).toMatchObject({
      firstHost: '10.0.0.4',
      lastHost: '10.0.0.5',
      usableAddresses: 2,
    });
    expect(calculateCidr('10.0.0.4/32')).toMatchObject({
      firstHost: '10.0.0.4',
      lastHost: '10.0.0.4',
      usableAddresses: 1,
    });
  });

  it('classifies special IPv4 ranges', () => {
    expect(classifyIpv4(parseIpv4('172.20.0.1'))).toBe('private');
    expect(classifyIpv4(parseIpv4('127.0.0.1'))).toBe('loopback');
    expect(classifyIpv4(parseIpv4('169.254.1.1'))).toBe('link-local');
    expect(classifyIpv4(parseIpv4('224.0.0.1'))).toBe('multicast');
    expect(classifyIpv4(parseIpv4('0.0.0.0'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('100.64.0.1'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('192.0.2.1'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('192.31.196.1'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('192.52.193.1'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('192.175.48.1'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('255.255.255.255'))).toBe('reserved');
    expect(classifyIpv4(parseIpv4('8.8.8.8'))).toBe('public');
  });

  it('rejects invalid addresses and prefixes', () => {
    expect(() => parseIpv4('192.168.01.1')).toThrow('4 个十进制段');
    expect(() => parseIpv4('256.1.1.1')).toThrow('0 到 255');
    expect(() => calculateCidr('192.168.1.1')).toThrow('IPv4/前缀');
    expect(() => calculateCidr('192.168.1.1/33')).toThrow('0 到 32');
  });
});
