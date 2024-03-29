import {
  DesignType,
  designTypeSchema,
  quoteRequestSchema,
  tempCategorySchema,
  tempDbSchema,
  tempDesignSchema,
  tempSubcategorySchema,
} from "./tempDbSchema";
import { SortingType } from "./types";

export function parseDesign(json: any, type: DesignType, index: number) {
  json.Id = index; //TEMPORARY SOLUTION for each design having a unique ID.
  json.DefaultBackgroundColor = json["Default Background Color"];
  json.DesignType = type;
  json.DesignNumber = `${json["Design Number"]}`;
  json.Featured = json.Featured === "Yes" ? true : false;

  json.Subcategory1 = json["Subcategory1 - Union"];
  json.Subcategory2 = json["Subcategory2 - Holiday/Event"];

  json.ImageURL = json["Image URL"];

  json.DropboxImagePath1 = json["Dropbox Image Path 1"];
  json.DropboxImagePath2 = json["Dropbox Image Path 2"];
  json.DropboxImagePath3 = json["Dropbox Image Path 3"];
  json.DropboxImagePath4 = json["Dropbox Image Path 4"];
  json.DropboxImagePath5 = json["Dropbox Image Path 5"];
  json.DropboxImagePath6 = json["Dropbox Image Path 6"];
  json.DropboxImagePath7 = json["Dropbox Image Path 7"];

  json.Date = `${json.Date}`;

  return tempDesignSchema.parse(json);
}

function parseCategory(json: any) {
  json.DesignType = json["Design Type"];

  return tempCategorySchema.parse(json);
}

function parseSubcategory(json: any) {
  json.ParentCategory = json["Parent Category"];

  return tempSubcategorySchema.parse(json);
}

export function parseTempDb(json: any) {
  const screenPrintDesigns: any[] = json["Screen Print Designs"];
  const embroideryDesigns: any[] = json["Embroidery Designs"];
  const parsedScreenPrintDesigns = screenPrintDesigns.map((design, i) =>
    parseDesign(design, "Screen Print", i)
  );
  const parsedEmbroideryDesigns = embroideryDesigns.map((design, i) =>
    parseDesign(design, "Embroidery", i + screenPrintDesigns.length)
  );
  const parsedCategories = json.Categories.map((category: any) =>
    parseCategory(category)
  );
  const parsedSubcategories = json.Subcategories.map((subcategory: any) =>
    parseSubcategory(subcategory)
  );
  const parsedColors = json.Colors.map((color: any) => `${color.Color}`);

  json.Designs = parsedScreenPrintDesigns.concat(parsedEmbroideryDesigns);
  json.Subcategories = parsedSubcategories;
  json.Categories = parsedCategories;
  json.Colors = parsedColors;

  return tempDbSchema.parse(json);
}

export function parseDesignType(str: string) {
  return designTypeSchema.parse(str);
}

export function parseQuoteRequest(json: any) {
  return quoteRequestSchema.parse(json);
}

export function parseSortingType(str: string) {
  const designNumber: SortingType = "design number";
  const priority: SortingType = "priority";
  if (str === designNumber || str === priority) return str;
}
