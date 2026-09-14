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

  // Fetch state from server
  const loadState = async (isInitial = false) => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setClasses(data.classes);
        setStudents(data.students);
        setActiveSunday(data.activeSunday);

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
      }
    } catch (err) {
      console.error('Failed to load state:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
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
      setActiveTab('qrcode');
    }
    setNewCheckinAlert('已退出后台管理模式');
    setTimeout(() => setNewCheckinAlert(null), 3000);
  };

  // Handle successful check-in
  const handleCheckinSuccess = (newRecord: AttendanceRecord, student: Student) => {
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
    const res = await fetch('/api/manual-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadState(false);
    }
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
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '保存系统配置失败');
    }
    setConfig(data.config);
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
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(classData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '保存班级失败');
    }
    await loadState(false);
  };

  // Handle delete class
  const handleDeleteClass = async (classId: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有删除班级的权限！');
    }
    const res = await fetch(`/api/classes/${classId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '删除班级失败');
    }
    await loadState(false);
  };

  // Handle add student
  const handleAddStudent = async (studentData: any) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加学员的权限！');
    }
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '登记学员失败');
    }
    await loadState(false);
  };

  // Handle batch add students
  const handleBatchAddStudents = async (classId: string, namesText: string, defaultAge?: number, defaultBirthDate?: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有批量添加学员的权限！');
    }
    const res = await fetch('/api/students/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ classId, namesText, defaultAge, defaultBirthDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '批量录入失败');
    }
    await loadState(false);
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，没有删除学员的权限！');
    }
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '删除学员失败');
    }
    await loadState(false);
  };

  // Handle reset data
  const handleResetData = async () => {
    if (currentUser?.role !== 'superadmin') {
      throw new Error('权限不足：除了总管理员之外，其他账号只有管理签到权限，无权重置系统示范数据！');
    }
    const res = await fetch('/api/reset-data', { 
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      await loadState(false);
      setNewCheckinAlert('已恢复为伯特利教会主日学与团契官方示范数据！');
      setTimeout(() => setNewCheckinAlert(null), 3000);
    } else {
      throw new Error(data.error || '重置数据失败');
    }
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
            onManualUpdate={handleManualUpdate}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportView
            config={config}
            classes={classes}
            students={students}
            records={records}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualReportView
            config={config}
            classes={classes}
            students={students}
            records={records}
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
