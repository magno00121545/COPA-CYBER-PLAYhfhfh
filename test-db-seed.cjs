const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "velvety-dock-ssjh2",
  appId: "1:322024526210:web:f90bf00a16e9d959c7bf9b",
  apiKey: "AIzaSyD_JNeoNJrQsBOE1C7n3oxUx_Yz2coyLQc",
  authDomain: "velvety-dock-ssjh2.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cyberplay-89ba9b18-2350-4810-8567-39648fa8542b");

async function seed() {
    await setDoc(doc(db, 'tournaments', 't1_test'), {
        name: 'Copa Free Fire',
        status: 'Inscrições abertas',
        max_spots: 100,
        current_spots: 0,
        payment_info: 'R$ 15,00 por Squad',
        game: 'Free Fire',
        created_at: new Date().toISOString()
    });
}
seed().then(() => {
    console.log("Seeded");
    process.exit(0);
}).catch(console.error);
