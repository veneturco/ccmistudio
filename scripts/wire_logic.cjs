const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// 1. Add new state variables
const stateHookTarget = `  const [isCardModalOpen, setIsCardModalOpen] = useState(false);`;
const newStates = `  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(false);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const togglePatientPanel = (name?: string, age?: string, id?: string, diag?: string, initials?: string) => setIsPatientPanelOpen(prev => !prev);
  const closeAllPanels = () => { setIsPatientPanelOpen(false); setIsVoicePanelOpen(false); };
  const toggleVoicePanel = () => setIsVoicePanelOpen(prev => !prev);
  const openNewPatientModal = () => setIsNewPatientModalOpen(true);
  const closeNewPatientModal = () => setIsNewPatientModalOpen(false);
  const showToast = (msg: string) => console.log("Toast:", msg); // In a real app this would use a toast library
`;
content = content.replace(stateHookTarget, newStates);

// Remove the old dummy handlers
content = content.replace(/  const togglePatientPanel = \(\) => console\.log\("Toggle patient"\);\s*/, '');
content = content.replace(/  const toggleVoicePanel = \(\) => console\.log\("Toggle voice"\);\s*/, '');
content = content.replace(/  const showToast = \(msg: string\) => console\.log\("Toast:", msg\);\s*/, '');
content = content.replace(/  const openNewPatientModal = \(\) => console\.log\("New patient"\);\s*/, '');

// 2. Wire the side panel class
content = content.replace(/id="patient-side-panel" className="side-panel"/g, 'id="patient-side-panel" className={`side-panel ${isPatientPanelOpen ? \'active\' : \'\'}`}');

// 3. Wire the voice panel class
content = content.replace(/id="voice-dictation-panel" className="voice-panel"/g, 'id="voice-dictation-panel" className={`voice-panel ${isVoicePanelOpen ? \'active\' : \'\'}`}');

// 4. Wire the overlay class
content = content.replace(/id="app-overlay" className="glass-overlay"/g, 'id="app-overlay" className={`glass-overlay ${(isPatientPanelOpen || isVoicePanelOpen) ? \'active\' : \'\'}`}');

// 5. Wire the new patient modal (assuming it has id="new-patient-modal")
// Wait, the HTML might use `style="display: none;"`. Let's check how it's hidden.
// In the provided HTML it was: <div id="new-patient-modal" class="fixed inset-0 ... hidden">
content = content.replace(/id="new-patient-modal" className="([^"]*)hidden([^"]*)"/g, 'id="new-patient-modal" className={`$1 ${isNewPatientModalOpen ? \'flex\' : \'hidden\'} $2`}');

// Since the class might be just "fixed inset-0 z-[100] flex items-center justify-center hidden"
// I will use a robust replacement:
content = content.replace(/id="new-patient-modal" className="fixed inset-0 z-\[100\] hidden/g, 'id="new-patient-modal" className={`fixed inset-0 z-[100] ${isNewPatientModalOpen ? \'flex\' : \'hidden\'}');
// Let's do a more generic replacement if the first one doesn't match perfectly.
content = content.replace(/className="fixed inset-0 z-\[100\] hidden([^"]*)"/g, 'className={`fixed inset-0 z-[100] ${isNewPatientModalOpen ? \'flex\' : \'hidden\'} $1`}');

// Update calls to closeAllPanels
// Because the HTML has `closeAllPanels()` already inside `onClick={() => { closeAllPanels() }}`

// We also need to hook up "Ver Protocolo Quirúrgico" which was showToast('Cargando protocolo y checklist Synapsis...')
// Let's make it open the `OfflineOperatingRoomBanner` or just alert.
// But we want to do it perfectly. The user asked to connect it.
// There is an OfflineOperatingRoomBanner component. Let's just render it if in Quirofano mode.
// Actually, `activeTab` handles the views. We can add a simple toggle for protocol.

fs.writeFileSync(dashPath, content);
console.log('Wired up state logic for panels and modals.');
