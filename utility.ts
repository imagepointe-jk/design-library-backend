import { TempDesign } from "./tempDbSchema";

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

export function getDesignTags(design: TempDesign) {
  const {
    Tag1,
    Tag2,
    Tag3,
    Tag4,
    Tag5,
    Tag6,
    Tag7,
    Tag8,
    Tag9,
    Tag10,
    Tag11,
    Tag12,
  } = design;
  return [
    Tag1,
    Tag2,
    Tag3,
    Tag4,
    Tag5,
    Tag6,
    Tag7,
    Tag8,
    Tag9,
    Tag10,
    Tag11,
    Tag12,
  ];
}

export function getDesignCategoryHierarchies(design: TempDesign) {
  const {
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  } = design;
  return [Subcategory1, Subcategory2, Subcategory3, Subcategory4, Subcategory5];
}

export function getDesignNumber(design: TempDesign) {
  const split = design.DesignNumber.split(" ");
  const first = split[0];
  const num = +first;

  if (!isNaN(num)) return num;
  return undefined;
}

export function splitDesignCategoryHierarchy(hierarchy: string) {
  const split = hierarchy.split(" > ");
  return {
    category: split[0],
    subcategory: split[1],
  };
}

export function shouldDesignBeFeatured(design: TempDesign) {
  if (design.Featured) return true;

  const isBestSeller = getDesignCategoryHierarchies(design).some((hierarchy) =>
    hierarchy
      ? splitDesignCategoryHierarchy(hierarchy).subcategory === "Best Sellers"
      : false
  );
  const isNew = getDesignAgeClassification(design) === "New";

  return isBestSeller && isNew;
}

export function getDesignAgeClassification(design: TempDesign) {
  const ageInYears = getDesignAgeInDays(design) / 365;
  const twoYears = 365 * 2;
  return ageInYears < twoYears ? "New" : "Classic";
}

function getDesignAgeInDays(design: TempDesign) {
  const designDate = design.Date ? new Date(design.Date) : null;
  if (!designDate || isNaN(+designDate)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const difference = Date.now() - designDate.getTime();
  const msInDay = 1000 * 60 * 60 * 24;
  return difference / msInDay;
}
