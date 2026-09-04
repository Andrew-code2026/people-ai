import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, Bell, Building2, CheckCircle2, ChevronRight, CircleUserRound, Clock3, FileText, LockKeyhole, Menu, Plus, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import type { RoleKey } from "../../../drizzle/schema";

const roleConfig: Record<RoleKey, { label: string; eyebrow: string; title: string; description: string; nav: string[]; accent: string }> = {
  SUPER_ADMIN: { label: "Super Admin", eyebrow: "Control de plataforma", title: "Una visión clara de cada empresa", description: "Administra el ecosistema PEOPLE AI con trazabilidad y control centralizado.", nav: ["Resumen", "Empresas", "Usuarios", "Actividad"], accent: "violet" },
  COMPANY_ADMIN: { label: "Company Admin", eyebrow: "Administración empresarial", title: "Tu empresa, en un solo lugar", description: "Configura equipos, accesos y estructura organizacional sin fricción.", nav: ["Resumen", "Empresa", "Usuarios", "Departamentos"], accent: "blue" },
  HR: { label: "Talento Humano", eyebrow: "People operations", title: "El pulso de tu organización", description: "Conecta la operación diaria con una experiencia humana y medible.", nav: ["Dashboard", "Empleados", "Documentos", "Vacaciones"], accent: "teal" },
  FINANCE: { label: "Finanzas", eyebrow: "Inteligencia financiera", title: "Decisiones con contexto", description: "Consulta indicadores financieros autorizados y próximos escenarios.", nav: ["Dashboard", "Costos", "Nómina", "Reportes"], accent: "amber" },
  MANAGER: { label: "Líder de equipo", eyebrow: "Team leadership", title: "Tu equipo, más cerca", description: "Acompaña el desempeño y prioriza lo que necesita atención.", nav: ["Dashboard", "Mi equipo", "Solicitudes", "Objetivos"], accent: "rose" },
  EMPLOYEE: { label: "Colaborador", eyebrow: "Employee experience", title: "Todo lo que necesitas para avanzar", description: "Accede a tu perfil, solicitudes y próximos pasos desde cualquier dispositivo.", nav: ["Inicio", "Mi perfil", "Mis solicitudes", "Capacitación"], accent: "indigo" },
};

const demoRoles = Object.keys(roleConfig) as RoleKey[];
const metrics = [
  { label: "Colaboradores activos", value: "248", change: "+12 este mes", icon: Users, tone: "text-blue-600 bg-blue-50" },
  { label: "Solicitudes pendientes", value: "18", change: "4 requieren atención", icon: Clock3, tone: "text-amber-600 bg-amber-50" },
  { label: "Capacitaciones activas", value: "06", change: "82% de avance", icon: BarChart3, tone: "text-teal-600 bg-teal-50" },
  { label: "Documentos al día", value: "94%", change: "+3.2% vs. anterior", icon: FileText, tone: "text-violet-600 bg-violet-50" },
];

const roleMetrics: Record<RoleKey, typeof metrics> = {
  SUPER_ADMIN: metrics.map((item, index) => ({ ...item, value: ["03", "16", "1,284", "99.1%"][index] })),
  COMPANY_ADMIN: metrics,
  HR: metrics.map((item, index) => ({ ...item, value: ["248", "12", "06", "94%"][index] })),
  FINANCE: metrics.map((item, index) => ({ ...item, label: ["Colaboradores con costo", "Alertas abiertas", "Escenarios activos", "Reportes listos"][index], value: ["248", "04", "08", "92%"][index] })),
  MANAGER: metrics.map((item, index) => ({ ...item, label: ["Personas en mi equipo", "Solicitudes por revisar", "Objetivos activos", "Check-ins completados"][index], value: ["18", "03", "14", "78%"][index] })),
  EMPLOYEE: metrics.map((item, index) => ({ ...item, label: ["Mi equipo", "Mis solicitudes", "Cursos en progreso", "Documentos vigentes"][index], value: ["18", "02", "03", "100%"][index] })),
};

const activity = [
  { initials: "LM", name: "Laura Méndez", action: "completó su onboarding", time: "Hace 12 min", color: "bg-blue-100 text-blue-700" },
  { initials: "JR", name: "Julián Rojas", action: "solicitó una actualización de perfil", time: "Hace 48 min", color: "bg-teal-100 text-teal-700" },
  { initials: "AV", name: "Ana Valentina", action: "inició capacitación de liderazgo", time: "Hace 2 h", color: "bg-violet-100 text-violet-700" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<RoleKey>("COMPANY_ADMIN");
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role];
  const { user, logout } = useAuth();
  const { data: access, isLoading: accessLoading, error: accessError } = trpc.access.me.useQuery(undefined, { retry: false });
  const visibleMetrics = roleMetrics[role];
  const showComingSoon = () => toast.info("Este módulo está preparado para una próxima fase.");

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/15"><Sparkles className="h-4 w-4" /></div><div><div className="font-semibold tracking-tight">PEOPLE AI</div><div className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:block">Human systems, intelligently</div></div></div>
          <div className="hidden items-center gap-3 md:flex"><Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Entorno demo</Badge><button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones"><Bell className="h-4 w-4" /></button>{user && <button onClick={logout} className="text-xs font-medium text-slate-500 hover:text-slate-950">Cerrar sesión</button>}<Avatar className="h-9 w-9 border border-slate-200"><AvatarFallback className="bg-slate-100 text-xs font-semibold">{user?.name?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback></Avatar></div>
          <button className="rounded-lg p-2 md:hidden" aria-label="Abrir menú" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className={`${mobileOpen ? "fixed inset-y-16 left-0 z-20 flex" : "hidden"} w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 md:sticky md:top-16 md:flex md:h-[calc(100vh-4rem)]`}>
          <div className="mb-6 px-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Espacio de trabajo</p><div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm"><Building2 className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">Bivien Demo</p><p className="text-xs text-slate-500">Colombia · Activa</p></div></div></div>
          <nav className="space-y-1">{config.nav.map((item, index) => <button key={item} onClick={index > 0 ? showComingSoon : undefined} className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${index === 0 ? "bg-slate-950 font-medium text-white shadow-md shadow-slate-950/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><span className="flex items-center gap-3"><CircleUserRound className="h-4 w-4 opacity-75" />{item}</span>{index > 0 && <span className="text-[9px] font-semibold uppercase text-slate-400">Próximamente</span>}</button>)}</nav>
          <div className="mt-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><ShieldCheck className="h-4 w-4" /></div><p className="text-sm font-semibold">Seguridad por diseño</p><p className="mt-1 text-xs leading-5 text-slate-300">Cada vista y operación respeta el alcance de tu empresa.</p></div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{config.eyebrow}</p><h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{config.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{config.description}</p></div><Button onClick={() => setLocation("/login")} className="w-full bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800 sm:w-auto"><LockKeyhole className="mr-2 h-4 w-4" />Iniciar sesión</Button></div>
          <Card className="mb-6 overflow-hidden border-0 bg-slate-950 text-white shadow-xl shadow-slate-900/10"><CardContent className="relative p-5 sm:p-7"><div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><Badge className="mb-4 border-0 bg-white/10 text-blue-100">Vista de demostración</Badge><h2 className="text-xl font-semibold tracking-tight">Explora la experiencia según cada rol</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Los indicadores de esta pantalla son ficticios y sirven únicamente para validar la arquitectura visual de la Fase 1.</p></div><div className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 text-teal-300" /> Datos no reales</div></div></CardContent></Card>
          <div className="mb-8 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-medium text-slate-500">Vista:</span>{demoRoles.map(item => <button key={item} onClick={() => setRole(item)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition ${role === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"}`}>{roleConfig[item].label}</button>)}{accessLoading && <Badge variant="outline" className="border-slate-200 bg-white text-slate-400">Validando acceso…</Badge>}{accessError && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Modo demostración sin sesión</Badge>}{access && <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">Acceso: {access.role}</Badge>}</div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visibleMetrics.map(metric => <Card key={metric.label} className="border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon className="h-5 w-5" /></div><span className="text-[11px] font-medium text-teal-600">{metric.change}</span></div><p className="mt-5 text-sm text-slate-500">{metric.label}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{metric.value}</p></CardContent></Card>)}</div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <Card className="border-slate-200/80 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 px-5 py-4"><div><CardTitle className="text-base">Actividad reciente</CardTitle><p className="mt-1 text-xs text-slate-500">Acciones registradas en Bivien Demo</p></div><Button variant="ghost" size="sm" onClick={showComingSoon} className="text-xs text-slate-500">Ver todo <ChevronRight className="ml-1 h-3 w-3" /></Button></CardHeader><CardContent className="p-0">{activity.map(item => <div key={item.name} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><Avatar className="h-9 w-9"><AvatarFallback className={`text-xs font-semibold ${item.color}`}>{item.initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800"><span>{item.name}</span> <span className="font-normal text-slate-500">{item.action}</span></p><p className="mt-1 text-xs text-slate-400">{item.time}</p></div><CheckCircle2 className="h-4 w-4 text-teal-500" /></div>)}</CardContent></Card>
            <Card className="border-slate-200/80 shadow-sm"><CardHeader className="px-5 py-4"><CardTitle className="text-base">Módulos preparados</CardTitle><p className="mt-1 text-xs text-slate-500">Extensiones desacopladas para fases futuras</p></CardHeader><CardContent className="space-y-3 px-5 pb-5">{["HR Assistant", "People Analytics", "Almacenamiento documental", "Integraciones externas"].map(item => <button key={item} onClick={showComingSoon} className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 p-3 text-left transition hover:border-slate-400 hover:bg-slate-50"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100"><Plus className="h-4 w-4 text-slate-500" /></div><span className="text-sm font-medium text-slate-700">{item}</span></div><Badge variant="outline" className="text-[10px] text-slate-400">Próximamente</Badge></button>)}</CardContent></Card>
          </div>
        </main>
      </div>
    </div>
  );
}
