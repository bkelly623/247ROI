"use client";

import { useState } from "react";
import { Loader2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateHireGateClient } from "@/lib/hire/gate";
import type { DiscoveryState, HireMessage, HireProposal } from "@/lib/hire/types";

type Props = {
  sessionId: string;
  teaserLine: string | null;
  employeeName?: string;
  hoursLabel?: string;
  proposal?: HireProposal | null;
  discovery?: DiscoveryState | null;
  messages?: HireMessage[];
  onUnlocked: (sessionId: string) => void;
};

export function HireGate({
  sessionId,
  teaserLine,
  employeeName,
  hoursLabel,
  proposal,
  discovery,
  messages,
  onUnlocked,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hoursBit = hoursLabel || teaserLine;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = validateHireGateClient({ firstName, phone, email });
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hire/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: "",
          phone,
          email: email.trim(),
          proposal,
          discovery,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not unlock");
      onUnlocked(data.sessionId || sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hire-gate-title"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/20 via-zinc-900 to-zinc-950 px-6 py-6">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-orange-300">
            Hire plan ready
          </p>
          <h2
            id="hire-gate-title"
            className="font-display text-3xl font-bold leading-tight text-zinc-50"
          >
            {employeeName ? `Unlock ${employeeName}` : "Unlock your first hire"}
          </h2>
          <p className="mt-3 text-lg text-zinc-300">
            {hoursBit
              ? `${hoursBit} — A→Z job, how you’d use it, hours back.`
              : "A→Z job, how you’d use it, hours back."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-6">
          <p className="text-base text-zinc-500">
            Name and mobile so we can save the audit and follow up. Email optional.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="hire-first" className="text-base">
              First name
            </Label>
            <Input
              id="hire-first"
              className="h-12 text-base"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Sam"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hire-phone" className="text-base">
              Mobile
            </Label>
            <Input
              id="hire-phone"
              className="h-12 text-base"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-1212"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hire-email" className="text-base">
              Email <span className="font-normal text-zinc-600">(optional)</span>
            </Label>
            <Input
              id="hire-email"
              className="h-12 text-base"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          {error && <p className="text-base text-red-400">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="h-14 w-full text-lg font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                Show the hire plan
                <Unlock className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
