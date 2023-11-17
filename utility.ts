export function message(message: string) {
  return {
    message,
  };
}

export function trySplitCommaSeparatedString(data: any) {
  return typeof data === "string" ? data.split(",") : undefined;
}
