// src/services/enhancedScraperService.ts
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { calculateProfileScore } from "../utils/helpers";

dotenv.config();

interface ProfileData {
  name: string;
  headline: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  recommendations: number;
  score?: number;
  analysis?: string;
}

interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
}

interface EducationItem {
  school: string;
  degree: string;
  years: string;
}

interface LinkedInCredentials {
  email: string;
  password: string;
}

/**
 * Enhanced LinkedIn profile scraper
 * Includes options for login if needed
 */
export async function scrapeProfileWithLogin(
  url: string,
  credentials?: LinkedInCredentials
): Promise<ProfileData> {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== "false", // Convert string to boolean
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate to LinkedIn profile
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Check if login is required
    const loginRequired = await page.evaluate(() => {
      return (
        document.querySelector(
          ".authwall-join-form, .authentication-outlet"
        ) !== null
      );
    });

    // Handle login if required and credentials are provided
    if (loginRequired && credentials) {
      console.log("Login required. Attempting to log in...");

      // Navigate to login page
      await page.goto("https://www.linkedin.com/login", {
        waitUntil: "networkidle2",
      });

      // Fill in login form
      await page.type("#username", credentials.email);
      await page.type("#password", credentials.password);

      // Click login button
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click(".login__form_action_container button"),
      ]);

      // Check if login was successful
      const loginSuccessful = await page.evaluate(() => {
        return document.querySelector(".feed-identity-module") !== null;
      });

      if (!loginSuccessful) {
        throw new Error("Login failed. Please check your credentials.");
      }

      // Navigate back to the profile URL
      await page.goto(url, { waitUntil: "networkidle2" });
    } else if (loginRequired && !credentials) {
      throw new Error(
        "This profile requires login, but no credentials were provided."
      );
    }

    // Wait for profile content to load
    await page
      .waitForSelector(".pv-top-card", { timeout: 10000 })
      .catch(() =>
        console.log("Could not find main profile section, but continuing...")
      );

    // Extract profile data with better selectors and fallbacks
    const profileData = await page.evaluate(() => {
      // Helper function to safely get text content
      const getText = (selector: string, fallback = "Not found") => {
        const element = document.querySelector(selector);
        return element ? element.textContent?.trim() || fallback : fallback;
      };

      // Find section by heading text
      const findSectionByHeading = (headingText: string) => {
        const headings = Array.from(
          document.querySelectorAll("section h2, section h3")
        );
        for (const heading of headings) {
          if (heading.textContent?.includes(headingText)) {
            return heading.closest("section");
          }
        }
        return null;
      };

      // Basic info with multiple selector attempts
      const name = getText(
        '.text-heading-xlarge, .pv-top-card-section__name, [data-generated-cea-title="name"]'
      );
      const headline = getText(
        '.text-body-medium, .pv-top-card-section__headline, [data-generated-cea-line1="headline"]'
      );
      const locationElement = document.querySelector(
        '.text-body-small.inline.t-black--light.break-words, .pv-top-card-section__location, [data-generated-cea-line2="location"]'
      );
      const location = locationElement
        ? locationElement.textContent?.trim() || "Not found"
        : "Not found";

      // Summary (About section)
      const summarySection = findSectionByHeading("About");
      const summary = summarySection
        ? getText(
            ".display-flex.ph5.pv3 div, .pv-about__summary-text",
            "No summary found"
          )
        : "No summary found";

      // Experience
      const experienceItems: ExperienceItem[] = [];
      const experienceSection = findSectionByHeading("Experience");

      if (experienceSection) {
        const expElements = experienceSection.querySelectorAll(
          "li.artdeco-list__item, .pv-entity__position-group"
        );

        expElements.forEach((element) => {
          const title = getText(
            'span.mr1.t-bold, .pv-entity__summary-info h3, [data-field="title"]',
            "Unknown role"
          );
          const company = getText(
            'span.t-14.t-normal, .pv-entity__secondary-title, [data-field="company_name"]',
            "Unknown company"
          );
          const duration = getText(
            'span.t-14.t-normal.t-black--light, .pv-entity__date-range span:nth-child(2), [data-field="date_range"]',
            "Unknown duration"
          );

          experienceItems.push({ title, company, duration });
        });
      }

      // Education
      const educationItems: EducationItem[] = [];
      const educationSection = findSectionByHeading("Education");

      if (educationSection) {
        const eduElements = educationSection.querySelectorAll(
          "li.artdeco-list__item, .pv-education-entity"
        );

        eduElements.forEach((element) => {
          const school = getText(
            'div.t-bold, .pv-entity__school-name, [data-field="school_name"]',
            "Unknown school"
          );
          const degree = getText(
            'span.t-14.t-normal, .pv-entity__degree-name span:nth-child(2), [data-field="degree_name"]',
            "Unknown degree"
          );
          const years = getText(
            'span.t-14.t-normal.t-black--light, .pv-entity__dates span:nth-child(2), [data-field="date_range"]',
            "Unknown years"
          );

          educationItems.push({ school, degree, years });
        });
      }

      // Skills
      const skills: string[] = [];
      const skillsSection = findSectionByHeading("Skills");

      if (skillsSection) {
        const skillElements = skillsSection.querySelectorAll(
          'span.display-block.t-black--light.t-14, .pv-skill-category-entity__name, [data-field="skill_name"]'
        );

        skillElements.forEach((element) => {
          const skill = element.textContent?.trim();
          if (skill) skills.push(skill);
        });
      }

      // Recommendations
      const recommendationsSection = findSectionByHeading("Recommendations");

      let recommendations = 0;
      if (recommendationsSection) {
        const recommendationsText = recommendationsSection.textContent || "";
        const match = recommendationsText.match(/(\d+)\s+recommendation/);
        if (match && match[1]) {
          recommendations = parseInt(match[1], 10);
        }
      }

      return {
        name,
        headline,
        location,
        summary,
        experience: experienceItems,
        education: educationItems,
        skills,
        recommendations,
      };
    });

    // Retry getting skills if it was empty (sometimes skills need to be expanded)
    if (profileData.skills.length === 0) {
      try {
        // Try to click "Show more skills" button if it exists
        const showMoreButton = await page.$(
          "button.pv-skills-section__additional-skills"
        );
        if (showMoreButton) {
          await showMoreButton.click();
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for animation

          // Extract skills again
          const skills = await page.evaluate(() => {
            const skillElements = document.querySelectorAll(
              ".pv-skill-category-entity__name"
            );
            return Array.from(skillElements)
              .map((element) => element.textContent?.trim())
              .filter(Boolean) as string[];
          });

          if (skills.length > 0) {
            profileData.skills = skills;
          }
        }
      } catch (error) {
        console.log("Could not expand skills section:", error);
      }
    }

    // Take a screenshot for debugging if needed
    if (process.env.NODE_ENV === "development") {
      await page.screenshot({ path: `screenshots/${Date.now()}_profile.png` });
    }

    // Close the browser
    await browser.close();

    // Calculate profile score and analysis
    const { score, analysis } = calculateProfileScore(profileData);

    return {
      ...profileData,
      score,
      analysis,
    };
  } catch (error) {
    console.error("Error during enhanced scraping:", error);
    await browser.close();
    throw error;
  }
}
