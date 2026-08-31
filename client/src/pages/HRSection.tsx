import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bell, BookOpen, Bot, FileText, Settings2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

export type HRSectionKey = "contratacion" | "assistant" | "knowledge" | "notifications" | "settings";
const copy: Record<HRSectionKey, { title: string; eyebrow: string; description: string }> = {
  contratacion: { title: "Contratación", eyebrow: "Automatización documental", description: "Gestiona procesos y prepara expedientes para revisión de Talento Humano." },
  assistant: { title: "HR Assistant", eyebrow: "Asistencia inteligente", description: "Una experiencia centralizada para responder preguntas con información oficial de la empresa." },
  knowledge: { title: "Base de conocimiento", eyebrow: "Información oficial", description: "Administra las fuentes que alimentarán el asistente en una próxima fase." },
  notifications: { title: "Notificaciones", eyebrow: "Centro de actividad", description: "Revisa las alertas relevantes para la operación de Talento Humano." },
  settings: { title: "Configuración", eyebrow: "Canales e integraciones", description: "Controla los canales disponibles para la experiencia HR Assistant." },
};

export default function HRSection({ section }: { section: HRSectionKey }) {
  const [, setLocation] = useLocation();
  const access = trpc.access.me.useQuery(undefined, { retry: false });
  const companyId = access.data?.companyId ?? 4;
  const recruitment = trpc.hr.recruitment.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const knowledge = trpc.hr.knowledge.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const assistant = trpc.hr.assistantPreview.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const config = copy[section];
  const soon = () => toast.info("Esta acción estará disponible en la siguiente fase.");
  return <DashboardLayout roleOverride="HR"><div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><button onClick={() => setLocation("/hr")} className="mb-4 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-1 h-3.5 w-3.5" />Volver al dashboard</button><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{config.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{config.title}</h1><p className="mt-2 text-sm text-slate-500">{config.description}</p></div><Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">Empresa Demo — Talento Humano</Badge></div>
    {section === "contratacion" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-blue-600" />Procesos de contratación</CardTitle><Button onClick={soon} className="bg-slate-950 text-white"><UserPlus className="mr-2 h-4 w-4" />Nueva contratación</Button></CardHeader><CardContent>{recruitment.isLoading ? <Skeleton className="h-28 w-full" /> : recruitment.error ? <p className="text-sm text-rose-600">No se pudo cargar este tenant.</p> : <div className="divide-y">{recruitment.data?.map(candidate => <div key={candidate.id} className="grid gap-2 py-4 sm:grid-cols-4"><span className="font-medium">{candidate.candidateName}</span><span className="text-sm text-slate-500">{candidate.position}</span><span className="text-sm text-slate-500">{candidate.documentsReceived}/{candidate.documentsRequired} documentos</span><Badge variant="outline" className="w-fit">{candidate.status === "complete" ? "Completo" : "Pendiente"}</Badge></div>)}</div>}</CardContent></Card>}
    {section === "assistant" && <Card className="border-0 bg-slate-950 text-white"><CardContent className="max-w-2xl p-8"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Bot className="h-5 w-5 text-teal-300" /></div><h2 className="mt-6 text-2xl font-semibold">PEOPLE AI Assistant</h2><p className="mt-2 text-slate-300">Preview conectado al adapter desacoplado de demo. Aún no consulta un modelo real.</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">Pregunta demo</p><p className="mt-2">¿Cómo solicito un certificado laboral?</p><p className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-300">{assistant.isLoading ? "Consultando…" : assistant.data?.content}</p></div><Button onClick={soon} className="mt-6 border border-white/15 bg-white/10 text-white hover:bg-white/20">Abrir asistente</Button></CardContent></Card>}
    {section === "knowledge" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-violet-600" />Fuentes de conocimiento</CardTitle><Button variant="outline" onClick={soon}>Agregar documento</Button></CardHeader><CardContent>{knowledge.isLoading ? <Skeleton className="h-24 w-full" /> : knowledge.error ? <p className="text-sm text-rose-600">No se pudo cargar la base de conocimiento.</p> : <div className="grid gap-3 sm:grid-cols-2">{knowledge.data?.map(doc => <div key={doc.id} className="rounded-xl border border-dashed p-4"><FileText className="h-4 w-4 text-violet-600" /><p className="mt-3 text-sm font-medium">{doc.title}</p><p className="mt-1 text-xs text-slate-500">{doc.category} · Demo</p></div>)}</div>}</CardContent></Card>}
    {section === "notifications" && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-amber-500" />Actividad reciente</CardTitle></CardHeader><CardContent><div className="rounded-xl bg-slate-50 p-5"><p className="font-medium">Todo está bajo control</p><p className="mt-1 text-sm text-slate-500">No hay notificaciones pendientes en el entorno demo.</p></div></CardContent></Card>}
    {section === "settings" && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4" />Canales e integraciones</CardTitle></CardHeader><CardContent className="space-y-3">{[["Web","Disponible","bg-teal-500"],["WhatsApp","Próximamente","bg-amber-400"],["Microsoft Teams","Próximamente","bg-amber-400"]].map(([name,status,dot])=><div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="font-medium">{name}</span><span className="flex items-center gap-2 text-sm text-slate-500"><i className={`h-2 w-2 rounded-full ${dot}`} />{status}</span></div>)}</CardContent></Card>}
  </div></DashboardLayout>;
}
