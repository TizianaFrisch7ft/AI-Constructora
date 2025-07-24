export const alignTableRows = (data: any[]): { headers: string[], rows: string[][] } | null => {
  if (!Array.isArray(data) || data.length === 0) return null;

  const headers = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  const rows = data.map((item) =>
    headers.map((key) =>
      typeof item[key] === "object" ? JSON.stringify(item[key]) : String(item[key] ?? "")
    )
  );

  return { headers, rows };
};
