"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function WhatsAppSettings() {
  const { user, updateWhatsappPhone } = useAuth();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setPhone(user?.whatsappPhone ?? "");
  }, [user?.whatsappPhone]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await updateWhatsappPhone(phone);
      setMessage("WhatsApp number saved");
    } catch {
      setMessage("Failed to save number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
        WhatsApp notifications
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Alerts are sent to this number when a price target is crossed.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="tel"
          placeholder="919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-brand-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !phone.trim()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-brand-500">{message}</p>}
    </section>
  );
}
