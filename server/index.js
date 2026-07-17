import express from "express";
import cors from "cors";
import { config } from "./config.js";
import apiRouter from "./routes/api.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// central error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (status >= 500) console.error("[server error]", err);
  res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`ResumeAI server listening on http://localhost:${config.port}`);
  console.log(`AI mode: ${config.mockMode ? "MOCK (no OPENAI_API_KEY set)" : `OpenAI ${config.openaiModel}`}`);
});
