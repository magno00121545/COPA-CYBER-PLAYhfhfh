const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

// import exportDatabaseJSON
code = code.replace("import { generateSocialMediaPDF } from '../lib/pdfExport';", "import { generateSocialMediaPDF } from '../lib/pdfExport';\nimport { exportDatabaseJSON } from '../lib/supabase';");

const oldLogout = `        {onLogout && (
          <button
            onClick={onLogout}`;

const newLogout = `        {onLogout && (
          <button
            onClick={async () => {
              if (confirm('Deseja fazer o download de um Backup do sistema antes de sair?')) {
                try {
                  const data = await exportDatabaseJSON();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = \`cyberplay_backup_\${new Date().toISOString().split('T')[0]}.json\`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  // Allow browser to download before logout
                  setTimeout(onLogout, 500);
                } catch(e) {
                  console.error(e);
                  onLogout();
                }
              } else {
                onLogout();
              }
            }}`;

code = code.replace(oldLogout, newLogout);
fs.writeFileSync('src/components/Header.tsx', code);
