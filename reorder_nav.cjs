const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('(workspace|agenda|history|portal)'\)\}[\s\S]*?<\/button>/g;
let match;
let buttons = {};
let positions = [];

while ((match = regex.exec(c)) !== null) {
  // We only want the ones in the main top nav, which are inside a group of 4.
  // The top nav ones are the first 4 occurrences.
  if (positions.length < 4) {
    buttons[match[1]] = match[0];
    positions.push({ start: match.index, end: match.index + match[0].length, id: match[1] });
  }
}

if (positions.length === 4) {
  const startIdx = positions[0].start;
  const endIdx = positions[3].end;
  
  const prefix = c.substring(0, startIdx);
  const suffix = c.substring(endIdx);
  
  // Also get the spacing between them
  const space1 = c.substring(positions[0].end, positions[1].start);
  const space2 = c.substring(positions[1].end, positions[2].start);
  const space3 = c.substring(positions[2].end, positions[3].start);

  // Reorder: Agenda, History, Workspace, Portal
  const newMiddle = buttons['agenda'] + space1 + 
                    buttons['history'] + space2 + 
                    buttons['workspace'] + space3 + 
                    buttons['portal'];

  fs.writeFileSync('src/components/Dashboard.tsx', prefix + newMiddle + suffix);
  console.log("Successfully reordered with regex!");
} else {
  console.log("Found " + positions.length + " buttons instead of 4.");
}