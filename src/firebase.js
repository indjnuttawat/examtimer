import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 👇 เอา Config จากเว็บ Firebase มาวางทับตรงนี้ได้เลยครับ
const firebaseConfig = {
  apiKey: "AIzaSyB1GSkmuK6THUpm4kVncItcbAH91lgwUow",
  authDomain: "examtimer-4ad05.firebaseapp.com",
  projectId: "examtimer-4ad05",
  storageBucket: "examtimer-4ad05.firebasestorage.app",
  messagingSenderId: "132132970354",
  appId: "1:132132970354:web:3bc85ce500baab8a9107eb"
};

// สั่งเปิดใช้งาน Firebase และส่งออกฐานข้อมูลไปให้ไฟล์อื่นใช้
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);