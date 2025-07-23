export const mdToHtml = async (md: string): Promise<string> => {
  const { marked } = await import("marked");
  console.log("marked cargado dinámicamente 👌");
  return marked.parse(md);
};
