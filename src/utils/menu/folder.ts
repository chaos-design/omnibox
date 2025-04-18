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
    key: '6',
    path: '/js',
    children: [
      {
        label: 'to-ts',
        key: '5',
        path: '/js/to-ts',
      },
    ],
  },
  {
    label: 'json',
    key: '8',
    path: '/json',
    children: [
      {
        label: 'stringify-parse',
        key: '7',
        path: '/json/stringify-parse',
      },
    ],
  },
  {
    label: 'kits',
    key: '10',
    path: '/kits',
    children: [
      {
        label: 'qrcode',
        key: '9',
        path: '/kits/qrcode',
      },
    ],
  },
];
