import mongoose from "mongoose";
import dotenv from "dotenv";

// Modelos
import Vendor from "./models/Vendor";
import Project from "./models/Project";
import Quote from "./models/Quote";
import QuoteLine from "./models/QuoteLine";
import VendorEval from "./models/VendorEval";
import VendorEvalLine from "./models/VendorEvalLine";
import PreselectVendor from "./models/PreselectVendor";
import ProjectVendor from "./models/ProjectVendor";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";

const seed = async () => {
  await mongoose.connect(MONGO_URI);

  // Limpiar todo
  await Promise.all([
    Vendor.deleteMany({}),
    Project.deleteMany({}),
    Quote.deleteMany({}),
    QuoteLine.deleteMany({}),
    VendorEval.deleteMany({}),
    VendorEvalLine.deleteMany({}),
    PreselectVendor.deleteMany({}),
    ProjectVendor.deleteMany({}),
  ]);

  // Insertar Vendors
  await Vendor.insertMany([
    { id: "V0001", name: "Barraca Central", reference_name: "Central", class: "Material", rubro: "Materiales de Construcción", legal_type: "RUT", legal_id: "211234560012", main_mail: "compras@barraca", in_contact_name: "Juan Pérez", mobile: "Activo", status: "Activo", type: "ready", score_avg: 5 },
    { id: "V0002", name: "Barraca Sur", reference_name: "Barraca Sur", class: "Material", rubro: "Cementos y Hormigón", legal_type: "RUT", legal_id: "213456780012", main_mail: "ventas@barraca", in_contact_name: "Laura Méndez", mobile: "Activo", status: "Activo", type: "ready", score_avg: 4 },
    { id: "V0003", name: "Enercon Uruguay", reference_name: "Enercon", class: "Servicio", rubro: "Suministro Eléctrico", legal_type: "RUT", legal_id: "218765430012", main_mail: "contacto@ener", in_contact_name: "Carlos Techera", mobile: "Activo", status: "Activo", type: "ready", score_avg: 4 },
    { id: "V0004", name: "Tecnogroup", reference_name: "Tecnogroup", class: "Servicio", rubro: "Suministro Eléctrico", legal_type: "RUT", legal_id: "228765430012", main_mail: "ventas@tecno", in_contact_name: "Martina Suárez", mobile: "Activo", status: "Activo", type: "ready", score_avg: 3 },
    { id: "V0005", name: "Grupel Uruguay", reference_name: "Grupel", class: "Servicio", rubro: "Suministro Eléctrico", legal_type: "RUT", legal_id: "", main_mail: "", in_contact_name: "Ruben Palo", mobile: "Activo", status: "Activo", type: "draft", score_avg: 0 },
    { id: "V0006", name: "Soluciones Rápidas", reference_name: "SR", class: "Servicio", rubro: "Proveedores Menores", legal_type: "RUT", legal_id: "215423190012", main_mail: "info@solrapida", in_contact_name: "Lucía Fernández", mobile: "Activo", status: "Activo", type: "ready", score_avg: 4.8 },
   { id: "V0007", name: "Barraca Nou", reference_name: "Nou", class: "", rubro: "", legal_type: "", legal_id: "", main_mail: "", in_contact_name: "", mobile: "", status: "", type: "", score_avg: 0 },
  ]);

  // Insertar Projects
  await Project.insertMany([
    { id: "P0001", name: "Reacondicionamiento Shopping Punta del Este" },
    { id: "P0002", name: "Construcción Torre Montevideo II" },
    { id: "P0011", name: "Proyecto Prueba 1" },
    { id: "P0012", name: "Proyecto Prueba 2" },
  ]);

  // Vendor Evals
  await VendorEval.insertMany([
    { eval_id: "EV0001", eval_name: "Certificación ISO", vendor_id: "V0001", start_date: "2023-01-01", due_date: "2025-01-01", type: "ISO", attach_id: "doc001" },
    { eval_id: "EV0002", eval_name: "Autoevaluación", vendor_id: "V0004", start_date: "2024-06-01", due_date: "2024-12-31", type: "Auto", attach_id: "doc002" },
    { eval_id: "EV0003", eval_name: "Certificación ISO", vendor_id: "V0003", start_date: "2023-01-01", due_date: "2025-08-01", type: "ISO", attach_id: "doc003" },
  ]);

  // Vendor Eval Lines
  await VendorEvalLine.insertMany([
    { eval_id: "EV0001", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "doc-line-001" },
    { eval_id: "EV0001", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "doc-line-002" },
    { eval_id: "EV0001", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "doc-line-003" },
    { eval_id: "EV0002", line_no: 1, name: "Tiene experiencia previa", value: "4", check: "N", attach_id: "doc-line-004" },
    { eval_id: "EV0002", line_no: 2, name: "Cuenta con garantías", value: "3.5", check: "Y", attach_id: "doc-line-005" },
    { eval_id: "EV0003", line_no: 1, name: "Cumple ISO9001", value: "Y", check: "Y", attach_id: "doc-line-006" },
    { eval_id: "EV0003", line_no: 2, name: "Cumple ISO 14001", value: "Y", check: "Y", attach_id: "doc-line-007" },
    { eval_id: "EV0003", line_no: 3, name: "Cumple ISO 45001", value: "Y", check: "Y", attach_id: "doc-line-009" },
  ]);

  // Preselect Vendors
  await PreselectVendor.insertMany([
    { project_id: "P0001", vendor_id: "V0001", status: "Approved" },
    { project_id: "P0001", vendor_id: "V0003", status: "Approved" },
    { project_id: "P0001", vendor_id: "V0004", status: "Pending" },
    { project_id: "P0001", vendor_id: "V0005", status: "Waiting" },
    { project_id: "P0001", vendor_id: "V0006", status: "Pending" },
    { project_id: "P0002", vendor_id: "V0004", status: "Waiting" },
    { project_id: "P0002", vendor_id: "V0006", status: "Pending" },
  ]);

  // Project Vendors
  await ProjectVendor.insertMany([
    { project_id: "P0011", vendor_id: "V0001", score: 5, status: "Activo" },
    { project_id: "P0011", vendor_id: "V0003", score: 4, status: "Activo" },
    { project_id: "P0012", vendor_id: "V0001", score: 3, status: "Activo" },
  ]);

  // Quotes
await Quote.insertMany([
  { id: "Q1001", project_id: "P0001", date: "2025-07-01" },
]);

  // Quote Lines
  await QuoteLine.insertMany([
    { id: "Q1001", line_no: 1, product_id: "MAT001", reference: "Arena fina m3", price: 1500, qty: 20, delivery_date: "2025-07-10", project_id: "P0001" },
    { id: "Q1001", line_no: 2, product_id: "CEM002", reference: "Cemento portland 50kg", price: 450, qty: 100, delivery_date: "2025-07-12", project_id: "P0001" },
    { id: "Q1001", line_no: 3, product_id: "ELEC01", reference: "Generador trifásico 15kva", price: 75000, qty: 2, delivery_date: "2025-07-08", project_id: "P0001" },

  ]);

  console.log("✅ Todos los datos fueron insertados");
  await mongoose.disconnect();
};

seed();
