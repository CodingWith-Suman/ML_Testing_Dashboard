import express from "express";
import cors from "cors";
import imageRoute from "./routes/image.route";
import dbPiiRoutes from "./routes/dbPii.route";
import documentPiiRoutes from "./routes/documentPii.route";
import batchRoutes from "./routes/batch.route";
import dashboard from "./routes/dashboard.route";
const app = express();

app.use(cors());
app.use(express.json());

app.use(imageRoute);
app.use(dbPiiRoutes);
app.use(documentPiiRoutes);
app.use("/batches", batchRoutes);
app.use("/dashboard", dashboard);

app.use((_req, res) => {
  res.status(404).send("Not found");
});

export default app;
