export interface DetectedEntity {
  type: 'vendor' | 'project' | 'eval';
  value: string;
  confidence: number;
  data: any;
  collection?: string;
}

export const detectEntitiesInResponse = (
  response: string,
  vendors: any[],
  projects: any[],
  evaluations?: any[]
): DetectedEntity[] => {
  const entities: DetectedEntity[] = [];
  const lowerResponse = response.toLowerCase();

  // Proveedores
  vendors.forEach((vendor) => {
    const namesToCheck = [
      vendor?.name,
      vendor?.reference_name,
      vendor?.legal_id,
    ].filter(Boolean);

    if (namesToCheck.some((n) => lowerResponse.includes(n.toLowerCase()))) {
      entities.push({
        type: 'vendor',
        value: `${vendor.name} (${vendor.legal_id || 'Sin ID'})`,
        confidence: 0.95,
        data: vendor,
        collection: 'vendors',
      });
    }
  });

  // Proyectos
  projects.forEach((project) => {
    if (
      project?.name &&
      lowerResponse.includes(project.name.toLowerCase())
    ) {
      entities.push({
        type: 'project',
        value: project.name,
        confidence: 0.95,
        data: project,
        collection: 'projects',
      });
    }
  });

  // Evaluaciones
  if (evaluations) {
    evaluations.forEach((evalItem) => {
      const label = evalItem?.eval_name || '';
      if (label && lowerResponse.includes(label.toLowerCase())) {
        entities.push({
          type: 'eval',
          value: label,
          confidence: 0.9,
          data: evalItem,
          collection: 'vendorevals',
        });
      }
    });
  }

  return entities;
};
