"use client";

import { useState } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateGateClient } from "@/lib/audit/gate-validation";
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
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = validateGateClient({ firstName, lastName, phone, email });
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
          lastName,
          phone,
          email,
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hire-gate-title"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/20 via-zinc-900 to-zinc-950 px-5 py-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
            <Lock className="h-3.5 w-3.5" />
            Hire packet sealed
          </div>
          <h2 id="hire-gate-title" className="font-display text-2xl font-bold text-zinc-50">
            {employeeName
              ? `${employeeName} is ready for review`
              : "Your first AI employee is drafted"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {teaserLine ||
              hoursLabel ||
              "Full A→Z job description, hours clawed back, and how you'll use it day one."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 px-5 py-5">
          <p className="text-xs text-zinc-500">
            Drop your details to unlock the hire plan. This also saves your audit so we can
            actually staff the role — not so we can spam you into oblivion.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hire-first">First name</Label>
              <Input
                id="hire-first"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sam"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hire-last">Last name</Label>
              <Input
                id="hire-last"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rivera"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hire-phone">Mobile</Label>
            <Input
              id="hire-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-1212"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hire-email">Email</Label>
            <Input
              id="hire-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                Unlock my hire plan
                <Unlock className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-center text-[11px] text-zinc-600">
            No password circus. Your audit becomes your lead file.
          </p>
        </form>
      </div>
    </div>
  );
}
