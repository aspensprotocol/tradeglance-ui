// Get the git commit hash for version display
// This will be replaced at build time with the actual commit hash
export const getGitCommitHash = (): string => {
  // In development, return a placeholder
  if (import.meta.env.DEV) {
    return "dev";
  }

  // In production, this will be replaced by Vite's define plugin
  // or we can use an environment variable
  return import.meta.env.VITE_GIT_COMMIT_HASH || "unknown";
};

// Get a short version of the commit hash (first 7 characters)
export const getShortGitCommitHash = (): string => {
  const hash = getGitCommitHash();
  return hash === "dev" || hash === "unknown" ? hash : hash.substring(0, 7);
};
