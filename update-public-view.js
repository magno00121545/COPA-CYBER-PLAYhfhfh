const fs = require('fs');

let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

// Replace localStorage reads with state defaults
code = code.replace(/const \[pixKey, setPixKey\] = useState\([^)]+\);/g, "const [pixKey, setPixKey] = useState('');");
code = code.replace(/const \[pixName, setPixName\] = useState\([^)]+\);/g, "const [pixName, setPixName] = useState('');");
code = code.replace(/const \[whatsappNumber, setWhatsappNumber\] = useState\([^)]+\);/g, "const [whatsappNumber, setWhatsappNumber] = useState('');");
code = code.replace(/const \[pixInstructions, setPixInstructions\] = useState\([^)]+\);/g, "const [pixInstructions, setPixInstructions] = useState('');");
code = code.replace(/const \[sponsors, setSponsors\] = useState<any\[\]>\([^)]+\);/g, "const [sponsors, setSponsors] = useState<any[]>([]);");

// Update useEffect to fetch settings
code = code.replace(/useEffect\(\(\) => \{\n    loadPublicData\(\);\n  \}, \[\]\);/, `useEffect(() => {
    loadPublicData();
    loadSettings();

    const channel = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadPublicData();
        loadSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setPixKey(data.pixKey || '');
      setPixName(data.pixName || '');
      setWhatsappNumber(data.whatsappNumber || '');
      setPixInstructions(data.pixInstructions || '');
      setSponsors(data.sponsors || []);
    }
  }
`);

fs.writeFileSync('src/components/PublicView.tsx', code);
