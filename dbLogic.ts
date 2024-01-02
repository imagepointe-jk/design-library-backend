import fs from "fs";
import xlsx from "xlsx";
import { errorMessages } from "./constants";
import { downloadTempDb, getDropboxFileURL } from "./fetch";
import { TempDesign, TempDesignWithImages } from "./tempDbSchema";
import { DropboxCredentials } from "./types";
import { parseTempDb } from "./validation";
import { isSettledPromiseFulfilled } from "./utility";

//? A spreadsheet is being used as a temporary pseudo-database.
//? Use XLSX to read in the entire DB and store it as JSON.
async function getTempDb(
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  if (!isDevMode)
    console.warn(
      "======WARNING: Reading from the sample database while not running in development environment!"
    );
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

export async function findDesignsInSubcategory(
  subcategory: string,
  dropboxCredentials: DropboxCredentials,
  isDevMode: boolean
) {
  const designs = await getDesigns(dropboxCredentials, isDevMode);
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

export async function populateSingleDesignImageURLs(
  design: TempDesign,
  dropboxCredentials: DropboxCredentials
): Promise<TempDesignWithImages> {
  const designImgPaths = [
    design.DropboxImagePath1,
    design.DropboxImagePath2,
    design.DropboxImagePath3,
    design.DropboxImagePath4,
    design.DropboxImagePath5,
    design.DropboxImagePath6,
    design.DropboxImagePath7,
  ];
  const requests = designImgPaths.map((path) =>
    path ? getDropboxFileURL(path, dropboxCredentials) : ""
  );
  const results = await Promise.allSettled(requests);
  const ImageURLs = results.map((result) =>
    isSettledPromiseFulfilled(result) ? result.value : ""
  );

  const designWithImage: TempDesignWithImages = {
    ...design,
    ImageURLs,
  };
  return designWithImage;
}

export async function populateDesignImageURLs(
  designs: TempDesign[],
  dropboxCredentials: DropboxCredentials
): Promise<TempDesignWithImages[]> {
  const requests = designs.map((design) =>
    populateSingleDesignImageURLs(design, dropboxCredentials)
  );
  const results = await Promise.allSettled(requests);
  const designsWithURLs = designs.map((design, i) => {
    const result = results[i];
    const designWithURL: TempDesignWithImages = isSettledPromiseFulfilled(
      result
    )
      ? result.value
      : { ...design, ImageURLs: [] };
    return designWithURL;
  });

  return designsWithURLs;
}
