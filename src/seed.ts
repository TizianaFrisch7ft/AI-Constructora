// src/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

import Vendor from "./models/Vendor";
import Project from "./models/Project";
import Eval from "./models/Eval";
import Eval_line from "./models/Eval_line";
import ProjectVendor from "./models/ProjectVendor";
import SchedulePur from "./models/SchedulePur";
import SchedulePurLine from "./models/SchedulePurLine";
import QuoteRequestLine from "./models/QuoteRequestLine";
import QuoteRequest from "./models/QuoteRequest";
import PM from "./models/PM";
import ProjectPM from "./models/ProjectPM";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "";

const seed = async () => {
  await mongoose.connect(MONGO_URI);

  await Promise.all([
    Project.deleteMany({}),
    Vendor.deleteMany({}),
    Eval.deleteMany({}),
    Eval_line.deleteMany({}),
    ProjectVendor.deleteMany({}),
    SchedulePur.deleteMany({}),
    SchedulePurLine.deleteMany({}),
    QuoteRequestLine.deleteMany({}),
    QuoteRequest.deleteMany({}),
    PM.deleteMany({}),
    ProjectPM.deleteMany({})
  ]);

  await Project.insertMany([
  {
    id: "P0001",
    name: "Reacondicionamiento Shopping Punta del Este",
    description: "Remodelación y modernización del centro comercial",
    address_1: "Sarmiento 654",
    state: "MAL",
    country: "Uruguay",
    status: "Close",
    start_date: new Date("2025-01-01"),
    desired_finish_date: new Date("2025-01-01"),
    finish_date: new Date("2025-06-01"),
  },
  {
    id: "P0002",
    name: "Construcción Torre Montevideo II",
    description: "Construcción de edificio de oficinas y residencias de lujo 1",
    address_1: "Colon 33",
    state: "MDV",
    country: "Uruguay",
    status: "Wip",
    start_date: new Date("2025-01-01"),
    desired_finish_date: new Date("2026-01-01"),
  },
  {
    id: "P0003",
    name: "Renovación Hospital Central",
    description: "Ampliación y modernización del hospital central",
    address_1: "Av. 18 de Julio 332",
    state: "MDV",
    country: "Uruguay",
    status: "Open",
    start_date: new Date("2025-08-01"),
    desired_finish_date: new Date("2025-12-01"),
  },
  {
    id: "P0004",
    name: "Proyecto Solar",
    description: "Instalación de paneles solares en complejo industrial",
    address_1: "Ruta 8, km 17, Zona Industrial",
    state: "MDV",
    country: "Uruguay",
    status: "Open",
    start_date: new Date("2025-08-01"),
    desired_finish_date: new Date("2026-12-01"),
  },
  {
    id: "P0005",
    name: "Torre Residencial Norte",
    description: "Construcción de torre de apartamentos de 15 pisos",
    address_1: "Av. Italia 4547",
    state: "MDV",
    country: "Uruguay",
    status: "Open",
    start_date: new Date("2025-08-01"),
    desired_finish_date: new Date("2026-12-01"),
  },
])
  await Vendor.deleteMany({});

  await Vendor.insertMany([
    {
      id: "V0001",
      name: "Barraca Central",
      reference_name: "Central",
      class: "Material",
      rubro: "Materiales de Construcción",
      legal_type: "RUT",
      legal_id: "211234560012",
      main_mail: "compras@barracacentral.com.uy",
      main_contact_name: "Juan Pérez",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 5,
      eval_state: "Al día",
      pay_terms: "15 DD",
    },
    {
      id: "V0002",
      name: "Barraca Sur",
      reference_name: "Barraca Sur",
      class: "Material",
      rubro: "Cementos y Hormigón",
      legal_type: "RUT",
      legal_id: "213456780008",
      main_mail: "ventas@barracasur.com.uy",
      main_contact_name: "Laura Méndez",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4,
      eval_state: "Al día",
      pay_terms: "30 DD",
    },
    {
      id: "V0003",
      name: "Enercon Uruguay",
      reference_name: "Enercon",
      class: "Servicio",
      rubro: "Suministro Eléctrico",
      legal_type: "RUT",
      legal_id: "218794310011",
      main_mail: "contacto@enerconstruccion.com.uy",
      main_contact_name: "Carlos Techera",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.6,
      eval_state: "Por vencer",
      pay_terms: "45DD",
    },
    {
      id: "V0004",
      name: "Tecnogrup",
      reference_name: "Tecnogroup",
      class: "Servicio",
      rubro: "Suministro Eléctrico",
      legal_type: "RUT",
      legal_id: "228095430012",
      main_mail: "ventas@tecnog.com",
      main_contact_name: "Martina Suarez",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 3,
      eval_state: "Vencido",
      pay_terms: "15 DD",
    },
    {
      id: "V0005",
      name: "Grupel Uruguay",
      reference_name: "Grupel",
      class: "Servicio",
      rubro: "Suministro Eléctrico",
      legal_type: "RUT",
      legal_id: "218765655555",
      main_mail: "",
      main_contact_name: "Ruben Palo",
      mobile: "59897732324",
      status: "Activo",
      type: "draft",
      score_avg: null,
      eval_state: "Sin Evaluar",
      pay_terms: "30 DD",
    },
    {
      id: "V0006",
      name: "Soluciones Rápidas",
      reference_name: "SR",
      class: "Servicio",
      rubro: "Proveedores Menores",
      legal_type: "RUT",
      legal_id: "213456780001",
      main_mail: "info@solrapidas.com.uy",
      main_contact_name: "Lucía Fernández",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.5,
      eval_state: "Al día",
      pay_terms: "30 DD",
    },
    {
      id: "V0007",
      name: "Barraca Norte",
      reference_name: "Norte",
      class: "Material",
      rubro: "Materiales de Construcción",
      legal_type: "RUT",
      legal_id: "213987650011",
      main_mail: "ventas@barracanorte.com.uy",
      main_contact_name: "Pablo García",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.3,
      eval_state: "Al día",
      pay_terms: "15 DD",
    },
    {
      id: "V0008",
      name: "Hormigones del Sur",
      reference_name: "HDS",
      class: "Material",
      rubro: "Cementos y Hormigón",
      legal_type: "RUT",
      legal_id: "214568990001",
      main_mail: "pedidos@hdsur.com.uy",
      main_contact_name: "Federico Sosa",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 3.9,
      eval_state: "Al día",
      pay_terms: "30 DD",
    },
    {
      id: "V0009",
      name: "ElectroRed",
      reference_name: "ElectroRed",
      class: "Servicio",
      rubro: "Suministro Eléctrico",
      legal_type: "RUT",
      legal_id: "218774430013",
      main_mail: "contacto@electrored.com.uy",
      main_contact_name: "Verónica Machado",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.2,
      eval_state: "Por vencer",
      pay_terms: "45DD",
    },
    {
      id: "V0010",
      name: "Instaleco",
      reference_name: "Instaleco",
      class: "Servicio",
      rubro: "Instalación eléctrica",
      legal_type: "RUT",
      legal_id: "218456230011",
      main_mail: "instal@instaleco.com.uy",
      main_contact_name: "Marcos López",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 3.8,
      eval_state: "Al día",
      pay_terms: "15 DD",
    },
    {
      id: "V0011",
      name: "Placas y Paneles SRL",
      reference_name: "PyP",
      class: "Material",
      rubro: "Revestimientos y Tabiques",
      legal_type: "RUT",
      legal_id: "213456780007",
      main_mail: "info@placasypaneles.com.uy",
      main_contact_name: "Romina Díaz",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.7,
      eval_state: "Al día",
      pay_terms: "45DD",
    },
    {
      id: "V0012",
      name: "ProveSol",
      reference_name: "ProveSol",
      class: "Servicio",
      rubro: "Proveedores Menores",
      legal_type: "RUT",
      legal_id: "217654320014",
      main_mail: "servicio@provesol.com.uy",
      main_contact_name: "Esteban Ferreira",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.4,
      eval_state: "Por vencer",
      pay_terms: "30 DD",
    },
    {
      id: "V0013",
      name: "Pinturas Delta",
      reference_name: "Delta",
      class: "Material",
      rubro: "Pintura y Acabados",
      legal_type: "RUT",
      legal_id: "213456780002",
      main_mail: "ventas@pinturasdelta.com.uy",
      main_contact_name: "Natalia Pereyra",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.1,
      eval_state: "Al día",
      pay_terms: "15 DD",
    },
    {
      id: "V0014",
      name: "MonteObra",
      reference_name: "MonteObra",
      class: "Servicio",
      rubro: "Alquiler de Maquinaria",
      legal_type: "RUT",
      legal_id: "213789900011",
      main_mail: "alquiler@monteobra.com.uy",
      main_contact_name: "Joaquín Rivero",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 3.8,
      eval_state: "Vencido",
      pay_terms: "30 DD",
    },
    {
      id: "V0015",
      name: "Aislacon S.A.",
      reference_name: "Aislacon",
      class: "Material",
      rubro: "Aislantes térmicos y acústicos",
      legal_type: "RUT",
      legal_id: "213309450017",
      main_mail: "contacto@aislacon.com.uy",
      main_contact_name: "Gabriela Fagúndez",
      mobile: "",
      status: "Activo",
      type: "ready",
      score_avg: 4.6,
      eval_state: "Al día",
      pay_terms: "45DD",
    },
  ]);
await Eval.insertMany([
  {
    eval_id: "EV0001",
    eval_name: "Certificación ISO",
    vendor_id: "V0001",
    start_date: new Date("2023-01-01"),
    due_date: new Date("2026-11-01"),
    type: "ISO",
    attach_id: "doc001"
  },
  {
    eval_id: "EV0004",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0001",
    start_date: new Date("2024-03-17"),
    due_date: new Date("2024-02-16"),
    type: "Técnica",
    attach_id: "doc004"
  },
  {
    eval_id: "EV0005",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0002",
    start_date: new Date("2025-08-01"),
    due_date: new Date("2025-02-17"),
    type: "Técnica",
    attach_id: "doc005"
  },
  {
    eval_id: "EV0003",
    eval_name: "Certificación ISO",
    vendor_id: "V0003",
    start_date: new Date("2023-01-01"),
    due_date: new Date("2025-09-01"),
    type: "ISO",
    attach_id: "doc003"
  },
  {
    eval_id: "EV0002",
    eval_name: "Autoevaluación",
    vendor_id: "V0004",
    start_date: new Date("2024-01-01"),
    due_date: new Date("2024-12-31"),
    type: "Auto",
    attach_id: "doc002"
  },
  {
    eval_id: "EV0009",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0006",
    start_date: new Date("2024-08-05"),
    due_date: new Date("2025-12-21"),
    type: "Técnica",
    attach_id: "doc009"
  },
  {
    eval_id: "EV0023",
    eval_name: "Certificación ISO",
    vendor_id: "V0007",
    start_date: new Date("2024-11-27"),
    due_date: new Date("2025-02-15"),
    type: "ISO",
    attach_id: "doc023"
  },
  {
    eval_id: "EV0011",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0008",
    start_date: new Date("2024-07-08"),
    due_date: new Date("2025-02-23"),
    type: "Técnica",
    attach_id: "doc011"
  },
  {
    eval_id: "EV0025",
    eval_name: "Certificación ISO",
    vendor_id: "V0011",
    start_date: new Date("2024-11-29"),
    due_date: new Date("2025-02-19"),
    type: "ISO",
    attach_id: "doc025"
  },
  {
    eval_id: "EV0026",
    eval_name: "Certificación ISO",
    vendor_id: "V0010",
    start_date: new Date("2024-11-30"),
    due_date: new Date("2025-06-18"),
    type: "ISO",
    attach_id: "doc026"
  },
  {
    eval_id: "EV0014",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0012",
    start_date: new Date("2025-10-08"),
    due_date: new Date("2025-06-26"),
    type: "Técnica",
    attach_id: "doc014"
  },
  {
    eval_id: "EV0015",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0012",
    start_date: new Date("2024-11-08"),
    due_date: new Date("2024-09-27"),
    type: "Técnica",
    attach_id: "doc015"
  },
  {
    eval_id: "EV0016",
    eval_name: "Evaluación Técnica",
    vendor_id: "V0013",
    start_date: new Date("2024-12-08"),
    due_date: new Date("2025-02-28"),
    type: "Técnica",
    attach_id: "doc016"
  },
]);
await Eval_line.insertMany([
  // EV0001 - Barraca Central
  { eval_id: "EV0001", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "doc-line-001" },
  { eval_id: "EV0001", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "doc-line-002" },
  { eval_id: "EV0001", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "doc-line-003" },

  // EV0002 - Tecnogrup
  { eval_id: "EV0002", line_no: 1, name: "Tiene experiencia previa", value: "4", check: "N", attach_id: "doc-line-004" },
  { eval_id: "EV0002", line_no: 2, name: "Cuenta con seguros y garantías necesarias para respaldar sus servicios", value: "3.5", check: "Y", attach_id: "doc-line-005" },
  { eval_id: "EV0002", line_no: 3, name: "Cumple con todas las normas laborales vigentes de seguridad para el personal", value: "Y", check: "Y", attach_id: "doc-line-006" },

  // EV0003 - Enercon
  { eval_id: "EV0003", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "doc-line-007" },
  { eval_id: "EV0003", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "doc-line-008" },
  { eval_id: "EV0003", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "doc-line-009" },

  // EV0004
  { eval_id: "EV0004", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0004", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0004", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0005
  { eval_id: "EV0005", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0005", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0005", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0006
  { eval_id: "EV0006", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0006", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0006", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "N", check: "Y", attach_id: "" },

  // EV0008
  { eval_id: "EV0008", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0008", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0008", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0009
  { eval_id: "EV0009", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0009", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0009", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0011
  { eval_id: "EV0011", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0011", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0011", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0014
  { eval_id: "EV0014", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0014", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0014", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0015
  { eval_id: "EV0015", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0015", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0015", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0016
  { eval_id: "EV0016", line_no: 1, name: "Cuenta con equipo técnico certificado", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0016", line_no: 2, name: "Presenta antecedentes comprobables", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0016", line_no: 3, name: "Cumple con plazos en contratos anteriores", value: "Y", check: "Y", attach_id: "" },

  // EV0017
  { eval_id: "EV0017", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0017", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0017", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "" },

  // EV0021
  { eval_id: "EV0021", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "doc-line-002" },
  { eval_id: "EV0021", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "doc-line-003" },
  { eval_id: "EV0021", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "doc-line-004" },

  // EV0023
  { eval_id: "EV0023", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0023", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0023", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "" },

  // EV0025
  { eval_id: "EV0025", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0025", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0025", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "" },

  // EV0026
  { eval_id: "EV0026", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0026", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "" },
  { eval_id: "EV0026", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "" }
])
await ProjectVendor.insertMany([
  // P0001
  { project_id: "P0001", vendor_id: "V0001", score: 5, ini_status: "Activo", reason: "Excelente cumplimiento en proyectos similares anteriores y entrega puntual de materiales." },
  { project_id: "P0001", vendor_id: "V0003", score: 4, ini_status: "Activo", reason: "Buen desempeño técnico, aunque presentó demoras menores en entregas previas." },
  { project_id: "P0001", vendor_id: "V0005", score: 4.5, ini_status: "Activo", reason: "Alta calidad de producto y flexibilidad comercial, con excelente atención posventa." },
  { project_id: "P0001", vendor_id: "V0007", score: 4.3, ini_status: "Activo", reason: "Cumple con certificaciones y responde bien ante imprevistos; podría mejorar la documentación." },
  { project_id: "P0001", vendor_id: "V0009", score: 4, ini_status: "Activo", reason: "Presentó inconsistencias en las entregas y documentación incompleta in contratos anteriores." },
  { project_id: "P0001", vendor_id: "V0011", score: 4, ini_status: "Activo", reason: "Cumple requisitos técnicos y normativos; aún no tiene experiencia directa con la empresa." },
  { project_id: "P0001", vendor_id: "V0013", score: 4, ini_status: "Activo", reason: "Corrección en experiencias anteriores, sin observaciones críticas." },
  { project_id: "P0001", vendor_id: "V0014", score: 4, ini_status: "Activo", reason: "Documentación y certificaciones al día, tiempos de entrega aceptables." },

  // P0002
  { project_id: "P0002", vendor_id: "V0004", score: 4.5, ini_status: "Activo", reason: "Buen proveedor menor, eficiente en logística y cumplimiento básico." },
  { project_id: "P0002", vendor_id: "V0005", score: 4.2, ini_status: "Activo", reason: "Correcto cumplimiento en calidad, con buena disposición ante requerimientos especiales." },
  { project_id: "P0002", vendor_id: "V0006", score: 4, ini_status: "Activo", reason: "Máxima confiabilidad histórica y excelente desempeño en proyectos urbanos." },
  { project_id: "P0002", vendor_id: "V0007", score: 4, ini_status: "Activo", reason: "Evaluación positiva general, con margen de mejora en plazos." },
  { project_id: "P0002", vendor_id: "V0009", score: 4.4, ini_status: "Activo", reason: "Alta calidad en ejecución, se adapta bien a condiciones de obra complejas." },
  { project_id: "P0002", vendor_id: "V0010", score: 3, ini_status: "Activo", reason: "Cumple con normas y protocolos, aunque tuvo un retraso leve en entregas parciales." },
  { project_id: "P0002", vendor_id: "V0012", score: 4, ini_status: "Activo", reason: "Buen desempeño técnico, experiencia reciente en proyectos similares." },

  // P0003
  { project_id: "P0003", vendor_id: "V0002", score: 4, ini_status: "Activo", reason: "Presentó observaciones en calidad de materiales en entregas previas." },
  { project_id: "P0003", vendor_id: "V0003", score: 4, ini_status: "Activo", reason: "Rápido en respuestas y con documentación adecuada." },
  { project_id: "P0003", vendor_id: "V0004", score: 4, ini_status: "Pendiente" },
  { project_id: "P0003", vendor_id: "V0012", score: 4, ini_status: "Activo" },
  { project_id: "P0003", vendor_id: "V0013", score: 4, ini_status: "Activo" },
  { project_id: "P0003", vendor_id: "V0014", score: 4, ini_status: "Pendiente" },
  { project_id: "P0003", vendor_id: "V0015", score: 4, ini_status: "Pendiente", reason: "Valoración positiva de calidad y cumplimiento contractual." },

  // P0004
  { project_id: "P0004", vendor_id: "V0003", score: 4, ini_status: "Activo" },
  { project_id: "P0004", vendor_id: "V0004", score: 4, ini_status: "Pendiente" },
  { project_id: "P0004", vendor_id: "V0006", score: 4, ini_status: "Activo" },
  { project_id: "P0004", vendor_id: "V0010", score: 4, ini_status: "Activo" },
  { project_id: "P0004", vendor_id: "V0011", score: 4, ini_status: "Activo" },
  { project_id: "P0004", vendor_id: "V0013", score: 4, ini_status: "Activo" },
  { project_id: "P0004", vendor_id: "V0014", score: 4, ini_status: "Pendiente" },
  { project_id: "P0004", vendor_id: "V0015", score: 4, ini_status: "Pendiente" },

  // P0005
  { project_id: "P0005", vendor_id: "V0001", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0003", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0002", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0005", score: 4, ini_status: "Pendiente" },
  { project_id: "P0005", vendor_id: "V0010", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0011", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0012", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0013", score: 4, ini_status: "Activo" },
  { project_id: "P0005", vendor_id: "V0014", score: 4, ini_status: "Pendiente" },
  { project_id: "P0005", vendor_id: "V0015", score: 4, ini_status: "Pendiente" },
]);
await SchedulePurLine.insertMany([
  // ----- CC0001 -----
  { cc_id: "CC0001", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0001", line_no: 2, qty: 500, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0008","V0002"] },
  { cc_id: "CC0001", line_no: 3, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0002"] },
  { cc_id: "CC0001", line_no: 4, qty: 50, um: "unid", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0011"] },
  { cc_id: "CC0001", line_no: 5, qty: 500, um: "unid", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0011"] },
  { cc_id: "CC0001", line_no: 6, qty: 80, um: "unid", product_id: "6", reference: "Paneles de yeso", reference_price: 30, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0001","V0007"] },
  { cc_id: "CC0001", line_no: 7, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0007"] },
  { cc_id: "CC0001", line_no: 8, qty: 15, um: "rollo", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0015"] },
  { cc_id: "CC0001", line_no: 9, qty: 60, um: "unid", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0015"] },
  { cc_id: "CC0001", line_no: 10, qty: 5, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 750, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0013"] },
  { cc_id: "CC0001", line_no: 11, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0001", line_no: 12, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0001", line_no: 13, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0001", line_no: 14, qty: 25, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0013"] },
  { cc_id: "CC0001", line_no: 15, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0012"] },
  { cc_id: "CC0001", line_no: 16, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0002","V0008"] },
  { cc_id: "CC0001", line_no: 17, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0010"] },
  { cc_id: "CC0001", line_no: 18, qty: 40, um: "planc", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0012"] },
  { cc_id: "CC0001", line_no: 19, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0012"] },
  { cc_id: "CC0001", line_no: 20, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0001", vendor_list: ["V0011","V0013"] },

  // ----- CC0002 -----
  { cc_id: "CC0002", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0002", line_no: 2, qty: 500, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0008","V0002"] },
  { cc_id: "CC0002", line_no: 3, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0002"] },
  { cc_id: "CC0002", line_no: 4, qty: 50, um: "unid", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0002", line_no: 5, qty: 500, um: "unid", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0002", line_no: 6, qty: 80, um: "unid", product_id: "6", reference: "Paneles de yeso", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0001","V0007"] },
  { cc_id: "CC0002", line_no: 7, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0007"] },
  { cc_id: "CC0002", line_no: 8, qty: 15, um: "rollo", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0002", line_no: 9, qty: 60, um: "unid", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0002", line_no: 10, qty: 5, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0002", line_no: 11, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0002", line_no: 12, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0002", line_no: 13, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0002", line_no: 14, qty: 25, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0002", line_no: 15, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0002", line_no: 16, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0002","V0008"] },
  { cc_id: "CC0002", line_no: 17, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010"] },
  { cc_id: "CC0002", line_no: 18, qty: 40, um: "planc", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0002", line_no: 19, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0002", line_no: 20, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011","V0013"] },

  // ----- CC0003 -----
  { cc_id: "CC0003", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0003", line_no: 2, qty: 500, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0008","V0002"] },
  { cc_id: "CC0003", line_no: 3, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0002"] },
  { cc_id: "CC0003", line_no: 4, qty: 50, um: "unid", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0003", line_no: 5, qty: 500, um: "unid", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0003", line_no: 6, qty: 80, um: "unid", product_id: "6", reference: "Paneles de yeso", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0001","V0007"] },
  { cc_id: "CC0003", line_no: 7, qty: 20, product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0007"] },
  { cc_id: "CC0003", line_no: 8, qty: 15, um: "rollo", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0003", line_no: 9, qty: 60, um: "unid", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0003", line_no: 10, qty: 5, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0003", line_no: 11, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0003", line_no: 12, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0003", line_no: 13, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0003", line_no: 14, qty: 25, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0003", line_no: 15, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0003", line_no: 16, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0002","V0008"] },
  { cc_id: "CC0003", line_no: 17, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0010"] },
  { cc_id: "CC0003", line_no: 18, qty: 40, um: "planc", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0003", line_no: 19, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0003", line_no: 20, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", desired_date: new Date("2024-01-01"), project_id: "P0002", vendor_list: ["V0011","V0013"] },
    { cc_id: "CC0004", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0004", line_no: 2, qty: 500, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0008","V0002"] },
  { cc_id: "CC0004", line_no: 3, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0002"] },
  { cc_id: "CC0004", line_no: 4, qty: 50, um: "unid", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0004", line_no: 5, qty: 500, um: "unid", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0011"] },
  { cc_id: "CC0004", line_no: 6, qty: 80, um: "unid", product_id: "6", reference: "Paneles de yeso", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0001","V0007"] },
  { cc_id: "CC0004", line_no: 7, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0007"] },
  { cc_id: "CC0004", line_no: 8, qty: 15, um: "rollo", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0004", line_no: 9, qty: 60, um: "unid", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0015"] },
  { cc_id: "CC0004", line_no: 10, qty: 5, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0004", line_no: 11, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0004", line_no: 12, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0004", line_no: 13, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0004", line_no: 14, qty: 25, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0013"] },
  { cc_id: "CC0004", line_no: 15, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0004", line_no: 16, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0002","V0008"] },
  { cc_id: "CC0004", line_no: 17, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0010"] },
  { cc_id: "CC0004", line_no: 18, qty: 40, um: "planc", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0004", line_no: 19, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0012"] },
  { cc_id: "CC0004", line_no: 20, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", desired_date: new Date("2024-01-08"), project_id: "P0002", vendor_list: ["V0011","V0013"] },

// ----- CC0005 -----
  { cc_id: "CC0005", line_no: 1, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", desired_date: new Date("2024-01-09"), project_id: "P0005", vendor_list: ["V0012"] },
  { cc_id: "CC0005", line_no: 2, qty: 15, um: "unidad", product_id: "22", reference: "Luces de inspección de piso", reference_price: 45, currency: "usd", desired_date: new Date("2024-01-09"), project_id: "P0005", vendor_list: ["V0012"] },
  { cc_id: "CC0005", line_no: 3, qty: 15, um: "unidad", product_id: "23", reference: "Luces de emergencia LED", reference_price: 42, currency: "usd", desired_date: new Date("2024-01-09"), project_id: "P0005", vendor_list: ["V0013"] },
  { cc_id: "CC0005", line_no: 4, qty: 15, um: "unidad", product_id: "24", reference: "Señalética fotoluminiscente", reference_price: 26, currency: "usd", desired_date: new Date("2024-01-09"), project_id: "P0005", vendor_list: ["V0013"] },

// ----- CC0006 -----
  { cc_id: "CC0006", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0006", line_no: 2, qty: 50, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0008","V0002"] },
  { cc_id: "CC0006", line_no: 3, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0002"] },
  { cc_id: "CC0006", line_no: 4, qty: 50, um: "unid", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0011"] },
  { cc_id: "CC0006", line_no: 5, qty: 500, um: "unid", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0011"] },
  { cc_id: "CC0006", line_no: 6, qty: 80, um: "unid", product_id: "6", reference: "Paneles de yeso", reference_price: 30, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0001","V0007"] },
  { cc_id: "CC0006", line_no: 7, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0007"] },
  { cc_id: "CC0006", line_no: 8, qty: 15, um: "rollo", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0015"] },
  { cc_id: "CC0006", line_no: 9, qty: 60, um: "unid", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0015"] },
  { cc_id: "CC0006", line_no: 10, qty: 5, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 750, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0013"] },
  { cc_id: "CC0006", line_no: 11, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0003","V0004"] },
  { cc_id: "CC0006", line_no: 12, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0006", line_no: 13, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0010","V0003"] },
  { cc_id: "CC0006", line_no: 14, qty: 25, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0013"] },
  { cc_id: "CC0006", line_no: 15, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0006", line_no: 16, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0002","V0008"] },
  { cc_id: "CC0006", line_no: 17, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0010"] },
  { cc_id: "CC0006", line_no: 18, qty: 40, um: "planc", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0006", line_no: 19, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0006", line_no: 20, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", desired_date: new Date("2024-02-01"), project_id: "P0003", vendor_list: ["V0011","V0013"] },
   
 { cc_id: "CC0007", line_no: 11, um: "unit", qty: 40, product_id: "LED_EXTERIOR", product_desc: "Luminarias LED para exterior", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", project_id: "P0003", vendor_list: ["V0003", "V0004"] },
  { cc_id: "CC0007", line_no: 12, um: "unit", qty: 25, product_id: "SWITCH_BREAKER", product_desc: "Llaves térmicas y disyuntores", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", project_id: "P0003", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0007", line_no: 13, um: "rollo", qty: 30, product_id: "CABLE_100M", product_desc: "Cables unipolares (rollo 100m)", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", project_id: "P0003", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0007", line_no: 14, um: "balde", qty: 20, product_id: "PAINT_TOUCHUP", product_desc: "Pintura de retoque (balde)", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", project_id: "P0003", vendor_list: ["V0013"] },
  { cc_id: "CC0007", line_no: 15, um: "cartucho", qty: 50, product_id: "SILICONA", product_desc: "Silicona para sellado", reference: "Silicona para sellado", reference_price: 15, currency: "usd", project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0007", line_no: 16, um: "unit", qty: 100, product_id: "BLOQUE_REPUESTO", product_desc: "Repuestos de bloques de horm", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", project_id: "P0003", vendor_list: ["V0002", "V0008"] },
  { cc_id: "CC0007", line_no: 17, um: "unit", qty: 60, product_id: "TAPA_CIEGA", product_desc: "Tapa ciega y toma corriente", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", project_id: "P0003", vendor_list: ["V0010"] },
  { cc_id: "CC0007", line_no: 18, um: "planch.", qty: 20, product_id: "MALLA_ELECTRO", product_desc: "Malla electrosoldada", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0007", line_no: 19, um: "unit", qty: 15, product_id: "CARTELERIA", product_desc: "Cartelería de seguridad final", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", project_id: "P0003", vendor_list: ["V0012"] },
  { cc_id: "CC0007", line_no: 20, um: "m2", qty: 120, product_id: "PISO_VINILICO", product_desc: "Piso vinílico para interior", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", project_id: "P0003", vendor_list: ["V0011", "V0013"] },

  // CC0008 (corregido: se agrega reference)
  { cc_id: "CC0008", line_no: 1, um: "meses", qty: 3, product_id: "ELECTRO_TRIF", product_desc: "Grupo electrógeno trifásico (die", reference: "Grupo electrógeno trifásico (die", reference_price: 1500, currency: "usd", project_id: "P0004", vendor_list: ["V0003", "V0004"] },
  { cc_id: "CC0008", line_no: 2, um: "bolsas", qty: 50, product_id: "CEMENTO", product_desc: "Bolsas de cemento", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", project_id: "P0004", vendor_list: ["V0008", "V0002"] },
  { cc_id: "CC0008", line_no: 3, um: "mts", qty: 200, product_id: "HIERRO_8MM", product_desc: "Hierro del 8mm", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", project_id: "P0004", vendor_list: ["V0002"] },
  { cc_id: "CC0008", line_no: 4, um: "bolsas", qty: 30, product_id: "ARENA_LAVADA", product_desc: "Arena lavada (m3)", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", project_id: "P0004", vendor_list: ["V0007"] },
  { cc_id: "CC0008", line_no: 5, um: "unit", qty: 500, product_id: "BLOQUE_HORMIGON", product_desc: "Bloques de hormigón", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", project_id: "P0004", vendor_list: ["V0011"] },
  { cc_id: "CC0008", line_no: 6, um: "unit", qty: 80, product_id: "PANEL_YESO", product_desc: "Paneles de yeso", reference: "Paneles de yeso", reference_price: 300, currency: "usd", project_id: "P0004", vendor_list: ["V0011"] },
  { cc_id: "CC0008", line_no: 7, um: "latas", qty: 20, product_id: "PINTURA_LATEX", product_desc: "Pintura látex (balde)", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", project_id: "P0004", vendor_list: ["V0001", "V0007"] },
  { cc_id: "CC0008", line_no: 8, um: "rollo", qty: 15, product_id: "AISLANTE_TERMICO", product_desc: "Aislante térmico (rollo)", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", project_id: "P0004", vendor_list: ["V0015"] },
  { cc_id: "CC0008", line_no: 9, um: "unit", qty: 25, product_id: "CAL_HIDRATADA", product_desc: "Cal hidratada (bolsa)", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", project_id: "P0004", vendor_list: ["V0013"] },
  { cc_id: "CC0008", line_no: 10, um: "m3", qty: 25, product_id: "GRAVA_GRUESA", product_desc: "Grava gruesa (m3)", reference: "Grava gruesa (m3)", reference_price: 700, currency: "usd", project_id: "P0004", vendor_list: ["V0013"] },
  { cc_id: "CC0008", line_no: 11, um: "unit", qty: 40, product_id: "LED_EXTERIOR", product_desc: "Luminarias LED para exterior", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", project_id: "P0004", vendor_list: ["V0003", "V0004"] },
  { cc_id: "CC0008", line_no: 12, um: "unit", qty: 25, product_id: "SWITCH_BREAKER", product_desc: "Llaves térmicas y disyuntores", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", project_id: "P0004", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0008", line_no: 13, um: "rollo", qty: 30, product_id: "CABLE_100M", product_desc: "Cables unipolares (rollo 100m)", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", project_id: "P0004", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0008", line_no: 14, um: "balde", qty: 20, product_id: "PAINT_TOUCHUP", product_desc: "Pintura de retoque (balde)", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", project_id: "P0004", vendor_list: ["V0013"] },
  { cc_id: "CC0008", line_no: 15, um: "cartucho", qty: 50, product_id: "SILICONA", product_desc: "Silicona para sellado", reference: "Silicona para sellado", reference_price: 15, currency: "usd", project_id: "P0004", vendor_list: ["V0012"] },
  { cc_id: "CC0008", line_no: 16, um: "unit", qty: 100, product_id: "BLOQUE_REPUESTO", product_desc: "Repuestos de bloques de horm", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", project_id: "P0004", vendor_list: ["V0002", "V0008"] },
  { cc_id: "CC0008", line_no: 17, um: "unit", qty: 60, product_id: "TAPA_CIEGA", product_desc: "Tapa ciega y toma corriente", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", project_id: "P0004", vendor_list: ["V0010"] },
  { cc_id: "CC0008", line_no: 18, um: "planch.", qty: 20, product_id: "MALLA_ELECTRO", product_desc: "Malla electrosoldada", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", project_id: "P0004", vendor_list: ["V0012"] },
  { cc_id: "CC0008", line_no: 19, um: "unit", qty: 15, product_id: "CARTELERIA", product_desc: "Cartelería de seguridad final", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", project_id: "P0004", vendor_list: ["V0012"] },
  { cc_id: "CC0008", line_no: 20, um: "m2", qty: 120, product_id: "PISO_VINILICO", product_desc: "Piso vinílico para interior", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", project_id: "P0004", vendor_list: ["V0011", "V0013"] },

  // CC0009 (corregido: se agrega reference)
  { cc_id: "CC0009", line_no: 1, um: "meses", qty: 3, product_id: "ELECTRO_TRIF", product_desc: "Grupo electrógeno trifásico (die", reference: "Grupo electrógeno trifásico (die", reference_price: 1500, currency: "usd", project_id: "P0005", vendor_list: ["V0003", "V0004"] },
  { cc_id: "CC0009", line_no: 2, um: "bolsas", qty: 50, product_id: "CEMENTO", product_desc: "Bolsas de cemento", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", project_id: "P0005", vendor_list: ["V0008", "V0002"] },
  { cc_id: "CC0009", line_no: 3, um: "mts", qty: 200, product_id: "HIERRO_8MM", product_desc: "Hierro del 8mm", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", project_id: "P0005", vendor_list: ["V0002"] },
  { cc_id: "CC0009", line_no: 4, um: "bolsas", qty: 30, product_id: "ARENA_LAVADA", product_desc: "Arena lavada (m3)", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", project_id: "P0005", vendor_list: ["V0007"] },
  { cc_id: "CC0009", line_no: 5, um: "unit", qty: 500, product_id: "BLOQUE_HORMIGON", product_desc: "Bloques de hormigón", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", project_id: "P0005", vendor_list: ["V0011"] },
  { cc_id: "CC0009", line_no: 6, um: "unit", qty: 80, product_id: "PANEL_YESO", product_desc: "Paneles de yeso", reference: "Paneles de yeso", reference_price: 300, currency: "usd", project_id: "P0005", vendor_list: ["V0011"] },
  { cc_id: "CC0009", line_no: 7, um: "latas", qty: 20, product_id: "PINTURA_LATEX", product_desc: "Pintura látex (balde)", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", project_id: "P0005", vendor_list: ["V0001", "V0007"] },
  { cc_id: "CC0009", line_no: 8, um: "rollo", qty: 15, product_id: "AISLANTE_TERMICO", product_desc: "Aislante térmico (rollo)", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", project_id: "P0005", vendor_list: ["V0015"] },
  { cc_id: "CC0009", line_no: 9, um: "unit", qty: 25, product_id: "CAL_HIDRATADA", product_desc: "Cal hidratada (bolsa)", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", project_id: "P0005", vendor_list: ["V0013"] },
  { cc_id: "CC0009", line_no: 10, um: "m3", qty: 25, product_id: "GRAVA_GRUESA", product_desc: "Grava gruesa (m3)", reference: "Grava gruesa (m3)", reference_price: 700, currency: "usd", project_id: "P0005", vendor_list: ["V0013"] },
  { cc_id: "CC0009", line_no: 11, um: "unit", qty: 40, product_id: "LED_EXTERIOR", product_desc: "Luminarias LED para exterior", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", project_id: "P0005", vendor_list: ["V0003", "V0004"] },
  { cc_id: "CC0009", line_no: 12, qty: 25, um: "unit", product_id: "SWITCH_BREAKER", product_desc: "Llaves térmicas y disyuntores", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", project_id: "P0005", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0009", line_no: 13, um: "rollo", qty: 30, product_id: "CABLE_100M", product_desc: "Cables unipolares (rollo 100m)", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", project_id: "P0005", vendor_list: ["V0010", "V0003"] },
  { cc_id: "CC0009", line_no: 14, um: "balde", qty: 20, product_id: "PAINT_TOUCHUP", product_desc: "Pintura de retoque (balde)", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", project_id: "P0005", vendor_list: ["V0013"] },
  { cc_id: "CC0009", line_no: 15, um: "cartucho", qty: 50, product_id: "SILICONA", product_desc: "Silicona para sellado", reference: "Silicona para sellado", reference_price: 15, currency: "usd", project_id: "P0005", vendor_list: ["V0012"] },
  { cc_id: "CC0009", line_no: 16, um: "unit", qty: 100, product_id: "BLOQUE_REPUESTO", product_desc: "Repuestos de bloques de horm", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", project_id: "P0005", vendor_list: ["V0002", "V0008"] },
  { cc_id: "CC0009", line_no: 17, um: "unit", qty: 60, product_id: "TAPA_CIEGA", product_desc: "Tapa ciega y toma corriente", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", project_id: "P0005", vendor_list: ["V0010"] },
  { cc_id: "CC0009", line_no: 18, um: "planch.", qty: 20, product_id: "MALLA_ELECTRO", product_desc: "Malla electrosoldada", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", project_id: "P0005", vendor_list: ["V0012"] },
  { cc_id: "CC0009", line_no: 19, um: "unit", qty: 15, product_id: "CARTELERIA", product_desc: "Cartelería de seguridad final", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", project_id: "P0005", vendor_list: ["V0012"] },
  { cc_id: "CC0009", line_no: 20, um: "m2", qty: 120, product_id: "PISO_VINILICO", product_desc: "Piso vinílico para interior", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", project_id: "P0005", vendor_list: ["V0011", "V0013"] }

])

await QuoteRequest.insertMany([
  // CC0001 QuoteRequests
  { qr_id: "QR101", vendor_id: "V0003", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR102", vendor_id: "V0004", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR103", vendor_id: "V0008", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR104", vendor_id: "V0002", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR105", vendor_id: "V0011", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR106", vendor_id: "V0001", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR107", vendor_id: "V0007", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR108", vendor_id: "V0013", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR109", vendor_id: "V0015", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR110", vendor_id: "V0010", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },
  { qr_id: "QR111", vendor_id: "V0012", date: new Date("2024-10-12"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0001" },

  // CC0002 QuoteRequests
  { qr_id: "QR201", vendor_id: "V0003", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR202", vendor_id: "V0004", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR203", vendor_id: "V0010", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR204", vendor_id: "V0013", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR205", vendor_id: "V0012", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR206", vendor_id: "V0002", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR207", vendor_id: "V0008", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },
  { qr_id: "QR208", vendor_id: "V0011", date: new Date("2024-10-04"), reference: "Consolidado obra P0001 / Cronograma de Compras CC0002" },

  // CC0003 QuoteRequests
  { qr_id: "QR301", vendor_id: "V0003", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR302", vendor_id: "V0004", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR303", vendor_id: "V0008", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR304", vendor_id: "V0002", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR305", vendor_id: "V0011", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR306", vendor_id: "V0001", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR307", vendor_id: "V0007", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR308", vendor_id: "V0013", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR309", vendor_id: "V0015", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR310", vendor_id: "V0010", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },
  { qr_id: "QR311", vendor_id: "V0012", date: new Date("2024-10-06"), reference: "Consolidado final obra P0002" },

  // CC0006 QuoteRequests (P0003)
  { qr_id: "QR401", vendor_id: "V0003", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR402", vendor_id: "V0004", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR403", vendor_id: "V0015", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR404", vendor_id: "V0011", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR405", vendor_id: "V0002", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR406", vendor_id: "V0008", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR407", vendor_id: "V0013", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" },
  { qr_id: "QR408", vendor_id: "V0012", date: new Date("2024-10-06"), reference: "Consolidado obra P0003" }
]);

await PM.insertMany([
  { id: "PM001", email: "carlos.mendez@company.com", name: "Carlos", surname: "Mendez" },
  { id: "PM002", email: "ana.rodriguez@company.com", name: "Ana", surname: "Rodriguez" },
  { id: "PM003", email: "luis.garcia@company.com", name: "Luis", surname: "Garcia" },
  { id: "PM004", email: "maria.lopez@company.com", name: "Maria", surname: "Lopez" },
  { id: "PM005", email: "pedro.martinez@company.com", name: "Pedro", surname: "Martinez" },
  { id: "PM006", email: "sofia.torres@company.com", name: "Sofia", surname: "Torres" },
  { id: "PM007", email: "diego.sanchez@company.com", name: "Diego", surname: "Sanchez" },
  { id: "PM008", email: "laura.fernandez@company.com", name: "Laura", surname: "Fernandez" }
]);

await ProjectPM.insertMany([
  // P0001 Project Managers
  { project_id: "P0001", pm_id: "PM001", name: "Carlos", surname: "Mendez" },
  { project_id: "P0001", pm_id: "PM002", name: "Ana", surname: "Rodriguez" },
  
  // P0002 Project Managers
  { project_id: "P0002", pm_id: "PM003", name: "Luis", surname: "Garcia" },
  { project_id: "P0002", pm_id: "PM004", name: "Maria", surname: "Lopez" },
  
  // P0003 Project Managers
  { project_id: "P0003", pm_id: "PM005", name: "Pedro", surname: "Martinez" },
  { project_id: "P0003", pm_id: "PM006", name: "Sofia", surname: "Torres" },
  
  // P0004 Project Managers
  { project_id: "P0004", pm_id: "PM007", name: "Diego", surname: "Sanchez" },
  { project_id: "P0004", pm_id: "PM008", name: "Laura", surname: "Fernandez" },
  
  // P0005 Project Managers
  { project_id: "P0005", pm_id: "PM001", name: "Carlos", surname: "Mendez" },
  { project_id: "P0005", pm_id: "PM003", name: "Luis", surname: "Garcia" }
]);

await QuoteRequestLine.insertMany([
  // ...existing entries...

  // Continuando desde donde terminamos, agregando los que faltan del segundo spreadsheet
  { qr_id: "QR211", line_no: 1, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", unit_price: 55, desired_date: new Date("2024-01-14"), promise_date: new Date("2024-01-14"), cc_id: "CC0002", cc_id_line: 21, status: "win" },
  { qr_id: "QR211", line_no: 2, qty: 15, um: "unidad", product_id: "22", reference: "Luces de inspección de piso", reference_price: 45, currency: "usd", unit_price: 45, desired_date: new Date("2024-01-14"), promise_date: new Date("2024-01-14"), cc_id: "CC0002", cc_id_line: 22, status: "win" },
  { qr_id: "QR211", line_no: 3, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", unit_price: 55, desired_date: new Date("2024-01-14"), promise_date: new Date("2024-01-14"), cc_id: "CC0005", cc_id_line: 21, status: "win" },
  { qr_id: "QR211", line_no: 4, qty: 15, um: "unidad", product_id: "24", reference: "Señalética fotoluminiscente", reference_price: 26, currency: "usd", unit_price: 26, desired_date: new Date("2024-01-14"), promise_date: new Date("2024-01-14"), cc_id: "CC0005", cc_id_line: 24, status: "win" },
  { qr_id: "QR211", line_no: 5, qty: 4, um: "unidad", product_id: "26", reference: "Botiquín de primeros auxilios c", reference_price: 75, currency: "usd", unit_price: 75, desired_date: new Date("2024-01-14"), promise_date: new Date("2024-01-14"), cc_id: "CC0005", cc_id_line: 26, status: "win" },

  // QR401 - CC0006 entries
  { qr_id: "QR401", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 1, status: "win" },
  { qr_id: "QR401", line_no: 2, qty: 12, um: "unidad", product_id: "23", reference: "Luces de emergencia LED", reference_price: 42, currency: "usd", unit_price: 42, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 23, status: "win" },

  { qr_id: "QR402", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 1, status: "win" },

  { qr_id: "QR403", line_no: 1, qty: 60, um: "unit", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", unit_price: 350, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 9, status: "win" },

  { qr_id: "QR404", line_no: 1, qty: 30, um: "m3", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", unit_price: 950, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 4, status: "win" },
  { qr_id: "QR404", line_no: 2, qty: 3, um: "unidad", product_id: "29", reference: "Dispenser de jabón acero inoxi", reference_price: 60, currency: "usd", unit_price: 60, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 29, status: "win" },

  { qr_id: "QR405", line_no: 1, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 16, status: "win" },

  { qr_id: "QR406", line_no: 1, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 16, status: "win" },

  { qr_id: "QR407", line_no: 1, qty: 10, um: "unidad", product_id: "25", reference: "Cinta antideslizante para escal", reference_price: 30, currency: "usd", unit_price: 30, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 25, status: "win" },
  { qr_id: "QR407", line_no: 2, qty: 25, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", unit_price: 22, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 20, status: "win" },

  { qr_id: "QR408", line_no: 1, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", unit_price: 55, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 21, status: "win" },
  { qr_id: "QR301", line_no: 4, qty: 12, um: "unidad", product_id: "23", reference: "Luces de emergencia LED", reference_price: 42, currency: "usd", unit_price: 42, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 23, status: "done" },

  // QR302 - CC0003
  { qr_id: "QR302", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 1, status: "done" },
  { qr_id: "QR302", line_no: 2, qty: 40, um: "unit", product_id: "11", reference: "Luminarias LED para exterior", reference_price: 85, currency: "usd", unit_price: 85, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 11, status: "done" },
  { qr_id: "QR302", line_no: 3, qty: 12, um: "unidad", product_id: "23", reference: "Luces de emergencia LED", reference_price: 42, currency: "usd", unit_price: 42, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 23, status: "done" },

  // QR303 - CC0003
  { qr_id: "QR303", line_no: 1, qty: 50, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", unit_price: 400, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 2, status: "done" },
  { qr_id: "QR303", line_no: 2, qty: 80, um: "unit", product_id: "6", reference: "Paneles de yeso", reference_price: 300, currency: "usd", unit_price: 300, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 6, status: "done" },
  { qr_id: "QR303", line_no: 3, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 16, status: "done" },

  // QR304 - CC0003
  { qr_id: "QR304", line_no: 1, qty: 50, um: "bolsas", product_id: "2", reference: "Bolsas de cemento", reference_price: 400, currency: "usd", unit_price: 400, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 2, status: "done" },
  { qr_id: "QR304", line_no: 2, qty: 200, um: "mts", product_id: "3", reference: "Hierro del 8mm", reference_price: 1200, currency: "usd", unit_price: 1200, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 3, status: "done" },
  { qr_id: "QR304", line_no: 3, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 16, status: "done" },
  { qr_id: "QR304", line_no: 4, qty: 20, um: "plancha", product_id: "18", reference: "Malla electrosoldada", reference_price: 45, currency: "usd", unit_price: 45, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 18, status: "done" },
  { qr_id: "QR304", line_no: 5, qty: 25, um: "unidad", product_id: "22", reference: "Tapas de inspección de piso", reference_price: 18, currency: "usd", unit_price: 18, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 22, status: "done" },
  { qr_id: "QR304", line_no: 6, qty: 1000, um: "unidad", product_id: "28", reference: "Tornillos de fijación galvanizad.", reference_price: 0.15, currency: "usd", unit_price: 0.15, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 28, status: "done" },

  // QR305 - CC0003
  { qr_id: "QR305", line_no: 1, qty: 30, um: "bolsas", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", unit_price: 950, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 4, status: "waiting" },
  { qr_id: "QR305", line_no: 2, qty: 500, um: "unit", product_id: "5", reference: "Bloques de hormigón", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 5, status: "waiting" },
  { qr_id: "QR305", line_no: 3, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", unit_price: 22, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 20, status: "waiting" },
  { qr_id: "QR305", line_no: 4, qty: 3, um: "unidad", product_id: "29", reference: "Dispenser de jabón acero inoxi", reference_price: 60, currency: "usd", unit_price: 60, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 29, status: "waiting" },

  // QR306 - CC0003
  { qr_id: "QR306", line_no: 1, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", unit_price: 800, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 7, status: "waiting" },

  // QR307 - CC0003
  { qr_id: "QR307", line_no: 1, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", unit_price: 800, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 7, status: "waiting" },
  { qr_id: "QR307", line_no: 2, qty: 15, um: "unit", product_id: "8", reference: "Aislante térmico (rollo)", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 8, status: "waiting" },
  { qr_id: "QR307", line_no: 3, qty: 5, um: "unidad", product_id: "30", reference: "Rejillas pluviales para vereda", reference_price: 45, currency: "usd", unit_price: 45, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 30, status: "waiting" },

  // QR308 - CC0003
  { qr_id: "QR308", line_no: 1, qty: 20, um: "latas", product_id: "7", reference: "Pintura látex (balde)", reference_price: 800, currency: "usd", unit_price: 800, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 7, status: "waiting" },
  { qr_id: "QR308", line_no: 2, qty: 25, um: "m3", product_id: "10", reference: "Grava gruesa (m3)", reference_price: 700, currency: "usd", unit_price: 700, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 10, status: "waiting" },
  { qr_id: "QR308", line_no: 3, qty: 10, um: "balde", product_id: "14", reference: "Pintura de retoque (balde)", reference_price: 750, currency: "usd", unit_price: 750, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 14, status: "waiting" },
  { qr_id: "QR308", line_no: 4, qty: 120, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", unit_price: 22, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 20, status: "waiting" },
  { qr_id: "QR308", line_no: 5, qty: 10, um: "unidad", product_id: "25", reference: "Cinta antideslizante para escal", reference_price: 30, currency: "usd", unit_price: 30, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 25, status: "waiting" },

  // QR309 - CC0003
  { qr_id: "QR309", line_no: 1, qty: 60, um: "unit", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", unit_price: 350, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0003", cc_id_line: 9, status: "waiting" },

  // QR310 - CC0004
  { qr_id: "QR310", line_no: 1, qty: 25, um: "unit", product_id: "12", reference: "Llaves térmicas y disyuntores", reference_price: 60, currency: "usd", unit_price: 60, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 12, status: "waiting" },
  { qr_id: "QR310", line_no: 2, qty: 30, um: "rollo", product_id: "13", reference: "Cables unipolares (rollo 100m)", reference_price: 110, currency: "usd", unit_price: 110, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 13, status: "waiting" },
  { qr_id: "QR310", line_no: 3, qty: 60, um: "unit", product_id: "17", reference: "Tapa ciega y toma corriente", reference_price: 8, currency: "usd", unit_price: 8, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 17, status: "waiting" },
  { qr_id: "QR310", line_no: 4, qty: 8, um: "unidad", product_id: "27", reference: "Timbres de aviso sonoro", reference_price: 20, currency: "usd", unit_price: 20, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 27, status: "waiting" },

  // QR311 - CC0004
  { qr_id: "QR311", line_no: 1, qty: 50, um: "cartucho", product_id: "15", reference: "Silicona para sellado", reference_price: 15, currency: "usd", unit_price: 15, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 15, status: "waiting" },
  { qr_id: "QR311", line_no: 2, qty: 15, um: "unit", product_id: "19", reference: "Cartelería de seguridad final", reference_price: 30, currency: "usd", unit_price: 30, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0004", cc_id_line: 19, status: "waiting" },
  { qr_id: "QR311", line_no: 3, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", unit_price: 55, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 21, status: "waiting" },
  { qr_id: "QR311", line_no: 4, qty: 15, um: "unidad", product_id: "24", reference: "Señalética fotoluminiscente", reference_price: 26, currency: "usd", unit_price: 26, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 24, status: "waiting" },
  { qr_id: "QR311", line_no: 5, qty: 4, um: "unidad", product_id: "26", reference: "Botiquín de primeros auxilios c", reference_price: 75, currency: "usd", unit_price: 75, desired_date: new Date("2024-01-08"), promise_date: new Date("2024-01-08"), cc_id: "CC0005", cc_id_line: 26, status: "waiting" },

  // QR401 - CC0006
  { qr_id: "QR401", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 1, status: "waiting" },
  { qr_id: "QR401", line_no: 2, qty: 12, um: "unidad", product_id: "23", reference: "Luces de emergencia LED", reference_price: 42, currency: "usd", unit_price: 42, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 23, status: "waiting" },

  // QR402 - CC0006
  { qr_id: "QR402", line_no: 1, qty: 3, um: "meses", product_id: "1", reference: "Grupo electrógeno trifásico (dix)", reference_price: 1500, currency: "usd", unit_price: 1500, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 1, status: "waiting" },

  // QR403 - CC0006
  { qr_id: "QR403", line_no: 1, qty: 60, um: "unit", product_id: "9", reference: "Cal hidratada (bolsa)", reference_price: 350, currency: "usd", unit_price: 350, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 9, status: "waiting" },

  // QR404 - CC0006
  { qr_id: "QR404", line_no: 1, qty: 30, um: "m3", product_id: "4", reference: "Arena lavada (m3)", reference_price: 950, currency: "usd", unit_price: 950, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 4, status: "waiting" },
  { qr_id: "QR404", line_no: 2, qty: 3, um: "unidad", product_id: "29", reference: "Dispenser de jabón acero inoxi", reference_price: 60, currency: "usd", unit_price: 60, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 29, status: "waiting" },

  // QR405 - CC0006
  { qr_id: "QR405", line_no: 1, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 16, status: "waiting" },

  // QR406 - CC0006
  { qr_id: "QR406", line_no: 1, qty: 100, um: "unit", product_id: "16", reference: "Repuestos de bloques de horm", reference_price: 25, currency: "usd", unit_price: 25, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 16, status: "waiting" },

  // QR407 - CC0006
  { qr_id: "QR407", line_no: 1, qty: 10, um: "unidad", product_id: "25", reference: "Cinta antideslizante para escal", reference_price: 30, currency: "usd", unit_price: 30, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 25, status: "waiting" },
  { qr_id: "QR407", line_no: 2, qty: 25, um: "m2", product_id: "20", reference: "Piso vinílico para interior", reference_price: 22, currency: "usd", unit_price: 22, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 20, status: "waiting" },

  // QR408 - CC0006
  { qr_id: "QR408", line_no: 1, qty: 6, um: "unidad", product_id: "21", reference: "Extintores certificados", reference_price: 55, currency: "usd", unit_price: 55, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 21, status: "waiting" },
  { qr_id: "QR408", line_no: 2, qty: 15, um: "unidad", product_id: "24", reference: "Señalética fotoluminiscente", reference_price: 26, currency: "usd", unit_price: 26, desired_date: new Date("2024-01-09"), promise_date: new Date("2024-01-09"), cc_id: "CC0006", cc_id_line: 24, status: "waiting" }

]);

await SchedulePur.insertMany([
  { cc_id: "CC0001", description: "Cronograma de Compras inicial", project_id: "P0001", pm_id: "PM001", date: new Date("2025-01-01"), status: "Close" },
  { cc_id: "CC0002", description: "Cronogramas de Compras Etapa Final", project_id: "P0001", pm_id: "PM001", date: new Date("2025-01-04"), status: "Close" },
  { cc_id: "CC0003", description: "Cronograma de Compras inicial", project_id: "P0002", pm_id: "PM002", date: new Date("2025-01-01"), status: "Close" },
  { cc_id: "CC0004", description: "Cronograma de Compras Etapa carrera cabezado", project_id: "P0002", pm_id: "PM003", date: new Date("2025-01-06"), status: "Close" },
  { cc_id: "CC0005", description: "Cronogramas de Compras Etapa Final", project_id: "P0002", pm_id: "PM003", date: new Date("2025-01-06"), status: "Waiting" },
  { cc_id: "CC0006", description: "Cronograma de Compras Excavadores, Topografia", project_id: "P0003", pm_id: "PM001", date: new Date("2025-01-06"), status: "Waiting" },
  { cc_id: "CC0007", description: "Cronograma de Compras inicial Material", project_id: "P0003", pm_id: "PM004", date: new Date("2025-01-06"), status: "WIP" },
  { cc_id: "CC0008", description: "Cronograma de Compras inicial", project_id: "P0004", pm_id: "PM002", date: new Date("2025-01-06"), status: "WIP" },
  { cc_id: "CC0009", description: "Cronograma de Compras inicial", project_id: "P0005", pm_id: "PM005", date: new Date("2025-01-06"), status: "WIP" }
]);


};

seed()
  .then(() => {
    console.log("Seeding completed.");
    mongoose.disconnect();
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    mongoose.disconnect();
  });

