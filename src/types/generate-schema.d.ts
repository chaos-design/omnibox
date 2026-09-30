declare module 'generate-schema' {
  export type JsonSchema = Record<string, unknown>;

  export function json(title: string, value: unknown): JsonSchema;

  const generateSchema: {
    json: typeof json;
  };

  export default generateSchema;
}
