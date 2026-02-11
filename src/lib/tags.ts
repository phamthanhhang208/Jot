const HASHTAG_REGEX = /#(\w+)/g;

/**
 * Extract all unique tags from a note's content string.
 * Content can be either Tiptap JSON (stringified) or plain text.
 * Returns deduplicated, lowercased tag names WITHOUT the "#" prefix.
 */
export function extractTags(content: string): string[] {
  if (!content) return [];

  let textToSearch: string;
  const trimmed = content.trimStart();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(content);
      const parts: string[] = [];

      function walk(node: unknown) {
        if (node && typeof node === "object") {
          const obj = node as Record<string, unknown>;
          if (typeof obj.text === "string") {
            parts.push(obj.text);
          }
          if (Array.isArray(obj.content)) {
            for (const child of obj.content) walk(child);
          }
        }
      }

      if (Array.isArray(parsed)) {
        for (const node of parsed) walk(node);
      } else {
        walk(parsed);
      }
      textToSearch = parts.join(" ");
    } catch {
      textToSearch = content;
    }
  } else {
    textToSearch = content;
  }

  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  HASHTAG_REGEX.lastIndex = 0;
  while ((match = HASHTAG_REGEX.exec(textToSearch)) !== null) {
    tags.add(match[1].toLowerCase());
  }

  return [...tags];
}
