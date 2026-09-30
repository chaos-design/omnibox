import { describe, expect, it } from 'vitest';

import {
  createJsonShareHash,
  createLegacyCompressedJsonShareHash,
  decodeJsonShareHash,
  encodeLegacyJsonShareHash,
  type JsonSharePayload,
  type JsonShareStorage,
} from './share';

const payload: JsonSharePayload = {
  activeKey: 'tab-2',
  tabs: [
    {
      key: 'tab-1',
      label: 'Tab 1',
      value: '{"name":"Omnibox"}',
    },
    {
      key: 'tab-2',
      label: '中文',
      value: '{"说明":"分享内容"}',
    },
  ],
  version: 1,
};

function createMemoryStorage() {
  const values = new Map<string, string>();
  const storage: JsonShareStorage = {
    getItem: (key) => values.get(key) ?? null,
  };

  return { storage, values };
}

function expectEquivalentPayload(restored: JsonSharePayload | null) {
  expect(restored?.version).toBe(1);
  expect(restored?.tabs.map(({ label, value }) => ({ label, value }))).toEqual(
    payload.tabs.map(({ label, value }) => ({ label, value })),
  );
  expect(
    restored?.tabs.find((tab) => tab.key === restored.activeKey)?.label,
  ).toBe('中文');
}

describe('JSON 分享 hash', () => {
  it('生成自包含压缩 hash 并恢复中文内容', async () => {
    const hash = await createJsonShareHash(payload);
    const legacyHash = await createLegacyCompressedJsonShareHash(payload);

    expect(hash).toMatch(/^v2\.[\w-]+$/u);
    expect(hash.length).toBeLessThan(legacyHash.length);
    expect(hash.length).toBeLessThan(encodeLegacyJsonShareHash(payload).length);
    expectEquivalentPayload(await decodeJsonShareHash(`#${hash}`));
  });

  it('兼容 v1 Deflate 压缩 hash', async () => {
    const hash = await createLegacyCompressedJsonShareHash(payload);

    await expect(decodeJsonShareHash(`#${hash}`)).resolves.toEqual(payload);
  });

  it('兼容旧版自包含 hash', async () => {
    const hash = encodeLegacyJsonShareHash(payload);

    await expect(decodeJsonShareHash(`#${hash}`)).resolves.toEqual(payload);
  });

  it('没有分享参数时返回 null', async () => {
    await expect(decodeJsonShareHash('')).resolves.toBeNull();
    await expect(decodeJsonShareHash('#other=value')).resolves.toBeNull();
  });

  it('兼容当前浏览器保存的 8 位旧短码', async () => {
    const { storage, values } = createMemoryStorage();
    values.set('OMNIBOX_JSON_SHARE_V1_12345678', JSON.stringify(payload));

    await expect(decodeJsonShareHash('#12345678', storage)).resolves.toEqual(
      payload,
    );
  });

  it('未知短码说明仅支持创建它的浏览器', async () => {
    const { storage } = createMemoryStorage();

    await expect(decodeJsonShareHash('#12345678', storage)).rejects.toThrow(
      '仅在创建它的浏览器可用',
    );
  });

  it('拒绝损坏的压缩分享数据', async () => {
    await expect(decodeJsonShareHash('#v2.not-deflate')).rejects.toThrow(
      '无法读取分享地址',
    );
    await expect(decodeJsonShareHash('#v1.not-deflate')).rejects.toThrow(
      '无法读取分享地址',
    );
  });

  it('拒绝损坏的旧版分享数据', async () => {
    await expect(decodeJsonShareHash('#data=not-base64')).rejects.toThrow(
      '无法读取分享地址',
    );
  });

  it('拒绝不存在的活动标签', async () => {
    const invalidPayload = {
      ...payload,
      activeKey: 'missing-tab',
    } as JsonSharePayload;

    await expect(createJsonShareHash(invalidPayload)).rejects.toThrow(
      '分享数据结构无效',
    );
  });

  it('拒绝本地存储中的损坏数据', async () => {
    const { storage, values } = createMemoryStorage();
    values.set('OMNIBOX_JSON_SHARE_V1_12345678', '{invalid');

    await expect(decodeJsonShareHash('#12345678', storage)).rejects.toThrow(
      '无法读取分享地址',
    );
  });

  it('拒绝包含过多标签的分享数据', async () => {
    const tooManyTabs: JsonSharePayload = {
      activeKey: 'tab-1',
      tabs: Array.from({ length: 501 }, (_, index) => ({
        key: `tab-${index + 1}`,
        label: `Tab ${index + 1}`,
        value: '{}',
      })),
      version: 1,
    };

    await expect(createJsonShareHash(tooManyTabs)).rejects.toThrow(
      '分享数据结构无效',
    );

    const hash = encodeLegacyJsonShareHash(tooManyTabs);

    await expect(decodeJsonShareHash(`#${hash}`)).rejects.toThrow(
      '无法读取分享地址',
    );
  });

  it('拒绝解压后超过大小限制的分享数据', async () => {
    const hugePayload: JsonSharePayload = {
      activeKey: 'tab-1',
      tabs: [{ key: 'tab-1', label: 'Huge', value: 'a'.repeat(1_100_000) }],
      version: 1,
    };

    const hash = await createJsonShareHash(hugePayload);

    await expect(decodeJsonShareHash(`#${hash}`)).rejects.toThrow('解压后过大');
  });
});
