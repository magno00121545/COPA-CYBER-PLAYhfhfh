const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf8');

code = code.replace("  payment_info: string;", "  payment_info: string;\n  game?: string;");
fs.writeFileSync('src/lib/types.ts', code);
