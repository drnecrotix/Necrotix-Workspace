import Link from "next/link";

export default function Home() {
  return <main className="portal">
    <div className="row"><div className="brand">NECROTIX / WORKSPACE</div><span className="eyebrow">Connected to NecrotixLab</span></div>
    <section className="portal-head">
      <span className="eyebrow">Project delivery system</span>
      <h1>Work, made visible.</h1>
      <p className="lead">A focused workspace where NecrotixLab clients can follow milestones, review deliverables and see exactly what happens next.</p>
      <div style={{display:"flex",gap:10,marginTop:28}}><Link className="button acid" href="/dashboard">Open workspace</Link><a className="button" href="https://necrotixlab.com/services">Explore services</a></div>
    </section>
    <div className="metrics">
      <div className="card metric"><span className="eyebrow">01</span><strong>Clear scope</strong><span className="muted">Selected services arrive with the original brief.</span></div>
      <div className="card metric"><span className="eyebrow">02</span><strong>Live status</strong><span className="muted">One source of truth for progress and review.</span></div>
      <div className="card metric"><span className="eyebrow">03</span><strong>Client view</strong><span className="muted">Private, expiring project access.</span></div>
      <div className="card metric"><span className="eyebrow">04</span><strong>Independent</strong><span className="muted">Separate releases, database and deployment.</span></div>
    </div>
  </main>;
}
