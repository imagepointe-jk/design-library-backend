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

const minimumTagsInCommon = 3; //how many tags two designs must have in common to be considered "similar"

export function filterDesigns(
  designs: TempDesign[],
  keywordsArray?: string[],
  category?: string,
  subcategoriesArray?: string[],
  tagsArray?: string[],
  designType?: DesignType,
  onlyFeatured?: boolean,
  allowDuplicateDesignNumbers?: boolean,
  shouldExcludePrioritized?: boolean,
  similarTo?: number
) {
  const designToCompare = designs.find((design) => design.Id === similarTo);
  return designs.filter((design, i, arr) => {
    const { DesignType, DesignNumber, Status, Priority } = design;
    const treatAsFeatured = shouldDesignBeFeatured(design);

    const isPublished = Status !== "Draft";
    const hasDesignNumber = DesignNumber !== `${undefined}`;
    const duplicateDesignNumberCheck =
      allowDuplicateDesignNumbers ||
      i === 0 ||
      (i > 0 && arr[i - 1].DesignNumber !== DesignNumber);
    const designTypeCheck = !designType || designType === DesignType;
    const categoryCheck = !category || matchDesignCategories(design, category);
    const subcategoryCheck =
      !subcategoriesArray ||
      matchDesignSubcategories(design, subcategoriesArray);
    const featuredCheck = !onlyFeatured || (onlyFeatured && treatAsFeatured);
    const keywordCheck =
      !keywordsArray || matchDesignKeywords(design, keywordsArray);
    const excludePrioritizedCheck =
      Priority === undefined || !shouldExcludePrioritized;
    const similarDesignCheck = matchSimilarDesign(design, designToCompare);

    return (
      isPublished &&
      hasDesignNumber &&
      duplicateDesignNumberCheck &&
      designTypeCheck &&
      categoryCheck &&
      subcategoryCheck &&
      featuredCheck &&
      keywordCheck &&
      excludePrioritizedCheck &&
      similarDesignCheck
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
    const parentCategoryListed =
      hierarchy && splitDesignCategoryHierarchy(hierarchy).category;
    const designAge = getDesignAgeClassification(design);
    //if this design is screen print AND considered new, then it should be treated as being in the "New Designs" category.
    //and "New Designs" has "Quick Search" as its parent category (per strategy document).
    //So all new screen print designs have "Quick Search" as their parent category.
    const parentCategoryToUse =
      designAge === "New" && design.DesignType === "Screen Print"
        ? "Quick Search"
        : parentCategoryListed;
    return (
      parentCategoryToUse &&
      category.toLocaleLowerCase() === parentCategoryToUse?.toLocaleLowerCase()
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

function matchSimilarDesign(design: TempDesign, designToCompare?: TempDesign) {
  if (!designToCompare) return true;

  //ignore the "union" tag because too many designs have it
  const designTags = getDesignTags(design).filter(
    (tag) => tag !== undefined && tag.toLocaleLowerCase() !== "union"
  );
  const designToCompareTags = getDesignTags(designToCompare).filter(
    (tag) => tag !== undefined && tag.toLocaleLowerCase() !== "union"
  );
  const tagsInCommon = designTags.filter((tag) =>
    designToCompareTags.includes(tag)
  ).length;

  return tagsInCommon >= minimumTagsInCommon;
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
  "design number": designNumberSort,
  priority: (design1: TempDesign, design2: TempDesign) => {
    if (design1.Priority === undefined) {
      if (design2.Priority === undefined)
        return designNumberSort(design1, design2);
      return 1;
    }
    if (design2.Priority === undefined) {
      if (design1.Priority === undefined)
        return designNumberSort(design1, design2);
      return -1;
    }
    return design1.Priority < design2.Priority ? 1 : -1;
  },
};

function designNumberSort(design1: TempDesign, design2: TempDesign) {
  const design1Number = getDesignNumber(design1);
  const design2Number = getDesignNumber(design2);

  if (design1Number === undefined) return 1;
  if (design2Number === undefined) return -1;
  return design1Number < design2Number ? 1 : -1;
}
