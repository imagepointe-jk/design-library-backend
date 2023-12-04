import {
  designTypeSchema,
  tempDbSchema,
  tempDesignSchema,
  tempSubcategorySchema,
} from "./tempDbSchema";

export function parseDesign(json: any) {
  json.DefaultBackgroundColor = json["Default Background Color"];
  json.DesignType = json["Design Type"];
  json.DesignNumber = json["Design Number"];
  json.Featured = json.Featured === "Yes" ? true : false;

  json.DropboxImagePath1 = json["Dropbox Image Path 1"];
  json.DropboxImagePath2 = json["Dropbox Image Path 2"];
  json.DropboxImagePath3 = json["Dropbox Image Path 3"];
  json.DropboxImagePath4 = json["Dropbox Image Path 4"];
  json.DropboxImagePath5 = json["Dropbox Image Path 5"];
  json.DropboxImagePath6 = json["Dropbox Image Path 6"];
  json.DropboxImagePath7 = json["Dropbox Image Path 7"];

  return tempDesignSchema.parse(json);
}

function parseSubcategory(json: any) {
  json.ParentCategory = json["Parent Category"];

  return tempSubcategorySchema.parse(json);
}

export function parseTempDb(json: any) {
  const parsedDesigns = json.Designs.map((design: any) => parseDesign(design));
  const parsedSubcategories = json.Subcategories.map((subcategory: any) =>
    parseSubcategory(subcategory)
  );

  json.Designs = parsedDesigns;
  json.Subcategories = parsedSubcategories;

  return tempDbSchema.parse(json);
}

export function parseDesignType(str: string) {
  return designTypeSchema.parse(str);
}
