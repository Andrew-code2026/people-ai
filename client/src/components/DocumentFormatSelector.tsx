import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, FileType } from "lucide-react";
import {
  FILE_TYPE_PRESETS,
  GRANULAR_FORMAT_CATEGORIES,
  DEFAULT_ALLOWED_MIMETYPES,
  getFileTypePreset,
  formatAllowedExtensions,
} from "@shared/documentTypes";

interface DocumentFormatSelectorProps {
  value: string;
  onChange: (mimeString: string) => void;
  showGranularOptions?: boolean;
  label?: string;
  compact?: boolean;
}

export default function DocumentFormatSelector({
  value,
  onChange,
  showGranularOptions = true,
  label = "Tipo de archivo aceptado",
  compact = false,
}: DocumentFormatSelectorProps) {
  const currentPreset = getFileTypePreset(value);
  const normalizedValue = value || DEFAULT_ALLOWED_MIMETYPES;

  const handlePresetSelect = (presetId: string) => {
    const found = FILE_TYPE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onChange(found.mimeTypes.join(","));
    }
  };

  const handleToggleCategory = (catId: string) => {
    const cat = GRANULAR_FORMAT_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;

    const currentSet = new Set(
      normalizedValue
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const isCurrentlySelected = cat.mimeTypes.some((m) =>
      currentSet.has(m.toLowerCase())
    );

    if (isCurrentlySelected) {
      // Remover tipos de esta categoría
      cat.mimeTypes.forEach((m) => currentSet.delete(m.toLowerCase()));
      // Si se queda vacío, dejamos PDF por seguridad
      if (currentSet.size === 0) {
        currentSet.add("application/pdf");
      }
    } else {
      // Agregar tipos de esta categoría
      cat.mimeTypes.forEach((m) => currentSet.add(m.toLowerCase()));
    }

    onChange(Array.from(currentSet).join(","));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {label && <span className="text-xs font-medium text-slate-600">{label}:</span>}
        <Select
          value={currentPreset?.id || "custom"}
          onValueChange={handlePresetSelect}
        >
          <SelectTrigger className="bg-white text-xs h-9 min-w-[200px]">
            <SelectValue placeholder="Formato permitido" />
          </SelectTrigger>
          <SelectContent>
            {FILE_TYPE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{preset.shortLabel}</span>
                  <span className="text-[10px] text-slate-400">
                    ({preset.extensions.slice(0, 3).join(", ")})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileType className="h-4 w-4 text-blue-600" />
          <Label className="text-xs font-semibold text-slate-800">{label}</Label>
        </div>
        <span className="text-[11px] text-slate-500 font-mono font-medium">
          {formatAllowedExtensions(value)}
        </span>
      </div>

      {/* Selector de Presets Principales */}
      <Select
        value={currentPreset?.id || "custom"}
        onValueChange={handlePresetSelect}
      >
        <SelectTrigger className="bg-white text-xs h-8.5">
          <SelectValue placeholder="Selecciona el formato o grupo de archivos" />
        </SelectTrigger>
        <SelectContent>
          {FILE_TYPE_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id} className="text-xs py-1.5">
              <div className="flex flex-col gap-0.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{preset.label}</span>
                </div>
                <span className="text-[11px] text-slate-500">{preset.description}</span>
              </div>
            </SelectItem>
          ))}
          {!currentPreset && (
            <SelectItem value="custom" disabled className="text-xs italic text-slate-400">
              Personalizado (ver selección abajo)
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Botones de Selección Granular por Categoría */}
      {showGranularOptions && (
        <div className="pt-0.5">
          <p className="text-[11px] text-slate-500 mb-1 font-medium">
            Formatos incluidos en este requisito:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {GRANULAR_FORMAT_CATEGORIES.map((cat) => {
              const currentSet = new Set(
                normalizedValue
                  .split(",")
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean)
              );
              const isSelected = cat.mimeTypes.some((m) =>
                currentSet.has(m.toLowerCase())
              );

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 text-blue-900 font-medium shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[11px] font-medium leading-tight truncate">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {cat.extensionsLabel}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 ml-1">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
