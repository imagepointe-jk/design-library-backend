import xlsx from "xlsx";
import fs from "fs";
import { TempDb } from "./tempDbSchema";
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
  //   console.log("Data to parse");
  //   console.log(data);
  try {
    const parsedData = parseTempDb(data);
    _db = parsedData;
  } catch (error) {
    console.error("ERROR PARSING DATABASE: " + error);
  }
  return _db;
}

export function findDesign(name: string) {
  const db = getTempDb();
  if (!db) return undefined;
  const result = db.Designs.find((design) => design.Name === name);
  return result;
}

export function findDesignsInSubcategory(subcategory: string) {
  const db = getTempDb();
  if (!db) return undefined;

  const result = db.Designs.filter((design) => {
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
