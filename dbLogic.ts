import fs from "fs";
import xlsx from "xlsx";
import { errorMessages } from "./constants";
import { getDropboxFileURL } from "./fetch";
import { TempDesign, TempDesignWithImage } from "./tempDbSchema";
import { DropboxCredentials } from "./types";
import { parseTempDb } from "./validation";
import { isSettledPromiseFulfilled } from "./utility";

//? A spreadsheet is being used as a temporary pseudo-database.
//? Use XLSX to read in the entire DB and store it as JSON.
function getTempDb() {
  const file = fs.readFileSync("./samples/sampleTempDb.xlsx");
  const workbook = xlsx.read(file, { type: "buffer" });
  const data: any = {};
  for (const sheetName of workbook.SheetNames) {
    data[`${sheetName}`] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  try {
    return parseTempDb(data);
  } catch (error) {
    console.error("ERROR PARSING DATABASE: " + error);
    throw new Error(errorMessages.serverError);
  }
}

export function getDesigns(): TempDesign[] {
  const db = getTempDb();
  if (!db) {
    console.error("Could not reach database");
    throw new Error(errorMessages.serverError);
  }
  return db.Designs;
}

export function getCategories() {
  const db = getTempDb();
  if (!db) return undefined;

  return db.Categories;
}

export function getSubcategories() {
  const db = getTempDb();
  if (!db) return undefined;

  return db.Subcategories;
}

export function getTags() {
  const db = getTempDb();
  if (!db) return undefined;

  return db.Tags;
}

export async function findDesign(name: string) {
  const designs = getDesigns();
  if (!designs) return undefined;

  const result = designs.find((design) => design.Name === name);
  return result;
}

export async function findDesignsInSubcategory(subcategory: string) {
  const designs = getDesigns();
  if (!designs) return undefined;

  const result = designs.filter((design) => {
    const {
      Subcategory1,
      Subcategory2,
      Subcategory3,
      Subcategory4,
      Subcategory5,
    } = design;
    const subcategories = [
      Subcategory1,
      Subcategory2,
      Subcategory3,
      Subcategory4,
      Subcategory5,
    ].map((hierarchy) => {
      if (!hierarchy) return undefined;
      return hierarchy.split(" > ")[1];
    });
    return subcategories.includes(subcategory);
  });

  return result;
}

export async function populateSingleDesignImageURL(
  design: TempDesign,
  dropboxCredentials: DropboxCredentials
): Promise<TempDesignWithImage> {
  const ImageURL = await getDropboxFileURL(
    design.DropboxImagePath,
    dropboxCredentials
  );
  const designWithImage: TempDesignWithImage = {
    ...design,
    ImageURL,
  };
  return designWithImage;
}

export async function populateDesignImageURLs(
  designs: TempDesign[],
  dropboxCredentials: DropboxCredentials
): Promise<TempDesignWithImage[]> {
  const requests = designs.map((design) =>
    getDropboxFileURL(design.DropboxImagePath, dropboxCredentials)
  );
  const results = await Promise.allSettled(requests);
  const designsWithImages: TempDesignWithImage[] = designs.map((design, i) => {
    const linkResult = results[i];
    const ImageURL = isSettledPromiseFulfilled(linkResult)
      ? linkResult.value
      : "";
    return {
      ...design,
      ImageURL,
    };
  });

  return designsWithImages;
}
