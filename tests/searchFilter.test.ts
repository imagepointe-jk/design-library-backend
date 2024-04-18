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

const publishedScreenPrintDesignNumbers = [
  "139",
  "220",
  "267",
  "385",
  "392",
  "453",
  "458",
  "461",
  "499",
  "522",
  "547",
  "625",
  "641",
  "710",
  "774",
  "854",
  "1027",
  "1030",
  "1069",
  "1091",
  "1107",
  "1107",
  "1119",
  "1122",
  "1150",
  "1180",
  "1234",
  "1252",
  "1252",
  "1281",
  "1348",
  "1359",
  "1512",
  "1518",
  "1520",
  "1547",
  "1556",
  "1617",
  "1639",
  "1658",
  "1659",
  "1674",
  "1684",
  "1695",
  "1734",
  "1747",
  "1320 (Sleeve)",
  "771 (Oversize)",
  "911 (Oversize)",
];

const publishedEmbroideryDesignNumbers = [
  "205",
  "342",
  "435",
  "435",
  "445",
  "445",
  "447",
  "448",
  "493",
  "531",
  "531",
  "532",
  "534",
  "567",
  "567",
  "594",
  "659",
  "660",
  "753",
  "754",
  "757",
  "758",
  "758",
  "758",
  "758",
  "758",
  "779",
  "785",
  "802",
  "813",
  "969",
  "982",
  "983",
  "985",
  "1002",
  "1046",
  "1052",
  "1190",
  "1191",
  "E11292",
  "E15121",
  "E16190",
  "E19873",
  "E19873",
  "E22203",
  "E23023",
  "E32172",
  "E32172",
];

describe("Correctly filter the sample data with various parameters", () => {
  it("should return all PUBLISHED designs when no filters are provided", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      allowDuplicateDesignNumbers: true,
    });
    const publishedDesignNumbers = designs
      .filter((design) => design.Status !== "Draft")
      .map((design) => design.DesignNumber);
    checkResults(filteredDesigns, publishedDesignNumbers);
  });

  it("should return only screen print designs when screen print is the design type", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Screen Print",
      allowDuplicateDesignNumbers: true,
    });
    checkResults(filteredDesigns, publishedScreenPrintDesignNumbers);
  });

  it("should only return embroidery designs considered 'Classics' relative to a certain date", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Embroidery",
      category: "Quick Search",
      subcategoriesArray: ["Classics"],
      allowDuplicateDesignNumbers: true,
      newDesignReferenceDate: new Date("4/18/24").getTime(),
    });
    checkResults(filteredDesigns, publishedEmbroideryDesignNumbers);
  });

  it("should find 0 embroidery designs considered 'new' relative to a certain date", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Embroidery",
      category: "Quick Search",
      subcategoriesArray: ["New Designs"],
      allowDuplicateDesignNumbers: true,
      newDesignReferenceDate: new Date("4/18/24").getTime(),
    });
    checkResults(filteredDesigns, []);
  });

  it("should only return screen print designs considered 'new' relative to a certain date", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Screen Print",
      category: "Quick Search",
      subcategoriesArray: ["New Designs"],
      newDesignReferenceDate: new Date("4/18/24").getTime(),
    });
    checkResults(filteredDesigns, [
      "1639",
      "1658",
      "1659",
      "1674",
      "1684",
      "1695",
      "1734",
      "1747",
    ]);
  });

  it("should only return screen print designs in the 'patriotic' subcategory", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Screen Print",
      category: "Quick Search",
      subcategoriesArray: ["Patriotic"],
      allowDuplicateDesignNumbers: true,
    });
    checkResults(filteredDesigns, [
      "139",
      "499",
      "547",
      "854",
      "1027",
      "1069",
      "1091",
      "1119",
      "1150",
      "1252",
      "1252",
    ]);
  });

  it("should only return screen print designs considered 'featured'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Screen Print",
      onlyFeatured: true,
      newDesignReferenceDate: new Date("4/18/24").getTime(),
    });
    checkResults(filteredDesigns, ["458", "1091", "1234", "1659"]);
  });

  it("should only return screen print designs that contain the keyword 'eagle'", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Screen Print",
      keywordsArray: ["eagle"],
      allowDuplicateDesignNumbers: true,
    });
    checkResults(filteredDesigns, ["499", "1252", "1252", "1518", "1684"]);
  });

  it("should only return the single embroidery design that contains the keyword 'carpenters' in the 'hats/beanies' subcategory", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Embroidery",
      keywordsArray: ["Carpenters"],
      category: "Inspiration Board",
      subcategoriesArray: ["Hats/Beanies"],
    });
    checkResults(filteredDesigns, ["754"]);
  });

  it("should only return embroidery designs in the 'inspiration board' parent category", async () => {
    const designs = await getDesigns(dropboxCredentials, true);
    const filteredDesigns = filterDesigns(designs, {
      designType: "Embroidery",
      category: "Inspiration Board",
      allowDuplicateDesignNumbers: true,
    });
    checkResults(filteredDesigns, [
      "205",
      "435",
      "435",
      "445",
      "445",
      "447",
      "448",
      "493",
      "567",
      "567",
      "594",
      "659",
      "660",
      "754",
      "757",
      "758",
      "758",
      "758",
      "758",
      "758",
      "779",
      "785",
      "802",
      "813",
      "1046",
      "1052",
      "1190",
      "1191",
    ]);
  });
});

function checkResults(
  filteredDesigns: TempDesign[],
  expectedDesignNumbers: string[]
) {
  expect(filteredDesigns.length).toBe(expectedDesignNumbers.length);
  const filteredDesignNumbers = filteredDesigns.map(
    (design) => design.DesignNumber
  );
  for (const designNumber of expectedDesignNumbers) {
    expect(filteredDesignNumbers).toContain(designNumber);
  }
}
