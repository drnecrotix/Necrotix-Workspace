"use client";

import { useState, useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import { moveTaskToStatus } from "./actions";

type Task = { id: string; title: string; description: string | null; status: TaskStatus };
const columns: Array<{ status: TaskStatus; label: string }> = [{ status: "BACKLOG", label: "Backlog" }, { status: "READY", label: "Ready" }, { status: "IN_PROGRESS", label: "In progress" }, { status: "REVIEW", label: "Review" }, { status: "DONE", label: "Done" }];

export function TaskBoard({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks); const [dragged, setDragged] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  function drop(status: TaskStatus) { if (!dragged) return; const previous = tasks; setTasks(items=>items.map(task=>task.id === dragged ? {...task,status} : task)); startTransition(async()=>{ try { await moveTaskToStatus(projectId, dragged, status); } catch { setTasks(previous); } }); setDragged(null); }
  return <section className={`board ${pending ? "is-saving" : ""}`} aria-label="Project task board">{columns.map(column=><div className="board-column" key={column.status} onDragOver={event=>event.preventDefault()} onDrop={()=>drop(column.status)}><div className="row"><div className="section-title">{column.label}</div><span className="count">{tasks.filter(task=>task.status === column.status).length}</span></div>{tasks.filter(task=>task.status === column.status).map(task=><article className="task-card draggable" key={task.id} draggable onDragStart={()=>setDragged(task.id)} onDragEnd={()=>setDragged(null)}><b>{task.title}</b>{task.description&&<p className="muted">{task.description}</p>}<span className="drag-hint">Drag to move</span></article>)}</div>)}</section>;
}
