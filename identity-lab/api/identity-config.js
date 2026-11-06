// Public browser bootstrap. Never return a server-side secret or service-role key.
export default function handler(req,res){
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
  const url=String(process.env.IDLAB_SUPABASE_URL||"").trim();
  const publishableKey=String(process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY||"").trim();
  let hostValid=false;
  try{const u=new URL(url);hostValid=u.protocol==="https:"&&/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname)&&u.pathname==="/";}catch{}
  const enabled=process.env.IDLAB_ACCOUNTS_ENABLED==="true"&&hostValid&&publishableKey.startsWith("sb_publishable_")&&publishableKey.length>20;
  return res.status(200).json(enabled?{enabled:true,url,publishableKey}:{enabled:false});
}
