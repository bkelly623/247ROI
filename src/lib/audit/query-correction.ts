export function queryCorrection(data: Record<string, unknown>): string | undefined {
  const info = data.search_information as Record<string, unknown> | undefined;
  const value = info?.showing_results_for ?? info?.spelling_fix;
  return typeof value === "string" && value.length > 0 && value.length < 300 ? value : undefined;
}
