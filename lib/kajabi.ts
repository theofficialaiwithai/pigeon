export const KAJABI_MOCK_PRODUCTS = [
  { id: "kj_mock_1", name: "6-Week Business Bootcamp", startDate: "2024-09-01" },
  { id: "kj_mock_2", name: "Content Creator Masterclass", startDate: null },
  { id: "kj_mock_3", name: "The Launch Blueprint", startDate: "2024-10-15" },
];

// Mints a short-lived Kajabi access token from stored client credentials.
// Throws on auth failure so callers can decide whether to 400 or fall back.
export async function mintKajabiToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch("https://api.kajabi.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }).toString(),
  });
  if (!res.ok) throw new Error("kajabi_auth_failed");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
