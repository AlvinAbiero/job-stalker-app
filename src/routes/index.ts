import { Router } from "express";
import {
  getHomePage,
  scrapeLinkedInProfile,
  getLinkedInProfileApI,
} from "../controllers/linkedinController";

import { linkedInProfileValidation } from "../utils/validators";

const router = Router();

// Web Interface routes
router.get("/", getHomePage);
router.post("/scrape", linkedInProfileValidation(), scrapeLinkedInProfile);

// API Routes
router.get(
  "/api/profile/:url",
  linkedInProfileValidation(),
  getLinkedInProfileApI
);
router.post("/api/profile", linkedInProfileValidation(), getLinkedInProfileApI);

export default router;
