import assert from "node:assert/strict";
import { testCheckoutPrice } from "../src/app/payment/test/test-config";
import { requestTestCheckout } from "../src/app/payment/test/checkout-client";
async function main() {
  for (const mode of [undefined, "live", "invalid", "test"]) {
    assert.equal(await testCheckoutPrice({ STRIPE_MODE: mode } as unknown as NodeJS.ProcessEnv), null);
  }
  const mock = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
  for (const url of [null, "http://checkout.stripe.com/c/pay/test", "https://checkout.stripe.com.evil.com/c/pay/test", "https://user@checkout.stripe.com/c/pay/test", "https://checkout.stripe.com:444/c/pay/test", "https://evil.com/", "/local", "javascript:alert(1)", "https://checkout.stripe.com/not-checkout"]) {
    await assert.rejects(requestTestCheckout("price_test", mock({ url })));
  }
  await assert.rejects(requestTestCheckout("price_test", mock({}, 503)));
  await assert.rejects(requestTestCheckout("price_test", (async () => { throw new Error("offline"); }) as typeof fetch));
  await assert.rejects(requestTestCheckout("price_test", (async () => new Response("not json")) as typeof fetch));
  const valid = "https://checkout.stripe.com/c/pay/cs_test_fixture";
  assert.equal(await requestTestCheckout("price_test", (async (url, init) => {
    assert.equal(url, "/api/stripe/checkout");
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.method, "POST");
    assert.equal(init?.cache, "no-store");
    assert.deepEqual(JSON.parse(init?.body as string), { priceId: "price_test" });
    return new Response(JSON.stringify({ url: valid }));
  }) as typeof fetch), valid);
  console.log("stripe test entry: mode/config gates, rejected responses, network/JSON errors, safe URL and same-origin request PASS");
}
main().catch(() => { console.error("stripe test entry FAILED"); process.exitCode = 1; });
