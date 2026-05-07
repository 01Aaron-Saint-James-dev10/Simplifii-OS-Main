export const fetchLMSData = async (courseCode) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    course: courseCode,
    taskName: 'Foundations Essay',
    wordLimit: 2000,
    objectives: [
      "Critically analyze the methodological frameworks presented in the reading.",
      "Compare at least two distinct approaches."
    ],
    rubric: [
      { criterion: "Critical Thinking", description: "Independent synthesis required. Logical integration of literature.", weight: "40%" },
      { criterion: "Structure", description: "Clear introduction, body paragraphs with topic sentences, and a conclusive summary.", weight: "30%" },
      { criterion: "Referencing", description: "APA 7th edition formatting required. Minimum 5 peer-reviewed sources.", weight: "30%" }
    ]
  };
};
