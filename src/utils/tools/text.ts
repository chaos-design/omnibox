export type TextCaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant';

export type LineMode = 'sort-asc' | 'sort-desc' | 'deduplicate' | 'reverse';

export interface TextStatistics {
  characters: number;
  charactersWithoutWhitespace: number;
  words: number;
  lines: number;
  bytes: number;
}

function splitWords(input: string): string[] {
  return (
    input
      .replace(/([\p{Ll}\d])(\p{Lu})/gu, '$1 $2')
      .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function capitalize(value: string): string {
  const characters = Array.from(value.toLocaleLowerCase());
  const first = characters.shift();

  return first ? first.toLocaleUpperCase() + characters.join('') : '';
}

export function convertTextCase(input: string, mode: TextCaseMode): string {
  if (mode === 'upper') {
    return input.toLocaleUpperCase();
  }

  if (mode === 'lower') {
    return input.toLocaleLowerCase();
  }

  const words = splitWords(input);

  switch (mode) {
    case 'title':
      return words.map(capitalize).join(' ');
    case 'camel':
      return words
        .map((word, index) =>
          index === 0 ? word.toLocaleLowerCase() : capitalize(word),
        )
        .join('');
    case 'pascal':
      return words.map(capitalize).join('');
    case 'snake':
      return words.map((word) => word.toLocaleLowerCase()).join('_');
    case 'kebab':
      return words.map((word) => word.toLocaleLowerCase()).join('-');
    case 'constant':
      return words.map((word) => word.toLocaleUpperCase()).join('_');
    default:
      return input;
  }
}

export function trimText(input: string): string {
  return input.trim();
}

export function collapseWhitespace(input: string): string {
  return input.trim().replace(/\s+/gu, ' ');
}

export function trimLines(input: string): string {
  return input
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .join('\n');
}

export function transformLines(input: string, mode: LineMode): string {
  const lines = input.split(/\r?\n/u);

  switch (mode) {
    case 'sort-asc':
      return lines
        .toSorted((left, right) =>
          left.localeCompare(right, undefined, { numeric: true }),
        )
        .join('\n');
    case 'sort-desc':
      return lines
        .toSorted((left, right) =>
          right.localeCompare(left, undefined, { numeric: true }),
        )
        .join('\n');
    case 'deduplicate':
      return Array.from(new Set(lines)).join('\n');
    case 'reverse':
      return lines.toReversed().join('\n');
    default:
      return input;
  }
}

export function getTextStatistics(input: string): TextStatistics {
  const characters = Array.from(input);
  const words = input.match(/[\p{L}\p{N}]+/gu) ?? [];

  return {
    characters: characters.length,
    charactersWithoutWhitespace: characters.filter(
      (character) => !/\s/u.test(character),
    ).length,
    words: words.length,
    lines: input ? input.split(/\r?\n/u).length : 0,
    bytes: new TextEncoder().encode(input).length,
  };
}
