export async function readHireBody(req: Request): Promise<unknown> {
  const origin=req.headers.get('origin');
  // Next's internal URL can be localhost behind its listener/proxy. Compare the actual Host.
  if(origin && new URL(origin).host!==(req.headers.get('host')||new URL(req.url).host))throw new Error('Cross-origin write blocked');
  if (Number(req.headers.get('content-length')||0)>16000) throw new Error('Request too large');
  const reader=req.body?.getReader();
  if (!reader) return {};
  const parts:Uint8Array[]=[]; let size=0;
  try {
    while(true) { const {value,done}=await reader.read(); if(done) break; size+=value.byteLength; if(size>16000){ await reader.cancel(); throw new Error('Request too large'); } parts.push(value); }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');
}
