import { body } from "express-validator";

/**
 * Validation rules for LinkedIn profile requests
 */

export const linkedInProfileValidation = () => {
  return [
    body("linkedinUrl")
      .optional()
      .isURL()
      .withMessage("A valid LinkedIn profile URL is required")
      .contains("linkedin.com/in/")
      .withMessage(
        "URL must be a LinkedIn profile URL (linkedin.com/in/{username})"
      ),
    body("credentials.email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required if credentials are provided"),
    body("credentials.password")
      .optional()
      .isLength({ min: 6 })
      .withMessage(
        "Password must be atleast 6 characters if credentials are provided"
      ),
  ];
};
