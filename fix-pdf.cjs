const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationsView.tsx', 'utf8');

code = code.replace("onClick={() => generateRegistrationReceiptPDF(r, tName)}", "onClick={() => generateRegistrationReceiptPDF(r, tournamentName)}");

fs.writeFileSync('src/components/RegistrationsView.tsx', code);
