import { DesignType, TempDesign } from "./tempDbSchema";
import { SortingType } from "./types";
import {
  getDesignNumber,
  getDesignCategoryHierarchies,
  getDesignTags,
  splitDesignCategoryHierarchy,
  shouldDesignBeFeatured,
  getDesignAgeClassification,
} from "./utility";

export function filterDesigns(
  designs: TempDesign[],
  keywordsArray?: string[],
  category?: string,
  subcategoriesArray?: string[],
  tagsArray?: string[],
  designType?: DesignType,
  onlyFeatured?: boolean,
  allowDuplicateDesignNumbers?: boolean
) {
  return designs.filter((design, i, arr) => {
    const { DesignType, DesignNumber, Status } = design;
    const treatAsFeatured = shouldDesignBeFeatured(design);
    return (
      Status !== "Draft" &&
      DesignNumber !== `${undefined}` &&
      (allowDuplicateDesignNumbers ||
        i === 0 ||
        (i > 0 && arr[i - 1].DesignNumber !== DesignNumber)) &&
      (!designType || designType === DesignType) &&
      (!category || matchDesignCategories(design, category)) &&
      (!subcategoriesArray ||
        matchDesignSubcategories(design, subcategoriesArray)) &&
      (!onlyFeatured || (onlyFeatured && treatAsFeatured)) &&
      (!keywordsArray || matchDesignKeywords(design, keywordsArray))
    );
  });
}

function matchDesignKeywords(design: TempDesign, keywordsArray: string[]) {
  const { Name, Description, DesignNumber } = design;
  const lowerCaseName = Name ? Name.toLocaleLowerCase() : "";
  const lowerCaseDescription = Description?.toLocaleLowerCase();
  const lowerCaseTags = getDesignTags(design).map((tag) =>
    tag?.toLocaleLowerCase()
  );
  const lowerCaseHierarchies = getDesignCategoryHierarchies(design)
    .map((hierarchy) => hierarchy?.toLocaleLowerCase())
    .join(" ");
  const lowerCaseDesignNumber = DesignNumber.toLocaleLowerCase();

  return keywordsArray.some((keyword) => {
    const lowerCaseKeyword = keyword.toLocaleLowerCase();

    return (
      lowerCaseName.includes(lowerCaseKeyword) ||
      lowerCaseDescription?.includes(lowerCaseKeyword) ||
      lowerCaseTags.includes(lowerCaseKeyword) ||
      lowerCaseHierarchies.includes(lowerCaseKeyword) ||
      lowerCaseDesignNumber.includes(lowerCaseKeyword)
    );
  });
}

function matchDesignCategories(design: TempDesign, category: string) {
  return getDesignCategoryHierarchies(design).some((hierarchy) => {
    const parentCategory =
      hierarchy && splitDesignCategoryHierarchy(hierarchy).category;
    return (
      parentCategory &&
      category.toLocaleLowerCase() === parentCategory?.toLocaleLowerCase()
    );
  });
}

function matchDesignSubcategories(
  design: TempDesign,
  querySubcategoriesArray: string[]
) {
  const lowerCaseQuerySubcategories = querySubcategoriesArray.map(
    (subcategory) => subcategory.toLocaleLowerCase()
  );
  const designAge = getDesignAgeClassification(design);
  const ageMatch =
    (lowerCaseQuerySubcategories.includes("new designs") &&
      designAge === "New") ||
    (lowerCaseQuerySubcategories.includes("classics") &&
      designAge === "Classic");
  const otherMatch = getDesignCategoryHierarchies(design).some((hierarchy) => {
    const subcategory =
      hierarchy && splitDesignCategoryHierarchy(hierarchy).subcategory;

    return (
      subcategory &&
      lowerCaseQuerySubcategories.includes(subcategory?.toLocaleLowerCase())
    );
  });

  return ageMatch || otherMatch;
}

function matchDesignTags(design: TempDesign, queryTagsArray?: string[]) {
  const lowerCaseQueryTags = queryTagsArray?.map((tag) =>
    tag.toLocaleLowerCase()
  );

  return getDesignTags(design).some(
    (subcategory) => subcategory && lowerCaseQueryTags?.includes(subcategory)
  );
}

export function sortDesigns(
  designs: TempDesign[],
  sortingType: SortingType = "design number"
) {
  designs.sort((design1, design2) => {
    if (design1.Featured !== design2.Featured) {
      return design1.Featured ? -1 : 1;
    }

    const sortingFunction = sortingFunctions[sortingType];
    return sortingFunction(design1, design2);
  });
}

type SortingFunctions = {
  [key in SortingType]: (design1: TempDesign, design2: TempDesign) => number;
};

const sortingFunctions: SortingFunctions = {
  "design number": (design1: TempDesign, design2: TempDesign) => {
    const design1Number = getDesignNumber(design1);
    const design2Number = getDesignNumber(design2);

    if (design1Number === undefined) return 1;
    if (design2Number === undefined) return -1;
    return design1Number < design2Number ? 1 : -1;
  },
  priority: (design1: TempDesign, design2: TempDesign) => {
    if (design1.Priority === undefined) return 1;
    if (design2.Priority === undefined) return -1;
    return design1.Priority < design2.Priority ? 1 : -1;
  },
};
