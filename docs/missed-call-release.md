# Missed-call outcomes repair

## Behavior
- Independent child-call progress events handle caller abandonment; Dial action only ends the voice flow.
- Never send just because a phone is ringing. Send after a terminal unanswered event plus approximately one initial ringing burst (2 seconds from provider ringing timestamp), or busy/failed.
- Twilio Number AMD Enable detects voicemail without waiting for a beep or call completion. Human results suppress texts. Carrier voicemail remains connected; 60-second dial window replaces the prior 20-second limit so the previously observed voicemail pickup is not cut off.
- Carrier callbacks do not count actual audible rings. The two-second threshold is an approximation, not an exact ring count.
- AMD is probabilistic and may return unknown or misclassify. Unknown is NOT guessed as missed: withhold text and alert owner on Telegram. A strict zero-error human/voicemail guarantee needs explicit acceptance (e.g. press 1), which is not introduced here.

## Reliability and privacy
- Signed callbacks enqueue in the existing private website-inquiries bucket before HTTP acknowledgment. Absolute 6-second storage deadline avoids blocking the voice callback on SMS processing.
- Next after() runs processing after HTTP response; a one-minute deterministic host worker retries durable failed jobs. Callback connection overrides request retries for transport/5xx failures.
- Immutable event facts tolerate reordering. Use actual child event timestamps, never inbound setup time or Dial callback receipt time, for abandonment eligibility.
- Atomic create-only claim per parent CallSid prevents concurrent SMS attempts. Definite rejections can retry; opt-outs cannot. Ambiguous acceptance/process crash is held for review and owner alert, not blindly resent. This is not an exactly-once-delivery guarantee.
- Private bucket verification precedes caller-number writes and event processing. Calls continue ringing if initial storage is unavailable; signed callbacks recover the parent from Twilio.
- No public website, audit, SMS reply-agent or registered message-copy changes.

## Acceptance
- Local production build and scoped lint passed.
- Offline regression tests cover ringing, human, voicemail during/after message, early abandonment, short hangup, duplicate/concurrent callbacks, reordered timing, storage failures, provider rejection/uncertainty, opt-out and durable job recovery.
- Production readback and host worker activation pending release.
- A real answered call, abandoned call and voicemail/left-message call are still required. Local fixtures and signed synthetic HTTP callbacks do not establish carrier detection accuracy or handset delivery.
- Existing A2P registration/use-case caveat remains separate from the call-flow fix; no registration claim is made here.
