"use client";
import {useEffect,useMemo,useState} from "react";
type Brand={id:string;name:string};
type Account={id:string;brand_id:string;platform:string;handle:string};
type Post={id:string;account_id:string;title:string;format:string;post_url:string|null;published_at:string|null;planned_date:string|null;status:string;views:number|null;likes:number|null;comments:number|null;shares:number|null;metrics_observed_at:string|null};
const fields=["views","likes","comments","shares"] as const;
type Field=typeof fields[number];
const format=(n:number|null)=>n===null?"—":n.toLocaleString();
const compact=(n:number)=>Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(n);
const dayLabel=(s:string)=>new Date(s+"T12:00:00Z").toLocaleDateString("en",{month:"short",day:"numeric",timeZone:"UTC"});
function SeriesChart({data,cumulative=false}:{data:{day:string;value:number}[];cumulative?:boolean}){
 if(!data.length)return <div className="chart-empty">No measured views in this period.</div>;
 let total=0;const points=data.map(d=>({day:d.day,value:cumulative?(total+=d.value):d.value}));
 const max=Math.max(...points.map(d=>d.value),1),w=640,h=180,left=48,right=18,top=18,bottom=35;
 const first=Date.parse(points[0].day),last=Date.parse(points[points.length-1].day);
 const x=(i:number)=>left+(first===last?(w-left-right)/2:(Date.parse(points[i].day)-first)/(last-first)*(w-left-right));
 const y=(n:number)=>top+(1-n/max)*(h-top-bottom);
 const line=points.map((p,i)=>x(i)+","+y(p.value)).join(" ");
 return <svg className="analytics-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={cumulative?"Cumulative measured views by publication date":"Measured views grouped by publication date"}>
 {Array.from({length:4},(_,i)=>{const v=max*i/3;return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 4"/><text x={left-8} y={y(v)+4} textAnchor="end">{compact(v)}</text></g>})}
 {cumulative&&points.length>1&&<polygon points={`${x(0)},${y(0)} ${line} ${x(points.length-1)},${y(0)}`} fill="var(--accent-soft)"/>}
 {points.length>1&&<polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round"/>}
 {points.map((p,i)=><circle key={p.day} cx={x(i)} cy={y(p.value)} r={3.5} fill="var(--accent)"><title>{dayLabel(p.day)}: {format(p.value)} views</title></circle>)}
 {points.map((p,i)=>(i===0||i===points.length-1||(points.length<=5&&i>0&&x(i)-x(i-1)>60&&x(points.length-1)-x(i)>60))&&<text key={p.day} x={x(i)} y={h-10} textAnchor="middle">{dayLabel(p.day)}</text>)}
 </svg>
}

export default function Performance({token,brands,accounts,brandId,onBrand}:{token:string;brands:Brand[];accounts:Account[];brandId:string;onBrand:(id:string)=>void}){
 const [posts,setPosts]=useState<Post[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[period,setPeriod]=useState(30),[accountId,setAccountId]=useState("all"),[sort,setSort]=useState<Field|"published_at">("views"),[ascending,setAscending]=useState(false);
 useEffect(()=>{let live=true;const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!base||!key)return;
 fetch(base+"/rest/v1/marketing_posts?select=id,account_id,title,format,post_url,published_at,planned_date,status,views,likes,comments,shares,metrics_observed_at&status=eq.published&order=published_at.desc,id.asc&limit=1000",{headers:{apikey:key,Authorization:"Bearer "+token},cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Unable to retrieve post performance.");return r.json()}).then(v=>{if(live){setPosts(v);setError("");setLoading(false)}}).catch(e=>{if(live){setError(e.message);setLoading(false)}});return()=>{live=false}},[token,reload]);
 const available=accounts.filter(a=>brandId==="all"||a.brand_id===brandId);
 const visible=useMemo(()=>{const allowed=new Set(accounts.filter(a=>brandId==="all"||a.brand_id===brandId).map(a=>a.id));const cutoff=new Date();cutoff.setDate(cutoff.getDate()-period);return posts.filter(p=>allowed.has(p.account_id)&&(accountId==="all"||p.account_id===accountId)&&(!period||!!p.published_at&&Date.parse(p.published_at)>=cutoff.getTime()&&Date.parse(p.published_at)<=Date.now()));},[accounts,brandId,accountId,period,posts]);
 const values=fields.map(f=>{const measured=visible.filter(p=>p[f]!=null);return {f,total:measured.length?measured.reduce((n,p)=>n+(p[f]??0),0):null,count:measured.length}});
 const byDay=new Map<string,number>();for(const p of visible){if(p.views===null||!p.published_at)continue;const day=p.published_at.slice(0,10);byDay.set(day,(byDay.get(day)??0)+p.views);}
 const series=Array.from(byDay,([day,value])=>({day,value})).sort((a,b)=>a.day.localeCompare(b.day));
 const ranked=[...visible].filter(p=>p.views!=null).sort((a,b)=>(b.views??0)-(a.views??0)).slice(0,3);
 const sorted=[...visible].sort((a,b)=>{const x=a[sort],y=b[sort];if(x==null)return y==null?0:1;if(y==null)return -1;const cmp=typeof x==="string"&&typeof y==="string"?x.localeCompare(y):Number(x)-Number(y);return ascending?cmp:-cmp;});
 const accountLabel=(id:string)=>{const a=accounts.find(a=>a.id===id);return a?a.platform+" · @"+a.handle:"Unknown account"};
 function setColumn(f:Field|"published_at"){if(sort===f)setAscending(v=>!v);else{setSort(f);setAscending(false)}}
 return <div className="page-stack"><section className="toolbar"><div><h2>Content performance</h2><p className="muted">{loading?"Loading stored records…":visible.length+" published records in scope"} · Snapshot metrics</p></div><div className="toolbar-actions"><label className="sr-only" htmlFor="analytics-brand">Brand</label><select id="analytics-brand" value={brandId} onChange={e=>{onBrand(e.target.value);setAccountId("all")}}><option value="all">All brands</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><label className="sr-only" htmlFor="analytics-account">Account</label><select id="analytics-account" value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="all">All accounts</option>{available.map(a=><option value={a.id} key={a.id}>{a.platform} · @{a.handle}</option>)}</select><div className="segmented" aria-label="Publication period">{[7,30,90,0].map(d=><button key={d} aria-pressed={period===d} className={period===d?"selected":""} onClick={()=>setPeriod(d)}>{d?d+"d":"All"}</button>)}</div><button onClick={()=>{setLoading(true);setReload(v=>v+1)}}>Reload</button></div></section>
 {error&&<p role="alert" className="notice">{error}</p>}
 <div className="metrics">{values.map(v=><div className="panel metric-card" key={v.f}><p className="muted metric-label">{v.f}</p><strong>{format(v.total)}</strong><small>{v.count} / {visible.length} posts measured</small></div>)}</div>
 <section><div className="section-heading"><h2>Top posts</h2><small>Ranked by recorded views</small></div>{ranked.length?<div className="top-post-grid">{ranked.map(p=><article className="panel top-post" key={p.id}><div className="format-tile" aria-hidden="true">{p.format==="short_video"?"▶":p.format==="carousel"?"▤":"▧"}</div><div><small>{accountLabel(p.account_id)}</small><h3>{p.title}</h3><strong>{format(p.views)} views</strong><p className="muted">{format(p.likes)} likes · {format(p.comments)} comments</p>{p.post_url?.startsWith("https://")&&<a href={p.post_url} target="_blank" rel="noreferrer">Open original ↗</a>}</div></article>)}</div>:<div className="panel empty-state">No measured posts in this selection.</div>}</section>
 <div className="chart-grid"><section className="panel"><div className="section-heading"><h3>Views by day posted</h3><small>Measured dates</small></div><SeriesChart data={series}/></section><section className="panel"><div className="section-heading"><h3>Cumulative views by day posted</h3><small>Known subtotal</small></div><SeriesChart data={series} cumulative/></section></div>
 <p className="muted">Charts group the latest recorded post views by UTC publication date. They do not show views earned on each day or historical growth. Missing metrics are excluded, not replaced by zero. Account totals may overlap with paid distribution.</p>
 <section><div className="section-heading"><h2>By account</h2><small>Published records</small></div><div className="table-scroll"><table><thead><tr><th>Account</th><th>Posts</th>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{available.filter(a=>accountId==="all"||accountId===a.id).map(a=>{const group=visible.filter(p=>p.account_id===a.id);return <tr key={a.id}><td>{a.platform} · @{a.handle}</td><td>{group.length}</td>{fields.map(f=>{const measured=group.filter(p=>p[f]!=null);return <td key={f}>{format(measured.length?measured.reduce((n,p)=>n+(p[f]??0),0):null)}</td>})}</tr>})}</tbody></table></div></section>
 <section><div className="section-heading"><h2>Posts</h2><small>{visible.length} records</small></div><div className="table-scroll"><table><thead><tr><th>Post</th><th>Account</th><th><button className="sort-button" onClick={()=>setColumn("published_at")}>Posted {sort==="published_at"?(ascending?"↑":"↓"):"↕"}</button></th>{fields.map(f=><th key={f}><button className="sort-button" onClick={()=>setColumn(f)}>{f} {sort===f?(ascending?"↑":"↓"):"↕"}</button></th>)}</tr></thead><tbody>{sorted.map(p=><tr key={p.id}><td className="post-title">{p.post_url?.startsWith("https://")?<a href={p.post_url} target="_blank" rel="noreferrer">{p.title}</a>:p.title}<small>{p.format.replaceAll("_"," ")}</small></td><td>{accountLabel(p.account_id)}</td><td>{p.published_at?dayLabel(p.published_at.slice(0,10)):"—"}</td>{fields.map(f=><td key={f}>{format(p[f])}</td>)}</tr>)}</tbody></table></div>{!sorted.length&&<div className="empty-state">No published posts in this selection. Add verified records in Historical Import.</div>}</section>
 <small>Coverage: up to 1,000 stored published records. Figures are not synchronized automatically.</small></div>
}
