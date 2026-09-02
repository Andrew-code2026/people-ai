export interface StatusInfo {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}

export function getHiringStatusInfo(
  status?: string | null,
  requiredCount?: number,
  receivedCount?: number
): StatusInfo {
  const isComplete =
    status === "complete" ||
    (requiredCount !== undefined &&
      receivedCount !== undefined &&
      requiredCount > 0 &&
      receivedCount >= requiredCount);

  if (isComplete) {
    return {
      label: "Completo",
      variant: "outline",
      className: "border-teal-200 bg-teal-50 text-teal-700",
    };
  }

  switch (status) {
    case "pending":
      return {
        label: "Pendiente",
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "in_review":
      return {
        label: "En revisión",
        variant: "outline",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "in_progress":
      return {
        label: "En progreso",
        variant: "outline",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "finalized":
      return {
        label: "Finalizado",
        variant: "outline",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "draft":
      return {
        label: "Borrador",
        variant: "outline",
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
    default:
      return {
        label: status ? (status === "pending" ? "Pendiente" : status) : "Pendiente",
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

export function getLinkStatusInfo(status?: string | null, isActive?: boolean): StatusInfo {
  if (isActive) {
    return {
      label: "Activo",
      variant: "default",
      className: "bg-teal-600 text-white",
    };
  }
  switch (status) {
    case "active":
      return {
        label: "Activo",
        variant: "default",
        className: "bg-teal-600 text-white",
      };
    case "expired":
      return {
        label: "Expirado",
        variant: "outline",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    case "revoked":
      return {
        label: "Revocado",
        variant: "outline",
        className: "border-slate-200 bg-slate-100 text-slate-600",
      };
    case "completed":
      return {
        label: "Completado",
        variant: "outline",
        className: "border-teal-200 bg-teal-50 text-teal-700",
      };
    default:
      return {
        label: status || "No generado",
        variant: "outline",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

export function getCommunicationStatusInfo(status?: string | null): StatusInfo {
  switch (status) {
    case "sent":
      return {
        label: "Enviado",
        variant: "default",
        className: "bg-teal-600 text-white",
      };
    case "delivered":
      return {
        label: "Entregado",
        variant: "outline",
        className: "border-teal-200 bg-teal-50 text-teal-700",
      };
    case "opened":
      return {
        label: "Abierto",
        variant: "outline",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "not_sent":
      return {
        label: "No enviado",
        variant: "outline",
        className: "border-slate-200 bg-slate-100 text-slate-600",
      };
    case "error":
      return {
        label: "Error",
        variant: "destructive",
        className: "",
      };
    default:
      return {
        label: status || "Pendiente",
        variant: "outline",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

export function getInsightStatusInfo(status?: string | null): StatusInfo {
  switch (status) {
    case "unread":
      return {
        label: "Sin leer",
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "read":
      return {
        label: "Leída",
        variant: "outline",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "reviewed":
      return {
        label: "Revisada",
        variant: "outline",
        className: "border-violet-200 bg-violet-50 text-violet-700",
      };
    case "resolved":
      return {
        label: "Resuelta",
        variant: "outline",
        className: "border-teal-200 bg-teal-50 text-teal-700",
      };
    default:
      return {
        label: status || "Pendiente",
        variant: "outline",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}
