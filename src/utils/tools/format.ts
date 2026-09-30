import type { Plugin } from 'prettier';

interface Formatter {
  parser: string;
  plugins: Plugin[];
}

async function loadFormatter(language: string): Promise<Formatter | null> {
  if (['javascript', 'json', 'json5'].includes(language)) {
    const [babel, estree] = await Promise.all([
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
    ]);

    return {
      parser:
        language === 'json5' ? 'json5' : language === 'json' ? 'json' : 'babel',
      plugins: [babel.default, estree.default],
    };
  }

  if (language === 'typescript') {
    const [typescript, estree] = await Promise.all([
      import('prettier/plugins/typescript'),
      import('prettier/plugins/estree'),
    ]);

    return {
      parser: 'typescript',
      plugins: [typescript.default, estree.default],
    };
  }

  if (['html', 'vue', 'angular'].includes(language)) {
    const html = await import('prettier/plugins/html');

    return { parser: language, plugins: [html.default] };
  }

  if (['css', 'scss', 'less'].includes(language)) {
    const postcss = await import('prettier/plugins/postcss');

    return { parser: language, plugins: [postcss.default] };
  }

  if (['markdown', 'mdx'].includes(language)) {
    const markdown = await import('prettier/plugins/markdown');

    return { parser: language, plugins: [markdown.default] };
  }

  if (language === 'yaml') {
    const yaml = await import('prettier/plugins/yaml');

    return { parser: 'yaml', plugins: [yaml.default] };
  }

  return null;
}

export async function formatCode(
  source: string,
  language: string,
): Promise<string | null> {
  const formatter = await loadFormatter(language);

  if (!formatter) {
    return null;
  }

  const prettier = await import('prettier/standalone');

  return prettier.format(source, {
    parser: formatter.parser,
    plugins: formatter.plugins,
  });
}
