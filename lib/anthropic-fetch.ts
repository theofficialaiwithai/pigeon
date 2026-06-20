interface AnthropicTextResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string | null;
}

interface AnthropicToolResponse {
  content: Array<{ type: string; id?: string; name?: string; input?: unknown }>;
  stop_reason: string | null;
}

export async function callClaude({
  model,
  max_tokens,
  system,
  messages,
}: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ text: string; stopReason: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as AnthropicTextResponse;
  const text =
    data.content[0]?.type === "text" ? data.content[0].text.trim() : "";
  return { text, stopReason: data.stop_reason ?? "unknown" };
}

/**
 * Call Claude and force it to return a specific structure via tool_use.
 * Claude MUST call the named tool with input that matches the schema,
 * so the response is always valid JSON — no parsing fragility.
 */
export async function callClaudeTool<T>({
  model,
  max_tokens,
  system,
  messages,
  toolName,
  toolDescription,
  inputSchema,
}: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
}): Promise<T> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens,
      system,
      messages,
      tools: [{ name: toolName, description: toolDescription, input_schema: inputSchema }],
      tool_choice: { type: "tool", name: toolName },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as AnthropicToolResponse;
  const toolUse = data.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.input === undefined) {
    throw new Error(`No tool_use block in Anthropic response (stop_reason=${data.stop_reason})`);
  }

  return toolUse.input as T;
}
