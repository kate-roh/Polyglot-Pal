import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";

import { authStorage } from "./storage";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set`);
  return v;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: requiredEnv("DATABASE_URL"),
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProd = process.env.NODE_ENV === "production";

  return session({
    secret: requiredEnv("SESSION_SECRET"),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

async function upsertUserFromGoogle(profile: Profile) {
  const email = profile.emails?.[0]?.value;
  const photo = profile.photos?.[0]?.value;

  await authStorage.upsertUser({
    id: profile.id,
    email: email ?? null,
    firstName: profile.name?.givenName ?? null,
    lastName: profile.name?.familyName ?? null,
    profileImageUrl: photo ?? null,
  });

  return {
    id: profile.id,
    email: email ?? null,
    firstName: profile.name?.givenName ?? null,
    lastName: profile.name?.familyName ?? null,
    profileImageUrl: photo ?? null,
  };
}

export async function setupAuth(app: Express) {
  // required for secure cookies behind proxies (Render/Fly/etc)
  app.set("trust proxy", 1);

  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  const clientID = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");

  // You can override this when deploying (recommended).
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        try {
          const user = await upsertUserFromGoogle(profile);
          done(null, user);
        } catch (err) {
          done(err as any);
        }
      },
    ),
  );

  // Login
  app.get(
    "/api/login",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    }),
  );

  // OAuth callback
  app.get(
    "/api/callback",
    passport.authenticate("google", {
      failureRedirect: "/",
    }),
    (req, res) => {
      // back to app
      res.redirect("/");
    },
  );

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session?.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !(req.user as any)?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
