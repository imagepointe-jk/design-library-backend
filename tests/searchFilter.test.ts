import { getDesigns } from "../dbLogic";
import { filterDesigns } from "../searchFilter";
import { TempDesign } from "../tempDbSchema";
import { DropboxCredentials } from "../types";

const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
const appKey = process.env.DROPBOX_APP_KEY;
const appSecret = process.env.DROPBOX_APP_SECRET;
const dropboxCredentials: DropboxCredentials = {
  refreshToken: refreshToken!,
  appKey: appKey!,
  appSecret: appSecret!,
};

describe("Correctly filter the sample data with various parameters", () => {
  it("should return all designs when no filters are provided", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
    const allDesignNumbers = designs.map((design) => +design.DesignNumber);
    checkResults(designs, filteredDesigns, allDesignNumbers);
  });

  it("should return only screen print designs when screen print is the design type", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Screen Print"
    );
    checkResults(
      designs,
      filteredDesigns,
      [1025, 1003, 1, 11, 1012, 1013, 1014, 1015, 1016, 1017, 1018]
    );
  });

  it("should return only embroidery designs when embroidery is the design type", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [1009, 1006, 1000, 1001, 205]);
  });

  it("should only return embroidery designs in the Classics subcategory", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      ["Classics"],
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [1006, 1000]);
  });

  it("should only return the single design that is screen print and in the Best Sellers subcategory", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      ["Best Sellers"],
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [1025]);
  });

  it("should only return featured embroidery designs", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Embroidery",
      true
    );
    checkResults(designs, filteredDesigns, [1009, 1006, 205]);
  });

  it("should only return screen print designs that contain the keyword 'Tough'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough"],
      undefined,
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [1003, 1, 11, 1012]);
  });

  it("should only return the single screen print design that contains the keyword 'Tough' and is in the 'Staff Favorites' subcategory", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough"],
      ["Staff Favorites"],
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [11]);
  });

  it("should only return embroidery designs that contain the keyword 'Tough' OR the keyword 'Bold'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough", "Bold"],
      undefined,
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [1006, 1009, 205]);
  });

  it("should return the single design that contains the keyword 'Gold' OR the keyword 'Embossed'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, ["Gold", "Embossed"]);
    checkResults(designs, filteredDesigns, [1009]);
  });

  it("should only return designs that contain the keyword 'elit' OR the keyword 'Embossed'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, ["elit", "Embossed"]);
    checkResults(
      designs,
      filteredDesigns,
      [1009, 1000, 1025, 1003, 1012, 1016, 1018]
    );
  });

  it("should find 0 screen print designs that contain the keyword 'Embossed'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Embossed"],
      undefined,
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, []);
  });
});

function checkResults(
  allDesigns: TempDesign[],
  filteredDesigns: TempDesign[],
  expectedDesignNumbers: number[]
) {
  expect(filteredDesigns.length).toBe(expectedDesignNumbers.length);
  const filteredDesignNumbers = filteredDesigns.map(
    (design) => +design.DesignNumber
  );
  for (const designNumber of expectedDesignNumbers) {
    expect(filteredDesignNumbers).toContain(designNumber);
  }
}
