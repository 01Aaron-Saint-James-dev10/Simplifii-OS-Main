export const Personas = {
  Hardcore: {
    name: 'The Hardcore Architect',
    tone: 'Blunt, 100% Logic, 0% Fluff',
    speechRate: 1.1,
    pitch: 0.8,
    greetings: [
      "Systems online, {{name}}. Let's optimize this.",
      "Drop the files, {{name}}. I don't have all day."
    ],
    prompts: {
      missingGrounding: "I've scraped the metadata. You're missing three articles. Stop stalling and drop the URLs.",
      verified: "Logic checks out. The canvas is unlocked. Start drafting.",
      systemised: "Evidence systemised. Good logic jump. Keep going."
    }
  },
  Executive: {
    name: 'The Executive Buffer',
    tone: 'Professional, High EQ, Protective',
    speechRate: 1.0,
    pitch: 1.0,
    greetings: [
      "Welcome back, {{name}}. Let's filter out the noise.",
      "I've protected your schedule, {{name}}. Let's review the brief."
    ],
    prompts: {
      missingGrounding: "I've reviewed the requirements. We need to ground this with three academic sources before we proceed.",
      verified: "Context verified. I've cleared the canvas for you. You may begin drafting.",
      systemised: "Evidence successfully integrated into the block. Your argument is stronger now."
    }
  },
  Socratic: {
    name: 'The Socratic Coach',
    tone: 'Supportive, High EQ, Patient',
    speechRate: 0.95,
    pitch: 1.1,
    greetings: [
      "Hello {{name}}! Let's take this one step at a time.",
      "I'm here to help you unpack this assessment, {{name}}."
    ],
    prompts: {
      missingGrounding: "Great start! Now, to make your argument strong, could you provide three scholarly articles for us to ground our work?",
      verified: "Excellent work! Your context is perfectly verified. Let's start the first draft.",
      systemised: "Beautiful connection! This evidence perfectly supports your point."
    }
  }
};

export const getPersonaResponse = (personaKey, eventType) => {
  const persona = Personas[personaKey] || Personas.Socratic;
  const userName = localStorage.getItem('simplifii_user_name') || 'User';

  const courseName = localStorage.getItem('simplifii_course_name') || 'Course';
  const eventName = localStorage.getItem('simplifii_event_name') || 'Lab 3/Assignment';
  const eventDate = localStorage.getItem('simplifii_event_date') || 'Friday';

  if (eventType === 'ignition_stage1') {
    return `Systems online. Handshake complete. I've mapped your identity, ${userName}. I'm your Cognitive Partner. Before we open the canvas, I need to calibrate the environment to your specific brain-state. Ready to build your profile?`;
  }
  if (eventType === 'ignition_stage2') {
    return `I'm looking at your timeline. I see the ${eventName} deadline approaching on ${eventDate}. I've adjusted your 'Friction Map' to prioritize high-impact drafting today. Is this the sprint we're focusing on, or are we starting something fresh?`;
  }
  if (eventType === 'ignition_stage3') {
    return `Understood. Mapping the ${courseName} context. Whether this is a high school lab or a doctoral thesis, I'm locking the grounding sensors to this specific academic level. I've initialized the 'Knowledge Graph' for this subject—let's feed it some data.`;
  }
  if (eventType === 'ignition_stage4') {
    return `This is the critical phase. Drop your Outline, Brief, and Rubric here. I'm going to use Document AI to 'see' exactly what your markers are looking for. Once I've parsed the metadata, I'll unlock your linear canvas and we can begin the 'Vibe Check'.`;
  }
  if (eventType === 'ignition_complete') {
    return `Context verified. The canvas is yours.`;
  }

  if (eventType === 'ignition') {
    return `Systems online, ${userName}. I have merged the Research Engine and the Cognitive Ledger. I've found 3 new connections between your BABS1201 brief and your 2025 Inclusive Education notes. Cockpit is live.`;
  }

  if (eventType === 'greeting') {
    const greetingTemplate = persona.greetings[Math.floor(Math.random() * persona.greetings.length)];
    return greetingTemplate.replace('{{name}}', userName);
  }
  return persona.prompts[eventType] || "System updated.";
};
