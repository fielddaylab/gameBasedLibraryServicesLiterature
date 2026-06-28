// Passport.js configuration for OAuth authentication.
// Supports GitHub and Google login strategies.

import passport from 'passport';
import GitHubStrategy from 'passport-github2';
import GoogleStrategy from 'passport-google-oauth20';
import { getEnv, APP_URL } from './config.mjs';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByGithubId,
  getUserByGoogleId,
  updateUserLastLogin,
} from './db.mjs';

// Extract OAuth credentials from environment
const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');

// Callback URLs — must match what's configured in GitHub/Google OAuth apps
const GITHUB_CALLBACK_URL = `${APP_URL}/auth/github/callback`;
const GOOGLE_CALLBACK_URL = `${APP_URL}/auth/google/callback`;

// ============================================================================
// GitHub Strategy
// ============================================================================

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Look up user by GitHub ID first
          let user = getUserByGithubId(profile.id);

          if (!user) {
            // Try to find by email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = getUserByEmail(email);
            }
          }

          if (!user) {
            // Create new user from GitHub profile
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('GitHub profile does not have an email address. Make sure your GitHub account has a public email.'));
            }

            const fullName = profile.displayName || profile.username || 'GitHub User';
            let initials = fullName
              .split(' ')
              .filter(n => n.length > 0)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            // Fallback if initials couldn't be calculated
            if (!initials) {
              initials = 'GH';
            }

            user = createUser(email, fullName, initials, null, profile.id, null, profile.username);
          }

          if (!user) {
            return done(new Error('Unable to create user from GitHub profile'));
          }

          updateUserLastLogin(user.id);
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GitHub OAuth is not configured (missing CLIENT_ID or CLIENT_SECRET)');
}

// ============================================================================
// Google Strategy
// ============================================================================

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Look up user by Google ID first
          let user = getUserByGoogleId(profile.id);

          if (!user) {
            // Try to find by email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = getUserByEmail(email);
            }
          }

          if (!user) {
            // Create new user from Google profile
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('Google profile does not have an email address.'));
            }

            const fullName = profile.displayName || 'Google User';
            let initials = fullName
              .split(' ')
              .filter(n => n.length > 0)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            // Fallback if initials couldn't be calculated
            if (!initials) {
              initials = 'GG';
            }

            user = createUser(email, fullName, initials, null, null, profile.id);
          }

          if (!user) {
            return done(new Error('Unable to create user from Google profile'));
          }

          updateUserLastLogin(user.id);
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth is not configured (missing CLIENT_ID or CLIENT_SECRET)');
}

// ============================================================================
// Session serialization
// ============================================================================

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = getUserById(id);
    done(null, user || null);
  } catch (error) {
    done(error);
  }
});

export default passport;
