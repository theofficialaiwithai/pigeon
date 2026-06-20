"use client";

import { useState } from "react";

interface Props {
  initialAccountName: string | null;
}

export function KitConnectCard({ initialAccountName }: Props) {
  const [accountName, setAccountName] = useState<string | null>(initialAccountName);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/convertkit/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json() as { accountName?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Connection failed");
      } else {
        setAccountName(data.accountName ?? "Kit");
        setApiKey("");

        pendo?.track("kit_integration_connected", {
          account_name: data.accountName ?? "Kit",
        });
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/integrations/convertkit/disconnect", { method: "POST" });
      const previousName = accountName;
      setAccountName(null);

      pendo?.track("kit_integration_disconnected", {
        account_name: previousName,
      });
    } catch {
      setError("Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }

  if (accountName) {
    return (
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          ✓ Connected
        </span>
        <span className="text-sm text-gray-700">{accountName}</span>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="text-xs text-pigeon-muted underline underline-offset-2 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="kit_••••••••"
            autoComplete="off"
            className="w-full rounded-lg border border-pigeon-border bg-white px-3 py-1.5 pr-16 text-sm text-gray-800 outline-none focus:border-pigeon-primary focus:ring-2 focus:ring-pigeon-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-pigeon-muted hover:text-gray-700"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          className="rounded-lg bg-pigeon-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-pigeon-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Connecting…" : "Connect →"}
        </button>
      </div>
      <p className="text-xs text-pigeon-muted">
        Find this in{" "}
        <a
          href="https://app.kit.com/account_settings/developer_settings"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-pigeon-primary"
        >
          Kit → Settings → Developer
        </a>
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
