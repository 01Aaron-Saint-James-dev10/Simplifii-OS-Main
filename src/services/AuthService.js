export const mockGoogleAuth = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'sandbox_demo_token',
        user: {
          name: 'Demo Student',
          email: 'demo@simplifii.local',
          picture: 'https://via.placeholder.com/150'
        }
      });
    }, 1500);
  });
};

// Sandbox-only mock. The 'preview' label on the LandingPage tells the user
// this is canned data; once real Google OAuth is wired, this entire file
// becomes a thin wrapper around the live People / Calendar / Drive APIs.
export const fetchContextualHistory = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        youtubeScrape: [],
        calendarScrape: [],
        inferredTier: 'tertiary',
        inferredFocus: 'General Studies'
      });
    }, 2000);
  });
};
