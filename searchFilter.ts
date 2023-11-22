import { TempDesign } from "./tempDbSchema";

export function filterDesign(
  design: TempDesign,
  keywordsArray?: string[],
  subcategoriesArray?: string[],
  tagsArray?: string[],
  screenPrint?: boolean,
  embroidery?: boolean
) {
  const {
    Tag1,
    Tag2,
    Tag3,
    Tag4,
    Tag5,
    Description,
    Name,
    Embroidery,
    ScreenPrint,
  } = design;

  return (
    matchDesignKeywords(design, keywordsArray) ||
    matchDesignSubcategories(design, subcategoriesArray) ||
    matchDesignTags(design, tagsArray) ||
    (screenPrint === true && ScreenPrint === true) ||
    (embroidery === true && Embroidery === true)
  );
}

function matchDesignKeywords(design: TempDesign, keywordsArray?: string[]) {
  const lowerCaseName = design.Name.toLocaleLowerCase();
  const loweCaseDescription = design.Name.toLocaleLowerCase();

  return keywordsArray?.some((keyword) => {
    const lowerCaseKeyword = keyword.toLocaleLowerCase();
    return (
      lowerCaseName.includes(lowerCaseKeyword) ||
      loweCaseDescription.includes(lowerCaseKeyword)
    );
  });
}

function matchDesignSubcategories(
  design: TempDesign,
  querySubcategoriesArray?: string[]
) {
  const {
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  } = design;
  const lowerCaseQuerySubcategories = querySubcategoriesArray?.map(
    (subcategory) => subcategory.toLocaleLowerCase()
  );

  return [
    Subcategory1,
    Subcategory2,
    Subcategory3,
    Subcategory4,
    Subcategory5,
  ].some((subcategory) => {
    const withoutParentCategory = subcategory && subcategory.split(" > ")[1];
    const withHyphens =
      withoutParentCategory && withoutParentCategory.replace(" ", "-");
    return (
      withHyphens &&
      lowerCaseQuerySubcategories?.includes(withHyphens.toLocaleLowerCase())
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
