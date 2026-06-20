/**
 * Extract a JSON string from Claude's response and sanitize it for parsing.
 * Handles: markdown code fences (with or without preamble), raw JSON, and
 * the most common corruption — literal newlines/tabs inside string values.
 */
export function extractJSON(text: string): string {
  const stripped = text.trim();

  // Code fence anywhere in the text (handles preamble before ```)
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const inner = fenced[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // Already raw JSON
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;

  // Pull out the first {...} or [...] block
  const block = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (block) return block[1].trim();

  return stripped;
}

/**
 * Fix literal newlines / carriage returns / tabs inside JSON string values.
 * Claude occasionally emits them unescaped, making JSON.parse throw.
 */
export function sanitizeJSON(raw: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }
    result += ch;
  }

  return result;
}
