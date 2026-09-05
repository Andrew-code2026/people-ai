import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Bell, BookOpen, Bot, FileText, Settings2, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getHiringStatusInfo } from "@/lib/statusFormatters";

export type HRSectionKey = "contratacion" | "assistant" | "knowledge" | "notifications" | "settings";
const copy: Record<HRSectionKey, { title: string; eyebrow: string; description: string }> = {
  contratacion: { title: "Contratación", eyebrow: "Automatización documental", description: "Gestiona procesos y prepara expedientes para revisión de Talento Humano." },
  assistant: { title: "People AI Assistant", eyebrow: "Asistencia inteligente", description: "Consulta contrataciones, documentos y pendientes con información registrada en PEOPLE AI." },
  knowledge: { title: "Base de conocimiento", eyebrow: "Información oficial", description: "Administra las fuentes que alimentarán el asistente en una próxima fase." },
  notifications: { title: "Notificaciones", eyebrow: "Centro de actividad", description: "Revisa las alertas relevantes para la operación de Talento Humano." },
  settings: { title: "Configuración", eyebrow: "Canales e integraciones", description: "Controla los canales disponibles para la experiencia HR Assistant." },
};
const suggestedPrompts = ["¿Qué contrataciones requieren atención?", "Muéstrame los candidatos con documentación incompleta.", "¿Cuántas contrataciones están en revisión?", "¿Qué documentos requieren revisión?"];

function AssistantPanel({ companyId }: { companyId: number }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola, Alexa. Soy tu asistente de Talento Humano. Puedo ayudarte a consultar contrataciones, documentos y pendientes. ¿Qué necesitas?" },
  ]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const ask = trpc.ai.ask.useMutation({
    onSuccess: result => {
      setMessages(prev => [...prev, { role: "assistant", content: result.content }]);
      if (result.requiresConfirmation) setPendingAction("La IA propuso una acción sensible. Confirma si deseas continuar al siguiente paso manual; PEOPLE AI no ejecutará cambios automáticamente.");
    },
    onError: error => {
      setMessages(prev => [...prev, { role: "assistant", content: `No pude completar la consulta: ${error.message}` }]);
      toast.error("No se pudo consultar People AI");
    },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden border-0 bg-slate-950 text-white">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-teal-300" />People AI Assistant</CardTitle><Badge className="border border-teal-300/30 bg-teal-300/10 text-teal-200">DEMO · datos del tenant</Badge></div>
          <p className="text-sm text-slate-300">Respuestas basadas únicamente en información autorizada de PEOPLE AI. La IA recomienda; la analista decide.</p>
        </CardHeader>
        <CardContent className="p-0"><AIChatBox messages={messages} onSendMessage={(content: string) => { setMessages(prev => [...prev, { role: "user", content }]); ask.mutate({ companyId, question: content, mode: "demo" }); }} isLoading={ask.isPending} placeholder="Pregunta sobre contrataciones o documentos…" height="560px" suggestedPrompts={suggestedPrompts} emptyStateMessage="Pregunta por pendientes, documentos o estados." /></CardContent>
      </Card>
      <div className="space-y-4">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-teal-600" />Alcance seguro</CardTitle></CardHeader><CardContent className="space-y-3 text-xs leading-5 text-slate-600"><p>El asistente está restringido a tu empresa y rol de Talento Humano.</p><p>No toma decisiones laborales ni ejecuta mutaciones sensibles automáticamente.</p><p>Las consultas se conservan por usuario y empresa para continuidad.</p></CardContent></Card>
        <Card className="border-blue-100 bg-blue-50"><CardContent className="p-4 text-xs leading-5 text-blue-900"><Sparkles className="mb-2 h-4 w-4 text-blue-600" /><p className="font-medium">Próximamente</p><p className="mt-1">Knowledge Base, WhatsApp y Teams están preparados como extensiones, pero no están activos en esta fase.</p></CardContent></Card>
      </div>
      {pendingAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ai-confirm-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Confirmación requerida</p><h2 id="ai-confirm-title" className="mt-2 text-lg font-semibold text-slate-950">Acción sugerida por la IA</h2><p className="mt-3 text-sm leading-6 text-slate-600">{pendingAction}</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setPendingAction(null)}>Cancelar</Button><Button onClick={() => { setPendingAction(null); toast.info("Confirmación registrada. Ejecuta el cambio desde el módulo correspondiente."); }}>Confirmar y revisar</Button></div></div></div>}
    </div>
  );
}

export default function HRSection({ section }: { section: HRSectionKey }) {
  const [, setLocation] = useLocation();
  const access = trpc.access.me.useQuery(undefined, { retry: false });
  const companyId = access.data?.companyId ?? 0;
  const recruitment = trpc.hr.recruitment.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const knowledge = trpc.hr.knowledge.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const config = copy[section];
  const soon = () => toast.info("Esta acción estará disponible en una siguiente fase.");
  return (
    <DashboardLayout roleOverride="HR">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{config.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{config.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{config.description}</p>
          </div>
          <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">Empresa Demo — Talento Humano</Badge>
        </div>
        {section === "assistant" && <AssistantPanel companyId={companyId} />}
        {section === "contratacion" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-blue-600" />Procesos de contratación</CardTitle><Button onClick={soon} className="bg-slate-950 text-white"><UserPlus className="mr-2 h-4 w-4" />Nueva contratación</Button></CardHeader><CardContent>{recruitment.isLoading ? <Skeleton className="h-28 w-full" /> : recruitment.error ? <p className="text-sm text-rose-600">No se pudo cargar este tenant.</p> : <div className="divide-y">{recruitment.data?.map(candidate => { const statusInfo = getHiringStatusInfo(candidate.status, candidate.documentsRequired, candidate.documentsReceived); return <div key={candidate.id} className="grid gap-2 py-4 sm:grid-cols-4"><span className="font-medium">{candidate.candidateName}</span><span className="text-sm text-slate-500">{candidate.position}</span><span className="text-sm text-slate-500">{candidate.documentsReceived}/{candidate.documentsRequired} documentos</span><Badge variant="outline" className={cn("w-fit font-normal", statusInfo.className)}>{statusInfo.label}</Badge></div>; })}</div>}</CardContent></Card>}
        {section === "knowledge" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-violet-600" />Fuentes de conocimiento</CardTitle><Button variant="outline" onClick={soon}>Agregar documento</Button></CardHeader><CardContent>{knowledge.isLoading ? <Skeleton className="h-24 w-full" /> : knowledge.error ? <p className="text-sm text-rose-600">No se pudo cargar la base de conocimiento.</p> : <div className="grid gap-3 sm:grid-cols-2">{knowledge.data?.map(doc => <div key={doc.id} className="rounded-xl border border-dashed p-4"><FileText className="h-4 w-4 text-violet-600" /><p className="mt-3 text-sm font-medium">{doc.title}</p><p className="mt-1 text-xs text-slate-500">{doc.category} · Demo</p></div>)}</div>}</CardContent></Card>}
        {section === "notifications" && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-amber-500" />Actividad reciente</CardTitle></CardHeader><CardContent><div className="rounded-xl bg-slate-50 p-5"><p className="font-medium">Las alertas AI Insights aparecen en el centro de notificaciones</p><p className="mt-1 text-sm text-slate-500">Los hallazgos de documentación y pendientes se mantienen ligados a tu empresa.</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/hr/notifications")}>Abrir centro de notificaciones</Button></div></CardContent></Card>}
        {section === "settings" && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4" />Canales e integraciones</CardTitle></CardHeader><CardContent className="space-y-3">{[["Web","Disponible","bg-teal-500"],["WhatsApp","Próximamente","bg-amber-400"],["Microsoft Teams","Próximamente","bg-amber-400"]].map(([name,status,dot])=><div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="font-medium">{name}</span><span className="flex items-center gap-2 text-sm text-slate-500"><i className={`h-2 w-2 rounded-full ${dot}`} />{status}</span></div>)}</CardContent></Card>}
      </div>
    </DashboardLayout>
  );
}
