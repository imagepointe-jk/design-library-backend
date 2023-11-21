import {
  tempDbSchema,
  tempDesignSchema,
  tempSubcategorySchema,
} from "./tempDbSchema";

export function parseDesign(json: any) {
  json.DefaultBackgroundColor = json["Default Background Color"];
  json.ScreenPrint = json["Screen Print"];
  json.DropboxImagePath = json["Dropbox Image Path"];

  json.ScreenPrint = json.ScreenPrint === "Yes" ? true : false;
  json.Embroidery = json.Embroidery === "Yes" ? true : false;

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
