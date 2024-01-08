import { DesignType, TempDesign } from "./tempDbSchema";

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
    const { DesignType, Featured, DesignNumber, Status } = design;
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
      (!onlyFeatured || (onlyFeatured && Featured)) &&
      (!keywordsArray || matchDesignKeywords(design, keywordsArray))
    );
  });
}

function matchDesignKeywords(design: TempDesign, keywordsArray: string[]) {
  const {
    Name,
    Description,
    Tag1,
    Tag2,
    Tag3,
    Tag4,
    Tag5,
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
    DesignNumber,
  } = design;
  const lowerCaseName = Name ? Name.toLocaleLowerCase() : "";
  const lowerCaseDescription = Description?.toLocaleLowerCase();
  const lowerCaseTags = [Tag1, Tag2, Tag3, Tag4, Tag5].map((tag) =>
    tag?.toLocaleLowerCase()
  );
  const lowerCaseSubcategories = [
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  ]
    .map((sub) => sub?.toLocaleLowerCase())
    .join(" ");
  const lowerCaseDesignNumber = DesignNumber.toLocaleLowerCase();

  return keywordsArray.some((keyword) => {
    const lowerCaseKeyword = keyword.toLocaleLowerCase();

    return (
      lowerCaseName.includes(lowerCaseKeyword) ||
      lowerCaseDescription?.includes(lowerCaseKeyword) ||
      lowerCaseTags.includes(lowerCaseKeyword) ||
      lowerCaseSubcategories.includes(lowerCaseKeyword) ||
      lowerCaseDesignNumber.includes(lowerCaseKeyword)
    );
  });
}

function matchDesignCategories(design: TempDesign, category: string) {
  const {
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  } = design;

  return [
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  ].some((subcategory) => {
    const parentCategory = subcategory?.split(" > ")[0];
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
  const {
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  } = design;
  const lowerCaseQuerySubcategories = querySubcategoriesArray.map(
    (subcategory) => subcategory.toLocaleLowerCase()
  );

  return [
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  ].some((subcategory) => {
    const withoutParentCategory = subcategory?.split(" > ")[1];
    return (
      withoutParentCategory &&
      lowerCaseQuerySubcategories.includes(
        withoutParentCategory?.toLocaleLowerCase()
      )
    );
  });
}

function matchDesignTags(design: TempDesign, queryTagsArray?: string[]) {
  const { Tag1, Tag2, Tag3, Tag4, Tag5 } = design;
  const lowerCaseQueryTags = queryTagsArray?.map((tag) =>
    tag.toLocaleLowerCase()
  );

  return [Tag1, Tag2, Tag3, Tag4, Tag5].some(
    (subcategory) => subcategory && lowerCaseQueryTags?.includes(subcategory)
  );
}

export function sortDesigns(designs: TempDesign[]) {
  designs.sort((design1, design2) => {
    if (design1.Featured) return -1;
    return 1;
  });
}
