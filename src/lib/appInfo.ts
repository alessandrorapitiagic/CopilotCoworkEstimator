// Application metadata exposed at build time via Vite `define`.
// Single source of truth: package.json version.

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

export const BUILD_DATE: string =
  typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString()

export const REPO_URL = 'https://github.com/anomalyco/CopilotCoworkEstimator'
