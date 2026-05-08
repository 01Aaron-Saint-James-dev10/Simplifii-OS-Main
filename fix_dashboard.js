const fs = require('fs');
const file = 'src/frontend/MasterDashboard.js';
let content = fs.readFileSync(file, 'utf8');

const startStr = "if (activePath === 'humaniser') return <Humaniser />;";
const endStr = "};";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex + startStr.length);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `if (activePath === 'humaniser') return <Humaniser />;
    if (activePath === 'essay_scorer') return <EssayScorer rubricCriteria={extractionData?.rubricCriteria} />;

    return (
      <div className="flex-1 flex overflow-hidden animate-fade-in relative z-0">
        <LinearCanvas extractionData={extractionData} />
      </div>
    );
  `;
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endStr.length);
  fs.writeFileSync(file, before + replacement + '};' + after);
  console.log("Success");
} else {
  console.log("Failed to find boundaries", startIndex, endIndex);
}
