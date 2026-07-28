export function getFormString(values: FormData, name: string) {
  const value = values.get(name);
  return typeof value === "string" ? value : "";
}
