import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Briefcase,
  Sparkles,
  Trash2,
  CheckCircle2,
  Search,
  ShieldCheck,
  Layers,
  Clock,
  AlertCircle,
  Pencil,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const DEFAULT_TEMPLATE_NAME = "Expediente de Ingreso Estándar";

const STANDARD_REFERENCE_DOCS = [
  {
    title: "Cédula de Ciudadanía (150%)",
    description: "Copia legible ampliada al 150% por ambas caras en formato PDF.",
    required: true,
    legalRef: "Identificación laboral oficial (Art. 58 C.S.T.)",
  },
  {
    title: "Hoja de Vida Actualizada",
    description: "Formato PDF con datos de contacto, perfil profesional y trayectoria.",
    required: true,
    legalRef: "Validación de perfil y antecedentes laborales",
  },
  {
    title: "Certificado de Afiliación EPS",
    description: "Certificación expedida con vigencia no mayor a 30 días.",
    required: true,
    legalRef: "Afiliación obligatoria al SGSSS (Ley 100 de 1993)",
  },
  {
    title: "Certificado de Fondo de Pensiones",
    description: "Certificado de afiliación al fondo pensional (Colpensiones o Fondo Privado).",
    required: true,
    legalRef: "Aporte pensional obligatorio (Ley 100 de 1993)",
  },
  {
    title: "Certificaciones Académicas",
    description: "Diplomas, actas de grado o certificaciones de estudio correspondientes al perfil.",
    required: false,
    legalRef: "Soporte de idoneidad y competencias del cargo",
  },
  {
    title: "Examen Médico de Ingreso",
    description: "Concepto de aptitud ocupacional expedido por médico especialista en SST / IPS autorizada.",
    required: true,
    legalRef: "Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales)",
  },
];

interface TemplateItem {
  id?: number;
  title: string;
  description?: string;
  required: boolean;
  sortOrder: number;
}

export default function PositionsPage() {
  const companyId = 4;
  const utils = trpc.useUtils();

  // Queries
  const positionsQuery = trpc.positions.list.useQuery({ companyId });
  const templatesQuery = trpc.templates.list.useQuery({ companyId });
  const masterStandardQuery = trpc.templates.getMasterStandard.useQuery({ companyId });

  // State
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Dialog states
  const [isNewPositionOpen, setIsNewPositionOpen] = useState(false);
  const [isDeletePositionOpen, setIsDeletePositionOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [isEditMasterStandardOpen, setIsEditMasterStandardOpen] = useState(false);
  const [isEditDocOpen, setIsEditDocOpen] = useState(false);
  const [isRenameTemplateOpen, setIsRenameTemplateOpen] = useState(false);

  // New position form
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionDescription, setNewPositionDescription] = useState("");

  // New template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [copyStandardDocs, setCopyStandardDocs] = useState(true);

  // Rename template form
  const [editTemplateTitle, setEditTemplateTitle] = useState("");

  // Edit single document form
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingDocTitle, setEditingDocTitle] = useState("");
  const [editingDocDesc, setEditingDocDesc] = useState("");
  const [editingDocRequired, setEditingDocRequired] = useState(true);

  // Master standard template editing state
  const [masterItems, setMasterItems] = useState<TemplateItem[]>([]);
  const [masterApplyToAll, setMasterApplyToAll] = useState(true);
  const [newMasterDocTitle, setNewMasterDocTitle] = useState("");
  const [newMasterDocDesc, setNewMasterDocDesc] = useState("");
  const [newMasterDocRequired, setNewMasterDocRequired] = useState(true);

  // Inline new document form
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDesc, setNewDocDesc] = useState("");
  const [newDocRequired, setNewDocRequired] = useState(true);

  // Initialize master standard items when query loads
  useEffect(() => {
    if (masterStandardQuery.data?.items) {
      setMasterItems(
        masterStandardQuery.data.items.map((item, idx) => ({
          title: item.title,
          description: item.description || undefined,
          required: item.required,
          sortOrder: item.sortOrder || idx + 1,
        }))
      );
    }
  }, [masterStandardQuery.data]);

  // Filter positions
  const positions = useMemo(() => {
    return (positionsQuery.data || []).filter((p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  }, [positionsQuery.data, searchFilter]);

  // Set default selected position and handle selection updates
  useEffect(() => {
    if (positionsQuery.data && positionsQuery.data.length > 0) {
      if (!selectedPositionId || !positionsQuery.data.some((p) => p.id === selectedPositionId)) {
        setSelectedPositionId(positionsQuery.data[0].id);
      }
    } else if (positionsQuery.data && positionsQuery.data.length === 0) {
      setSelectedPositionId(null);
    }
  }, [positionsQuery.data, selectedPositionId]);

  // Selected position object
  const selectedPosition = useMemo(() => {
    return positionsQuery.data?.find((p) => p.id === selectedPositionId) || null;
  }, [positionsQuery.data, selectedPositionId]);

  // Templates for the selected position
  const positionTemplates = useMemo(() => {
    if (!selectedPositionId || !templatesQuery.data) return [];
    return templatesQuery.data.filter((t) => t.positionId === selectedPositionId);
  }, [selectedPositionId, templatesQuery.data]);

  // Select active template for position
  useEffect(() => {
    if (positionTemplates.length > 0) {
      const exists = positionTemplates.some((t) => t.id === selectedTemplateId);
      if (!exists) {
        setSelectedTemplateId(positionTemplates[0].id);
      }
    } else {
      setSelectedTemplateId(null);
    }
  }, [positionTemplates, selectedTemplateId]);

  // Active template query
  const templateQuery = trpc.templates.get.useQuery(
    { companyId, templateId: selectedTemplateId! },
    { enabled: Boolean(selectedTemplateId) }
  );

  // Mutations
  const createPositionMutation = trpc.positions.create.useMutation({
    onSuccess: (newId) => {
      utils.positions.list.invalidate();
      setSelectedPositionId(newId);
      setIsNewPositionOpen(false);
      setNewPositionName("");
      setNewPositionDescription("");
      toast.success("Cargo creado exitosamente");
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear el cargo");
    },
  });

  const deletePositionMutation = trpc.positions.delete.useMutation({
    onSuccess: () => {
      utils.positions.list.invalidate();
      utils.templates.list.invalidate();
      setIsDeletePositionOpen(false);
      setPositionToDelete(null);
      toast.success("Cargo eliminado exitosamente");
    },
    onError: (err) => {
      toast.error(err.message || "Error al eliminar el cargo");
    },
  });

  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: (data) => {
      utils.templates.list.invalidate();
      if (data) {
        setSelectedTemplateId(data.id);
        utils.templates.get.invalidate({ companyId, templateId: data.id });
      }
      setIsNewTemplateOpen(false);
      setNewTemplateName("");
      toast.success("Plantilla personalizada creada");
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear la plantilla");
    },
  });

  const assignDefaultMutation = trpc.templates.assignDefault.useMutation({
    onSuccess: (data) => {
      utils.templates.list.invalidate();
      if (data) {
        setSelectedTemplateId(data.id);
        utils.templates.get.invalidate({ companyId, templateId: data.id });
      }
      toast.success("Plantilla por defecto asignada");
    },
    onError: (err) => {
      toast.error(err.message || "Error al asignar la plantilla");
    },
  });

  const updateTemplateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      if (selectedTemplateId) {
        utils.templates.get.invalidate({ companyId, templateId: selectedTemplateId });
      }
      toast.success("Plantilla de documentos actualizada");
      setNewDocTitle("");
      setNewDocDesc("");
      setNewDocRequired(true);
      setIsEditDocOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar la plantilla");
    },
  });

  const updateMasterStandardMutation = trpc.templates.updateMasterStandard.useMutation({
    onSuccess: () => {
      utils.templates.getMasterStandard.invalidate();
      utils.templates.list.invalidate();
      if (selectedTemplateId) {
        utils.templates.get.invalidate({ companyId, templateId: selectedTemplateId });
      }
      setIsEditMasterStandardOpen(false);
      toast.success("Plantilla estándar de la empresa guardada exitosamente");
    },
    onError: (err) => {
      toast.error(err.message || "Error al guardar la plantilla estándar");
    },
  });

  const updateTemplateNameMutation = trpc.templates.updateName.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      if (selectedTemplateId) {
        utils.templates.get.invalidate({ companyId, templateId: selectedTemplateId });
      }
      setIsRenameTemplateOpen(false);
      toast.success("Nombre de plantilla actualizado");
    },
    onError: (err) => {
      toast.error(err.message || "Error al renombrar la plantilla");
    },
  });

  const deleteTemplateMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Plantilla eliminada");
    },
    onError: (err) => {
      toast.error(err.message || "Error al eliminar la plantilla");
    },
  });

  // Handlers
  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;
    createPositionMutation.mutate({
      companyId,
      name: newPositionName.trim(),
      description: newPositionDescription.trim() || undefined,
    });
  };

  const handlePromptDeletePosition = (pos: { id: number; name: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPositionToDelete(pos);
    setIsDeletePositionOpen(true);
  };

  const handleConfirmDeletePosition = () => {
    if (!positionToDelete) return;
    deletePositionMutation.mutate({
      companyId,
      positionId: positionToDelete.id,
    });
  };

  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPositionId || !newTemplateName.trim()) return;

    const baseDocs = masterStandardQuery.data?.items || STANDARD_REFERENCE_DOCS;
    const items = copyStandardDocs
      ? baseDocs.map((doc, idx) => ({
          title: doc.title,
          description: doc.description || undefined,
          required: doc.required,
          sortOrder: idx + 1,
        }))
      : [
          {
            title: "Hoja de Vida Actualizada",
            description: "Formato PDF con datos de contacto",
            required: true,
            sortOrder: 1,
          },
        ];

    createTemplateMutation.mutate({
      companyId,
      positionId: selectedPositionId,
      name: newTemplateName.trim(),
      items,
    });
  };

  const handleAssignDefault = () => {
    if (!selectedPositionId) return;
    assignDefaultMutation.mutate({
      companyId,
      positionId: selectedPositionId,
    });
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !templateQuery.data || !selectedTemplateId) return;

    const existingItems = templateQuery.data.items || [];
    const updatedItems = [
      ...existingItems.map((item, index) => ({
        title: item.title,
        description: item.description || undefined,
        required: item.required,
        sortOrder: index + 1,
      })),
      {
        title: newDocTitle.trim(),
        description: newDocDesc.trim() || undefined,
        required: newDocRequired,
        sortOrder: existingItems.length + 1,
      },
    ];

    updateTemplateMutation.mutate({
      companyId,
      templateId: selectedTemplateId,
      items: updatedItems,
    });
  };

  const handleOpenEditDoc = (item: { id: number; title: string; description?: string | null; required: boolean }) => {
    setEditingDocId(item.id);
    setEditingDocTitle(item.title);
    setEditingDocDesc(item.description || "");
    setEditingDocRequired(item.required);
    setIsEditDocOpen(true);
  };

  const handleSaveDocEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateQuery.data || !selectedTemplateId || editingDocId === null || !editingDocTitle.trim()) return;

    const updatedItems = templateQuery.data.items.map((item) => {
      if (item.id === editingDocId) {
        return {
          title: editingDocTitle.trim(),
          description: editingDocDesc.trim() || undefined,
          required: editingDocRequired,
          sortOrder: item.sortOrder,
        };
      }
      return {
        title: item.title,
        description: item.description || undefined,
        required: item.required,
        sortOrder: item.sortOrder,
      };
    });

    updateTemplateMutation.mutate({
      companyId,
      templateId: selectedTemplateId,
      items: updatedItems,
    });
  };

  const handleMoveDoc = (index: number, direction: "up" | "down") => {
    if (!templateQuery.data || !selectedTemplateId) return;
    const items = [...templateQuery.data.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const updatedItems = items.map((item, idx) => ({
      title: item.title,
      description: item.description || undefined,
      required: item.required,
      sortOrder: idx + 1,
    }));

    updateTemplateMutation.mutate({
      companyId,
      templateId: selectedTemplateId,
      items: updatedItems,
    });
  };

  const handleToggleRequired = (itemId: number) => {
    if (!templateQuery.data || !selectedTemplateId) return;

    const updatedItems = templateQuery.data.items.map((item) => ({
      title: item.title,
      description: item.description || undefined,
      required: item.id === itemId ? !item.required : item.required,
      sortOrder: item.sortOrder,
    }));

    updateTemplateMutation.mutate({
      companyId,
      templateId: selectedTemplateId,
      items: updatedItems,
    });
  };

  const handleDeleteDocument = (itemId: number) => {
    if (!templateQuery.data || !selectedTemplateId) return;

    const updatedItems = templateQuery.data.items
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({
        title: item.title,
        description: item.description || undefined,
        required: item.required,
        sortOrder: index + 1,
      }));

    updateTemplateMutation.mutate({
      companyId,
      templateId: selectedTemplateId,
      items: updatedItems,
    });
  };

  const handleAddMasterItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterDocTitle.trim()) return;
    setMasterItems([
      ...masterItems,
      {
        title: newMasterDocTitle.trim(),
        description: newMasterDocDesc.trim() || undefined,
        required: newMasterDocRequired,
        sortOrder: masterItems.length + 1,
      },
    ]);
    setNewMasterDocTitle("");
    setNewMasterDocDesc("");
    setNewMasterDocRequired(true);
  };

  const handleRemoveMasterItem = (index: number) => {
    setMasterItems(masterItems.filter((_, idx) => idx !== index));
  };

  const handleMoveMasterItem = (index: number, direction: "up" | "down") => {
    const newItems = [...masterItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setMasterItems(newItems);
  };

  const handleToggleMasterItemRequired = (index: number) => {
    setMasterItems(
      masterItems.map((item, idx) =>
        idx === index ? { ...item, required: !item.required } : item
      )
    );
  };

  const handleResetMasterToLegalDefaults = () => {
    if (confirm("¿Deseas restaurar la plantilla estándar con los 6 requisitos normativos de Colombia?")) {
      setMasterItems(
        STANDARD_REFERENCE_DOCS.map((doc, idx) => ({
          title: doc.title,
          description: doc.description,
          required: doc.required,
          sortOrder: idx + 1,
        }))
      );
      toast.info("Valores normativos cargados en el formulario");
    }
  };

  const handleSaveMasterStandard = () => {
    if (masterItems.length === 0) {
      toast.error("La plantilla estándar debe contener al menos 1 documento");
      return;
    }
    updateMasterStandardMutation.mutate({
      companyId,
      items: masterItems.map((item, idx) => ({
        title: item.title,
        description: item.description,
        required: item.required,
        sortOrder: idx + 1,
      })),
      applyToAllPositions: masterApplyToAll,
    });
  };

  const isDefaultTemplate = templateQuery.data?.name === DEFAULT_TEMPLATE_NAME;

  return (
    <DashboardLayout roleOverride="HR">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <Layers className="h-3.5 w-3.5" />
                Configuración Operativa
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Cargos y Plantillas de Documentos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Administra los perfiles de cargo de la empresa y define sus listas de chequeo documental estándar o personalizadas.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMasterStandardOpen(true)}
              className="border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            >
              <Sliders className="mr-1.5 h-4 w-4 text-blue-600" />
              Editar Plantilla Estándar de la Empresa
            </Button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left Column: Cargos List Component */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Cargos ({positions.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsNewPositionOpen(true)}
                    className="h-8 bg-slate-950 text-white hover:bg-slate-800 text-xs font-medium px-2.5 shadow-sm"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Nuevo Cargo
                  </Button>
                </div>
                <div className="relative mt-2.5">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar cargo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-2 pt-2 space-y-1.5 max-h-[600px] overflow-y-auto">
                {positionsQuery.isLoading ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <Clock className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando cargos...
                  </div>
                ) : positions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <Briefcase className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                    No se encontraron cargos.
                  </div>
                ) : (
                  positions.map((position) => {
                    const isSelected = selectedPositionId === position.id;
                    const posTemplates = (templatesQuery.data || []).filter(
                      (t) => t.positionId === position.id
                    );
                    const hasDefault = posTemplates.some((t) => t.name === DEFAULT_TEMPLATE_NAME);

                    return (
                      <div
                        key={position.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPositionId(position.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPositionId(position.id);
                          }
                        }}
                        className={`group relative flex w-full flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/60 shadow-sm ring-1 ring-blue-500/30"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span
                            className={`font-semibold text-sm line-clamp-1 ${
                              isSelected ? "text-blue-950" : "text-slate-800"
                            }`}
                          >
                            {position.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handlePromptDeletePosition(position, e)}
                              className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={`Eliminar cargo "${position.name}"`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Briefcase
                              className={`h-4 w-4 shrink-0 transition ${
                                isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                              }`}
                            />
                          </div>
                        </div>

                        {position.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {position.description}
                          </p>
                        )}

                        <div className="mt-2.5 flex w-full items-center justify-between gap-2">
                          {posTemplates.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                              <AlertCircle className="h-3 w-3" /> Sin plantilla
                            </span>
                          ) : hasDefault ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              <CheckCircle2 className="h-3 w-3" /> Estándar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-100/80 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                              <Sparkles className="h-3 w-3" /> {posTemplates[0].name}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            {posTemplates.length} plantilla{posTemplates.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Template Management for Selected Position */}
          <div className="space-y-4">
            {selectedPosition ? (
              <>
                {/* Position Summary Card */}
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Cargo seleccionado
                          </span>
                          <Badge variant="outline" className="text-xs font-normal">
                            ID: {selectedPosition.id}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromptDeletePosition(selectedPosition)}
                            className="h-6 px-2 text-xs font-medium text-red-600 border-red-200 bg-red-50/40 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors ml-1"
                            title="Eliminar este cargo"
                          >
                            <Trash2 className="mr-1 h-3 w-3 text-red-500" />
                            Eliminar cargo
                          </Button>
                        </div>
                        <CardTitle className="mt-1 text-xl font-bold text-slate-900">
                          {selectedPosition.name}
                        </CardTitle>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedPosition.description || "Este cargo no tiene una descripción adicional configurada."}
                        </p>
                      </div>

                      {positionTemplates.length > 1 && (
                        <div className="w-full sm:w-60">
                          <Label className="text-xs text-slate-500 mb-1.5 block">
                            Plantilla activa del cargo:
                          </Label>
                          <Select
                            value={String(selectedTemplateId || "")}
                            onValueChange={(val) => setSelectedTemplateId(Number(val))}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar plantilla" />
                            </SelectTrigger>
                            <SelectContent>
                              {positionTemplates.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Header Bar Above Template Configuration Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Configuración de Plantilla de Documentos
                    </h2>
                    <p className="text-xs text-slate-500">
                      Requisitos documentales que se solicitarán en las contrataciones de este cargo.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsNewTemplateOpen(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      size="sm"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Crear Nueva Plantilla
                    </Button>
                  </div>
                </div>

                {/* Template Documents Card */}
                {positionTemplates.length === 0 ? (
                  <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-8 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Este cargo aún no tiene una plantilla de documentos asignada
                      </h3>
                      <p className="text-xs text-slate-500">
                        Puedes asignarle la plantilla estándar de contratación legal o crear una nueva plantilla con requisitos personalizados.
                      </p>
                      <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Button
                          onClick={handleAssignDefault}
                          disabled={assignDefaultMutation.isPending}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <ShieldCheck className="mr-1.5 h-4 w-4" />
                          Asignar Expediente Estándar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewTemplateOpen(true)}
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          Crear Plantilla Personalizada
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="p-5 pb-4 border-b border-slate-100">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Template title and info */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg font-bold text-slate-900 truncate">
                              {templateQuery.data?.name || "Plantilla de documentos"}
                            </CardTitle>
                            {isDefaultTemplate ? (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 font-medium">
                                Plantilla por Defecto
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                  Plantilla Personalizada
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                                  onClick={() => {
                                    setEditTemplateTitle(templateQuery.data?.name || "");
                                    setIsRenameTemplateOpen(true);
                                  }}
                                  title="Renombrar plantilla"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <CardDescription className="text-xs text-slate-500">
                            Lista de documentos que se requerirán al candidato y se capturarán como snapshot inmutable en cada contratación.
                          </CardDescription>
                        </div>

                        {/* Stats pill and optional Delete action */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 text-left sm:text-right">
                            <div className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                              {templateQuery.data?.items.length || 0} documentos configurados
                            </div>
                            <div className="text-[11px] text-slate-500 whitespace-nowrap">
                              {templateQuery.data?.items.filter((i) => i.required).length || 0} obligatorios ·{" "}
                              {templateQuery.data?.items.filter((i) => !i.required).length || 0} opcionales
                            </div>
                          </div>

                          {/* Delete custom template button */}
                          {!isDefaultTemplate && selectedTemplateId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar la plantilla "${templateQuery.data?.name}"?`)) {
                                  deleteTemplateMutation.mutate({
                                    companyId,
                                    templateId: selectedTemplateId,
                                  });
                                }
                              }}
                              className="h-9 text-xs font-medium text-red-600 border-red-200 bg-red-50/40 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                              title="Eliminar esta plantilla personalizada"
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-500" />
                              Eliminar plantilla
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Inline Document Addition Form */}
                    <div className="bg-slate-50/80 p-4 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2.5">
                        + Agregar documento a esta plantilla:
                      </p>
                      <form onSubmit={handleAddDocument} className="grid gap-3 sm:grid-cols-[1.5fr_1.5fr_auto_auto]">
                        <div>
                          <Input
                            placeholder="Título (ej. Certificado de Antecedentes)"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            className="bg-white text-xs"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Descripción / Instrucciones (opcional)"
                            value={newDocDesc}
                            onChange={(e) => setNewDocDesc(e.target.value)}
                            className="bg-white text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                          <Switch
                            id="required-toggle"
                            checked={newDocRequired}
                            onCheckedChange={setNewDocRequired}
                          />
                          <Label htmlFor="required-toggle" className="text-xs cursor-pointer select-none">
                            {newDocRequired ? "Obligatorio" : "Opcional"}
                          </Label>
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newDocTitle.trim() || updateTemplateMutation.isPending}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Agregar
                        </Button>
                      </form>
                    </div>

                    {/* Document List with Edit, Reorder and Delete Actions */}
                    <CardContent className="p-0 divide-y divide-slate-100">
                      {templateQuery.isLoading ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                          <Clock className="mx-auto mb-2 h-5 w-5 animate-spin" />
                          Cargando documentos de la plantilla...
                        </div>
                      ) : !templateQuery.data?.items.length ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                          No hay documentos en esta plantilla. Agrega uno arriba o restaura los documentos por defecto.
                        </div>
                      ) : (
                        templateQuery.data.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50/80"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {index + 1}
                            </span>
                            
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100">
                              <button
                                type="button"
                                disabled={index === 0 || updateTemplateMutation.isPending}
                                onClick={() => handleMoveDoc(index, "up")}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                title="Mover arriba"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === (templateQuery.data?.items.length || 0) - 1 || updateTemplateMutation.isPending}
                                onClick={() => handleMoveDoc(index, "down")}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                title="Mover abajo"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Edit Document Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditDoc(item)}
                                className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100"
                                title="Editar título y descripción"
                              >
                                <Pencil className="mr-1 h-3 w-3 text-slate-500" />
                                Editar
                              </Button>

                              {/* Toggle Required Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleRequired(item.id)}
                                title="Haz clic para alternar entre obligatorio y opcional"
                                className={`h-7 px-2.5 text-xs font-medium rounded-full transition ${
                                  item.required
                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {item.required ? "Obligatorio" : "Opcional"}
                              </Button>

                              {/* Delete Document Button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteDocument(item.id)}
                                className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-80 group-hover:opacity-100"
                                title="Eliminar documento de la plantilla"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  Selecciona un cargo de la lista izquierda para gestionar sus plantillas y documentos.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* DIALOG: Editar Plantilla Estándar Maestra de la Empresa */}
      <Dialog open={isEditMasterStandardOpen} onOpenChange={setIsEditMasterStandardOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-lg font-bold">
                Editar Plantilla Estándar de la Empresa
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Personaliza los documentos estándar que tu organización solicitará por defecto en las contrataciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick action: Reset to legal defaults */}
            <div className="flex items-center justify-between rounded-lg bg-blue-50/60 p-3 border border-blue-100">
              <div className="flex items-center gap-2 text-xs text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Esta plantilla sirve como base oficial para todos los cargos de la empresa.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetMasterToLegalDefaults}
                className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Restaurar 6 normativos
              </Button>
            </div>

            {/* List of master documents */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {masterItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 p-3 hover:bg-slate-50/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {index + 1}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveMasterItem(index, "up")}
                      className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    >
                      <ArrowUp className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === masterItems.length - 1}
                      onClick={() => handleMoveMasterItem(index, "down")}
                      className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    >
                      <ArrowDown className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleMasterItemRequired(index)}
                    className={`h-6 px-2 text-[11px] font-medium rounded-full ${
                      item.required
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.required ? "Obligatorio" : "Opcional"}
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveMasterItem(index)}
                    className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new document to master standard */}
            <form onSubmit={handleAddMasterItem} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                + Añadir documento a la plantilla estándar:
              </p>
              <div className="grid gap-2 sm:grid-cols-[1.5fr_1.5fr_auto_auto]">
                <Input
                  placeholder="Título (ej. Certificación Bancaria)"
                  value={newMasterDocTitle}
                  onChange={(e) => setNewMasterDocTitle(e.target.value)}
                  className="bg-white text-xs h-8"
                />
                <Input
                  placeholder="Descripción / Instrucciones (opcional)"
                  value={newMasterDocDesc}
                  onChange={(e) => setNewMasterDocDesc(e.target.value)}
                  className="bg-white text-xs h-8"
                />
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  <Switch
                    id="master-req"
                    checked={newMasterDocRequired}
                    onCheckedChange={setNewMasterDocRequired}
                  />
                  <Label htmlFor="master-req" className="text-xs cursor-pointer">
                    {newMasterDocRequired ? "Obligatorio" : "Opcional"}
                  </Label>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMasterDocTitle.trim()}
                  className="h-8 bg-slate-900 text-white"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Añadir
                </Button>
              </div>
            </form>

            {/* Sync option */}
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 bg-white">
              <Switch
                id="apply-all"
                checked={masterApplyToAll}
                onCheckedChange={setMasterApplyToAll}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="apply-all" className="text-xs font-semibold cursor-pointer">
                  Actualizar y sincronizar todos los cargos que usan la plantilla estándar
                </Label>
                <p className="text-[11px] text-slate-500">
                  Si se activa, todos los cargos configurados con el "Expediente de Ingreso Estándar" adoptarán inmediatamente estos documentos.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditMasterStandardOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveMasterStandard}
              disabled={masterItems.length === 0 || updateMasterStandardMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {updateMasterStandardMutation.isPending ? "Guardando..." : "Guardar Plantilla Estándar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Editar Documento Individual */}
      <Dialog open={isEditDocOpen} onOpenChange={setIsEditDocOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveDocEdit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Editar Documento</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Modifica el título, las instrucciones y la obligatoriedad de este documento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-doc-title" className="text-xs font-semibold">
                  Título del documento *
                </Label>
                <Input
                  id="edit-doc-title"
                  value={editingDocTitle}
                  onChange={(e) => setEditingDocTitle(e.target.value)}
                  placeholder="Ej. Certificado de Antecedentes Disciplinarios"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-doc-desc" className="text-xs font-semibold">
                  Instrucciones o descripción (opcional)
                </Label>
                <Textarea
                  id="edit-doc-desc"
                  value={editingDocDesc}
                  onChange={(e) => setNewDocDesc(e.target.value)}
                  placeholder="Instrucciones para el candidato sobre vigencia, formato o emisor..."
                  className="mt-1.5 resize-none text-xs"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div>
                  <Label htmlFor="edit-doc-req" className="text-xs font-semibold cursor-pointer">
                    Documento Obligatorio
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    {editingDocRequired
                      ? "El candidato debe subirlo obligatoriamente para completar el proceso."
                      : "El candidato puede completar el proceso sin este documento."}
                  </p>
                </div>
                <Switch
                  id="edit-doc-req"
                  checked={editingDocRequired}
                  onCheckedChange={setEditingDocRequired}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDocOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!editingDocTitle.trim() || updateTemplateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {updateTemplateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Renombrar Plantilla */}
      <Dialog open={isRenameTemplateOpen} onOpenChange={setIsRenameTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedTemplateId || !editTemplateTitle.trim()) return;
              updateTemplateNameMutation.mutate({
                companyId,
                templateId: selectedTemplateId,
                name: editTemplateTitle.trim(),
              });
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Renombrar Plantilla</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Modifica el nombre identificativo de esta plantilla de documentos.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor="template-new-name" className="text-xs font-semibold">
                Nombre de la plantilla *
              </Label>
              <Input
                id="template-new-name"
                value={editTemplateTitle}
                onChange={(e) => setEditTemplateTitle(e.target.value)}
                placeholder="Ej. Expediente Técnico Senior"
                className="mt-1.5"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenameTemplateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!editTemplateTitle.trim() || updateTemplateNameMutation.isPending}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {updateTemplateNameMutation.isPending ? "Guardando..." : "Guardar Nombre"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo Cargo */}
      <Dialog open={isNewPositionOpen} onOpenChange={setIsNewPositionOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreatePosition}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Crear Nuevo Cargo</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Registra un nuevo cargo o puesto de trabajo para tu organización.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="position-name" className="text-xs font-semibold">
                  Nombre del cargo *
                </Label>
                <Input
                  id="position-name"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="Ej. Desarrollador Frontend, Analista Financiero..."
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="position-desc" className="text-xs font-semibold">
                  Descripción o perfil del cargo (opcional)
                </Label>
                <Textarea
                  id="position-desc"
                  value={newPositionDescription}
                  onChange={(e) => setNewPositionDescription(e.target.value)}
                  placeholder="Responsabilidades principales o requisitos específicos del perfil..."
                  className="mt-1.5 resize-none text-xs"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewPositionOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={newPositionName.trim().length < 2 || createPositionMutation.isPending}
                className="bg-slate-950 text-white hover:bg-slate-800"
              >
                {createPositionMutation.isPending ? "Creando..." : "Crear Cargo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nueva Plantilla Personalizada */}
      <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCustomTemplate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Crear Plantilla Personalizada
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Define una plantilla documental personalizada para{" "}
                <span className="font-semibold text-slate-800">{selectedPosition?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="template-name" className="text-xs font-semibold">
                  Nombre de la plantilla *
                </Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ej. Expediente Especializado con Certificaciones Cloud"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-start gap-3">
                  <Switch
                    id="copy-standard"
                    checked={copyStandardDocs}
                    onCheckedChange={setCopyStandardDocs}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="copy-standard" className="text-xs font-semibold cursor-pointer">
                      Pre-cargar documentos de la plantilla estándar de la empresa
                    </Label>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Incluye automáticamente los requisitos estándar actuales para que los personalices rápidamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewTemplateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={newTemplateName.trim().length < 2 || createTemplateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {createTemplateMutation.isPending ? "Creando..." : "Crear y Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Confirmar Eliminación de Cargo */}
      <Dialog open={isDeletePositionOpen} onOpenChange={setIsDeletePositionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Eliminar Cargo
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 pt-2">
              ¿Estás seguro de que deseas eliminar el cargo{" "}
              <span className="font-semibold text-slate-900">"{positionToDelete?.name}"</span>?
              Esta acción archivará el cargo y sus plantillas de documentos asociadas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeletePositionOpen(false)}
              disabled={deletePositionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeletePosition}
              disabled={deletePositionMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {deletePositionMutation.isPending ? "Eliminando..." : "Eliminar Cargo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
