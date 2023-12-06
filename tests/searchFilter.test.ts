import { getDesigns } from "../dbLogic";
import { filterDesigns } from "../searchFilter";
import { TempDesign } from "../tempDbSchema";

describe("Correctly filter the sample data with various parameters", () => {
  it("should return all designs when no filters are provided", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(designs);
    const allDesignIndices = designs.map((_, i) => i);
    checkResults(designs, filteredDesigns, allDesignIndices);
  });

  it("should return only screen print designs when screen print is the design type", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [0, 3, 4, 5]);
  });

  it("should return only embroidery designs when embroidery is the design type", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [1, 2, 6, 7]);
  });

  it("should only return embroidery designs in the Classics subcategory", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      ["Classics"],
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [2, 6]);
  });

  it("should only return the single design that is screen print and in the Best Sellers subcategory", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      ["Best Sellers"],
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [0]);
  });

  it("should only return featured embroidery designs", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      undefined,
      undefined,
      undefined,
      "Embroidery",
      true
    );
    checkResults(designs, filteredDesigns, [1, 2]);
  });

  it("should only return screen print designs that contain the keyword 'Tough'", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough"],
      undefined,
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [3, 4, 5]);
  });

  it("should only return the single screen print design that contains the keyword 'Tough' and is in the 'Staff Favorites' subcategory", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough"],
      ["Staff Favorites"],
      undefined,
      "Screen Print"
    );
    checkResults(designs, filteredDesigns, [5]);
  });

  it("should only return embroidery designs that contain the keyword 'Tough' OR the keyword 'Bold'", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(
      designs,
      ["Tough", "Bold"],
      undefined,
      undefined,
      "Embroidery"
    );
    checkResults(designs, filteredDesigns, [1, 2]);
  });

  it("should return the single design that contains the keyword 'Gold' OR the keyword 'Embossed'", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(designs, ["Gold", "Embossed"]);
    checkResults(designs, filteredDesigns, [1]);
  });

  it("should only return designs that contain the keyword 'elit' OR the keyword 'Embossed'", () => {
    const designs = getDesigns(true);
    const filteredDesigns = filterDesigns(designs, ["elit", "Embossed"]);
    checkResults(designs, filteredDesigns, [0, 1, 3, 6]);
  });

  it("should find 0 screen print designs that contain the keyword 'Embossed'", () => {
    const designs = getDesigns(true);
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
  expectedDesignIndices: number[]
) {
  expect(filteredDesigns.length).toBe(expectedDesignIndices.length);
  for (const i of expectedDesignIndices) {
    expect(filteredDesigns).toContainEqual(allDesigns[i]);
  }
}
