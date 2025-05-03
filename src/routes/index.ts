import { Router } from "express";
import {
  getHomePage,
  scrapeLinkedInProfile,
} from "../controllers/linkedinController";

const router = Router();

router.get("/", getHomePage);
router.post("/scrape", scrapeLinkedInProfile);

export default router;
