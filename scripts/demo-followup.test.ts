import assert from "node:assert/strict";
import { demoFollowupEligibility, type DemoFollowupFacts } from "../src/lib/demo-followup";

const ready: DemoFollowupFacts = {
  confirmedDemoProspect: true,
  explicitSmsPermission: true,
  recipient: "+12025550123",
  callCompleted: true,
  booking: "no_booking",
  previousFollowupClaim: false,
  audience: "demo_prospect",
  optedOut: false,
  declined: false,
  duplicateCallback: false,
};

let passed = 0;
function check(name: string, fn: () => void) { fn(); passed++; console.log("PASS", name); }

check("confirmed demo prospect with explicit permission and no booking is eligible but not delivered", () => {
  const decision = demoFollowupEligibility(ready);
  assert.equal(decision.eligible, true);
  assert.equal(decision.delivery, "off");
});

check("booked, uncertain, and non-prospect outcomes stay ineligible", () => {
  const cases: Array<[Partial<DemoFollowupFacts>, string]> = [
    [{ booking: "booked" }, "appointment_booked"],
    [{ booking: "uncertain" }, "booking_uncertain"],
    [{ audience: "support" }, "audience_excluded"],
    [{ audience: "existing_customer" }, "audience_excluded"],
    [{ audience: "vendor" }, "audience_excluded"],
    [{ audience: "wrong_number" }, "audience_excluded"],
    [{ audience: "spam" }, "audience_excluded"],
    [{ audience: "unknown" }, "audience_excluded"],
    [{ confirmedDemoProspect: false }, "demo_prospect_required"],
    [{ explicitSmsPermission: false }, "sms_permission_required"],
    [{ recipient: "" }, "recipient_unknown"],
    [{ recipient: "2025550123" }, "recipient_unknown"],
    [{ callCompleted: false }, "call_not_completed"],
    [{ previousFollowupClaim: true }, "followup_already_claimed"],
    [{ optedOut: true }, "opt_out_or_decline"],
    [{ declined: true }, "opt_out_or_decline"],
    [{ duplicateCallback: true }, "duplicate_callback"],
  ];
  for (const [patch, reason] of cases) {
    const decision = demoFollowupEligibility({ ...ready, ...patch });
    assert.equal(decision.eligible, false, reason);
    assert.equal(decision.delivery, "off");
    assert.equal(decision.reason, reason);
  }
});

check("model inference cannot override authoritative booking or consent", () => {
  const booked = demoFollowupEligibility({ ...ready, booking: "booked", model: { booking: "no_booking", audience: "demo_prospect", smsPermission: true } });
  assert.equal(booked.eligible, false);
  assert.equal(booked.reason, "appointment_booked");
  const noConsent = demoFollowupEligibility({ ...ready, explicitSmsPermission: false, model: { smsPermission: true, booking: "no_booking" } });
  assert.equal(noConsent.eligible, false);
  assert.equal(noConsent.reason, "sms_permission_required");
  const unknown = demoFollowupEligibility({ ...ready, audience: "unknown", model: { audience: "demo_prospect" } });
  assert.equal(unknown.eligible, false);
  const authoritative = demoFollowupEligibility({ ...ready, model: { booking: "booked", audience: "spam", smsPermission: false } });
  assert.equal(authoritative.eligible, true);
  assert.equal(authoritative.delivery, "off");
});

console.log(JSON.stringify({ passed, deliveryEnabled: false }));
