import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getDashboardForRole, ROLE_LABELS } from "../../../server/authorization";
import type { RoleKey } from "../../../drizzle/schema";
import { AlertCircle, ArrowLeft, Building2, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function RoleDashboard({ expectedRole }: { expectedRole: RoleKey }) {
  const [, setLocation] = useLocation();
  const accessQuery = trpc.access.me.useQuery(undefined, { retry: false });
  const access = accessQuery.data;
  const companyId = access?.companyId ?? 0;
  const companiesQuery = trpc.platform.companies.useQuery(undefined, { enabled: Boolean(access?.role === "SUPER_ADMIN") });
  const employeesQuery = trpc.company.employees.useQuery({ companyId }, { enabled: Boolean(access?.companyId && ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"].includes(access.role)) });
  const isWrongRole = Boolean(access && access.role !== expectedRole && access.role !== "SUPER_ADMIN");

  return <DashboardLayout>
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Área protegida</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard de {ROLE_LABELS[expectedRole]}</h1><p className="mt-2 text-sm text-muted-foreground">Los datos están filtrados por el contexto empresarial validado en backend.</p></div><Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 text-teal-700">Sesión segura · {expectedRole}</Badge></div>
      {accessQuery.isLoading && <Card><CardContent className="space-y-3 p-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /><Skeleton className="h-20 w-full" /></CardContent></Card>}
      {accessQuery.error && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-6 text-amber-800"><AlertCircle className="h-5 w-5" /><div><p className="font-medium">No hay una sesión empresarial activa</p><p className="text-sm">Inicia sesión desde la pantalla principal para acceder al dashboard.</p></div></CardContent></Card>}
      {isWrongRole && <Card className="border-rose-200 bg-rose-50"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 text-rose-800"><div><p className="font-medium">Este dashboard no corresponde a tu rol</p><p className="text-sm">Tu acceso actual es {access?.role}.</p></div><Button variant="outline" onClick={() => setLocation(getDashboardForRole(access!.role))}><ArrowLeft className="mr-2 h-4 w-4" />Ir a mi dashboard</Button></CardContent></Card>}
      {!accessQuery.isLoading && !accessQuery.error && !isWrongRole && <>
        <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><Building2 className="h-5 w-5 text-blue-600" /><p className="mt-4 text-sm text-muted-foreground">Empresa activa</p><p className="mt-1 text-xl font-semibold">{access?.role === "SUPER_ADMIN" ? "Toda la plataforma" : `Empresa #${access?.companyId}`}</p></CardContent></Card><Card><CardContent className="p-5"><Users className="h-5 w-5 text-teal-600" /><p className="mt-4 text-sm text-muted-foreground">Empleados visibles</p><p className="mt-1 text-xl font-semibold">{employeesQuery.isLoading ? "…" : employeesQuery.data?.length ?? 0}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Módulos disponibles</p><p className="mt-1 text-xl font-semibold">1 activo</p><p className="mt-2 text-xs text-muted-foreground">El resto aparece como Próximamente.</p></CardContent></Card></div>
        <Card><CardHeader><CardTitle>{expectedRole === "SUPER_ADMIN" ? "Empresas de la plataforma" : "Personal del contexto empresarial"}</CardTitle></CardHeader><CardContent>{expectedRole === "SUPER_ADMIN" ? (companiesQuery.isLoading ? <Skeleton className="h-20 w-full" /> : companiesQuery.error ? <p className="text-sm text-rose-600">No se pudo cargar la lista de empresas.</p> : companiesQuery.data?.length ? <div className="divide-y">{companiesQuery.data.map(company => <div key={company.id} className="flex items-center justify-between py-3"><div><p className="font-medium">{company.name}</p><p className="text-xs text-muted-foreground">{company.city} · {company.industry}</p></div><Badge variant="outline">{company.status === "active" ? "Activa" : company.status === "suspended" ? "Suspendida" : "Archivada"}</Badge></div>)}</div> : <p className="py-6 text-center text-sm text-muted-foreground">No hay empresas para mostrar.</p>) : (employeesQuery.isLoading ? <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : employeesQuery.error ? <p className="text-sm text-rose-600">No se pudo cargar el personal de esta empresa.</p> : employeesQuery.data?.length ? <div className="divide-y">{employeesQuery.data.map(employee => <div key={employee.id} className="flex items-center justify-between py-3"><div><p className="font-medium">{employee.firstName} {employee.lastName}</p><p className="text-xs text-muted-foreground">{employee.position || "Colaborador"} · {employee.employeeCode}</p></div><Badge variant="outline">{employee.employmentStatus === "active" ? "Activo" : employee.employmentStatus === "leave" ? "Licencia" : employee.employmentStatus === "terminated" ? "Retirado" : employee.employmentStatus}</Badge></div>)}</div> : <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay empleados registrados en este contexto.</p>)}</CardContent></Card>
      </>}
    </div>
  </DashboardLayout>;
}
