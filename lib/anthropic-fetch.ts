interface AnthropicApiResponse {
  content: Array<{ type: string; text: string }>;
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

  const data = (await res.json()) as AnthropicApiResponse;
  const text =
    data.content[0]?.type === "text" ? data.content[0].text.trim() : "";
  return { text, stopReason: data.stop_reason ?? "unknown" };
}
