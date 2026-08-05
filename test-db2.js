import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "velvety-dock-ssjh2",
  appId: "1:322024526210:web:f90bf00a16e9d959c7bf9b",
  apiKey: "AIzaSyD_JNeoNJrQsBOE1C7n3oxUx_Yz2coyLQc",
  authDomain: "velvety-dock-ssjh2.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cyberplay-89ba9b18-2350-4810-8567-39648fa8542b");

async function initSettings() {
    await setDoc(doc(db, 'settings', 'global'), {
        pixKey: '',
        pixName: '',
        whatsappNumber: '',
        pixInstructions: 'Após fazer o PIX, envie seu comprovante pelo WhatsApp e informe seu Nickname.',
        sponsors: []
    });
}
initSettings().then(() => {
    console.log("Done");
    process.exit(0);
});
