import express, { json } from "express";
import {
  getCategories,
  getDesigns,
  getSubcategories,
  getTags,
} from "./dbLogic";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "./statusCodes";
import { message, trySplitCommaSeparatedString } from "./utility";
import { errorMessages } from "./constants";
import { filterDesign } from "./searchFilter";

const app = express();
app.use(json());

app.get("/designs", (req, res) => {
  const { subcategories, keywords, tags } = req.query;

  const subcategoriesArray = trySplitCommaSeparatedString(subcategories);
  const keywordsArray = trySplitCommaSeparatedString(keywords);
  const tagsArray = trySplitCommaSeparatedString(tags);
  const screenPrint = req.query.screenprint === "true";
  const embroidery = req.query.embroidery === "true";

  const designs = getDesigns();
  if (!designs)
    return res
      .status(INTERNAL_SERVER_ERROR)
      .send(message(errorMessages.serverError));

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

  res.status(status).send(filteredDesigns);
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
