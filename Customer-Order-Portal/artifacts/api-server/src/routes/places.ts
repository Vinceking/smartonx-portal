import { Router } from "express";
import { autocomplete, details } from "../lib/places";

const router = Router();

// GET /api/places/autocomplete?query=...
router.get("/autocomplete", (req, res) => {
  const query = String(req.query.query ?? "");
  res.json(autocomplete(query));
});

// GET /api/places/details?placeId=...
router.get("/details", (req, res) => {
  const placeId = String(req.query.placeId ?? "");
  const result = details(placeId);
  if (!result) { res.status(404).json({ error: "Place not found" }); return; }
  res.json(result);
});

export default router;
