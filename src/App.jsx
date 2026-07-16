import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, Plus, Trash2, Clock, BookOpen, AlertCircle, X, Globe, 
  Volume2, VolumeX, Lock, Edit2, Megaphone, Monitor, Code, Calculator, 
  PenTool, FlaskConical, Palette, Music, Type, Image as ImageIcon
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';

// 👇 1. นำ Config ของคุณจากเว็บ Firebase มาวางทับตรงนี้ได้เลยครับ
const firebaseConfig = {
  apiKey: "AIzaSyB1GSkmuK6THUpm4kVncItcbAH91lgwUow",
  authDomain: "examtimer-4ad05.firebaseapp.com",
  projectId: "examtimer-4ad05",
  storageBucket: "examtimer-4ad05.firebasestorage.app",
  messagingSenderId: "132132970354",
  appId: "1:132132970354:web:3bc85ce500baab8a9107eb"
};

// เช็กว่ามีการใส่ Config จริงหรือยัง
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

// ป้องกันการ Initialize ซ้ำซ้อน
let app, db;
if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
}

// แผนผังไอคอนสำหรับวิชาเรียน
const IconMap = {
  book: BookOpen,
  math: Calculator,
  code: Code,
  science: FlaskConical,
  art: Palette,
  music: Music,
  lang: Type,
  globe: Globe
};

// ข้อมูลจำลองสำหรับตอนที่ยังไม่เชื่อม Firebase
const mockExams = [
  { id: '1', code: 'TEST101', name: 'ทดสอบระบบ (ใส่ Config Firebase)', start: '09:00', end: '16:30', icon: 'book' }
];

// --- ข้อมูลพจนานุกรม 2 ภาษา ---
const t = {
  th: {
    current: "เวลาปัจจุบัน",
    inProgress: "กำลังสอบ",
    next: "วิชาถัดไป",
    remaining: "หมดเวลาในอีก",
    startsIn: "เริ่มสอบในอีก",
    status: "สถานะ",
    noActive: "ไม่มีวิชาสอบ",
    noActiveDesc: "การสอบทั้งหมดของวันนี้เสร็จสิ้นแล้ว หรือยังไม่มีตาราง",
    start: "เริ่ม:",
    end: "สิ้นสุด:",
    todaySchedule: "ตารางสอบวันนี้",
    total: "จำนวนทั้งหมด",
    subjects: "วิชา",
    noSchedule: "ไม่มีรายการวิชาสอบ",
    noScheduleDesc: "คลิกไอคอนฟันเฟืองเพื่อเพิ่มรายวิชา",
    settings: "ตั้งค่าระบบและตารางสอบ",
    generalConfig: "ตั้งค่าทั่วไป",
    bgColor: "สีพื้นหลังฝั่งซ้าย:",
    reset: "รีเซ็ต",
    addSubject: "เพิ่มวิชาใหม่",
    editSubject: "แก้ไขวิชา",
    code: "รหัสวิชา",
    name: "ชื่อวิชา",
    startTime: "เวลาเริ่ม (HH:mm)",
    endTime: "เวลาสิ้นสุด (HH:mm)",
    addBtn: "เพิ่มลงตาราง",
    updateBtn: "บันทึกการแก้ไข",
    cancelEdit: "ยกเลิกแก้ไข",
    allSubjects: "รายการวิชาทั้งหมด",
    noData: "ไม่มีข้อมูลวิชาสอบ",
    close: "ปิดหน้าต่าง",
    pinTitle: "กรุณาใส่รหัสผ่าน",
    pinDesc: "ใส่รหัส PIN 4 หลักเพื่อเข้าสู่เมนูตั้งค่า",
    pinErr: "รหัสผ่านไม่ถูกต้อง!",
    submit: "ตกลง",
    cancel: "ยกเลิก",
    enableAudio: "เปิดใช้งานเสียงแจ้งเตือน",
    audioEnabled: "เสียงแจ้งเตือน: ทำงาน",
    audioDisabled: "เสียงแจ้งเตือน: ปิด",
    voiceLang: "ภาษาของเสียงประกาศ:",
    voiceTh: "ภาษาไทย",
    voiceEn: "ภาษาอังกฤษ",
    voiceBoth: "พูดทั้ง 2 ภาษา",
    viewExam: "หน้าสอบ",
    viewClock: "หน้าเวลา",
    viewAnnounce: "หน้าประกาศ",
    announceText: "ข้อความประกาศ (หน้ากลาง):",
    announcePlaceholder: "พิมพ์ข้อความประกาศที่นี่...",
    selectIcon: "เลือกสัญลักษณ์วิชา:",
    logoUrl: "ลิงก์รูปภาพโลโก้ (URL):",
    marqueeText: "ข้อความวิ่งด้านล่าง:",
    marqueePlaceholder: "พิมพ์ข้อความวิ่ง..."
  },
  en: {
    current: "Current Time",
    inProgress: "IN PROGRESS",
    next: "UPCOMING",
    remaining: "Time Remaining",
    startsIn: "Starts In",
    status: "Status",
    noActive: "No Active Exams",
    noActiveDesc: "All exams for today are finished, or no schedule is available.",
    start: "Start:",
    end: "End:",
    todaySchedule: "Today's Schedule",
    total: "Total",
    subjects: "subjects",
    noSchedule: "No exams scheduled",
    noScheduleDesc: "Click the settings icon to add subjects.",
    settings: "Settings & Schedule",
    generalConfig: "General Settings",
    bgColor: "Left Panel Color:",
    reset: "Reset",
    addSubject: "Add New Subject",
    editSubject: "Edit Subject",
    code: "Subject Code",
    name: "Subject Name",
    startTime: "Start Time (HH:mm)",
    endTime: "End Time (HH:mm)",
    addBtn: "Add to Schedule",
    updateBtn: "Save Changes",
    cancelEdit: "Cancel",
    allSubjects: "All Subjects",
    noData: "No exam data",
    close: "Close",
    pinTitle: "Enter PIN",
    pinDesc: "Enter 4-digit PIN to access settings",
    pinErr: "Incorrect PIN!",
    submit: "Submit",
    cancel: "Cancel",
    enableAudio: "Enable Audio Alerts",
    audioEnabled: "Audio: ON",
    audioDisabled: "Audio: OFF",
    voiceLang: "Announcement Voice:",
    voiceTh: "Thai Only",
    voiceEn: "English Only",
    voiceBoth: "Both Languages",
    viewExam: "Exams",
    viewClock: "Clock",
    viewAnnounce: "Announce",
    announceText: "Center Announcement:",
    announcePlaceholder: "Type announcement here...",
    selectIcon: "Select Subject Icon:",
    logoUrl: "Logo Image URL:",
    marqueeText: "Bottom Marquee Text:",
    marqueePlaceholder: "Type scrolling text here..."
  }
};

export default function App() {
  const [exams, setExams] = useState(isFirebaseConfigured ? [] : mockExams);
  const [now, setNow] = useState(new Date());
  
  // States มุมมองหน้าจอ
  const [view, setView] = useState('exam');
  
  // States ตั้งค่าเนื้อหา
  const [announcementText, setAnnouncementText] = useState('กรุณาเตรียมตัวสอบ / Please prepare for the exam');
  const [marqueeText, setMarqueeText] = useState('ขอให้ผู้เข้าสอบทุกท่านโชคดีในการสอบ ห้ามนำเครื่องมือสื่อสารทุกชนิดเข้าห้องสอบเด็ดขาด');
  const [logoUrl, setLogoUrl] = useState('https://cdn-icons-png.flaticon.com/512/4762/4762311.png'); // Default Logo

  // States สำหรับตั้งค่าต่างๆ
  const [lang, setLang] = useState('th');
  const [leftPanelColor, setLeftPanelColor] = useState('#0f172a');
  
  // States สำหรับ PIN และ Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form State (รองรับโหมด Edit)
  const [newExam, setNewExam] = useState({ code: '', name: '', start: '', end: '', icon: 'book' });
  const [editingExamId, setEditingExamId] = useState(null);

  // States สำหรับระบบเสียง
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [voiceLang, setVoiceLang] = useState('both');
  const alertFlags = useRef({ examId: null, '45': false, '30': false, '15': false, '5': false, '0': false });

  // 1. ดึงข้อมูล Firebase (Realtime)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(examsData);
    }, (error) => {
      console.error("Firebase Error: ", error);
    });
    return () => unsubscribe();
  }, []);

  // 2. นาฬิกาหลักของระบบ
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. นำเข้า Font Sarabun และตั้งค่า Animation สำหรับตัวหนังสือวิ่ง
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
      .font-sarabun { font-family: 'Sarabun', sans-serif; }
      @keyframes marquee {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      .animate-marquee {
        display: inline-block;
        white-space: nowrap;
        animation: marquee 25s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const parseTime = (timeStr) => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':');
    const d = new Date(now);
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return d;
  };

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  }, [exams, now]);

  const { currentExam, nextExam, status } = useMemo(() => {
    let current = null;
    let next = null;
    for (let exam of sortedExams) {
      if (now >= parseTime(exam.start) && now <= parseTime(exam.end)) {
        current = exam; break;
      }
    }
    if (!current) {
      next = sortedExams.find(exam => now < parseTime(exam.start));
    }
    return { currentExam: current, nextExam: next, status: current ? 'ACTIVE' : (next ? 'WAITING' : 'FINISHED') };
  }, [sortedExams, now]);

  // 4. ระบบเสียงแจ้งเตือนที่เสถียรขึ้น
  useEffect(() => {
    if (!audioEnabled || status !== 'ACTIVE' || !currentExam) return;

    const endTime = parseTime(currentExam.end);
    const diffSeconds = Math.floor((endTime - now) / 1000);
    const currentId = currentExam.id;

    if (alertFlags.current.examId !== currentId) {
      alertFlags.current = { examId: currentId, '45': false, '30': false, '15': false, '5': false, '0': false };
    }

    const checkAndPlayAlert = (minutes) => {
      const targetSeconds = minutes * 60;
      if (diffSeconds === targetSeconds && !alertFlags.current[minutes.toString()]) {
        alertFlags.current[minutes.toString()] = true; 
        playAnnouncement(minutes);
      }
    };

    checkAndPlayAlert(45);
    checkAndPlayAlert(30);
    checkAndPlayAlert(15);
    checkAndPlayAlert(5);
    checkAndPlayAlert(0);
  }, [now, currentExam, status, audioEnabled, voiceLang]);

  const playAnnouncement = (minutes) => {
    const bell = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    bell.volume = 0.5;
    bell.play().catch(e => console.log('Audio blocked', e));

    setTimeout(() => {
      // ยกเลิกเสียงที่อาจจะค้างอยู่ก่อนหน้า
      window.speechSynthesis.cancel();
      
      if (voiceLang === 'th' || voiceLang === 'both') {
        const msgTh = minutes === 0 ? "หมดเวลาทำข้อสอบแล้วครับ" : `เหลือเวลาทำข้อสอบอีก ${minutes} นาที`;
        const utterTh = new SpeechSynthesisUtterance(msgTh);
        utterTh.lang = 'th-TH';
        utterTh.rate = 0.9;
        window.speechSynthesis.speak(utterTh);
      }
      
      if (voiceLang === 'en' || voiceLang === 'both') {
        const msgEn = minutes === 0 ? "Time is up. Please stop writing." : `${minutes} minutes remaining`;
        const utterEn = new SpeechSynthesisUtterance(msgEn);
        utterEn.lang = 'en-US';
        utterEn.rate = 0.9;
        window.speechSynthesis.speak(utterEn);
      }
    }, 1500);
  };

  const enableAudioManually = () => {
    setAudioEnabled(true);
    // ปลดล็อกการเล่นเสียงเบราว์เซอร์
    new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq').play().catch(()=>{});
    // ปลดล็อกระบบ TTS
    const silentUtterance = new SpeechSynthesisUtterance('');
    silentUtterance.volume = 0;
    window.speechSynthesis.speak(silentUtterance);
  };

  const timeDisplay = useMemo(() => {
    if (status === 'ACTIVE' && currentExam) {
      const diff = parseTime(currentExam.end) - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return {
        title: t[lang].remaining,
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isUrgent: diff < 15 * 60 * 1000
      };
    } else if (status === 'WAITING' && nextExam) {
      const diff = parseTime(nextExam.start) - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return {
        title: t[lang].startsIn,
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isUrgent: false
      };
    }
    return { title: t[lang].status, time: '--:--:--', isUrgent: false };
  }, [status, currentExam, nextExam, now, lang]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '5555') {
      setIsAuthenticated(true);
      setShowPinModal(false);
      setIsSettingsOpen(true);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    if (newExam.code && newExam.name && newExam.start && newExam.end) {
      if (editingExamId) {
        if (isFirebaseConfigured) await updateDoc(doc(db, 'exams', editingExamId), newExam);
        else setExams(prev => prev.map(ex => ex.id === editingExamId ? { ...newExam, id: editingExamId } : ex));
        setEditingExamId(null);
      } else {
        if (isFirebaseConfigured) await addDoc(collection(db, 'exams'), newExam);
        else setExams(prev => [...prev, { ...newExam, id: Date.now().toString() }]);
      }
      setNewExam({ code: '', name: '', start: '', end: '', icon: 'book' });
    }
  };

  const handleEditClick = (exam) => {
    setNewExam(exam);
    setEditingExamId(exam.id);
  };

  const handleDeleteExam = async (id) => {
    if (isFirebaseConfigured) await deleteDoc(doc(db, 'exams', id));
    else setExams(prev => prev.filter(exam => exam.id !== id));
    
    if (editingExamId === id) {
      setEditingExamId(null);
      setNewExam({ code: '', name: '', start: '', end: '', icon: 'book' });
    }
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const focusExam = currentExam || nextExam;
  const FocusIcon = focusExam && IconMap[focusExam.icon] ? IconMap[focusExam.icon] : BookOpen;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sarabun overflow-hidden relative">
      
      {/* 🟢 กลุ่มปุ่มเมนูหลัก (พื้นดำให้เห็นชัดเจน) */}
      <div className="absolute top-6 right-6 z-40 flex items-center space-x-3">
        <div className="bg-slate-900 rounded-full shadow-lg p-1.5 flex items-center space-x-1 border border-slate-700">
          <button 
            onClick={() => setView('exam')}
            className={`p-2.5 rounded-full transition-all ${view === 'exam' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title={t[lang].viewExam}
          >
            <Monitor size={20} />
          </button>
          <button 
            onClick={() => setView('clock')}
            className={`p-2.5 rounded-full transition-all ${view === 'clock' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title={t[lang].viewClock}
          >
            <Clock size={20} />
          </button>
          <button 
            onClick={() => setView('announcement')}
            className={`p-2.5 rounded-full transition-all ${view === 'announcement' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title={t[lang].viewAnnounce}
          >
            <Megaphone size={20} />
          </button>
        </div>

        <button 
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg transition-all text-white border border-slate-700"
          title="Change Language"
        >
          <Globe size={22} />
        </button>

        <button 
          onClick={() => {
            if (isAuthenticated) setIsSettingsOpen(true);
            else setShowPinModal(true);
          }}
          className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full shadow-lg transition-all text-white border border-slate-700"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* ----------------- VIEW: EXAM (หน้าจอแบ่งฝั่งหลัก) ----------------- */}
      {view === 'exam' && (
        <div className="flex flex-col md:flex-row h-full w-full pb-10"> {/* เผื่อที่ให้ Marquee */}
          {/* ฝั่งซ้าย */}
          <div 
            className="w-full md:w-7/12 text-white flex flex-col justify-center relative p-8 md:p-16 transition-colors duration-300"
            style={{ backgroundColor: leftPanelColor }}
          >
            {/* 🔴 เพิ่ม Logo มุมซ้ายบน */}
            <div className="absolute top-8 left-8 flex items-center space-x-4">
              {logoUrl && (
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-2 flex items-center justify-center border border-white/20 shadow-lg">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
              <div className="flex flex-col text-slate-300 font-light">
                <span className="text-sm opacity-80">{t[lang].current}</span>
                <span className="text-xl md:text-3xl font-medium tracking-wider flex items-center">
                  <Clock size={20} className="mr-2 opacity-70"/> {formatCurrentTime(now)}
                </span>
              </div>
            </div>

            {focusExam ? (
              <div className="flex flex-col space-y-8 max-w-4xl mx-auto w-full animate-fade-in mt-16 md:mt-20">
                <div>
                  <span className={`inline-block px-5 py-2 rounded-full text-lg font-bold mb-6 tracking-wide uppercase ${status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    {status === 'ACTIVE' ? t[lang].inProgress : t[lang].next}
                  </span>
                  <div className="flex items-center space-x-6 mb-4">
                    <FocusIcon size={64} className="text-white opacity-80" />
                    <h2 className="text-6xl md:text-8xl font-black text-white tracking-tight drop-shadow-lg">
                      {focusExam.code}
                    </h2>
                  </div>
                  <h1 className="text-3xl md:text-5xl text-slate-200 font-semibold leading-relaxed">
                    {focusExam.name}
                  </h1>
                </div>

                <div className="pt-10 md:pt-12 border-t border-slate-700/50">
                  <p className="text-2xl md:text-3xl text-slate-400 mb-6 font-medium">{timeDisplay.title}</p>
                  <div className={`text-8xl md:text-[12rem] font-black tracking-tighter leading-none drop-shadow-2xl ${timeDisplay.isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeDisplay.time}
                  </div>
                  <div className="flex space-x-12 mt-10 text-slate-400 text-2xl font-light">
                    <p>{t[lang].start} <span className="text-white font-semibold ml-2">{focusExam.start}</span></p>
                    <p>{t[lang].end} <span className="text-white font-semibold ml-2">{focusExam.end}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center opacity-60 mt-16">
                <BookOpen size={100} className="mb-8 text-slate-400" />
                <h2 className="text-5xl font-bold mb-6">{t[lang].noActive}</h2>
                <p className="text-2xl">{t[lang].noActiveDesc}</p>
              </div>
            )}
          </div>

          {/* ฝั่งขวา */}
          <div className="w-full md:w-5/12 bg-slate-50 flex flex-col h-full overflow-y-auto shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] z-10">
            <div className="p-8 md:p-12 pb-6 sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 border-b border-slate-200 shadow-sm">
              <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">{t[lang].todaySchedule}</h2>
              <p className="text-slate-500 mt-3 text-lg">{t[lang].total} <span className="font-bold text-slate-700">{sortedExams.length}</span> {t[lang].subjects}</p>
            </div>

            <div className="p-8 md:p-12 pt-6 flex-1 flex flex-col space-y-5">
              {sortedExams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                  <AlertCircle size={64} className="mb-6 opacity-50" />
                  <p className="text-xl mb-2 font-semibold">{t[lang].noSchedule}</p>
                  <p>{t[lang].noScheduleDesc}</p>
                </div>
              ) : (
                sortedExams.map((exam) => {
                  const examStart = parseTime(exam.start);
                  const examEnd = parseTime(exam.end);
                  let cardStatus = 'WAITING'; 
                  
                  if (now > examEnd) cardStatus = 'FINISHED';
                  else if (now >= examStart && now <= examEnd) cardStatus = 'ACTIVE';

                  const CardIcon = IconMap[exam.icon] || BookOpen;

                  return (
                    <div 
                      key={exam.id} 
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        cardStatus === 'ACTIVE' 
                          ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-100 transform scale-[1.02]' 
                          : cardStatus === 'FINISHED'
                            ? 'border-slate-200 bg-slate-100 opacity-60 grayscale'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      {cardStatus === 'ACTIVE' && (
                        <div className="absolute -top-3 -right-3">
                          <span className="flex h-6 w-6 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500 border-2 border-white"></span>
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-xl ${cardStatus === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            <CardIcon size={24} />
                          </div>
                          <div>
                            <h3 className={`text-2xl font-bold ${cardStatus === 'FINISHED' ? 'text-slate-500' : 'text-slate-900'}`}>
                              {exam.code}
                            </h3>
                            <p className={`mt-1 text-lg font-medium ${cardStatus === 'FINISHED' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {exam.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center space-x-2 text-base font-bold px-4 py-2 rounded-xl w-max mt-2 ${
                        cardStatus === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-md' : 
                        cardStatus === 'FINISHED' ? 'bg-slate-200 text-slate-500' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Clock size={18} />
                        <span>{exam.start} - {exam.end}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW: CLOCK ----------------- */}
      {view === 'clock' && (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white p-8 pb-14">
           {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-8 opacity-80" onError={(e) => e.target.style.display = 'none'} />
           )}
           <h2 className="text-4xl md:text-5xl font-light text-slate-400 mb-8 tracking-widest uppercase">{t[lang].current}</h2>
           <div className="text-[12rem] md:text-[18rem] font-black tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
             {formatCurrentTime(now)}
           </div>
        </div>
      )}

      {/* ----------------- VIEW: ANNOUNCEMENT ----------------- */}
      {view === 'announcement' && (
        <div className="flex flex-col items-center justify-center h-full w-full bg-indigo-900 text-white p-12 relative overflow-hidden pb-14">
           {logoUrl && (
              <img src={logoUrl} alt="Logo" className="absolute top-12 left-12 w-24 h-24 object-contain opacity-50" onError={(e) => e.target.style.display = 'none'} />
           )}
           <Megaphone size={300} className="absolute -bottom-20 -left-20 text-indigo-800 opacity-30 rotate-[-15deg]" />
           <div className="z-10 max-w-5xl text-center space-y-12">
             <div className="inline-flex items-center space-x-4 bg-indigo-800/50 px-8 py-3 rounded-full border border-indigo-500/30">
               <AlertCircle size={28} className="text-yellow-400" />
               <span className="text-2xl font-semibold tracking-widest uppercase text-indigo-200">Announcement</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-bold leading-tight break-words drop-shadow-xl whitespace-pre-line">
               {announcementText}
             </h1>
           </div>
        </div>
      )}

      {/* ----------------- MARQUEE (ข้อความวิ่งด้านล่าง) ----------------- */}
      {marqueeText && (
        <div className="absolute bottom-0 left-0 w-full h-10 bg-slate-900 text-yellow-300 font-bold text-xl flex items-center overflow-hidden border-t-2 border-indigo-500/50 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-30">
          <div className="w-full whitespace-nowrap box-border">
            <p className="animate-marquee">{marqueeText}</p>
          </div>
        </div>
      )}

      {/* --- Modal ป้อนรหัส PIN (5555) --- */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-8 text-center animate-in zoom-in duration-200">
            <div className="mx-auto bg-slate-100 p-4 rounded-full mb-4">
              <Lock size={32} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t[lang].pinTitle}</h2>
            <p className="text-slate-500 mb-6">{t[lang].pinDesc}</p>
            
            <form onSubmit={handlePinSubmit}>
              <input 
                type="password" maxLength="4" autoFocus
                className={`w-full text-center text-3xl tracking-widest font-bold px-4 py-4 border-2 rounded-xl outline-none transition-all ${pinError ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                placeholder="****"
                value={pinInput} onChange={e => setPinInput(e.target.value)}
              />
              {pinError && <p className="text-red-500 mt-2 font-medium animate-pulse">{t[lang].pinErr}</p>}
              
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => { setShowPinModal(false); setPinError(false); setPinInput(''); }} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  {t[lang].cancel}
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                  {t[lang].submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal การตั้งค่า --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Settings className="mr-3 text-indigo-600" /> {t[lang].settings}
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 space-y-6">
              
              {/* ตั้งค่าทั่วไป (General Settings) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5 text-lg border-b pb-2">{t[lang].generalConfig}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* การแสดงผล (Logo & สี) */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t[lang].bgColor}</label>
                      <div className="flex items-center space-x-3">
                        <input type="color" value={leftPanelColor} onChange={(e) => setLeftPanelColor(e.target.value)} className="h-10 w-full p-1 bg-white border border-slate-300 rounded cursor-pointer" />
                        <button onClick={() => setLeftPanelColor('#0f172a')} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors">{t[lang].reset}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><ImageIcon size={16} className="mr-2"/> {t[lang].logoUrl}</label>
                      <input 
                        type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} 
                        placeholder="https://..."
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* เสียงประกาศ */}
                  <div className="space-y-4">
                    <button 
                      onClick={() => audioEnabled ? setAudioEnabled(false) : enableAudioManually()}
                      className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-colors border-2 ${audioEnabled ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                    >
                      {audioEnabled ? <Volume2 size={20} className="mr-2"/> : <VolumeX size={20} className="mr-2"/>}
                      {audioEnabled ? t[lang].audioEnabled : t[lang].enableAudio}
                    </button>
                    {audioEnabled && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                         <label className="block text-xs font-bold text-slate-500 mb-1">{t[lang].voiceLang}</label>
                         <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium text-slate-700 bg-white">
                           <option value="th">{t[lang].voiceTh}</option>
                           <option value="en">{t[lang].voiceEn}</option>
                           <option value="both">{t[lang].voiceBoth}</option>
                         </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ข้อความประกาศ (หน้ากลาง) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><Megaphone size={16} className="mr-2"/>{t[lang].announceText}</label>
                    <textarea 
                      value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} 
                      placeholder={t[lang].announcePlaceholder} rows="2"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                  {/* ข้อความวิ่ง (ด้านล่าง) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t[lang].marqueeText}</label>
                    <textarea 
                      value={marqueeText} onChange={(e) => setMarqueeText(e.target.value)} 
                      placeholder={t[lang].marqueePlaceholder} rows="2"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form เพิ่ม/แก้ไขวิชา */}
              <div className={`p-6 rounded-2xl border-2 shadow-sm transition-all ${editingExamId ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-slate-800 mb-5 flex items-center text-lg border-b pb-2 border-slate-200/50">
                  {editingExamId ? <Edit2 size={20} className="mr-2 text-indigo-600" /> : <Plus size={20} className="mr-2 text-indigo-600" />} 
                  {editingExamId ? t[lang].editSubject : t[lang].addSubject}
                </h3>
                
                <form onSubmit={handleExamSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">{t[lang].code}</label>
                      <input type="text" required className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium" value={newExam.code} onChange={e => setNewExam({...newExam, code: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">{t[lang].name}</label>
                      <input type="text" required className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">{t[lang].startTime}</label>
                      <input type="time" required className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium" value={newExam.start} onChange={e => setNewExam({...newExam, start: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">{t[lang].endTime}</label>
                      <input type="time" required className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium" value={newExam.end} onChange={e => setNewExam({...newExam, end: e.target.value})} />
                    </div>
                  </div>

                  {/* เลือกไอคอน */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t[lang].selectIcon}</label>
                    <div className="flex flex-wrap gap-3">
                      {Object.keys(IconMap).map(iconKey => {
                        const IconComp = IconMap[iconKey];
                        return (
                          <button 
                            key={iconKey} type="button"
                            onClick={() => setNewExam({...newExam, icon: iconKey})}
                            className={`p-3 rounded-xl border-2 transition-all ${newExam.icon === iconKey ? 'bg-indigo-100 border-indigo-500 text-indigo-700 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'}`}
                          >
                            <IconComp size={24} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    {editingExamId && (
                      <button type="button" onClick={() => { setEditingExamId(null); setNewExam({ code: '', name: '', start: '', end: '', icon: 'book' }); }} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-lg">
                        {t[lang].cancelEdit}
                      </button>
                    )}
                    <button type="submit" className={`flex-1 ${editingExamId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors text-lg`}>
                      {editingExamId ? t[lang].updateBtn : t[lang].addBtn}
                    </button>
                  </div>
                </form>
              </div>

              {/* รายการวิชาที่มี */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">{t[lang].allSubjects} ({exams.length})</h3>
                <div className="space-y-3">
                  {sortedExams.map(exam => {
                    const ExamIcon = IconMap[exam.icon] || BookOpen;
                    return (
                      <div key={exam.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500 group-hover:text-indigo-500"><ExamIcon size={20}/></div>
                          <div>
                            <div className="font-bold text-slate-800 text-lg">{exam.code}</div>
                            <div className="font-medium text-slate-500 text-sm">{exam.start} - {exam.end}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditClick(exam)} className="p-2.5 bg-white text-indigo-500 hover:bg-indigo-500 hover:text-white border border-slate-200 hover:border-indigo-500 rounded-xl transition-all shadow-sm" title="Edit">
                            <Edit2 size={20} />
                          </button>
                          <button onClick={() => handleDeleteExam(exam.id)} className="p-2.5 bg-white text-red-500 hover:bg-red-500 hover:text-white border border-slate-200 hover:border-red-500 rounded-xl transition-all shadow-sm" title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {exams.length === 0 && <div className="text-center text-slate-500 font-medium py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">{t[lang].noData}</div>}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-white text-right rounded-b-3xl">
              <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors shadow-lg">{t[lang].close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}