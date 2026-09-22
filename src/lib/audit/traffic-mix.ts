/** Regional prior, not a measurement or fitted estimate of the audited website. */
export const TRAFFIC_BENCHMARK = {
  version: 'regional-referrals-v1', period: 'August 2026', region: 'North America',
  source: 'https://chatgpt-vs-google.com/', sourceName: 'Ahrefs Web Analytics',
  // Published regional shares of all tracked visits. Unlisted sources remain excluded.
  sources: [
    {name:'Google',group:'google',share:26.38},
    {name:'Bing',group:'search',share:2},
    {name:'Yahoo',group:'search',share:.64},
    {name:'DuckDuckGo',group:'search',share:.50},
    {name:'Yandex',group:'search',share:.05},
    {name:'Ecosia',group:'search',share:.05},
    {name:'Naver',group:'search',share:.01},
    {name:'Brave',group:'search',share:.01},
    {name:'ChatGPT',group:'ai',share:.27},
    {name:'Meta AI',group:'ai',share:.17},
    {name:'Gemini',group:'ai',share:.01},
  ],
} as const;

export function trafficMix() {
 const total=TRAFFIC_BENCHMARK.sources.reduce((n,s)=>n+s.share,0);
 const groups=[{key:'google',label:'Google',color:'#fb923c'},{key:'search',label:'Other search engines',color:'#60a5fa'},{key:'ai',label:'AI assistants',color:'#34d399'}] as const;
 const rows=groups.map(g=>({...g,percent:TRAFFIC_BENCHMARK.sources.filter(s=>s.group===g.key).reduce((n,s)=>n+s.share,0)/total*100}));
 return {rows,denominator:total,leadingProng:rows[0].percent+rows[1].percent>=rows[2].percent?'seo':'ai' as 'seo'|'ai'};
}

export function pieSlice(start: number, percent: number): string {
 const point=(angle:number)=>[150+120*Math.cos(angle*Math.PI/180),150+120*Math.sin(angle*Math.PI/180)];
 const a=point(start),b=point(start+percent*3.6);
 return `M150,150 L${a[0]},${a[1]} A120,120 0 ${percent>50?1:0},1 ${b[0]},${b[1]} Z`;
}
