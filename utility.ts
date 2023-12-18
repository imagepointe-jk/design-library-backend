export function message(message: string) {
  return {
    message,
  };
}

export function trySplitCommaSeparatedString(data: any) {
  return typeof data === "string" ? data.split(",") : undefined;
}

export function getArrayPage(
  array: any[],
  pageNumber: number,
  countPerPage: number
) {
  const startIndex = countPerPage * (pageNumber - 1);
  return array.slice(startIndex, startIndex + countPerPage);
}

export function isSettledPromiseFulfilled<T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> {
  return input.status === "fulfilled";
}

export function makeStringTitleCase(str: string) {
  return str
    .split(" ")
    .map((word) => `${word[0].toUpperCase()}${word.substring(1)}`)
    .join(" ");
}

export function minutesToMilliseconds(minutes: number) {
  return minutes * 60 * 1000;
}
