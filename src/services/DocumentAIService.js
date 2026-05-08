/**
 * Document AI Service for Simplifii-OS
 * Wires into GCP's Document AI REST API to replace react-pdftotext.
 */

const PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID || 'simplifii-os-production';
const LOCATION = 'us'; 
const PROCESSOR_ID = process.env.REACT_APP_DOCUMENT_AI_PROCESSOR_ID || 'c79a8ed226a1576e';
import { speakSystemMessage } from './MessagingHub';

export const processDocumentWithGCP = async (fileBlob, authToken) => {
  const endpoint = `https://${LOCATION}-documentai.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}:process`;

  try {
    // Convert blob to base64
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(fileBlob);
    });

    const requestBody = {
      rawDocument: {
        content: base64String,
        mimeType: fileBlob.type || 'application/pdf',
      }
    };

    const liveToken = localStorage.getItem('gcp_access_token') || authToken;

    if (liveToken) {
      console.log("Using Live OAuth Token from Google Login state...");
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${liveToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        speakSystemMessage("Adonis, I need you to re-authenticate to access the Research Engine.");
        throw new Error(`Document AI Error: 401 Unauthorized. Token expired or invalid.`);
      }

      if (!response.ok) {
        throw new Error(`Document AI Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.document.text;
    } else {
      // MOCK FALLBACK: Because the user has not completed the OAuth login with real GCP credentials yet,
      // we mock the Document AI response to prevent the UI from blocking.
      console.warn("Using Mock Document AI: Real OAuth token not provided.");
      return await mockDocumentAI(fileBlob);
    }

  } catch (error) {
    console.error("GCP Document AI Pipeline failed. Falling back to local mock.", error);
    return await mockDocumentAI(fileBlob);
  }
};

const mockDocumentAI = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[SIMULATED DOCUMENT AI EXTRACTION FOR ${file.name}]\n\nUnit Code: BABS1201\nTheme: Molecules\nTier: mres\nLength: 2000 words\nRequirements: Primary sources required.`);
    }, 1500);
  });
};
