import express, { json } from "express";
import { defaultCountPerPage, errorMessages } from "./constants";
import {
  getCategories,
  getDesigns,
  getSubcategories,
  getTags,
  populateDesignImageURLs,
  populateSingleDesignImageURL,
} from "./dbLogic";
import { filterDesign } from "./searchFilter";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "./statusCodes";
import { DropboxCredentials } from "./types";
import {
  getArrayPage as getPageOfArray,
  message,
  trySplitCommaSeparatedString,
} from "./utility";

const app = express();
const devMode = app.get("env") === "development";

const allowedOrigins = [
  "https://react-frontend-production-93c4.up.railway.app",
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (devMode || allowedOrigins.includes(origin))) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(json());
if (devMode) {
  console.log("=====DEV ENVIRONMENT======");
  require("dotenv").config();
}
const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
const appKey = process.env.DROPBOX_APP_KEY;
const appSecret = process.env.DROPBOX_APP_SECRET;
if (!refreshToken || !appKey || !appSecret) {
  console.error(
    "Couldn't find at least one of the Dropbox environment variables!"
  );
}
const dropboxCredentials: DropboxCredentials = {
  refreshToken: refreshToken!,
  appKey: appKey!,
  appSecret: appSecret!,
};

app.get("/designs/:designId?", async (req, res) => {
  const { subcategories, keywords, tags, perPage, pageNumber } = req.query;
  const { designId: designIdStr } = req.params;

  const designId =
    designIdStr && !isNaN(+designIdStr) ? +designIdStr : undefined;
  const subcategoriesArray = trySplitCommaSeparatedString(subcategories);
  const keywordsArray = trySplitCommaSeparatedString(keywords);
  const tagsArray = trySplitCommaSeparatedString(tags);
  const screenPrint = req.query.screenprint === "true";
  const embroidery = req.query.embroidery === "true";
  const amountPerPage = perPage !== undefined ? +perPage : defaultCountPerPage;
  const pageNumberToUse = pageNumber !== undefined ? +pageNumber : 1;
  console.log("id is " + designId);

  try {
    const designs = getDesigns();
    if (!designs) {
      throw new Error(errorMessages.serverError);
    }

    if (designId !== undefined) {
      const designWithId = designs.find((design) => design.ID === designId);
      if (!designWithId)
        return res.status(404).send(message(`Design ${designId} not found.`));
      const designWithImage = await populateSingleDesignImageURL(
        designWithId,
        dropboxCredentials
      );
      return res.status(OK).send(designWithImage);
    }

    const noFilters =
      (!subcategoriesArray || subcategoriesArray.length === 0) &&
      (!keywordsArray || keywordsArray.length === 0) &&
      (!tagsArray || tagsArray.length === 0) &&
      !screenPrint &&
      !embroidery;
    if (noFilters) {
      const paginated = getPageOfArray(designs, pageNumberToUse, amountPerPage);
      const withImageLinks = await populateDesignImageURLs(
        paginated,
        dropboxCredentials
      );
      return res.status(OK).send(withImageLinks);
    }

    const filteredDesigns = designs.filter((design) =>
      filterDesign(
        design,
        keywordsArray,
        subcategoriesArray,
        tagsArray,
        screenPrint,
        embroidery
      )
    );

    const status = filteredDesigns.length === 0 ? NOT_FOUND : OK;

    const paginated = getPageOfArray(
      filteredDesigns,
      pageNumberToUse,
      amountPerPage
    );
    const withImageLinks = await populateDesignImageURLs(
      paginated,
      dropboxCredentials
    );
    res.status(status).send(withImageLinks);
  } catch (error) {
    if (error instanceof Error)
      return res.status(INTERNAL_SERVER_ERROR).send(message(error.message));
  }
});

app.get("/categories", (req, res) => {
  const categories = getCategories();
  if (!categories)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(categories);
});

app.get("/subcategories", (req, res) => {
  const subcategories = getSubcategories();
  if (!subcategories)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(subcategories);
});

app.get("/tags", (req, res) => {
  const tags = getTags();
  if (!tags)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(tags);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
