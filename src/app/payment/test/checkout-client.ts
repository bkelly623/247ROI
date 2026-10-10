export async function requestTestCheckout(priceId: string, request: typeof fetch = fetch): Promise<string> {
  const response = await request("/api/stripe/checkout", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId }),
  });
  if (!response.ok) throw new Error("checkout_failed");
  const body: unknown = await response.json();
  const value = body && typeof body === "object" && "url" in body ? body.url : null;
  if (typeof value !== "string") throw new Error("checkout_failed");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com" || url.port || url.username || url.password || !url.pathname.startsWith("/c/pay/")) throw new Error("checkout_failed");
  return url.href;
}
