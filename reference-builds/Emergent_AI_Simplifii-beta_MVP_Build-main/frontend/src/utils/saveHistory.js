import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const saveToolOutput = async (toolName, inputSummary, outputSummary, fullOutput, ticketCost = 1) => {
  try {
    await axios.post(`${API}/history/save`, {
      tool_name: toolName,
      input_summary: inputSummary.substring(0, 100),
      output_summary: outputSummary.substring(0, 200),
      full_output: fullOutput,
      ticket_cost: ticketCost
    }, { withCredentials: true });
  } catch (err) {
    // Silent fail — history saving should never block tool usage
    console.warn('Failed to save tool output to history:', err.message);
  }
};
