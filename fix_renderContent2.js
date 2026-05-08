const fs = require('fs');
const file = 'src/frontend/MasterDashboard.js';
let content = fs.readFileSync(file, 'utf8');

const startIndex = content.indexOf('  const renderContent = () => {');
const endIndexStr = '  };';
// find the first "  };" after renderContent start
const endIndex = content.indexOf(endIndexStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  const renderContent = () => {
    if (!activeTask) {
      return <UniversalOnboarding onComplete={handleSprintCreation} setAvatarEvent={setAvatarEvent} />;
    }

    if (workflowPhase === 'verification') {
      return <VerificationGate 
        onVerify={() => {
          setWorkflowPhase('drafting');
          setAvatarEvent('verified');
        }} 
        extractionData={extractionData} 
      />;
    }

    return (
      <div className="flex-1 flex overflow-hidden animate-fade-in relative z-0">
        <LinearCanvas extractionData={extractionData} />
      </div>
    );`;
  
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endIndexStr.length); 
  fs.writeFileSync(file, before + replacement + '\n  };\n' + after);
  console.log("Replaced renderContent successfully.");
} else {
  console.log("Failed to find renderContent boundaries.");
}
