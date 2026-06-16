/**
 * Extract a JSON string from Claude's response, which may be wrapped in
 * markdown code fences (```json ... ``` or ``` ... ```) despite being
 * instructed to return raw JSON. Strips the fences when present, then
 * falls back to the whole string if no fences are found.
 */
export function extractJSON(text: string): string {
  const stripped = text.trim();

  // Match ```json ... ``` or ``` ... ```
  const fenced = stripped.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) return fenced[1].trim();

  // If the text starts with { or [ it's already raw JSON
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;

  // Last resort: pull out the first {...} or [...] block
  const block = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (block) return block[1].trim();

  return stripped;
}
