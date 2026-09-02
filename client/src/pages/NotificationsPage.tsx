import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Bell, ArrowUpRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInsightStatusInfo } from "@/lib/statusFormatters";

export default function NotificationsPage() {
  const companyId = 4;
  const notifications = trpc.hiring.notifications.useQuery({ companyId });
  const insights = trpc.ai.insights.useQuery({ companyId });
  const utils = trpc.useUtils();
  const updateInsight = trpc.ai.updateInsight.useMutation({
    onSuccess: () => {
      utils.ai.insights.invalidate({ companyId });
      toast.success("Estado de alerta actualizado");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <DashboardLayout roleOverride="HR">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Centro de actividad
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Notificaciones</h1>
          <p className="mt-2 text-sm text-slate-500">
            Seguimiento de eventos importantes y hallazgos de IA de tu empresa.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-violet-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.isLoading ? (
              <p className="text-sm text-slate-500">Cargando alertas…</p>
            ) : insights.data?.length ? (
              insights.data.map((item) => {
                const insightStatus = getInsightStatusInfo(item.status);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-violet-100 bg-violet-50/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <Badge
                            variant={insightStatus.variant}
                            className={cn("font-normal", insightStatus.className)}
                          >
                            {insightStatus.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                      {item.processId && (
                        <Link
                          href={`/hr/contrataciones/${item.processId}`}
                          className="text-xs font-medium text-blue-700 hover:underline"
                        >
                          Ver contratación{" "}
                          <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    {item.status !== "resolved" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateInsight.isPending}
                          onClick={() =>
                            updateInsight.mutate({
                              companyId,
                              insightId: item.id,
                              status: "read",
                            })
                          }
                        >
                          Marcar leída
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateInsight.isPending}
                          onClick={() =>
                            updateInsight.mutate({
                              companyId,
                              insightId: item.id,
                              status: "reviewed",
                            })
                          }
                        >
                          Revisada
                        </Button>
                        <Button
                          size="sm"
                          disabled={updateInsight.isPending}
                          onClick={() =>
                            updateInsight.mutate({
                              companyId,
                              insightId: item.id,
                              status: "resolved",
                            })
                          }
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Resolver
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No hay AI Insights nuevas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-blue-600" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.isLoading ? (
              <p className="p-6 text-sm text-slate-500">Cargando notificaciones…</p>
            ) : notifications.data?.length ? (
              notifications.data.map((item) => (
                <Link
                  key={item.id}
                  href={item.processId ? `/hr/contrataciones/${item.processId}` : "/hr"}
                  className="flex items-center gap-4 border-b px-6 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                No tienes notificaciones nuevas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
