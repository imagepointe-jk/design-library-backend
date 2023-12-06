import { DesignType, TempDesign } from "./tempDbSchema";

export function filterDesigns(
  designs: TempDesign[],
  keywordsArray?: string[],
  subcategoriesArray?: string[],
  tagsArray?: string[],
  designType?: DesignType,
  onlyFeatured?: boolean
) {
  return designs.filter((design) => {
    const { DesignType, Featured } = design;
    return (
      (!designType || designType === DesignType) &&
      (!subcategoriesArray ||
        matchDesignSubcategories(design, subcategoriesArray)) &&
      (!onlyFeatured || (onlyFeatured && Featured)) &&
      (!keywordsArray || matchDesignKeywords(design, keywordsArray))
    );
  });
}

function matchDesignKeywords(design: TempDesign, keywordsArray: string[]) {
  const { Name, Description, Tag1, Tag2, Tag3, Tag4, Tag5 } = design;
  const lowerCaseName = Name.toLocaleLowerCase();
  const lowerCaseDescription = Description?.toLocaleLowerCase();
  const lowerCaseTags = [Tag1, Tag2, Tag3, Tag4, Tag5].map((tag) =>
    tag?.toLocaleLowerCase()
  );

  return keywordsArray.some((keyword) => {
    const lowerCaseKeyword = keyword.toLocaleLowerCase();
    return (
      lowerCaseName.includes(lowerCaseKeyword) ||
      lowerCaseDescription?.includes(lowerCaseKeyword) ||
      lowerCaseTags.includes(lowerCaseKeyword)
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
    // const withHyphens =
    //   withoutParentCategory && withoutParentCategory.replace(" ", "-");
    // return (
    //   withHyphens &&
    //   lowerCaseQuerySubcategories?.includes(withHyphens.toLocaleLowerCase())
    // );
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
