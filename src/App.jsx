import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Plus, Trash2, Clock, BookOpen, AlertCircle, X } from 'lucide-react';
// นำเข้าเครื่องมือจาก Firebase ที่เราเพิ่งสร้าง
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; 

export default function App() {
  const [exams, setExams] = useState([]); // เริ่มต้นด้วยตารางว่างๆ เพื่อรอโหลดจาก Firebase
  const [now, setNow] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leftPanelColor, setLeftPanelColor] = useState('#0f172a');
  const [newExam, setNewExam] = useState({ code: '', name: '', start: '', end: '' });

  // อัปเดตเวลาปัจจุบันทุกๆ 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔴 ส่วนที่เพิ่มใหม่: ดึงข้อมูลจาก Firebase แบบ Real-time
  useEffect(() => {
    // onSnapshot คือการดักฟัง ถ้ากระดานดำ (Firebase) มีการเปลี่ยนแปลง ให้โหลดใหม่ทันที
    const unsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsData);
    });
    // ปิดการดักฟังเมื่อปิดหน้าเว็บ
    return () => unsubscribe();
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
      const startTime = parseTime(exam.start);
      const endTime = parseTime(exam.end);
      if (now >= startTime && now <= endTime) {
        current = exam; break;
      }
    }
    if (!current) {
      next = sortedExams.find(exam => now < parseTime(exam.start));
    }
    return { 
      currentExam: current, nextExam: next, status: current ? 'ACTIVE' : (next ? 'WAITING' : 'FINISHED') 
    };
  }, [sortedExams, now]);

  const timeDisplay = useMemo(() => {
    if (status === 'ACTIVE' && currentExam) {
      const diff = parseTime(currentExam.end) - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return {
        title: 'Time Remaining',
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isUrgent: diff < 15 * 60 * 1000
      };
    } else if (status === 'WAITING' && nextExam) {
      const diff = parseTime(nextExam.start) - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return {
        title: 'Starts In',
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isUrgent: false
      };
    }
    return { title: 'Status', time: '--:--:--', isUrgent: false };
  }, [status, currentExam, nextExam, now]);

  // 🔴 ส่วนที่เปลี่ยนใหม่: บันทึกวิชาลง Firebase แทนการจำไว้ในเครื่อง
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (newExam.code && newExam.name && newExam.start && newExam.end) {
      await addDoc(collection(db, 'exams'), newExam);
      setNewExam({ code: '', name: '', start: '', end: '' });
    }
  };

  // 🔴 ส่วนที่เปลี่ยนใหม่: สั่งลบวิชาจาก Firebase โดยตรง
  const handleDeleteExam = async (id) => {
    await deleteDoc(doc(db, 'exams', id));
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const focusExam = currentExam || nextExam;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Settings Button */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-6 right-6 z-20 p-3 bg-white/20 hover:bg-slate-200/50 backdrop-blur-md rounded-full shadow-lg transition-all text-slate-800 md:text-white md:bg-white/10"
      >
        <Settings size={28} />
      </button>

      {/* Left Panel */}
      <div 
        className="w-full md:w-7/12 text-white flex flex-col justify-center relative p-8 md:p-16 transition-colors duration-300"
        style={{ backgroundColor: leftPanelColor }}
      >
        <div className="absolute top-8 left-8 flex items-center text-slate-300 space-x-2 text-xl md:text-2xl font-light">
          <Clock size={24} />
          <span>Current Time: {formatCurrentTime(now)}</span>
        </div>

        {focusExam ? (
          <div className="flex flex-col space-y-6 md:space-y-8 max-w-2xl mx-auto w-full animate-fade-in">
            <div>
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm md:text-base font-semibold mb-6 ${status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {status === 'ACTIVE' ? 'IN PROGRESS' : 'UPCOMING'}
              </span>
              <h2 className="text-4xl md:text-6xl font-bold text-slate-100 mb-2 leading-tight">
                {focusExam.code}
              </h2>
              <h1 className="text-2xl md:text-4xl text-slate-300 font-medium leading-relaxed">
                {focusExam.name}
              </h1>
            </div>

            <div className="pt-8 md:pt-12 border-t border-slate-700/50">
              <p className="text-lg md:text-2xl text-slate-400 mb-4">{timeDisplay.title}</p>
              <div className={`text-7xl md:text-[9rem] font-black tracking-tight leading-none ${timeDisplay.isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timeDisplay.time}
              </div>
              <div className="flex space-x-8 mt-6 text-slate-400 text-lg md:text-xl font-light">
                <p>Start: <span className="text-white font-medium">{focusExam.start}</span></p>
                <p>End: <span className="text-white font-medium">{focusExam.end}</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-60">
            <BookOpen size={80} className="mb-6 text-slate-400" />
            <h2 className="text-4xl font-bold mb-4">No Active Exams</h2>
            <p className="text-xl">All exams for today are finished, or no schedule is available.</p>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-5/12 bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-8 md:p-12 pb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 border-b border-slate-100">
          <h2 className="text-3xl font-bold text-slate-800">Today's Schedule</h2>
          <p className="text-slate-500 mt-2">Total {sortedExams.length} subjects</p>
        </div>

        <div className="p-8 md:p-12 pt-4 flex-1 flex flex-col space-y-4">
          {sortedExams.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
              <AlertCircle size={48} className="mb-4" />
              <p>No exams scheduled.<br/>Click the settings icon to add subjects.</p>
            </div>
          ) : (
            sortedExams.map((exam) => {
              const examStart = parseTime(exam.start);
              const examEnd = parseTime(exam.end);
              let cardStatus = 'WAITING'; 
              
              if (now > examEnd) cardStatus = 'FINISHED';
              else if (now >= examStart && now <= examEnd) cardStatus = 'ACTIVE';

              return (
                <div 
                  key={exam.id} 
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    cardStatus === 'ACTIVE' 
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' 
                      : cardStatus === 'FINISHED'
                        ? 'border-slate-100 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  {cardStatus === 'ACTIVE' && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${cardStatus === 'FINISHED' ? 'text-slate-500' : 'text-slate-800'}`}>
                        {exam.code}
                      </h3>
                      <p className={`mt-1 font-medium ${cardStatus === 'FINISHED' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {exam.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-sm font-semibold px-3 py-1.5 rounded-lg w-max ${
                    cardStatus === 'ACTIVE' ? 'bg-indigo-100 text-indigo-700' : 
                    cardStatus === 'FINISHED' ? 'bg-slate-200 text-slate-500' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <Clock size={16} />
                    <span>{exam.start} - {exam.end}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">Manage Schedule & Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Appearance Setting */}
              <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center">Appearance</h3>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-slate-600">Left Panel Background Color:</label>
                  <input type="color" value={leftPanelColor} onChange={(e) => setLeftPanelColor(e.target.value)} className="h-10 w-16 p-0.5 bg-white border border-slate-200 rounded cursor-pointer" />
                  <button onClick={() => setLeftPanelColor('#0f172a')} className="text-sm text-indigo-600 hover:text-indigo-800 underline transition-colors">Reset to Default</button>
                </div>
              </div>

              {/* Add Exam Form */}
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                  <Plus size={18} className="mr-2" /> Add New Subject
                </h3>
                <form onSubmit={handleAddExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Subject Code</label>
                    <input type="text" required placeholder="e.g. CS101" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExam.code} onChange={e => setNewExam({...newExam, code: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Subject Name</label>
                    <input type="text" required placeholder="e.g. Intro to Programming" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Start Time (HH:mm)</label>
                    <input type="time" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExam.start} onChange={e => setNewExam({...newExam, start: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">End Time (HH:mm)</label>
                    <input type="time" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExam.end} onChange={e => setNewExam({...newExam, end: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">Add to Schedule</button>
                  </div>
                </form>
              </div>

              {/* Exam List */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-4">All Subjects ({exams.length})</h3>
                <div className="space-y-3">
                  {sortedExams.map(exam => (
                    <div key={exam.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                      <div>
                        <div className="font-bold text-slate-800">{exam.code}</div>
                        <div className="text-sm text-slate-500">{exam.start} - {exam.end}</div>
                      </div>
                      <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove Subject">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {exams.length === 0 && <div className="text-center text-slate-400 py-4 text-sm">No exam data</div>}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}