import QuoteRequest from "../models/QuoteRequest";
import Vendor from "../models/Vendor";
import Project from "../models/Project";
import SchedulePur from "../models/SchedulePur";
import Eval from "../models/Eval";
import PM from "../models/PM";

// Función para obtener el siguiente número secuencial basado en IDs existentes
const getNextSequentialId = async (
  model: any,
  prefix: string,
  digitCount: number,
  fieldName: string = 'id'
): Promise<string> => {
  try {
    // Buscar todos los documentos que tengan IDs con el prefijo correcto
    const regex = new RegExp(`^${prefix}\\d{${digitCount}}$`);
    const query: any = {};
    query[fieldName] = regex;
    
    const existingDocs = await model.find(query).select(fieldName);
    
    if (existingDocs.length === 0) {
      // Si no hay documentos, empezar desde 1
      return `${prefix}${'0'.repeat(digitCount - 1)}1`;
    }
    
    // Extraer los números de los IDs existentes
    const numbers = existingDocs
      .map((doc: any) => {
        const idStr = doc[fieldName];
        const numberPart = idStr.substring(prefix.length);
        return parseInt(numberPart, 10);
      })
      .filter((num: number) => !isNaN(num));
    
    // Encontrar el número más alto y agregar 1
    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    
    // Formatear con ceros a la izquierda
    const paddedNumber = nextNumber.toString().padStart(digitCount, '0');
    return `${prefix}${paddedNumber}`;
    
  } catch (error) {
    console.error(`Error generating ${prefix} ID:`, error);
    // Fallback: usar timestamp
    return `${prefix}${Date.now().toString().slice(-digitCount)}`;
  }
};

// Generar ID para Vendors (V0001, V0002, etc.)
export const generateVendorId = async (): Promise<string> => {
  return getNextSequentialId(Vendor, 'V', 4, 'id');
};

// Generar ID para Projects (P0001, P0002, etc.)
export const generateProjectId = async (): Promise<string> => {
  return getNextSequentialId(Project, 'P', 4, 'id');
};

// Generar ID para QuoteRequests (QR101, QR201, etc.)
export const generateQrId = async (): Promise<string> => {
  return getNextSequentialId(QuoteRequest, 'QR', 3, 'qr_id');
};

// Generar ID para SchedulePur (CC0001, CC0002, etc.)
export const generateScheduleId = async (): Promise<string> => {
  return getNextSequentialId(SchedulePur, 'CC', 4, 'cc_id');
};

// Generar ID para Evaluations (EV0001, EV0002, etc.)
export const generateEvalId = async (): Promise<string> => {
  return getNextSequentialId(Eval, 'EV', 4, 'eval_id');
};

// Generar ID para PMs (PM001, PM002, etc.)
export const generatePMId = async (): Promise<string> => {
  return getNextSequentialId(PM, 'PM', 3, 'id');
};
