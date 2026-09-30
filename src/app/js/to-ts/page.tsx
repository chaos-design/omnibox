import type { Metadata } from 'next';

import { JsonTransformer } from '../../../components/json-transformer';

export const metadata: Metadata = {
  title: 'JSON 转 TypeScript',
};

export default function JsonToTypeScriptPage() {
  return <JsonTransformer mode="typescript" />;
}
