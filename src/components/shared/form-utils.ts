// register(..., { setValueAs }) helper: empty number inputs become undefined instead of NaN/0.
export function toOptionalNumber(value: unknown) {
  if (value === "" || value == null) return undefined;
  return typeof value === "number" ? value : Number(value);
}
