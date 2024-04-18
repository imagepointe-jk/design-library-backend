import fs from "fs";
import xlsx from "xlsx";
import { errorMessages } from "./constants";
import { downloadTempDb } from "./fetch";
import { TempDesign } from "./tempDbSchema";
import { DropboxCredentials } from "./types";
import { parseTempDb } from "./validation";

//? A spreadsheet is being used as a temporary pseudo-database.
//? Use XLSX to read in the entire DB and store it as JSON.
async function getTempDb(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  // if (!isDevMode)
  //   console.warn(
  //     "======WARNING: Reading from the sample database while not running in development environment!"
  //   );
  try {
    const file = isDevMode
      ? fs.readFileSync("./samples/sampleTempDb.xlsx")
      : await downloadTempDb(dropboxCredentials);
    const workbook = xlsx.read(file, { type: "buffer" });
    const data: any = {};
    for (const sheetName of workbook.SheetNames) {
      data[`${sheetName}`] = xlsx.utils.sheet_to_json(
        workbook.Sheets[sheetName]
      );
    }

    return parseTempDb(data);
  } catch (error) {
    console.error("ERROR PARSING DATABASE: " + error);
    throw new Error(errorMessages.serverError);
  }
}

export async function getDesigns(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
): Promise<TempDesign[]> {
  const db = await getTempDb(dropboxCredentials, isDevMode);
  if (!db) {
    console.error("Could not reach database");
    throw new Error(errorMessages.serverError);
  }
  return db.Designs;
}

export async function getCategories(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  const db = await getTempDb(dropboxCredentials, isDevMode);
  if (!db) return undefined;

  return db.Categories;
}

export async function getSubcategories(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  const db = await getTempDb(dropboxCredentials, isDevMode);
  if (!db) return undefined;

  return db.Subcategories;
}

export async function getTags(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  const db = await getTempDb(dropboxCredentials, isDevMode);
  if (!db) return undefined;

  return db.Tags;
}

export async function getColors(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  const db = await getTempDb(dropboxCredentials, isDevMode);
  if (!db) return undefined;

  return db.Colors;
}

export async function findDesign(
  dropboxCredentials: DropboxCredentials,
  name: string,
  isDevMode: boolean
) {
  const designs = await getDesigns(dropboxCredentials, isDevMode);
  if (!designs) return undefined;

  const result = designs.find((design) => design.Name === name);
  return result;
}
