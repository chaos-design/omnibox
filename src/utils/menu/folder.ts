export const MENU_PATH_DATA = [
  {
    key: '1',
    label: 'home',
    path: '/',
  },
  {
    label: 'code',
    key: '4',
    path: '/code',
    children: [
      {
        label: 'diff',
        key: '2',
        path: '/code/diff',
      },
      {
        label: 'format',
        key: '3',
        path: '/code/format',
      },
    ],
  },
  {
    label: 'data',
    key: '8',
    path: '/data',
    children: [
      {
        label: 'csv-json',
        key: '5',
        path: '/data/csv-json',
      },
      {
        label: 'json-pointer',
        key: '6',
        path: '/data/json-pointer',
      },
      {
        label: 'xml',
        key: '7',
        path: '/data/xml',
      },
    ],
  },
  {
    label: 'js',
    key: '11',
    path: '/js',
    children: [
      {
        label: 'to-schema',
        key: '9',
        path: '/js/to-schema',
      },
      {
        label: 'to-ts',
        key: '10',
        path: '/js/to-ts',
      },
    ],
  },
  {
    label: 'json',
    key: '13',
    path: '/json',
    children: [
      {
        label: 'stringify-parse',
        key: '12',
        path: '/json/stringify-parse',
      },
    ],
  },
  {
    label: 'kits',
    key: '30',
    path: '/kits',
    children: [
      {
        label: 'chmod',
        key: '14',
        path: '/kits/chmod',
      },
      {
        label: 'color',
        key: '15',
        path: '/kits/color',
      },
      {
        label: 'cron',
        key: '16',
        path: '/kits/cron',
      },
      {
        label: 'data-size',
        key: '17',
        path: '/kits/data-size',
      },
      {
        label: 'data-url',
        key: '18',
        path: '/kits/data-url',
      },
      {
        label: 'hash-random',
        key: '19',
        path: '/kits/hash-random',
      },
      {
        label: 'hmac',
        key: '20',
        path: '/kits/hmac',
      },
      {
        label: 'http-builder',
        key: '21',
        path: '/kits/http-builder',
      },
      {
        label: 'ip-cidr',
        key: '22',
        path: '/kits/ip-cidr',
      },
      {
        label: 'jwt',
        key: '23',
        path: '/kits/jwt',
      },
      {
        label: 'qrcode',
        key: '24',
        path: '/kits/qrcode',
      },
      {
        label: 'radix',
        key: '25',
        path: '/kits/radix',
      },
      {
        label: 'semver',
        key: '26',
        path: '/kits/semver',
      },
      {
        label: 'sse-preview',
        key: '27',
        path: '/kits/sse-preview',
      },
      {
        label: 'timestamp',
        key: '28',
        path: '/kits/timestamp',
      },
      {
        label: 'url-parser',
        key: '29',
        path: '/kits/url-parser',
      },
    ],
  },
  {
    label: 'text',
    key: '35',
    path: '/text',
    children: [
      {
        label: 'codec',
        key: '31',
        path: '/text/codec',
      },
      {
        label: 'regex',
        key: '32',
        path: '/text/regex',
      },
      {
        label: 'transform',
        key: '33',
        path: '/text/transform',
      },
      {
        label: 'unicode',
        key: '34',
        path: '/text/unicode',
      },
    ],
  },
];
