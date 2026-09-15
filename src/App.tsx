import React, { useState, useEffect, useRef } from 'react';
import { 
  Church, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles
} from 'lucide-react';
import type { SystemConfig, ClassGroup, Student, AttendanceRecord, AdminUser } from './types';
import { Header } from './components/Header';
import { TodayDashboard } from './components/TodayDashboard';
import { MonthlyReportView } from './components/MonthlyReportView';
import { AnnualReportView } from './components/AnnualReportView';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { getLocalData, saveLocalData, resetLocalData } from './utils/localStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'monthly' | 'annual' | 'settings'>('today');
  const [loading, setLoading] = useState(true);
  const [newCheckinAlert, setNewCheckinAlert] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bethel_admin_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // App Data (Initialized for Bethel Church)
  const [config, setConfig] = useState<SystemConfig>({
    churchName: '伯特利教会',
    schoolTitle: '主日学与团契',
    allowedDayOfWeek: 0,
    checkinStartTime: '08:30',
    checkinEndTime: '12:30',
    testMode: true,
    currentYear: 2026,
    currentSemester: '2026年秋季学期',
    weeklyMemoryVerse: '雅各就给那地方起名叫伯特利。他说：这地方何等可畏！这不是别的，乃是神的殿，也是天的门。',
    memoryVerseReference: '创世记 28:17,19',
    qrSecretToken: 'BETHEL_SUNDAY_2026_TOKEN',

    enableMemoryVerseOption: true,
    defaultMemoryVerseChecked: true,
    enableOfferingOption: false,
    defaultOfferingChecked: false,
    enableLateRule: true,
    lateThresholdTime: '09:30',
    enableExcusedNote: true,
    enableCheckinPopup: true,
    adminPassword: 'bethel2026',
  });

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeSunday, setActiveSunday] = useState<string>('2026-09-13');

  const previousRecordsCountRef = useRef<number>(0);

  // Fetch state from server or local storage fallback
  const loadState = async (isInitial = false) => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setClasses(data.classes);
        setStudents(data.students);
        setActiveSunday(data.activeSunday);

        // Keep local cache synced as fallback
        saveLocalData({
          classes: data.classes,
          students: data.students,
          config: data.config,
          records: data.records,
          activeSunday: data.activeSunday
        });

        // Detect new real-time check-in
        if (!isInitial && data.records.length > previousRecordsCountRef.current) {
          const newest = data.records[data.records.length - 1];
          if (newest && newest.date === data.activeSunday && data.config.enableCheckinPopup !== false) {
            setNewCheckinAlert(`🎉 实时签到：【${newest.studentName}】刚刚完成了主日签到！`);
            setTimeout(() => setNewCheckinAlert(null), 4000);
          }
        }
        previousRecordsCountRef.current = data.records.length;
        setRecords(data.records);
        if (isInitial) setLoading(false);
        return;
      }
    } catch (err) {
      // Offline / GitHub Pages static mode
    }

    // Fallback to local storage
    const local = getLocalData();
    setConfig(local.config);
    setClasses(local.classes);
    setStudents(local.students);
    setActiveSunday(local.activeSunday);
    setRecords(local.records);
    previousRecordsCountRef.current = local.records.length;

    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    loadState(true);

    // Poll every 3 seconds for real-time mobile check-in updates
    const interval = setInterval(() => {
      loadState(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Login & Logout Handlers
  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bethel_admin_user', JSON.stringify(user));
    }
    setNewCheckinAlert(`🔐 登录成功：欢迎 ${user.displayName} 进入伯特利后台！`);
    setTimeout(() => setNewCheckinAlert(null), 3500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bethel_admin_user');
    }
    if (activeTab === 'settings') {
      setActiveTab('today');
    }
    setNewCheckinAlert('已退出后台管理模式');
    setTimeout(() => setNewCheckinAlert(null), 3000);
  };

  // Handle successful check-in
  const handleCheckinSuccess = (newRecord: AttendanceRecord, student: Student) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setRecords(prev => {
      const existing = prev.findIndex(r => r.id === newRecord.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });
    if (config.enableCheckinPopup !== false) {
      setNewCheckinAlert(`🎉 签到成功：【${student.name}】主日蒙福！`);
      setTimeout(() => setNewCheckinAlert(null), 4000);
    }
  };

  // Handle manual update from teacher
  const handleManualUpdate = async (data: {
    studentId: string;
    date: string;
    status: 'present' | 'late' | 'excused' | 'absent';
    memoryVerseCompleted?: boolean;
    offeringCompleted?: boolean;
    notes?: string;
  }) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      throw new Error('请先登录教师或管理员账号后再进行签到打卡操作');
    }
    try {
      const res = await fetch('/api/manual-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }

    // Local fallback update
    setRecords(prev => {
      const student = students.find(s => s.id === data.studentId);
      const studentName = student ? student.name : '';
      const studentClassId = student ? student.classId : '';
      const existingIdx = prev.findIndex(r => r.studentId === data.studentId && r.date === data.date);
      
      const nowStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      const newRecord: AttendanceRecord = {
        id: existingIdx !== -1 ? prev[existingIdx].id : `rec-${data.date}-${data.studentId}`,
        studentId: data.studentId,
        studentName,
        classId: studentClassId,
        date: data.date,
        timestamp: new Date().toISOString(),
        timeStr: nowStr.substring(0, 5),
        status: data.status,
        method: 'manual_teacher',
        memoryVerseCompleted: !!data.memoryVerseCompleted,
        offeringCompleted: data.offeringCompleted,
        notes: data.notes
      };

      const updated = existingIdx !== -1 
        ? prev.map((r, i) => i === existingIdx ? newRecord : r)
        : [...prev, newRecord];
      
      saveLocalData({ records: updated });
      return updated;
    });
  };

  // Auth headers helper
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }
    if (currentUser?.role) {
      headers['X-User-Role'] = currentUser.role;
    }
    if (currentUser?.username) {
      headers['X-Username'] = currentUser.username;
    }
    return headers;
  };

  // Handle save config & toggles
  const handleSaveConfig = async (updated: Partial<SystemConfig>) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，无权更改系统设置！');
    }
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        saveLocalData({ config: data.config });
        return;
      }
    } catch {
      // Offline / Static
    }
    setConfig(prev => {
      const merged = { ...prev, ...updated };
      saveLocalData({ config: merged });
      return merged;
    });
  };

  // Quick toggle test mode
  const handleQuickToggleTestMode = async () => {
    if (currentUser?.role !== 'superadmin') {
      setNewCheckinAlert('权限受限：仅总管理员可切换测试模式');
      setTimeout(() => setNewCheckinAlert(null), 3000);
      return;
    }
    await handleSaveConfig({ testMode: !config.testMode });
  };

  // Handle save class
  const handleSaveClass = async (classData: Partial<ClassGroup>) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加或修改班级的权限！');
    }
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }
    setClasses(prev => {
      let updated: ClassGroup[];
      if (classData.id) {
        updated = prev.map(c => c.id === classData.id ? { ...c, ...classData } as ClassGroup : c);
      } else {
        const newClass: ClassGroup = {
          id: `class-${Date.now()}`,
          name: classData.name || '新班级',
          ageRange: classData.ageRange || '3-12岁',
          teacher: classData.teacher || '主日学老师',
          classroom: classData.classroom || '主堂教室',
          color: classData.color || 'bg-amber-500',
          groupType: classData.groupType || 'sunday_school',
          targetCapacity: classData.targetCapacity || 20,
          description: classData.description || ''
        };
        updated = [...prev, newClass];
      }
      saveLocalData({ classes: updated });
      return updated;
    });
  };

  // Handle delete class
  const handleDeleteClass = async (classId: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有删除班级的权限！');
    }
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }
    setClasses(prev => {
      const updated = prev.filter(c => c.id !== classId);
      saveLocalData({ classes: updated });
      return updated;
    });
  };

  // Handle add or update student
  const handleAddStudent = async (studentData: any) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加或编辑学员的权限！');
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }
    setStudents(prev => {
      let updated: Student[];
      if (studentData.id) {
        updated = prev.map(s => s.id === studentData.id ? { ...s, ...studentData } : s);
      } else {
        const newStudent: Student = {
          ...studentData,
          id: `s-${Date.now()}`
        };
        updated = [...prev, newStudent];
      }
      saveLocalData({ students: updated });
      return updated;
    });

    // If updating student, also sync attendance record names
    if (studentData.id && studentData.name) {
      setRecords(prev => {
        const updated = prev.map(r => r.studentId === studentData.id ? { 
          ...r, 
          studentName: studentData.name, 
          classId: studentData.classId || r.classId 
        } : r);
        saveLocalData({ records: updated });
        return updated;
      });
    }
  };

  // Handle batch add students
  const handleBatchAddStudents = async (classId: string, namesText: string, defaultAge?: number, defaultBirthDate?: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有批量添加学员的权限！');
    }
    try {
      const res = await fetch('/api/students/batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ classId, namesText, defaultAge, defaultBirthDate }),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }
    const lines = namesText.split(/[\n,，]+/).map(s => s.trim()).filter(Boolean);
    const newItems: Student[] = lines.map((name, i) => ({
      id: `s-${Date.now()}-${i}`,
      name,
      gender: i % 2 === 0 ? 'boy' : 'girl',
      age: defaultAge || 7,
      birthDate: defaultBirthDate || '2019-06-01',
      classId,
      parentName: '家长/本人',
      parentPhone: '未填写',
      memberCode: `BTL-${Math.floor(100 + Math.random() * 900)}`,
      joinDate: new Date().toISOString().split('T')[0]
    }));
    setStudents(prev => {
      const updated = [...prev, ...newItems];
      saveLocalData({ students: updated });
      return updated;
    });
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有删除学员的权限！');
    }
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadState(false);
        return;
      }
    } catch {
      // Offline / Static
    }
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== studentId);
      saveLocalData({ students: updated });
      return updated;
    });
  };

  // Handle reset data
  const handleResetData = async () => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，无权重置系统示范数据！');
    }
    try {
      const res = await fetch('/api/reset-data', { 
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadState(false);
        setNewCheckinAlert('已恢复为伯特利教会主日学与团契官方示范数据！');
        setTimeout(() => setNewCheckinAlert(null), 3000);
        return;
      }
    } catch {
      // Offline / Static
    }
    const reset = resetLocalData();
    if (reset) {
      setClasses(reset.classes);
      setStudents(reset.students);
      setConfig(reset.config);
      setRecords(reset.records);
      setActiveSunday(reset.activeSunday);
    }
    setNewCheckinAlert('已恢复为伯特利教会主日学与团契官方示范数据！');
    setTimeout(() => setNewCheckinAlert(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-md mb-4">
          <Church className="w-8 h-8 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
          <span>正在连接伯特利教会主日学签到系统...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/30 text-slate-800 flex flex-col font-sans">
      
      {/* Real-time Notification Toast */}
      {newCheckinAlert && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium">{newCheckinAlert}</span>
        </div>
      )}

      {/* Main Header & Navigation */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickToggleTestMode={handleQuickToggleTestMode}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'today' && (
          <TodayDashboard
            config={config}
            classes={classes}
            students={students}
            records={records}
            activeSunday={activeSunday}
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onManualUpdate={handleManualUpdate}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportView
            config={config}
            classes={classes}
            students={students}
            records={records}
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualReportView
            config={config}
            classes={classes}
            students={students}
            records={records}
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            config={config}
            classes={classes}
            students={students}
            currentUser={currentUser}
            onSaveConfig={handleSaveConfig}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onDeleteStudent={handleDeleteStudent}
            onResetData={handleResetData}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-amber-200/60 bg-white/70 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <p className="flex items-center gap-1.5 font-serif">
            <Church className="w-4 h-4 text-amber-700" />
            <span className="font-semibold text-slate-800">{config.churchName}</span>
            <span>•</span>
            <span>{config.schoolTitle}</span>
          </p>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
