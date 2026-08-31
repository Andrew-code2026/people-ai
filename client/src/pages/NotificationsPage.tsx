import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Bell, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function NotificationsPage() {
  const companyId = 4; const notifications = trpc.hiring.notifications.useQuery({ companyId });
  return <DashboardLayout roleOverride="HR"><div className="mx-auto max-w-5xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Centro de actividad</p><h1 className="mt-2 text-3xl font-semibold">Notificaciones</h1><p className="mt-2 text-sm text-slate-500">Seguimiento de eventos importantes de tu empresa.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-blue-600" />Actividad reciente</CardTitle></CardHeader><CardContent className="p-0">{notifications.isLoading ? <p className="p-6 text-sm text-slate-500">Cargando notificaciones…</p> : notifications.data?.length ? notifications.data.map(item => <Link key={item.id} href={item.processId ? `/hr/contrataciones/${item.processId}` : "/hr"} className="flex items-center gap-4 border-b px-6 py-5 transition hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><Bell className="h-4 w-4" /></div><div className="flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("es-CO")}</p></div><ArrowUpRight className="h-4 w-4 text-slate-400" /></Link>) : <div className="p-8 text-center text-sm text-slate-500">No tienes notificaciones nuevas.</div>}</CardContent></Card></div></DashboardLayout>;
}
