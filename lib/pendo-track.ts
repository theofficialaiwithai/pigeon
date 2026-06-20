/**
 * Server-side Pendo Track Event helper.
 * Sends events via HTTP POST to the Pendo Track API.
 * Never throws — tracking failures must not break application flow.
 */
export async function pendoTrack({
  event,
  visitorId,
  accountId,
  properties,
}: {
  event: string;
  visitorId: string;
  accountId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("https://data.pendo.io/data/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": "c9841f7d-57fc-4a50-bc16-7e8904199bb2",
      },
      body: JSON.stringify({
        type: "track",
        event,
        visitorId,
        accountId: accountId ?? visitorId,
        timestamp: Date.now(),
        properties,
      }),
    });
  } catch (err) {
    console.error("[pendo-track] Failed to send event:", event, err);
  }
}
