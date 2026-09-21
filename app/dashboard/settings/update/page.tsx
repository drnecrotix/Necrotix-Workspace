import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkForUpdate, currentVersion } from "@/lib/update";
import { requestDeployment } from "./actions";

export const dynamic = "force-dynamic";

export default async function UpdateCenter() {
  const [check, saved] = await Promise.all([checkForUpdate(), prisma.systemSetting.findUnique({ where: { key: "cms.update" } })]);
  const status = saved?.value as { state?: string; message?: string; targetVersion?: string; updatedAt?: string } | null;
  const available = check.state === "available";
  return <main className="project-page"><header className="topbar"><Link className="back" href="/dashboard">← Dashboard</Link><span className="badge">Update center</span></header><section className="project-hero"><span className="eyebrow">System / releases</span><h1>Workspace updates.</h1><p className="lead">Compare the installed release with the signed deployment source and start the configured production workflow.</p></section><section className="update-layout"><div className="card"><div className="row"><div><span className="muted">Installed</span><h2>v{currentVersion}</h2></div><div><span className="muted">Available</span><h2>{check.manifest?.version ? `v${check.manifest.version}` : "Unknown"}</h2></div></div><div className={`update-state ${check.state}`}><b>{check.state === "available" ? "Update available" : check.state === "current" ? "Up to date" : "Check failed"}</b><p>{check.message}</p></div>{check.manifest?.notes?.length ? <div><div className="section-title spaced">Release notes</div><ul className="release-notes">{check.manifest.notes.map(note=><li key={note}>{note}</li>)}</ul></div> : null}<form action={requestDeployment}><button className="button acid" disabled={!available}>{available ? "Deploy update" : "No update required"}</button></form></div><aside className="card"><div className="section-title">Deployment pipeline</div><ol className="pipeline"><li>Check manifest</li><li>Trigger hosting workflow</li><li>Install dependencies</li><li>Apply Prisma migrations</li><li>Build and activate</li></ol>{status && <div className="message"><b>{status.state}</b><p>{status.message}</p>{status.updatedAt && <span className="muted">{new Date(status.updatedAt).toLocaleString()}</span>}</div>}<p className="muted small">The CMS never downloads executable code into the running process. Your hosting provider performs the deployment and keeps rollback history.</p></aside></section></main>;
}
