import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const [projects, activeCount, dueCount, waitingCount, recentEvents] = await Promise.all([
    prisma.project.findMany({ include: { client: true, tasks: { select: { status: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.project.count({ where: { status: { in: ["ACTIVE", "PLANNED", "REVIEW"] } } }),
    prisma.task.count({ where: { status: { not: "DONE" }, dueAt: { lte: nextWeek } } }),
    prisma.clientAction.count({ where: { status: "OPEN" } }),
    prisma.projectEvent.findMany({ include: { project: { select: { reference: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const healthy = projects.filter((project) => project.status !== "WAITING_CLIENT" && project.status !== "ARCHIVED").length;
  const health = projects.length ? Math.round((healthy / projects.length) * 100) : 100;
  return <div className="shell">
    <aside className="sidebar"><div className="brand">NECROTIX<br/>WORKSPACE</div><nav className="nav"><Link href="/dashboard">Overview</Link><a href="#projects">Projects</a><a href="#activity">Activity</a></nav><div className="side-foot">projects.necrotixlab.com<br/>Independent delivery system</div></aside>
    <main className="main"><header className="topbar"><span className="eyebrow">Operations / live workspace</span><span className="badge">Database live</span></header><h1>Project control,<br/>without the noise.</h1><p className="lead">Accepted Services requests become structured projects with client-safe progress and a complete operational trail.</p>
      <section className="metrics"><div className="card metric"><span className="muted">Active projects</span><strong>{activeCount.toString().padStart(2,"0")}</strong></div><div className="card metric"><span className="muted">Due this week</span><strong>{dueCount.toString().padStart(2,"0")}</strong></div><div className="card metric"><span className="muted">Waiting for client</span><strong>{waitingCount.toString().padStart(2,"0")}</strong></div><div className="card metric"><span className="muted">Delivery health</span><strong>{health}%</strong></div></section>
      <section className="workspace"><div className="card" id="projects"><div className="row"><div className="section-title">Projects</div><span className="muted">{projects.length} recent</span></div>{projects.length ? projects.map((project) => { const completed = project.tasks.filter((task) => task.status === "DONE").length; const progress = project.tasks.length ? Math.round(completed / project.tasks.length * 100) : 0; return <a className="project" href={`/dashboard/projects/${project.id}`} key={project.id}><div><span className="eyebrow">{project.reference} / {project.client.name}</span><h3>{project.title}</h3><div className="progress"><span style={{width:`${progress}%`}}/></div></div><span className="badge">{project.status.replaceAll("_"," ")}</span></a>; }) : <p className="empty">Projects accepted in NecrotixLab Services will appear here.</p>}</div>
        <div className="card" id="activity"><div className="section-title">Recent activity</div>{recentEvents.length ? <ul className="activity">{recentEvents.map(event=><li key={event.id}><b>{event.message}</b><br/><span className="muted">{event.project.reference} · {event.createdAt.toLocaleString()}</span></li>)}</ul> : <p className="empty">No activity yet.</p>}</div></section>
    </main>
  </div>;
}
