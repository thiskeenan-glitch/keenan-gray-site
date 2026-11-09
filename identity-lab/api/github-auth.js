// GitHub connection endpoints: OAuth sign in, status, and safe sign out.
// This endpoint cannot modify third-party sites or publish portfolio changes.
import {oauthConfig,startLogin,finishLoginState,exchangeCode,githubIdentity,
 sessionCookie,readSession,requireSameOrigin,clearCookie,SESSION_COOKIE,STATE_COOKIE} from "../lib/github-session.mjs";
function reply(res,status,data){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 return res.status(status).json(data);
}
export default async function handler(req,res){
 const c=oauthConfig();
 const action=String(req.query?.action||"status");
 res.setHeader("Cache-Control","no-store");
 res.setHeader("Referrer-Policy","no-referrer");
 if(!c)return reply(res,503,{connected:false,configured:false,
  error:"GitHub sign-in is not configured for this Ulab deployment."});
 if(action==="status"){
  if(req.method!=="GET")return reply(res,405,{error:"GET required."});
  const user=readSession(req,c);
  return reply(res,200,{configured:true,connected:!!user,account:user?.login||null});
 }
 if(action==="login"){
  if(req.method!=="GET")return reply(res,405,{error:"GET required."});
  const login=startLogin(c);
  res.setHeader("Set-Cookie",login.cookie);res.writeHead(302,{Location:login.url});res.end();return;
 }
 if(action==="callback"){
  if(req.method!=="GET")return reply(res,405,{error:"GET required."});
  res.setHeader("Set-Cookie",clearCookie(STATE_COOKIE));
  const state=String(req.query?.state||""),code=String(req.query?.code||"");
  const verifier=finishLoginState(req,c,state);
  if(!verifier||!code)return reply(res,400,{error:"GitHub sign-in state was invalid or expired. Start again."});
  try{
   const token=await exchangeCode(c,code,verifier);
   const identity=await githubIdentity(token);
   if(identity.login.toLowerCase()!==c.owner.toLowerCase())
    return reply(res,403,{error:"This private beta permits only its authorized repository owner."});
   res.setHeader("Set-Cookie",[
    clearCookie(STATE_COOKIE),sessionCookie(c,token,c.owner)
   ]);
   res.writeHead(302,{Location:c.origin+"/repair?connected=1"});res.end();return;
  }catch(error){return reply(res,502,{error:String(error.message||"GitHub sign-in failed.").slice(0,160)});}
 }
 if(action==="logout"){
  if(req.method!=="POST"||!requireSameOrigin(req,c))return reply(res,403,{error:"Same-origin POST required."});
  res.setHeader("Set-Cookie",clearCookie(SESSION_COOKIE));
  return reply(res,200,{connected:false});
 }
 return reply(res,404,{error:"Unknown sign-in action."});
}
