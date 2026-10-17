// Splitting wikitext at a separator that is not inside a template ({{ }}) or a link ([[ ]], [url text]). Pure.

const DEPTH_CHANGE: Readonly<Record<string, number>> = { "{": 1, "[": 1, "}": -1, "]": -1 };

const startsAt = (chars: readonly string[], index: number, separator: readonly string[]): boolean =>
  separator.every((char, offset) => chars[index + offset] === char);

/** The parts of text between the separators that are outside every template and link. */
export const splitOutside = (text: string, separator: string): string[] => {
  const chars = Array.from(text);
  const sep = Array.from(separator);
  const parts: string[][] = [[]];
  const state = { depth: 0, skip: 0 };
  chars.forEach((char, index) => {
    if (state.skip > 0) {
      state.skip -= 1;
      return;
    }
    if (state.depth === 0 && startsAt(chars, index, sep)) {
      parts.push([]);
      state.skip = sep.length - 1;
      return;
    }
    parts[parts.length - 1]?.push(char);
    state.depth += DEPTH_CHANGE[char] ?? 0;
  });
  return parts.map((part) => part.join(""));
};

const count = (text: string, mark: string): number => text.split(mark).length - 1;

/** How many templates and links are open at the end of text: above 0, the text goes on past its line. */
export const openDepth = (text: string): number => count(text, "{{") - count(text, "}}") + count(text, "[[") - count(text, "]]");
