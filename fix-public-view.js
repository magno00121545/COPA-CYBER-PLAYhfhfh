import fs from 'fs';

let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

// Convert string replacements easily
code = code.replace("const pixKey = localStorage.getItem('cyberplay_pix_key') || 'pix@cyberplay.com';", "const [pixKey, setPixKey] = useState('pix@cyberplay.com');");
code = code.replace("const pixName = localStorage.getItem('cyberplay_pix_name') || 'Cyberplay Torneios';", "const [pixName, setPixName] = useState('Cyberplay Torneios');");
code = code.replace("const whatsappNumber = localStorage.getItem('cyberplay_whatsapp_number') || '';", "const [whatsappNumber, setWhatsappNumber] = useState('');");
code = code.replace("const pixInstructions = localStorage.getItem('cyberplay_pix_instructions') || 'Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.';", "const [pixInstructions, setPixInstructions] = useState('Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');");

const loadSponsorsOld = `  function loadSponsors() {
    try {
      const data = localStorage.getItem('cyberplay_sponsors');
      if (data) {
        setSponsors(JSON.parse(data));
      } else {
        setSponsors([]);
      }
    } catch (e) {
      setSponsors([]);
    }
  }`;
code = code.replace(loadSponsorsOld, `  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setPixKey(data.pixKey || 'pix@cyberplay.com');
      setPixName(data.pixName || 'Cyberplay Torneios');
      setWhatsappNumber(data.whatsappNumber || '');
      setPixInstructions(data.pixInstructions || 'Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');
      setSponsors(data.sponsors || []);
    }
  }`);

const oldUseEffect = `  useEffect(() => {
    fetchData();
    loadSponsors();
  }, []);`;

const newUseEffect = `  useEffect(() => {
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
  }, []);`;

code = code.replace(oldUseEffect, newUseEffect);

fs.writeFileSync('src/components/PublicView.tsx', code);
