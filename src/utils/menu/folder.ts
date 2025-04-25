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
    label: 'js',
    key: '7',
    path: '/js',
    children: [
      {
        label: 'to-schema',
        key: '5',
        path: '/js/to-schema',
      },
      {
        label: 'to-ts',
        key: '6',
        path: '/js/to-ts',
      },
    ],
  },
  {
    label: 'json',
    key: '9',
    path: '/json',
    children: [
      {
        label: 'stringify-parse',
        key: '8',
        path: '/json/stringify-parse',
      },
    ],
  },
  {
    label: 'kits',
    key: '11',
    path: '/kits',
    children: [
      {
        label: 'qrcode',
        key: '10',
        path: '/kits/qrcode',
      },
    ],
  },
];
