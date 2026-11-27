import {createHash} from "node:crypto";
const formats=new Set(["short_video","carousel","image","text","article"]);
const normalize=(s:string)=>s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
function similar(a:string,b:string){const x=normalize(a),y=normalize(b);if(x===y)return true;const xs=new Set(x.split(" ")),ys=new Set(y.split(" "));return xs.size>=4&&ys.size>=4&&[...xs].filter(w=>ys.has(w)).length/new Set([...xs,...ys]).size>=.8;}
export async function POST(req:Request){
 const auth=req.headers.get("authorization"),base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!auth?.startsWith("Bearer ")||!base||!key)return Response.json({error:"Sign in first."},{status:401});
 const headers={apikey:key,Authorization:auth,"Content-Type":"application/json",Prefer:"return=representation"};
 try{
 const user=await fetch(base+"/auth/v1/user",{headers,cache:"no-store",signal:AbortSignal.timeout(10000)});if(!user.ok)return Response.json({error:"Session expired."},{status:401});
 const p=await req.json();
 const fields=["accountId","title","format","plannedDate","hook","outline","cta","metric"] as const;
 if(!p||fields.some(k=>typeof p[k]!=="string"||!p[k].trim()||p[k].length>(k==="title"?200:k==="outline"?900:400)))return Response.json({error:"Invalid proposal fields."},{status:400});
 if(!/^[0-9a-f-]{36}$/i.test(p.accountId)||!formats.has(p.format)||!/^\d{4}-\d{2}-\d{2}$/.test(p.plannedDate)||!Number.isFinite(Date.parse(p.plannedDate))||new Date(p.plannedDate).toISOString().slice(0,10)!==p.plannedDate||!normalize(p.title))return Response.json({error:"Invalid account, title, format or date."},{status:400});
 const a=await fetch(base+"/rest/v1/social_accounts?select=id,brand_id&id=eq."+p.accountId,{headers,cache:"no-store"});if(!a.ok)throw Error("Account lookup failed");const accounts=await a.json();if(!accounts.length)return Response.json({error:"Account not accessible."},{status:404});
 const approvalKey=createHash("sha256").update(normalize(p.title)).digest("hex");
 const existing=await fetch(base+"/rest/v1/marketing_posts?select=id,title,status,approval_key&status=neq.cancelled&limit=1000",{headers,cache:"no-store"});if(!existing.ok)throw Error("Post lookup failed");const posts=await existing.json() as {id:string;title:string;status:string;approval_key:string|null}[];
 const exact=posts.find(x=>x.approval_key===approvalKey);if(exact)return Response.json({id:exact.id,alreadyAdded:true});
 if(posts.length>=1000)return Response.json({error:"Approval requires a complete duplicate check. The workspace has reached the current 1,000-record limit."},{status:409});
 if(posts.some(x=>similar(x.title,p.title)))return Response.json({error:"A similar title already exists. Revise the proposal before approval."},{status:409});
 const r=await fetch(base+"/rest/v1/marketing_posts",{method:"POST",headers,body:JSON.stringify({account_id:p.accountId,title:p.title.trim(),format:p.format,planned_date:p.plannedDate,status:"draft",campaign:typeof p.campaign==="string"?p.campaign.trim().slice(0,150):"",hook:["Hook: "+p.hook,"Creative outline: "+p.outline,"CTA: "+p.cta,"Measure: "+p.metric].join("\n"),approval_key:approvalKey,approved_at:new Date().toISOString()})});
 if(r.status===409)return Response.json({error:"This proposal has already been added or conflicts with an existing record."},{status:409});
 if(!r.ok)throw Error("Save failed");const rows=await r.json();return Response.json({id:rows[0]?.id,alreadyAdded:false},{status:201});
 }catch{return Response.json({error:"Unable to add proposal. Check your session and Supabase connection."},{status:503})}
}
