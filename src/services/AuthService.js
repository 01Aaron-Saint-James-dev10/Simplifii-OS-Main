export const mockGoogleAuth = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock_jwt_token_xyz123',
        user: {
          name: 'Adonis',
          email: 'adonis@student.unsw.edu.au',
          picture: 'https://via.placeholder.com/150'
        }
      });
    }, 1500);
  });
};

export const fetchContextualHistory = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        youtubeScrape: [
          { query: 'Cellular Metabolism basics', timestamp: Date.now() - 86400000 },
          { query: 'BABS1201 Lab Report structure', timestamp: Date.now() - 172800000 }
        ],
        calendarScrape: [
          { event: 'BABS1201 Lab 3', date: new Date(Date.now() + 86400000).toISOString() }
        ],
        inferredTier: 'tertiary',
        inferredFocus: 'Cellular Metabolism'
      });
    }, 2000);
  });
};
