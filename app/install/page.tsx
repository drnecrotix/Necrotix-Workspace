import { notFound } from "next/navigation";
import { isInstalled } from "@/lib/installation";
import { installCms } from "./actions";

export const dynamic = "force-dynamic";

export default async function InstallPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isInstalled()) notFound();
  const { error } = await searchParams;
  return <main className="installer"><header><div className="brand">NECROTIX / WORKSPACE</div><span className="badge">First-run setup</span></header><section className="installer-grid"><div><span className="eyebrow">CMS installation</span><h1>Set up the delivery workspace.</h1><p className="lead">This one-time process verifies your installation token, records the CMS installation and creates the initial project templates.</p><ol className="install-steps"><li><b>Database</b><span>Prisma schema and migrations are available.</span></li><li><b>Security</b><span>Admin and integration secrets remain server-side.</span></li><li><b>Workspace</b><span>Default Web, Security and Engineering templates are created.</span></li><li><b>Lock</b><span>The installer becomes unavailable after success.</span></li></ol></div><form className="card install-form" action={installCms}><div><label htmlFor="siteName">Workspace name</label><input id="siteName" name="siteName" defaultValue="Necrotix Workspace" required maxLength={100}/></div><div><label htmlFor="installToken">Installation token</label><input id="installToken" name="installToken" type="password" required minLength={32} autoComplete="one-time-code"/></div>{error && <p className="form-error">The installation token is not valid.</p>}<p className="muted small">After installation this route returns 404 and cannot be used again unless the installation record is intentionally removed from the database.</p><button className="button acid" type="submit">Install CMS</button></form></section></main>;
}
