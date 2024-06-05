import { DesignType, TempDesign } from "./tempDbSchema";
import { SortingType } from "./types";
import {
  getDesignNumber,
  getDesignTags,
  shouldDesignBeFeatured,
  getDesignAgeClassification,
  getDesignCategoryData,
} from "./utility";

const minimumTagsInCommon = 3; //how many tags two designs must have in common to be considered "similar"

export function filterDesigns(
  designs: TempDesign[],
  params: {
    keywordsArray?: string[];
    category?: string;
    subcategoriesArray?: string[];
    tagsArray?: string[];
    designType?: DesignType;
    onlyFeatured?: boolean;
    allowDuplicateDesignNumbers?: boolean;
    shouldExcludePrioritized?: boolean;
    similarTo?: number;
    newDesignReferenceDate?: number;
  }
) {
  const {
    allowDuplicateDesignNumbers,
    category,
    designType,
    keywordsArray,
    onlyFeatured,
    shouldExcludePrioritized,
    similarTo,
    subcategoriesArray,
    tagsArray,
    newDesignReferenceDate,
  } = params;
  const designToCompare = designs.find((design) => design.Id === similarTo);
  return designs.filter((design, i, arr) => {
    const { DesignType, DesignNumber, Status, Priority } = design;
    const treatAsFeatured = shouldDesignBeFeatured(
      design,
      newDesignReferenceDate
    );

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
  const categoryData = getDesignCategoryData(design);
  const lowercaseCategoryWords = [
    ...categoryData.categories.map((cat) => cat.toLocaleLowerCase()),
    ...categoryData.subcategories.map((sub) => sub.toLocaleLowerCase()),
  ].join(" ");
  const lowerCaseDesignNumber = DesignNumber.toLocaleLowerCase();

  return keywordsArray.some((keyword) => {
    const lowerCaseKeyword = keyword.toLocaleLowerCase();

    return (
      lowerCaseName.includes(lowerCaseKeyword) ||
      lowerCaseDescription?.includes(lowerCaseKeyword) ||
      lowerCaseTags.includes(lowerCaseKeyword) ||
      lowercaseCategoryWords.includes(lowerCaseKeyword) ||
      lowerCaseDesignNumber.includes(lowerCaseKeyword)
    );
  });
}

function matchDesignCategories(design: TempDesign, category: string) {
  //Currently all designs are considered either "new" or "classics".
  //and "new" and "classics" are both under the "quick search" category.
  //so currently ALL designs are in quick search.
  if (category === "Quick Search") return true;

  const categoryData = getDesignCategoryData(design);
  return categoryData.categories.some(
    (designCategory) =>
      designCategory.toLocaleLowerCase() === category.toLocaleLowerCase()
  );
}

function matchDesignSubcategories(
  design: TempDesign,
  querySubcategoriesArray: string[]
) {
  const lowerCaseQuerySubcategories = querySubcategoriesArray.map(
    (subcategory) => subcategory.toLocaleLowerCase()
  );
  const categoryData = getDesignCategoryData(design);
  const designAge = getDesignAgeClassification(design);
  const ageMatch =
    (lowerCaseQuerySubcategories.includes("new designs") &&
      designAge === "New") ||
    (lowerCaseQuerySubcategories.includes("classics") &&
      designAge === "Classic");
  const otherMatch = categoryData.subcategories.some((sub) =>
    lowerCaseQuerySubcategories.includes(sub.toLocaleLowerCase())
  );

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
