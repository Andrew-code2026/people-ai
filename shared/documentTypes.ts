export interface FileTypePreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  mimeTypes: string[];
  extensions: string[];
  badgeText: string;
  badgeColor: string;
}

export interface GranularFormatCategory {
  id: string;
  label: string;
  extensionsLabel: string;
  mimeTypes: string[];
}

export const GRANULAR_FORMAT_CATEGORIES: GranularFormatCategory[] = [
  {
    id: "pdf",
    label: "Documentos PDF",
    extensionsLabel: ".pdf",
    mimeTypes: ["application/pdf"],
  },
  {
    id: "images",
    label: "Imágenes / Fotos",
    extensionsLabel: ".jpg, .jpeg, .png, .webp",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "word",
    label: "Documentos Word",
    extensionsLabel: ".docx, .doc",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
  },
  {
    id: "excel",
    label: "Hojas de cálculo Excel",
    extensionsLabel: ".xlsx, .xls",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  },
];

export const FILE_TYPE_PRESETS: FileTypePreset[] = [
  {
    id: "pdf_only",
    label: "Solo PDF (.pdf)",
    shortLabel: "Solo PDF",
    description: "Ideal para certificados oficiales, contratos y documentos legales.",
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    badgeText: "PDF",
    badgeColor: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
  {
    id: "pdf_and_images",
    label: "PDF e Imágenes (.pdf, .jpg, .png, .webp)",
    shortLabel: "PDF + Fotos",
    description: "Recomendado para cédulas, diplomas o fotos desde celular.",
    mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    badgeText: "PDF + Fotos",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    id: "images_only",
    label: "Solo Imágenes (.jpg, .png, .webp)",
    shortLabel: "Solo Fotos",
    description: "Fotos de identificación, carné o firmas escaneadas.",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    badgeText: "Solo Fotos",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  {
    id: "word_and_pdf",
    label: "Word y PDF (.pdf, .docx, .doc)",
    shortLabel: "Word + PDF",
    description: "Hojas de vida editables, formatos de solicitud o cartas.",
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    extensions: [".pdf", ".docx", ".doc"],
    badgeText: "Word + PDF",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "excel_and_pdf",
    label: "Excel y PDF (.pdf, .xlsx, .xls)",
    shortLabel: "Excel + PDF",
    description: "Presupuestos, tablas de cálculo o pruebas técnicas.",
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    extensions: [".pdf", ".xlsx", ".xls"],
    badgeText: "Excel + PDF",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
  },
  {
    id: "all",
    label: "Todos los formatos admitidos (PDF, fotos, Word, Excel)",
    shortLabel: "Todos los formatos",
    description: "Permite cualquier archivo compatible admitido por la plataforma.",
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    extensions: [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
    ],
    badgeText: "Todos los formatos",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
];

export const DEFAULT_ALLOWED_MIMETYPES = "application/pdf,image/jpeg,image/png,image/webp";

/**
 * Normaliza una cadena de tipos MIME separados por coma a un conjunto ordenado.
 */
export function normalizeMimeTypesString(raw?: string | null): string {
  if (!raw || !raw.trim()) return DEFAULT_ALLOWED_MIMETYPES;
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(",");
}

/**
 * Encuentra el preset coincidente a partir de una cadena de tipos MIME.
 */
export function getFileTypePreset(rawMimeTypes?: string | null): FileTypePreset | null {
  if (!rawMimeTypes) return FILE_TYPE_PRESETS[1]; // default: pdf_and_images

  const inputSet = new Set(
    rawMimeTypes
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  for (const preset of FILE_TYPE_PRESETS) {
    if (preset.mimeTypes.length === inputSet.size) {
      const allMatch = preset.mimeTypes.every((m) => inputSet.has(m.toLowerCase()));
      if (allMatch) return preset;
    }
  }

  // Si solo tiene pdf
  if (inputSet.size === 1 && inputSet.has("application/pdf")) {
    return FILE_TYPE_PRESETS[0];
  }

  // Si tiene pdf, jpeg, png (sin webp, formato legado)
  if (
    inputSet.size === 3 &&
    inputSet.has("application/pdf") &&
    inputSet.has("image/jpeg") &&
    inputSet.has("image/png")
  ) {
    return FILE_TYPE_PRESETS[1]; // tratar como pdf_and_images
  }

  return null; // personal o sin preset exacto
}

/**
 * Devuelve la información para mostrar el badge en la lista de documentos.
 */
export function getFileTypeBadgeInfo(rawMimeTypes?: string | null): {
  badgeText: string;
  badgeColor: string;
  title: string;
} {
  const preset = getFileTypePreset(rawMimeTypes);
  if (preset) {
    return {
      badgeText: preset.badgeText,
      badgeColor: preset.badgeColor,
      title: `${preset.label}: ${preset.description}`,
    };
  }

  // Configuración personalizada
  const inputSet = new Set(
    (rawMimeTypes || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const hasPdf = inputSet.has("application/pdf");
  const hasImages =
    inputSet.has("image/jpeg") || inputSet.has("image/png") || inputSet.has("image/webp");
  const hasWord =
    inputSet.has("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    inputSet.has("application/msword");
  const hasExcel =
    inputSet.has("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    inputSet.has("application/vnd.ms-excel");

  const tags: string[] = [];
  if (hasPdf) tags.push("PDF");
  if (hasImages) tags.push("Fotos");
  if (hasWord) tags.push("Word");
  if (hasExcel) tags.push("Excel");

  return {
    badgeText: tags.length ? tags.join(" + ") : "Personalizado",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
    title: `Formatos personalizados: ${rawMimeTypes || "Ninguno"}`,
  };
}

/**
 * Genera la cadena para el atributo accept del input file HTML a partir de allowedMimeTypes.
 */
export function getAcceptAttribute(rawMimeTypes?: string | null): string {
  if (!rawMimeTypes || !rawMimeTypes.trim()) {
    return ".pdf,.jpg,.jpeg,.png,.webp";
  }

  const inputSet = new Set(
    rawMimeTypes
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const exts: string[] = [];
  if (inputSet.has("application/pdf")) exts.push(".pdf");
  if (inputSet.has("image/jpeg")) exts.push(".jpg", ".jpeg");
  if (inputSet.has("image/png")) exts.push(".png");
  if (inputSet.has("image/webp")) exts.push(".webp");
  if (
    inputSet.has(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  )
    exts.push(".docx");
  if (inputSet.has("application/msword")) exts.push(".doc");
  if (
    inputSet.has(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  )
    exts.push(".xlsx");
  if (inputSet.has("application/vnd.ms-excel")) exts.push(".xls");

  return exts.length ? exts.join(",") : ".pdf";
}

/**
 * Genera una lista legible en lenguaje natural de extensiones permitidas.
 */
export function formatAllowedExtensions(rawMimeTypes?: string | null): string {
  const acceptStr = getAcceptAttribute(rawMimeTypes);
  return acceptStr.split(",").join(", ");
}
