import { Request, Response } from "express";
import { scrapeProfile } from "../services/scraper.service";
import { validationResult } from "express-validator";

export const getHomePage = (_req: Request, res: Response) => {
  res.render("index", { title: "Job Stalker App" });
};

export const scrapeLinkedInProfile = async (req: Request, res: Response) => {
  try {
    // Check validation errors if express-validator is used
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("index", {
        title: "Job Stalker App",
        error: errors.array()[0].msg,
      });
    }

    const { linkedinUrl } = req.body;

    if (!linkedinUrl) {
      return res.render("index", {
        title: "Job Stalker App",
        error: "Please provide a LinkedIn URL",
      });
    }

    // Validate if the URL is a linkedIn profile URL
    if (!linkedinUrl.includes("linkedin.com/in/")) {
      return res.render("index", {
        title: "Job Stalker App",
        error: "Please provide a valid LinkedIn profile URL",
      });
    }

    console.log(`Scraping LinkedIn Profile: ${linkedinUrl}`);

    // optional Login credentials
    const credentials = req.body.credentials
      ? {
          email: req.body.credentials.email,
          password: req.body.credentials.password,
        }
      : undefined;

    // For now, use environment variables for credentials if needed
    // const credentials =
    //   process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASSWORD
    //     ? {
    //         email: process.env.LINKEDIN_EMAIL,
    //         password: process.env.LINKEDIN_PASSWORD,
    //       }
    //     : undefined;

    // Set a longer timeout for the client response (5 minutes)
    req.setTimeout(300000); // 5 minutes in milliseconds

    const profileData = await scrapeProfile(linkedinUrl, credentials);

    res.render("result", {
      title: "Profile Analysis",
      profile: profileData,
    });
  } catch (error: any) {
    console.error("Error scraping profile:", error);
    // Determine the appropriate error message
    let errorMessage =
      "An error occurred while scraping the profile. Please try again.";

    if (error.message?.includes("timeout")) {
      errorMessage =
        "The request timed out. LinkedIn might be blocking automated access or the profile is too large. Please try again later.";
    } else if (
      error.message?.includes("CAPTCHA") ||
      error.message?.includes("Security Verification")
    ) {
      errorMessage =
        "LinkedIn is requesting CAPTCHA verification. Please try again later or use different credentials.";
    } else if (error.message?.includes("requires login")) {
      errorMessage =
        "This profile requires login. Please configure LinkedIn credentials in your .env file.";
    } else if (error.message?.includes("check your credentials")) {
      errorMessage =
        "Invalid LinkedIn credentials. Please check your credentials in the .env file.";
    } else if (error.message?.includes("Could not scrape")) {
      errorMessage =
        "Could not scrape the profile data. The profile might be private or LinkedIn's structure has changed.";
    }

    res.render("index", {
      title: "Job Stalker App",
      error: errorMessage,
    });
  }
};

/**
 * API endpoint to get LinkedIn profile data (JSON response)
 */

export const getLinkedInProfileApI = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const url = req.params.url || req.body.linkedinUrl;

    if (!url) {
      res.status(400).json({
        success: false,
        error: "LinkedIn URL is required",
      });
      return;
    }

    // Optional login credentials
    const credentials = req.body.credentials
      ? {
          email: req.body.credentials.email,
          password: req.body.credentials.password,
        }
      : undefined;

    // Scrape the profile
    const profileData = await scrapeProfile(url, credentials);

    // Return JSON response
    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    console.error("Error fetching LinkedIn profile:", error);

    // Determine appropriate error status
    let statusCode = 500;
    if (
      error.message?.includes("requires login") ||
      error.message?.includes("check your credentials")
    ) {
      statusCode = 401;
    } else if (
      error.message?.includes("not found") ||
      error.message?.includes("could not find")
    ) {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to fetch LinkedIn profile",
    });
  }
};
