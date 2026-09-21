import Link from "next/link";

const projects = [
  { ref:"NL-1042", title:"Industrial landing system", client:"Kreatrics", status:"Active", progress:64 },
  { ref:"NL-1041", title:"CNC production package", client:"Private client", status:"Review", progress:82 },
  { ref:"NL-1038", title:"Community operations portal", client:"BG-GAMER", status:"Waiting client", progress:45 },
];

export default function Dashboard() {
  return <div className="shell">
    <aside className="sidebar"><div className="brand">NECROTIX<br/>WORKSPACE</div><nav className="nav"><Link href="/dashboard">Overview</Link><a href="#projects">Projects</a><a href="#tasks">Tasks</a><a href="#clients">Clients</a><a href="#integration">Integration</a></nav><div className="side-foot">projects.necrotixlab.com<br/>Independent delivery system</div></aside>
    <main className="main">
      <header className="topbar"><span className="eyebrow">Operations / live workspace</span><button className="button">New project +</button></header>
      <h1>Project control,<br/>without the noise.</h1><p className="lead">Requests accepted in NecrotixLab Services become structured projects here, with client-safe progress and a complete operational trail.</p>
      <section className="metrics">
        <div className="card metric"><span className="muted">Active projects</span><strong>06</strong><span className="eyebrow">+2 this month</span></div>
        <div className="card metric"><span className="muted">Due this week</span><strong>11</strong><span className="eyebrow">3 high priority</span></div>
        <div className="card metric"><span className="muted">Waiting review</span><strong>04</strong><span className="eyebrow">Client action</span></div>
        <div className="card metric"><span className="muted">Delivery health</span><strong>92%</strong><span className="eyebrow">On schedule</span></div>
      </section>
      <section className="workspace">
        <div className="card" id="projects"><div className="row"><div className="section-title">Priority projects</div><span className="muted">View all →</span></div>{projects.map(p=><article className="project" key={p.ref}><div><span className="eyebrow">{p.ref} / {p.client}</span><h3>{p.title}</h3><div className="progress"><span style={{width:`${p.progress}%`}}/></div></div><span className="badge">{p.status}</span></article>)}</div>
        <div className="card"><div className="section-title">Recent activity</div><ul className="activity"><li><b>Scope imported</b><br/><span className="muted">NL-1042 from Services</span></li><li><b>Deliverable ready</b><br/><span className="muted">Toolpath preview v3</span></li><li><b>Client feedback</b><br/><span className="muted">2 annotations received</span></li><li><b>Status synced</b><br/><span className="muted">NecrotixLab updated</span></li></ul></div>
      </section>
    </main>
  </div>;
}
