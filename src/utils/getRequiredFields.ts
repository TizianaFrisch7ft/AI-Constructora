import mongoose from "mongoose";

/**
 * Devuelve los campos requeridos que faltan, en base al schema y a los datos ya provistos.
 */
export const getMissingFieldsForCollection = (
  collectionName: string,
  providedData: Record<string, any> | Record<string, any>[]
): string[] => {
  // Buscar el model por nombre (case-insensitive)
  const model =
    mongoose.models[collectionName] ||
    mongoose.models[
      Object.keys(mongoose.models).find(
        (name) => name.toLowerCase() === collectionName.toLowerCase()
      ) || ""
    ];

  if (!model) return [];

  const schema = model.schema;
  const data = Array.isArray(providedData) ? providedData[0] : providedData;

  // Todos los campos requeridos del schema
  const requiredFields: string[] = [];
  schema.eachPath((path, schemaType) => {
    if ((schemaType as any).isRequired) {
      requiredFields.push(path);
    }
  });

  // Filtramos solo los que faltan en los datos provistos
  return requiredFields.filter(
    (field) =>
      !(field in data) || data[field] === undefined || data[field] === null
  );
};
