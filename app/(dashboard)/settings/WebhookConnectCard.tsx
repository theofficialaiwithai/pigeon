"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";

interface Props {
  initialWebhookUrl: string | null;
}

export function WebhookConnectCard({ initialWebhookUrl }: Props) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? "");
  const [saved, setSaved] = useState(!!initialWebhookUrl);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setSaving(true);
    setSaveError(null);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/webhook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save");
      } else {
        setSaved(true);

        try {
          const domain = new URL(webhookUrl.trim()).hostname;
          pendo?.track("webhook_connected", { webhook_domain: domain });
        } catch {
          pendo?.track("webhook_connected", { webhook_domain: null });
        }
      }
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    setSaveError(null);
    setTestResult(null);
    try {
      await fetch("/api/integrations/webhook/disconnect", { method: "POST" });
      setSaved(false);
      setWebhookUrl("");

      pendo?.track("webhook_disconnected");
    } catch {
      setSaveError("Failed to disconnect");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/webhook/test", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setTestResult({ ok: false, message: data.error ?? "Test failed" });
      } else {
        setTestResult({ ok: true, message: "Test payload sent! Check your Zap / Scenario trigger." });
      }

      pendo?.track("webhook_test_sent", {
        test_success: res.ok && !!data.ok,
        webhook_http_status: res.status,
      });
    } catch {
      setTestResult({ ok: false, message: "Network error — please try again" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Webhook URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value);
              setSaved(false);
              setTestResult(null);
            }}
            placeholder="https://hooks.zapier.com/hooks/catch/…"
            className="flex-1 max-w-sm rounded-lg border border-pigeon-border bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-pigeon-primary focus:ring-2 focus:ring-pigeon-primary/20"
          />
          <button
            type="submit"
            disabled={saving || !webhookUrl.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pigeon-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-pigeon-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2Icon size={13} className="animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      </form>

      {/* Connected state */}
      {saved && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            ✓ Connected
          </span>
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pigeon-border bg-white px-3 py-1 text-xs font-semibold text-pigeon-primary hover:bg-pigeon-bg disabled:opacity-50 transition-colors"
          >
            {testing && <Loader2Icon size={12} className="animate-spin" />}
            {testing ? "Sending…" : "Send Test Payload"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="text-xs text-pigeon-muted underline underline-offset-2 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {testResult && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            testResult.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {testResult.message}
        </p>
      )}

      {/* Helper text */}
      <div className="space-y-3 rounded-lg bg-pigeon-bg border border-pigeon-border p-4 text-xs text-pigeon-muted leading-relaxed">
        <div>
          <p className="font-semibold text-gray-700 mb-1">Zapier</p>
          <p>
            Create a Zap → choose <strong>Webhooks by Zapier</strong> → <strong>Catch Hook</strong> as the trigger →
            copy the URL it gives you and paste it above.
          </p>
          <p className="mt-1">
            Add a free <strong>Looping by Zapier</strong> step to turn the emails array into one
            action per email (e.g., one Mailchimp campaign per email). Available on every Zapier
            plan.
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-700 mb-1">Make (formerly Integromat)</p>
          <p>
            Create a Scenario → add a <strong>Custom webhook</strong> trigger → copy its URL and
            paste it above.
          </p>
          <p className="mt-1">
            Use Make&apos;s built-in <strong>Iterator</strong> module on the <code className="font-mono bg-white px-1 rounded">emails</code> array
            to process one email at a time (e.g., one ActiveCampaign campaign per email). Free on
            every Make plan.
          </p>
        </div>
      </div>
    </div>
  );
}
