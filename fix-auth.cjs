const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

code = code.replace("onAuthStateChange: () =>", "onAuthStateChange: (cb?: any) =>");
fs.writeFileSync('src/lib/supabase.ts', code);
