import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

export const basicAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // check if basic auth is enabled
  const enableBasicAuth = process.env.ENABLE_BASIC_AUTH === "true";

  if (!enableBasicAuth) {
    return next(); // skip authentication if not enabled
  }

  // get credentials from headers
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader("WWW-Authenticate", "Basic");
    res.status(401).send("Authentication required.");
    return;
  }

  // basic auth format: Basic <base64(username:password)
  const base64Credentials = authHeader.split(" ")[1];

  // Handle case where format might be invalid
  if (!base64Credentials) {
    res.setHeader("WWW-Authenticate", "Basic");
    res.status(401).send("Invalid authorization format.");
    return;
  }

  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  // check if credentials are properly formatted
  if (!username || !password) {
    res.setHeader("WWW-Authenticate", "Basic");
    res.status(401).send("Invalid credentials format.");
    return;
  }

  // check credentials against environment variables
  const validUsername = process.env.BASIC_AUTH_USERNAME;
  const validPassword = process.env.BASIC_AUTH_PASSWORD;

  if (username === validUsername && password === validPassword) {
    return next(); // authentication successful, proceed to the next mid dleware
  }

  res.setHeader("WWW-Authenticate", "Basic");
  res.status(401).send("Invalid credentials.");
};
