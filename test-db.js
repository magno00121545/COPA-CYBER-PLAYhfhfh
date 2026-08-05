import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "velvety-dock-ssjh2",
  appId: "1:322024526210:web:f90bf00a16e9d959c7bf9b",
  apiKey: "AIzaSyD_JNeoNJrQsBOE1C7n3oxUx_Yz2coyLQc",
  authDomain: "velvety-dock-ssjh2.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cyberplay-89ba9b18-2350-4810-8567-39648fa8542b");

async function test() {
  try {
    const newDoc = doc(collection(db, 'test_registrations'));
    await setDoc(newDoc, { nickname: 'test_player', status: 'Pendente' });
    console.log('Saved to Firestore successfully with ID:', newDoc.id);

    const snapshot = await getDocs(collection(db, 'test_registrations'));
    console.log('Read from Firestore successfully. Docs count:', snapshot.size);
  } catch(e) {
    console.error('Firestore Error:', e);
  } finally {
    process.exit(0);
  }
}
test();
