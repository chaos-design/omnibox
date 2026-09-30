import type { Metadata } from 'next';

import { JsonTransformer } from '../../../components/json-transformer';

export const metadata: Metadata = {
  title: 'JSON 转 Schema',
};

export default function JsonToSchemaPage() {
  return <JsonTransformer mode="schema" />;
}
