const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfExport.ts', 'utf8');

if (!code.includes("import jsPDF from 'jspdf';")) {
  code = "import jsPDF from 'jspdf';\n" + code;
}

fs.writeFileSync('src/lib/pdfExport.ts', code);
