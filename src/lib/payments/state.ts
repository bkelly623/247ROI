import type { StripeMode } from "@/lib/payments/config";

export type FulfillmentStatus =
  | "pending"
  | "processing"
  | "expired"
  | "failed"
  | "unrecognized"
  | "paid"
  | "partially_refunded"
  | "refunded";

export type FulfillmentState = {
  accountId: string;
  mode: StripeMode;
  sessionId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  customerId: string | null;
  status: FulfillmentStatus;
  recognized: boolean;
  amountTotal: number | null;
  currency: string | null;
  refundSeen: boolean;
  fullRefund: boolean;
  fulfilledAt: string | null;
  browserBinding: string | null;
};

export type CheckoutAction = {
  kind: "checkout";
  accountId: string;
  mode: StripeMode;
  sessionId: string;
  paymentIntentId: string | null;
  chargeId: string | null;
  customerId: string | null;
  amountTotal: number | null;
  currency: string | null;
  recognized: boolean;
  outcome: "paid" | "processing" | "failed" | "expired" | "unpaid" | "unrecognized";
  browserBinding?: string | null;
};

export type RefundAction = {
  kind: "refund";
  accountId: string;
  mode: StripeMode;
  paymentIntentId: string;
  chargeId: string | null;
  fullRefund: boolean;
};

const RANK: Record<FulfillmentStatus, number> = {
  pending: 10,
  unrecognized: 15,
  processing: 20,
  expired: 30,
  failed: 30,
  paid: 40,
  partially_refunded: 50,
  refunded: 60,
};

export function statusRank(status: FulfillmentStatus): number {
  return RANK[status];
}

function mergeStatus(current: FulfillmentStatus | null, incoming: FulfillmentStatus): FulfillmentStatus {
  if (!current) return incoming;
  const nextRank = RANK[incoming];
  const currentRank = RANK[current];
  if (nextRank < currentRank) return current;
  if (nextRank === currentRank && incoming !== current) return current;
  return incoming;
}

export function identityConflict(existing: string | null, incoming: string | null): boolean {
  return existing != null && incoming != null && existing !== incoming;
}

export function assertIncomingIdentity(existing: FulfillmentState, action: CheckoutAction | RefundAction) {
  const sessionId = action.kind === "checkout" ? action.sessionId : null;
  const customerId = action.kind === "checkout" ? action.customerId : null;
  const browserBinding = action.kind === "checkout" ? action.browserBinding ?? null : null;
  if (
    identityConflict(existing.sessionId, sessionId) ||
    identityConflict(existing.paymentIntentId, action.paymentIntentId) ||
    identityConflict(existing.customerId, customerId) ||
    identityConflict(existing.browserBinding, browserBinding)
  ) {
    throw new Error("payment_identity_conflict");
  }
}

export function combineFulfillments(left: FulfillmentState, right: FulfillmentState): FulfillmentState {
  assertIncomingIdentity(left, {
    kind: "checkout",
    accountId: right.accountId,
    mode: right.mode,
    sessionId: right.sessionId ?? left.sessionId ?? "",
    paymentIntentId: right.paymentIntentId,
    chargeId: right.chargeId,
    customerId: right.customerId,
    amountTotal: right.amountTotal,
    currency: right.currency,
    recognized: right.recognized,
    outcome: "processing",
    browserBinding: right.browserBinding,
  });
  const fulfilledAt = !left.fulfilledAt ? right.fulfilledAt : !right.fulfilledAt ? left.fulfilledAt : left.fulfilledAt < right.fulfilledAt ? left.fulfilledAt : right.fulfilledAt;
  return {
    ...left,
    sessionId: left.sessionId ?? right.sessionId,
    paymentIntentId: left.paymentIntentId ?? right.paymentIntentId,
    chargeId: left.chargeId ?? right.chargeId,
    customerId: left.customerId ?? right.customerId,
    browserBinding: left.browserBinding ?? right.browserBinding,
    amountTotal: left.amountTotal ?? right.amountTotal,
    currency: left.currency ?? right.currency,
    recognized: left.recognized || right.recognized,
    refundSeen: left.refundSeen || right.refundSeen,
    fullRefund: left.fullRefund || right.fullRefund,
    status: mergeStatus(left.status, right.status),
    fulfilledAt,
  };
}

function blank(accountId: string, mode: StripeMode): FulfillmentState {
  return {
    accountId,
    mode,
    sessionId: null,
    paymentIntentId: null,
    chargeId: null,
    customerId: null,
    status: "pending",
    recognized: false,
    amountTotal: null,
    currency: null,
    refundSeen: false,
    fullRefund: false,
    fulfilledAt: null,
    browserBinding: null,
  };
}

function checkoutIncoming(action: CheckoutAction, refundSeen: boolean, fullRefund: boolean): FulfillmentStatus {
  if (!action.recognized && (action.outcome === "paid" || action.outcome === "unrecognized")) return "unrecognized";
  if (action.outcome === "paid") {
    if (refundSeen) return fullRefund ? "refunded" : "partially_refunded";
    return "paid";
  }
  if (action.outcome === "processing") return "processing";
  if (action.outcome === "failed") return "failed";
  if (action.outcome === "expired") return "expired";
  if (action.outcome === "unrecognized") return "unrecognized";
  return "pending";
}

/**
 * Monotonic payment state. A refund never grants fulfillment, including when it
 * arrives before checkout.session.completed. Equal-rank terminals do not replace
 * each other (expired vs failed). Paid does not regress to processing or expired.
 */
export function reduceFulfillment(
  state: FulfillmentState | null,
  action: CheckoutAction | RefundAction,
  nowIso: string,
): { state: FulfillmentState; fulfilledNow: boolean } {
  if (state) assertIncomingIdentity(state, action);
  if (action.kind === "refund") {
    const base = state ?? blank(action.accountId, action.mode);
    const fullRefund = action.fullRefund || base.fullRefund;
    let status = base.status;
    if (base.fulfilledAt || base.status === "paid" || base.status === "partially_refunded" || base.status === "refunded") {
      status = mergeStatus(base.status, fullRefund ? "refunded" : "partially_refunded");
    }
    return {
      fulfilledNow: false,
      state: {
        ...base,
        paymentIntentId: base.paymentIntentId ?? action.paymentIntentId,
        chargeId: action.chargeId ?? base.chargeId,
        refundSeen: true,
        fullRefund,
        status,
      },
    };
  }

  const base = state ?? blank(action.accountId, action.mode);
  const refundSeen = base.refundSeen;
  const fullRefund = base.fullRefund;
  const incoming = checkoutIncoming(action, refundSeen, fullRefund);
  const status = mergeStatus(base.status, incoming);
  const recognized = action.recognized || base.recognized;
  const entitled = recognized && !fullRefund && (status === "paid" || status === "partially_refunded");
  const fulfilledNow = entitled && !base.fulfilledAt;
  return {
    fulfilledNow,
    state: {
      ...base,
      sessionId: base.sessionId ?? action.sessionId,
      paymentIntentId: base.paymentIntentId ?? action.paymentIntentId,
      chargeId: action.chargeId ?? base.chargeId,
      customerId: action.customerId ?? base.customerId,
      amountTotal: action.amountTotal ?? base.amountTotal,
      currency: action.currency ?? base.currency,
      recognized,
      refundSeen,
      fullRefund,
      status,
      fulfilledAt: fulfilledNow ? nowIso : base.fulfilledAt,
      browserBinding: action.browserBinding ?? base.browserBinding,
    },
  };
}
