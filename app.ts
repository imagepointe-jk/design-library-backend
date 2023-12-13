import express, { json } from "express";
import { defaultCountPerPage, errorMessages } from "./constants";
import {
  getCategories,
  getDesigns,
  getSubcategories,
  getTags,
  populateDesignImageURLs,
  populateSingleDesignImageURLs,
} from "./dbLogic";
import { filterDesigns } from "./searchFilter";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "./statusCodes";
import { DropboxCredentials } from "./types";
import {
  getArrayPage as getPageOfArray,
  makeStringTitleCase,
  message,
  trySplitCommaSeparatedString,
} from "./utility";
import { DesignType, designTypes } from "./tempDbSchema";
import { parseDesignType } from "./validation";

// #region Setup
const app = express();
const isDevMode = app.get("env") === "development";

const allowedOrigins = [
  "https://react-frontend-production-93c4.up.railway.app",
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (isDevMode || allowedOrigins.includes(origin))) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(json());
if (isDevMode) {
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
// #endregion

app.get("/designs/:designNumber?", async (req, res) => {
  const {
    subcategories,
    keywords,
    tags,
    perPage,
    pageNumber,
    designtype: designTypeQuery,
    featured,
  } = req.query;
  const { designNumber: designNumberStr } = req.params;

  const designNumber =
    designNumberStr && !isNaN(+designNumberStr) ? +designNumberStr : undefined;
  const subcategoriesArray = trySplitCommaSeparatedString(subcategories);
  const keywordsArray = trySplitCommaSeparatedString(keywords);
  const tagsArray = trySplitCommaSeparatedString(tags);
  let designType: DesignType = "Screen Print";
  try {
    designType = parseDesignType(makeStringTitleCase(`${designTypeQuery}`));
  } catch (_) {}
  const onlyFeatured = `${featured}` === `${true}`;
  const amountPerPage = perPage !== undefined ? +perPage : defaultCountPerPage;
  const pageNumberToUse = pageNumber !== undefined ? +pageNumber : 1;

  try {
    const designs = getDesigns(isDevMode);
    if (!designs) {
      throw new Error(errorMessages.serverError);
    }

    if (designNumber !== undefined) {
      const designWithId = designs.find(
        (design) => design.DesignNumber === designNumber
      );
      if (!designWithId)
        return res
          .status(404)
          .send(message(`Design ${designNumber} not found.`));
      const designWithImage = await populateSingleDesignImageURLs(
        designWithId,
        dropboxCredentials
      );
      return res.status(OK).send(designWithImage);
    }

    const filteredDesigns = filterDesigns(
      designs,
      keywordsArray,
      subcategoriesArray,
      tagsArray,
      designType,
      onlyFeatured
    );

    const paginated = getPageOfArray(
      filteredDesigns,
      pageNumberToUse,
      amountPerPage
    );
    const status = paginated.length === 0 ? NOT_FOUND : OK;
    const withImageLinks = await populateDesignImageURLs(
      paginated,
      dropboxCredentials
    );
    res.status(status).send({
      pageNumber: pageNumberToUse,
      perPage: amountPerPage,
      total: filteredDesigns.length,
      designs: withImageLinks,
    });
  } catch (error) {
    if (error instanceof Error)
      return res.status(INTERNAL_SERVER_ERROR).send(message(error.message));
  }
});

app.get("/categories", (req, res) => {
  const categories = getCategories(isDevMode);
  if (!categories)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(categories);
});

app.get("/subcategories", (req, res) => {
  const subcategories = getSubcategories(isDevMode);
  if (!subcategories)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(subcategories);
});

app.get("/tags", (req, res) => {
  const tags = getTags(isDevMode);
  if (!tags)
    res.status(INTERNAL_SERVER_ERROR).send(message(errorMessages.serverError));

  res.status(OK).send(tags);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
