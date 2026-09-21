import { login } from "./actions";

export default async function Login({searchParams}:{searchParams:Promise<{error?:string;installed?:string}>}) {
  const {error,installed} = await searchParams;
  return <main className="portal" style={{maxWidth:520}}><div className="brand">NECROTIX / WORKSPACE</div><section className="portal-head"><span className="eyebrow">Secure operations access</span><h1 style={{fontSize:52}}>Admin sign in</h1><p className="lead">Use the workspace access key configured on the server.</p></section>{installed&&<div className="update-state current"><b>CMS installed</b><p>The installer is now locked and the workspace is ready.</p></div>}<form action={login} className="card"><label className="section-title" htmlFor="accessKey">Access key</label><input id="accessKey" name="accessKey" type="password" required autoComplete="current-password" style={{width:"100%",padding:14,background:"#070807",color:"white",border:"1px solid #343a34",borderRadius:8,marginBottom:12}}/>{error&&<p style={{color:"#ff7b72"}}>The access key is not valid.</p>}<button className="button acid" type="submit">Enter workspace</button></form></main>;
}
