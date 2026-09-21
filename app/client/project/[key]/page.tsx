import { notFound } from "next/navigation";
import { hashAccessToken } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientProject({ params, searchParams }: { params: Promise<{key:string}>; searchParams: Promise<{token?:string}> }) {
  const [{key},{token}] = await Promise.all([params,searchParams]);
  if (!token) notFound();
  const project = await prisma.project.findFirst({ where:{ key, accessTokens:{some:{tokenHash:hashAccessToken(token),revokedAt:null,expiresAt:{gt:new Date()}}}}, include:{client:true,tasks:{where:{visibleToClient:true},orderBy:{sortOrder:"asc"}},events:{orderBy:{createdAt:"desc"},take:8}} });
  if (!project) notFound();
  const services = project.selectedServices as Array<{id:string;name:string;quantity:number}>;
  const completed = project.tasks.filter(task=>task.status === "DONE").length;
  const progress = project.tasks.length ? Math.round(completed/project.tasks.length*100) : 0;
  return <main className="portal"><div className="row"><div className="brand">NECROTIX / WORKSPACE</div><span className="badge">{project.status.replaceAll("_"," ")}</span></div><section className="portal-head"><span className="eyebrow">{project.reference} / {project.client.name}</span><h1>{project.title}</h1><p className="lead">{project.description ?? "Your project scope, progress and next actions in one place."}</p></section><div className="metrics"><div className="card metric"><span className="muted">Progress</span><strong>{progress}%</strong></div><div className="card metric"><span className="muted">Tasks</span><strong>{project.tasks.length}</strong></div><div className="card metric"><span className="muted">Completed</span><strong>{completed}</strong></div><div className="card metric"><span className="muted">Last update</span><strong style={{fontSize:18}}>{project.updatedAt.toLocaleDateString()}</strong></div></div><section className="workspace"><div className="card"><div className="section-title">Selected services</div><div className="services">{services.map(service=><div className="service" key={service.id}><b>{service.name}</b><div className="muted">Quantity {service.quantity}</div></div>)}</div></div><div className="card"><div className="section-title">Project tasks</div>{project.tasks.map(task=><article className="project" key={task.id}><div><h3>{task.title}</h3><span className="muted">{task.description}</span></div><span className="badge">{task.status.replaceAll("_"," ")}</span></article>)}</div></section></main>;
}
