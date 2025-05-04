import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import routes from "./routes";
import { basicAuth } from "./middlewares";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Basic authentication middleware (if enabled)
app.use(basicAuth);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// set view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", apiLimiter);
app.use("/linkedin", routes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).render("error", {
      title: "Error",
      message: "Something went wrong!",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you requested does not exist.",
    error: {},
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
