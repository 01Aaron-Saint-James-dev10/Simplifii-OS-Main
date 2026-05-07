import React from 'react';
import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import MasterDashboard from './frontend/MasterDashboard';
function App() { return (
<SettingsProvider><ProjectProvider><MasterDashboard /></ProjectProvider></SettingsProvider>
); }
export default App;
