import express, { json } from "express";
import {
  getCategories,
  getDesigns,
  getSubcategories,
  getTags,
} from "./dbLogic";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "./statusCodes";
import {
  getArrayPage as getPageOfArray,
  message,
  trySplitCommaSeparatedString,
} from "./utility";
import { defaultCountPerPage, errorMessages } from "./constants";
import { filterDesign } from "./searchFilter";

const app = express();
app.use(json());

app.get("/designs", (req, res) => {
  const { subcategories, keywords, tags, perPage, pageNumber } = req.query;

  const subcategoriesArray = trySplitCommaSeparatedString(subcategories);
  const keywordsArray = trySplitCommaSeparatedString(keywords);
  const tagsArray = trySplitCommaSeparatedString(tags);
  const screenPrint = req.query.screenprint === "true";
  const embroidery = req.query.embroidery === "true";
  const amountPerPage = perPage !== undefined ? +perPage : defaultCountPerPage;
  const pageNumberToUse = pageNumber !== undefined ? +pageNumber : 1;

  const designs = getDesigns();
  if (!designs)
    return res
      .status(INTERNAL_SERVER_ERROR)
      .send(message(errorMessages.serverError));
  const noFilters =
    (!subcategoriesArray || subcategoriesArray.length === 0) &&
    (!keywordsArray || keywordsArray.length === 0) &&
    (!tagsArray || tagsArray.length === 0) &&
    !screenPrint &&
    !embroidery;
  if (noFilters) {
    const paginated = getPageOfArray(designs, pageNumberToUse, amountPerPage);
    return res.status(OK).send(paginated);
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
  res.status(status).send(paginated);
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
