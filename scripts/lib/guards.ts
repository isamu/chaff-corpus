export type UnknownRecord = Readonly<Record<string, unknown>>;

export const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

export const isPositiveInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;

export const isHttpUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

export const optionalString = (value: unknown): string | undefined => (isNonEmptyString(value) ? value : undefined);
