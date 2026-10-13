const MISSED_CALL_NOTICE =
  "If you call 247ROI LLC and we miss your call, you may receive one automated text acknowledging your inquiry. If you do not reply, no further inquiry texts are sent from that call. Calling does not enroll you in ongoing service updates, review requests, or marketing. Reply STOP to opt out, HELP for help. Msg & data rates may apply.";

export function MissedCallNotice({ className }: { className?: string }) {
  return (
    <p className={["text-sm leading-relaxed text-inherit", className].filter(Boolean).join(" ")}>
      {MISSED_CALL_NOTICE}
    </p>
  );
}
