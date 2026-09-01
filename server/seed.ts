import { getDb } from "./db";
import { appProfiles, companies, departments, documentTemplateItems, documentTemplates, employees, hiringProcesses, hiringRequirements, candidateProfiles, jobPositions, knowledgeBaseDocuments, recruitmentCandidates, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedDemoData() {
  const db = await getDb();
  if (!db) return;

  // 1. Companies
  const existingCompanies = await db.select().from(companies);
  if (existingCompanies.length === 0) {
    await db.insert(companies).values([
      { id: 1, name: "Bivien Demo", legalName: "Bivien SAS", industry: "Tecnología", city: "Bogotá", country: "Colombia" },
      { id: 2, name: "NovaTech Colombia", legalName: "NovaTech Soluciones SAS", industry: "Software", city: "Medellín", country: "Colombia" },
      { id: 3, name: "Andina Retail", legalName: "Andina Retail Colombia SAS", industry: "Comercio", city: "Cali", country: "Colombia" },
      { id: 4, name: "Empresa Demo — Talento Humano", legalName: "Empresa Demo SAS", industry: "Servicios", city: "Bogotá", country: "Colombia" },
    ]);
  }

  // 2. Demo User: Alexa Torres (HR)
  let alexaUser = (await db.select().from(users).where(eq(users.openId, "demo-alexa-torres")).limit(1))[0];
  if (!alexaUser) {
    const res = await db.insert(users).values({
      openId: "demo-alexa-torres",
      name: "Alexa Torres",
      email: "alexa.torres@people-ai.test",
      loginMethod: "demo",
      role: "user",
    });
    const userId = Number(res[0].insertId);
    alexaUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  }

  if (alexaUser) {
    const existingProfile = (await db.select().from(appProfiles).where(eq(appProfiles.userId, alexaUser.id)).limit(1))[0];
    if (!existingProfile) {
      await db.insert(appProfiles).values({
        userId: alexaUser.id,
        companyId: 4,
        role: "HR",
        status: "active",
      });
    }
  }

  // 3. Departments for Company 4
  const deptList = await db.select().from(departments).where(eq(departments.companyId, 4));
  if (deptList.length === 0) {
    await db.insert(departments).values([
      { companyId: 4, name: "Talento Humano", description: "Gestión de personas y cultura" },
      { companyId: 4, name: "Tecnología e Innovación", description: "Ingeniería y desarrollo" },
      { companyId: 4, name: "Operaciones y Finanzas", description: "Administración general" },
    ]);
  }

  // 4. Job Positions
  const posList = await db.select().from(jobPositions).where(eq(jobPositions.companyId, 4));
  let devPosId = posList.find(p => p.name.includes("Full Stack"))?.id;
  let hrPosId = posList.find(p => p.name.includes("Talento Humano"))?.id;
  let nomPosId = posList.find(p => p.name.includes("Nómina"))?.id;

  if (posList.length === 0) {
    const posRes = await db.insert(jobPositions).values([
      { companyId: 4, name: "Desarrollador Full Stack Senior", description: "Ingeniero de software con experiencia en React y Node.js" },
      { companyId: 4, name: "Analista de Talento Humano", description: "Gestión de procesos de selección y nómina" },
      { companyId: 4, name: "Especialista de Nómina", description: "Liquidación de prestaciones y seguridad social" },
    ]);
    devPosId = Number(posRes[0].insertId);
    hrPosId = devPosId + 1;
    nomPosId = devPosId + 2;
  } else {
    if (!devPosId) devPosId = posList[0].id;
    if (!hrPosId) hrPosId = posList[0].id;
    if (!nomPosId) nomPosId = posList[0].id;
  }

  // 5. Document Templates for each position
  const tmplList = await db.select().from(documentTemplates).where(eq(documentTemplates.companyId, 4));
  let standardTmplId = tmplList[0]?.id;

  if (tmplList.length === 0 && devPosId) {
    const tmplRes = await db.insert(documentTemplates).values([
      { companyId: 4, positionId: devPosId, name: "Expediente de Ingreso Estándar" },
      { companyId: 4, positionId: hrPosId || devPosId, name: "Expediente de Talento Humano" },
      { companyId: 4, positionId: nomPosId || devPosId, name: "Expediente de Nómina y Finanzas" },
    ]);
    standardTmplId = Number(tmplRes[0].insertId);

    const standardItems = [
      { title: "Cédula de Ciudadanía (150%)", description: "Copia legible por ambas caras en PDF", required: true, sortOrder: 1 },
      { title: "Hoja de Vida Actualizada", description: "Formato PDF con datos de contacto", required: true, sortOrder: 2 },
      { title: "Certificado de Afiliación EPS", description: "No mayor a 30 días", required: true, sortOrder: 3 },
      { title: "Certificado de Fondo de Pensiones", description: "No mayor a 30 días", required: true, sortOrder: 4 },
      { title: "Certificaciones Académicas", description: "Títulos profesionales y diplomados", required: false, sortOrder: 5 },
      { title: "Examen Médico de Ingreso", description: "Concepto de aptitud laboral emitido por IPS", required: true, sortOrder: 6 },
    ];

    for (const tId of [standardTmplId, standardTmplId + 1, standardTmplId + 2]) {
      await db.insert(documentTemplateItems).values(
        standardItems.map(item => ({ ...item, companyId: 4, templateId: tId }))
      );
    }
  }

  // 6. Real Hiring Candidates & Processes
  const existingProcesses = await db.select().from(hiringProcesses).where(eq(hiringProcesses.companyId, 4));
  if (existingProcesses.length === 0 && standardTmplId && alexaUser) {
    const seedCandidates = [
      {
        fullName: "Carlos Mendoza",
        identificationNumber: "1020304050",
        email: "carlos.mendoza@ejemplo.com",
        positionId: devPosId!,
        templateId: standardTmplId,
        status: "pending" as const,
        uploadedCount: 4,
      },
      {
        fullName: "Laura Gómez",
        identificationNumber: "1030405060",
        email: "laura.gomez@ejemplo.com",
        positionId: hrPosId || devPosId!,
        templateId: standardTmplId,
        status: "complete" as const,
        uploadedCount: 6,
      },
      {
        fullName: "Andrés Silva",
        identificationNumber: "1040506070",
        email: "andres.silva@ejemplo.com",
        positionId: nomPosId || devPosId!,
        templateId: standardTmplId,
        status: "pending" as const,
        uploadedCount: 3,
      },
      {
        fullName: "Mariana Restrepo",
        identificationNumber: "1050607080",
        email: "mariana.restrepo@ejemplo.com",
        positionId: devPosId!,
        templateId: standardTmplId,
        status: "complete" as const,
        uploadedCount: 6,
      },
    ];

    const standardReqs = [
      { title: "Cédula de Ciudadanía (150%)", description: "Copia legible por ambas caras en PDF", required: true, sortOrder: 1 },
      { title: "Hoja de Vida Actualizada", description: "Formato PDF con datos de contacto", required: true, sortOrder: 2 },
      { title: "Certificado de Afiliación EPS", description: "No mayor a 30 días", required: true, sortOrder: 3 },
      { title: "Certificado de Fondo de Pensiones", description: "No mayor a 30 días", required: true, sortOrder: 4 },
      { title: "Certificaciones Académicas", description: "Títulos profesionales y diplomados", required: false, sortOrder: 5 },
      { title: "Examen Médico de Ingreso", description: "Concepto de aptitud laboral emitido por IPS", required: true, sortOrder: 6 },
    ];

    for (const c of seedCandidates) {
      const candRes = await db.insert(candidateProfiles).values({
        companyId: 4,
        fullName: c.fullName,
        identificationNumber: c.identificationNumber,
        email: c.email,
      });
      const candidateId = Number(candRes[0].insertId);

      const procRes = await db.insert(hiringProcesses).values({
        companyId: 4,
        candidateId,
        positionId: c.positionId,
        templateId: c.templateId,
        createdByUserId: alexaUser.id,
        status: c.status,
      });
      const processId = Number(procRes[0].insertId);

      await db.insert(hiringRequirements).values(
        standardReqs.map((req, idx) => ({
          companyId: 4,
          processId,
          title: req.title,
          description: req.description,
          required: req.required,
          sortOrder: req.sortOrder,
          status: idx < c.uploadedCount ? ("uploaded" as const) : ("pending" as const),
        }))
      );
    }
  }

  // Legacy recruitment candidates (kept for compatibility)
  const candList = await db.select().from(recruitmentCandidates).where(eq(recruitmentCandidates.companyId, 4));
  if (candList.length === 0) {
    await db.insert(recruitmentCandidates).values([
      { companyId: 4, candidateName: "Carlos Mendoza", position: "Desarrollador Full Stack Senior", documentsRequired: 6, documentsReceived: 4, status: "pending" },
      { companyId: 4, candidateName: "Laura Gómez", position: "Analista de Talento Humano", documentsRequired: 6, documentsReceived: 6, status: "complete" },
      { companyId: 4, candidateName: "Andrés Silva", position: "Especialista de Nómina", documentsRequired: 5, documentsReceived: 3, status: "pending" },
      { companyId: 4, candidateName: "Mariana Restrepo", position: "Desarrollador Full Stack", documentsRequired: 6, documentsReceived: 6, status: "complete" },
    ]);
  }

  // 7. Knowledge Base Documents
  const kbList = await db.select().from(knowledgeBaseDocuments).where(eq(knowledgeBaseDocuments.companyId, 4));
  if (kbList.length === 0) {
    await db.insert(knowledgeBaseDocuments).values([
      { companyId: 4, title: "Política de Vacaciones y Días Libres", category: "Beneficios", status: "published", sourceRef: "RH-POL-001" },
      { companyId: 4, title: "Proceso de Solicitud de Certificados Laborales", category: "Trámites", status: "published", sourceRef: "RH-DOC-002" },
      { companyId: 4, title: "Guía de Afiliaciones a Seguridad Social", category: "Normativa", status: "published", sourceRef: "RH-NOR-003" },
      { companyId: 4, title: "Reglamento Interno de Trabajo", category: "Políticas", status: "published", sourceRef: "RH-REG-004" },
    ]);
  }

  return alexaUser;
}
