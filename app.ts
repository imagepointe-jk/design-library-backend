import express, { json } from "express";
import { defaultCountPerPage, errorMessages } from "./constants";
import {
  getCategories,
  getColors,
  getDesigns,
  getSubcategories,
  getTags,
} from "./dbLogic";
import { filterDesigns, sortDesigns } from "./searchFilter";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_AUTHENTICATED,
  NOT_FOUND,
  OK,
} from "./statusCodes";
import { DropboxCredentials } from "./types";
import {
  getArrayPage as getPageOfArray,
  makeStringTitleCase,
  message,
  trySplitCommaSeparatedString,
} from "./utility";
import { DesignType, designTypes } from "./tempDbSchema";
import {
  parseDesignType,
  parseQuoteRequest,
  parseSortingType,
} from "./validation";
import { ZodError } from "zod";
import { sendQuoteRequestEmail } from "./mail";

// #region Setup
const app = express();
const isDevMode = app.get("env") === "development";

const allowedOrigins = [
  "https://react-frontend-production-93c4.up.railway.app",
  "https://react-frontend-development-31c4.up.railway.app",
  "https://iframe-friendly-production.up.railway.app",
  "https://www.imagepointe.com",
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

const authPassword = process.env.AUTH_PASSWORD;
if (!authPassword) {
  console.error("Couldn't find the auth password!");
}
// #endregion

app.get("/designs/:designId?", async (req, res) => {
  const {
    subcategories,
    category: categoryQuery,
    keywords,
    tags,
    perPage,
    pageNumber,
    designtype: designTypeQuery,
    featured,
    allowDuplicateDesignNumbers,
    getRelatedToId, //if an ID was specified, also return any designs with the same design number
    sortBy,
    similarTo,
    excludePrioritized, //if true, this helps prevent showing designs again in the main library when they're already featured in the top slider. should be used sparingly to avoid hiding designs at unexpected times.
  } = req.query;
  const { designId } = req.params;

  const subcategoriesArray = trySplitCommaSeparatedString(subcategories);
  const category = categoryQuery ? `${categoryQuery}` : undefined;
  const keywordsArray = trySplitCommaSeparatedString(keywords);
  const tagsArray = trySplitCommaSeparatedString(tags);
  let designType: DesignType = "Screen Print";
  try {
    designType = parseDesignType(makeStringTitleCase(`${designTypeQuery}`));
  } catch (_) {}
  const onlyFeatured = `${featured}` === `${true}`;
  const amountPerPage = perPage !== undefined ? +perPage : defaultCountPerPage;
  const pageNumberToUse = pageNumber !== undefined ? +pageNumber : 1;
  const allowDuplicates = `${allowDuplicateDesignNumbers}` === `${true}`;
  const getRelated = `${getRelatedToId}` === `${true}`;
  const sortingType = parseSortingType(`${sortBy}`);
  const similarToId = similarTo && !isNaN(+similarTo) ? +similarTo : undefined;
  // const shouldExcludePrioritized = `${excludePrioritized}` === `${true}`;
  const shouldExcludePrioritized = false; //temporarily disable this feature

  try {
    const designs = await getDesigns(dropboxCredentials, isDevMode);
    if (!designs) {
      throw new Error(errorMessages.serverError);
    }

    if (designId !== undefined && !isNaN(+designId)) {
      const designWithDesignId = designs.find(
        (design) => design.Id === +designId
      );
      if (!designWithDesignId)
        return res.status(404).send(message(`Design ${designId} not found.`));
      if (getRelated) {
        const designsWithSameDesignNumber = designs.filter(
          (design) => design.DesignNumber === designWithDesignId.DesignNumber
        );
        return res.status(OK).send(designsWithSameDesignNumber);
      }
      return res.status(OK).send(designWithDesignId);
    }

    const filteredDesigns = filterDesigns(
      designs,
      keywordsArray,
      category,
      subcategoriesArray,
      tagsArray,
      designType,
      onlyFeatured,
      allowDuplicates,
      shouldExcludePrioritized,
      similarToId
    );
    sortDesigns(filteredDesigns, sortingType);

    const paginated = getPageOfArray(
      filteredDesigns,
      pageNumberToUse,
      amountPerPage
    );
    const status = paginated.length === 0 ? NOT_FOUND : OK;
    res.status(status).send({
      pageNumber: pageNumberToUse,
      perPage: amountPerPage,
      total: filteredDesigns.length,
      designs: paginated,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    return res.status(INTERNAL_SERVER_ERROR).send(message(errorMessage));
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await getCategories(dropboxCredentials, isDevMode);
    if (!categories)
      res
        .status(INTERNAL_SERVER_ERROR)
        .send(message(errorMessages.serverError));

    res.status(OK).send(categories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    return res.status(INTERNAL_SERVER_ERROR).send(message(errorMessage));
  }
});

app.get("/subcategories", async (req, res) => {
  try {
    const subcategories = await getSubcategories(dropboxCredentials, isDevMode);
    if (!subcategories)
      res
        .status(INTERNAL_SERVER_ERROR)
        .send(message(errorMessages.serverError));

    res.status(OK).send(subcategories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    return res.status(INTERNAL_SERVER_ERROR).send(message(errorMessage));
  }
});

app.get("/tags", async (req, res) => {
  try {
    const tags = await getTags(dropboxCredentials, isDevMode);
    if (!tags)
      res
        .status(INTERNAL_SERVER_ERROR)
        .send(message(errorMessages.serverError));

    res.status(OK).send(tags);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    return res.status(INTERNAL_SERVER_ERROR).send(message(errorMessage));
  }
});

app.get("/colors", async (req, res) => {
  try {
    const colors = await getColors(dropboxCredentials, isDevMode);
    if (!colors)
      res
        .status(INTERNAL_SERVER_ERROR)
        .send(message(errorMessages.serverError));

    res.status(OK).send(colors);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    return res.status(INTERNAL_SERVER_ERROR).send(message(errorMessage));
  }
});

app.post("/quote-request", async (req, res) => {
  try {
    const givenPassword = req.headers.authorization?.split(" ")[1];
    if (givenPassword !== authPassword) {
      return res
        .status(NOT_AUTHENTICATED)
        .send(message("Invalid authorization."));
    }
    const parsedBody = parseQuoteRequest(req.body);
    sendQuoteRequestEmail(parsedBody, isDevMode);
    return res.status(OK).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(BAD_REQUEST).send(error);
    } else if (error instanceof Error) {
      console.error(error.message);
    }
    return res.status(INTERNAL_SERVER_ERROR).send(message("Unknown error."));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
