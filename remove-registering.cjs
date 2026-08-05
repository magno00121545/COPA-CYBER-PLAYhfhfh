const fs = require('fs');
let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

code = code.replace(/const \[registering, setRegistering\] = useState[^;]+;\n/g, '');
code = code.replace(/setRegistering\(null\);/g, '');

fs.writeFileSync('src/components/PublicView.tsx', code);
