const fs = require('fs');

let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

code = code.replace(/const pixKey = localStorage[^;]+;/g, "const [pixKey, setPixKey] = useState('pix@cyberplay.com');");
code = code.replace(/const pixName = localStorage[^;]+;/g, "const [pixName, setPixName] = useState('Cyberplay Torneios');");
code = code.replace(/const whatsappNumber = localStorage[^;]+;/g, "const [whatsappNumber, setWhatsappNumber] = useState('');");
code = code.replace(/const pixInstructions = localStorage[^;]+;/g, "const [pixInstructions, setPixInstructions] = useState('Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');");

code = code.replace(/function loadSponsors\(\) \{[\s\S]*?catch \(e\) \{[\s\S]*?setSponsors\(\[\]\);\s*\}\s*\}/g, "");
code = code.replace(/loadSponsors\(\);/g, "loadSettings();");

code = code.replace(/useEffect\(\(\) => \{\n    fetchData\(\);\n  \}, \[\]\);/g, `useEffect(() => {
    fetchData();
    loadSettings();

    const channel = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
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
  }`);

// Also fix the initial useEffect which had fetchData() and loadSponsors()
code = code.replace(/useEffect\(\(\) => \{\n    fetchData\(\);\n    loadSettings\(\);\n  \}, \[\]\);/, `useEffect(() => {
    fetchData();
    loadSettings();

    const channel = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
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
      setPixKey(data.pixKey || 'pix@cyberplay.com');
      setPixName(data.pixName || 'Cyberplay Torneios');
      setWhatsappNumber(data.whatsappNumber || '');
      setPixInstructions(data.pixInstructions || 'Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');
      setSponsors(data.sponsors || []);
    }
  }`);

fs.writeFileSync('src/components/PublicView.tsx', code);
