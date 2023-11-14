import express, { json } from "express";

const app = express();
app.use(json());

app.get("/", (req, res) => {
  console.log("received request");
  res.status(200).send({ message: "Llama" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
