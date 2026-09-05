import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRoute } from "wouter";
import {
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_ALLOWED_MIMETYPES,
  formatAllowedExtensions,
  getAcceptAttribute,
  getFileTypeBadgeInfo,
} from "@shared/documentTypes";

const maxBytes = 10 * 1024 * 1024;

export default function CandidatePortalPage() {
  const [, params] = useRoute("/candidate/documents/:token");
  const token = params?.token || "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const portal = trpc.candidatePortal.get.useQuery(
    { token },
    { enabled: token.length >= 20, retry: false }
  );
  const utils = trpc.useUtils();

  const remove = trpc.candidatePortal.remove.useMutation({
    onSuccess: () => {
      utils.candidatePortal.get.invalidate({ token });
      toast.success("Documento eliminado");
    },
    onError: (e) => toast.error(e.message),
  });

  const upload = trpc.candidatePortal.upload.useMutation({
    onSuccess: () => {
      utils.candidatePortal.get.invalidate({ token });
      toast.success("Documento cargado correctamente");
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = trpc.candidatePortal.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message),
  });

  const handleOpenFileInput = (reqId: number, rawAllowedMimeTypes?: string | null) => {
    setSelectedRequirement(reqId);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.accept = getAcceptAttribute(rawAllowedMimeTypes);
      inputRef.current.click();
    }
  };

  const onFile = (file?: File) => {
    if (!file || !selectedRequirement) return;

    if (file.size > maxBytes) {
      toast.error("El archivo supera el tamaño máximo permitido de 10 MB.");
      return;
    }

    const activeReq = portal.data?.requirements.find((r) => r.id === selectedRequirement);
    const rawAllowed = (activeReq as any)?.allowedMimeTypes || DEFAULT_ALLOWED_MIMETYPES;
    const acceptExts = getAcceptAttribute(rawAllowed)
      .split(",")
      .map((ext) => ext.trim().toLowerCase());
    const fileExt = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    const mimeList = rawAllowed.split(",").map((m: string) => m.trim().toLowerCase());

    const isExtMatch = acceptExts.includes(fileExt);
    const isMimeMatch = file.type ? mimeList.includes(file.type.toLowerCase()) : false;

    // Si ni la extensión ni el tipo MIME coinciden, rechazar en frontend
    if (!isExtMatch && !isMimeMatch) {
      toast.error(
        `Formato no admitido. Este documento requiere: ${formatAllowedExtensions(rawAllowed)}`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      upload.mutate({
        token,
        requirementId: selectedRequirement,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: String(reader.result).split(",")[1] || "",
      });
    reader.readAsDataURL(file);
  };

  if (!token || portal.error || !portal.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />
            <h1 className="mt-4 text-xl font-semibold">Este enlace ya no está disponible</h1>
            <p className="mt-2 text-sm text-slate-500">
              Comunícate con Talento Humano para solicitar un nuevo enlace.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { candidate, position, company, requirements, documents, process } = portal.data;
  const received = requirements.filter((r) =>
    documents.some((d) => d.requirementId === r.id)
  ).length;
  const missing = requirements.filter(
    (r) => r.required && !documents.some((d) => d.requirementId === r.id)
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            PEOPLE AI · Incorporación
          </p>
          <h1 className="mt-4 text-3xl font-semibold">¡Bienvenido!</h1>
          <p className="mt-2 text-slate-300">
            {candidate?.fullName}, estamos felices de acompañarte en tu proceso.
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-400">Cargo</span>
              <p className="mt-1 font-medium">{position?.name || "Proceso de contratación"}</p>
            </div>
            <div>
              <span className="text-slate-400">Empresa</span>
              <p className="mt-1 font-medium">{company?.name || "Empresa"}</p>
            </div>
            {process?.documentDeadline && (
              <div className="sm:col-span-2 mt-1 flex items-center gap-2 rounded-xl bg-slate-900/80 p-3 text-xs text-amber-200 border border-amber-500/20">
                <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Fecha límite para cargar documentos:{" "}
                  <strong>
                    {new Date(process.documentDeadline).toLocaleDateString("es-CO", {
                      dateStyle: "long",
                    })}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Tu documentación</CardTitle>
            <p className="text-sm text-slate-500">
              {received} de {requirements.length} documentos completados
            </p>
            <Progress
              value={requirements.length ? (received / requirements.length) * 100 : 0}
              className="mt-3"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {requirements.map((req) => {
              const doc = documents.find((d) => d.requirementId === req.id);
              const allowedMime = (req as any).allowedMimeTypes;
              const badgeInfo = getFileTypeBadgeInfo(allowedMime);

              return (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      doc ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {doc ? <CheckCircle2 className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{req.title}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${badgeInfo.badgeColor}`}
                        title={`Formatos admitidos: ${formatAllowedExtensions(allowedMime)}`}
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        {badgeInfo.badgeText}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500 mt-0.5">
                      {doc
                        ? `${doc.originalName} · cargado`
                        : req.required
                        ? "Pendiente · obligatorio"
                        : "Pendiente · opcional"}
                    </p>
                  </div>
                  {!submitted && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenFileInput(req.id, allowedMime)}
                      >
                        {doc ? "Reemplazar" : "Adjuntar documento"}
                      </Button>
                      {doc && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove.mutate({ token, requirementId: req.id })}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {submitted ? (
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-7 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600" />
              <h2 className="mt-3 text-xl font-semibold text-teal-900">Documentación enviada</h2>
              <p className="mt-2 text-sm text-teal-800">
                Recibimos correctamente tus documentos. Talento Humano los revisará.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {missing.length
                    ? `Te faltan ${missing.length} documentos obligatorios.`
                    : "¡Documentación completa!"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {missing.length
                    ? "Completa el checklist antes de enviar."
                    : "Has cargado todos los documentos requeridos."}
                </p>
              </div>
              <Button
                disabled={missing.length > 0 || submit.isPending}
                onClick={() => submit.mutate({ token })}
                className="bg-blue-600 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar documentación
              </Button>
            </CardContent>
          </Card>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {upload.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Subiendo documento…
          </div>
        )}

        <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Tus documentos se almacenan de forma protegida.
        </p>
      </div>
    </main>
  );
}
