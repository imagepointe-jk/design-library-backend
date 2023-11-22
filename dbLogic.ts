import fs from "fs";
import xlsx from "xlsx";
import { errorMessages } from "./constants";
import { getDropboxFileURL } from "./fetch";
import { TempDb, TempDesignWithImage } from "./tempDbSchema";
import { DropboxCredentials } from "./types";
import { parseTempDb } from "./validation";

//? A spreadsheet is being used as a temporary pseudo-database.
//? Use XLSX to read in the entire DB and store it as JSON.
let _db: TempDb | undefined = undefined;

function getTempDb() {
  if (_db !== undefined) return _db;

  const file = fs.readFileSync("./samples/sampleTempDb.xlsx");
  const workbook = xlsx.read(file, { type: "buffer" });
  const data: any = {};
  for (const sheetName of workbook.SheetNames) {
    data[`${sheetName}`] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  try {
    const parsedData = parseTempDb(data);
    _db = parsedData;
  } catch (error) {
    console.error("ERROR PARSING DATABASE: " + error);
    throw new Error(errorMessages.serverError);
  }

  return _db;
}

export async function getDesigns(
  dropboxCredentials: DropboxCredentials
): Promise<TempDesignWithImage[]> {
  const db = getTempDb();
  if (!db) {
    console.error("Could not reach database");
    throw new Error(errorMessages.serverError);
  }
  const designsWithImages: TempDesignWithImage[] = db.Designs.map((design) => ({
    ...design,
    ImageURL: "",
  }));

  for (const design of designsWithImages) {
    const url = await getDropboxFileURL(
      design.DropboxImagePath,
      dropboxCredentials
    );
    if (!url) continue;
    design.ImageURL = url;
  }

  return designsWithImages;
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

export async function findDesign(
  name: string,
  dropboxCredentials: DropboxCredentials
) {
  const designs = await getDesigns(dropboxCredentials);
  if (!designs) return undefined;

  const result = designs.find((design) => design.Name === name);
  return result;
}

export async function findDesignsInSubcategory(
  subcategory: string,
  dropboxCredentials: DropboxCredentials
) {
  const designs = await getDesigns(dropboxCredentials);
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
