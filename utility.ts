import { TempDesign } from "./tempDbSchema";

export function message(message: string) {
  return {
    message,
  };
}

export function trySplitCommaSeparatedString(data: any) {
  return typeof data === "string" ? data.split(",") : undefined;
}

export function getArrayPage<T>(
  array: T[],
  pageNumber: number,
  countPerPage: number
) {
  const startIndex = countPerPage * (pageNumber - 1);
  return array.slice(startIndex, startIndex + countPerPage);
}

export function makeStringTitleCase(str: string) {
  return str
    .split(" ")
    .map((word) => `${word[0].toUpperCase()}${word.substring(1)}`)
    .join(" ");
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

export function getDesignCategoryData(design: TempDesign) {
  const {
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  } = design;
  const subcategories: string[] = [];
  if (Subcategory1) subcategories.push(Subcategory1);
  const splits = removeUndefined([
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  ]).map((sub) => splitDesignCategoryHierarchy(sub));
  return {
    categories: splits.map((split) => split.category),
    subcategories: splits.map((split) => split.subcategory),
  };
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

export function shouldDesignBeFeatured(
  design: TempDesign,
  referenceDate?: number
) {
  if (design.Featured) return true;

  const isBestSeller = getDesignCategoryData(design).subcategories.some(
    (sub) => sub === "Best Sellers"
  );
  const isNew = getDesignAgeClassification(design, referenceDate) === "New";

  return isBestSeller && isNew;
}

export function getDesignAgeClassification(
  design: TempDesign,
  referenceDate?: number
) {
  const ageInYears = getDesignAgeInDays(design, referenceDate) / 365;
  return ageInYears < 2 ? "New" : "Classic";
}

function getDesignAgeInDays(design: TempDesign, referenceDate?: number) {
  const designDate = design.Date ? new Date(design.Date) : null;
  if (!designDate || isNaN(+designDate)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const laterDate = referenceDate ? referenceDate : Date.now();
  const difference = laterDate - designDate.getTime();
  const msInDay = 1000 * 60 * 60 * 24;
  return difference / msInDay;
}

function removeUndefined<T>(arr: (T | undefined)[]) {
  const newArr: T[] = [];
  for (const el of arr) {
    if (el !== undefined) newArr.push(el);
  }
  return newArr;
}
