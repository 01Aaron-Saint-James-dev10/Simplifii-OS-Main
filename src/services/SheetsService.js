/**
 * Sheets Service for Simplifii-OS Cognitive Ledger
 * Logs drafting effort into a Google Sheet every 60 seconds.
 */

const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || 'mock_spreadsheet_123';

export const appendThinkingLog = async (logs, authToken) => {
  if (!logs || logs.length === 0) return;

  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED`;

  // Format logs for Sheets
  const values = logs.map(log => [
    new Date(log.timestamp).toISOString(),
    log.blockId,
    log.type, // e.g., 'keystroke', 'flow'
    log.metadata || ''
  ]);

  try {
    if (authToken && authToken !== 'mock_jwt_token_xyz123') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`Sheets API Error: ${response.statusText}`);
      }
      console.log(`Successfully logged ${logs.length} events to Cognitive Ledger.`);
    } else {
      console.warn(`Using Mock Sheets API: Successfully simulated logging ${logs.length} events to Cognitive Ledger.`);
    }
  } catch (error) {
    console.error("Failed to append to Cognitive Ledger:", error);
  }
};

export const appendSemanticLog = async (entities, authToken) => {
  if (!entities || entities.length === 0) return;

  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/B1:append?valueInputOption=USER_ENTERED`;

  const values = entities.map(entity => [
    new Date().toISOString(),
    entity.id,
    entity.label,
    entity.type,
    entity.confidence
  ]);

  try {
    if (authToken && authToken !== 'mock_jwt_token_xyz123') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      });
      if (!response.ok) throw new Error(`Sheets API Error: ${response.statusText}`);
      console.log(`Successfully logged ${entities.length} semantic connections to Cognitive Ledger.`);
    } else {
      console.warn(`Using Mock Sheets API: Successfully simulated logging ${entities.length} semantic connections to Map of Thought.`);
    }
  } catch (error) {
    console.error("Failed to append semantic log:", error);
  }
};
