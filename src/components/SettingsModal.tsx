import React, { useState } from 'react';
import { 
  Settings, 
  Clock, 
  Sparkles, 
  Church, 
  BookOpen, 
  UserPlus, 
  Trash2, 
  Save, 
  RefreshCw, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Check,
  KeyRound,
  UserCheck,
  FileSpreadsheet,
  Calendar,
  Loader2,
  Lock,
  ShieldAlert
} from 'lucide-react';
import type { SystemConfig, Student, ClassGroup, AdminUser } from '../types';
import { calculateAge, formatBirthDate, getDefaultBirthDateForAge } from '../utils/studentUtils';

interface SettingsModalProps {
  config: SystemConfig;
  classes: ClassGroup[];
  students: Student[];
  currentUser: AdminUser | null;
  onSaveConfig: (updated: Partial<SystemConfig>) => Promise<void>;
  onSaveClass: (classData: Partial<ClassGroup>) => Promise<void>;
  onDeleteClass: (classId: string) => Promise<void>;
  onAddStudent: (studentData: any) => Promise<void>;
  onBatchAddStudents: (classId: string, namesText: string, defaultAge?: number, defaultBirthDate?: string) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onResetData: () => Promise<void>;
  onOpenLogin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  classes,
  students,
  currentUser,
  onSaveConfig,
  onSaveClass,
  onDeleteClass,
  onAddStudent,
  onBatchAddStudents,
  onDeleteStudent,
  onResetData,
  onOpenLogin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'students' | 'options' | 'system'>('classes');
  
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Feedback notices
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (type: 'success' | 'error', msg: string) => {
    setFeedbackNotice({ type, msg });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Class Editing Modal / State
  const [editingClass, setEditingClass] = useState<Partial<ClassGroup> | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  // In-App Deletion Confirmation State (Replaces window.confirm to avoid iframe blocking)
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'class'; id: string; name: string; enrolledCount: number }
    | { type: 'student'; id: string; name: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Student Filter & Batch Import State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(classes[0]?.id || 'all');
  const [batchClassId, setBatchClassId] = useState<string>(classes[0]?.id || '');
  const [batchNamesText, setBatchNamesText] = useState<string>('');
  const [batchBirthDate, setBatchBirthDate] = useState<string>('2019-06-01');
  const [isBatchAdding, setIsBatchAdding] = useState<boolean>(false);

  // Single Student State
  const [singleName, setSingleName] = useState('');
  const [singleGender, setSingleGender] = useState<'boy' | 'girl'>('boy');
  const [singleBirthDate, setSingleBirthDate] = useState('2019-06-01');
  const [singleClassId, setSingleClassId] = useState(classes[0]?.id || '');
  const [singleParent, setSingleParent] = useState('');
  const [singlePhone, setSinglePhone] = useState('');
  const [isAddingSingle, setIsAddingSingle] = useState(false);

  // Student Editing Modal / State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentGender, setEditStudentGender] = useState<'boy' | 'girl'>('boy');
  const [editStudentBirthDate, setEditStudentBirthDate] = useState('2020-01-01');
  const [editStudentClassId, setEditStudentClassId] = useState('');
  const [editStudentMemberCode, setEditStudentMemberCode] = useState('');
  const [editStudentParentName, setEditStudentParentName] = useState('');
  const [editStudentParentPhone, setEditStudentParentPhone] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Default Options State (Syncs with config)
  const [optionsState, setOptionsState] = useState({
    enableMemoryVerseOption: config.enableMemoryVerseOption ?? true,
    defaultMemoryVerseChecked: config.defaultMemoryVerseChecked ?? true,
    enableOfferingOption: config.enableOfferingOption ?? true,
    defaultOfferingChecked: config.defaultOfferingChecked ?? true,
    enableLateRule: config.enableLateRule ?? true,
    lateThresholdTime: config.lateThresholdTime || '09:30',
    enableExcusedNote: config.enableExcusedNote ?? true,
    enableCheckinPopup: config.enableCheckinPopup ?? true,
    testMode: config.testMode ?? false,
  });

  // System & Church info state
  const [churchName, setChurchName] = useState(config.churchName);
  const [schoolTitle, setSchoolTitle] = useState(config.schoolTitle);
  const [startTime, setStartTime] = useState(config.checkinStartTime);
  const [endTime, setEndTime] = useState(config.checkinEndTime);
  const [memoryVerse, setMemoryVerse] = useState(config.weeklyMemoryVerse);
  const [verseRef, setVerseRef] = useState(config.memoryVerseReference);
  const [adminPassword, setAdminPassword] = useState(config.adminPassword || 'bethel2026');
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  // Filter students for display
  const displayedStudents = selectedClassFilter === 'all'
    ? students
    : students.filter(s => s.classId === selectedClassFilter);

  // Class Edit Handlers
  const handleOpenNewClass = () => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号只有管理签到权限，没有添加班级的权限！');
      return;
    }
    setEditingClass({
      name: '',
      ageRange: '6-12岁',
      teacher: '主日学老师',
      classroom: '伯特利副堂',
      color: 'bg-amber-500',
      groupType: 'sunday_school',
      targetCapacity: 20,
      description: ''
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassGroup) => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号只有管理签到权限，没有编辑班级的权限！');
      return;
    }
    setEditingClass({ ...cls });
    setIsClassModalOpen(true);
  };

  const handleSaveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有添加或修改班级的权限！');
      return;
    }
    if (!editingClass?.name) return;
    try {
      await onSaveClass(editingClass);
      setIsClassModalOpen(false);
      setEditingClass(null);
      showNotice('success', '班级/团契信息已成功更新！');
    } catch (err: any) {
      showNotice('error', err.message || '操作失败');
    }
  };

  // Open in-app deletion confirm for Class
  const handleRequestDeleteClass = (cls: ClassGroup) => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有删除班级的权限！');
      return;
    }
    const enrolled = students.filter(s => s.classId === cls.id).length;
    setDeleteTarget({
      type: 'class',
      id: cls.id,
      name: cls.name,
      enrolledCount: enrolled,
    });
  };

  // Open in-app deletion confirm for Student
  const handleRequestDeleteStudent = (stu: Student) => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有删除学员的权限！');
      return;
    }
    setDeleteTarget({
      type: 'student',
      id: stu.id,
      name: stu.name,
    });
  };

  // Execute in-app confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有删除班级与学生的权限！');
      return;
    }
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'class') {
        await onDeleteClass(deleteTarget.id);
        showNotice('success', `班级【${deleteTarget.name}】已成功删除！`);
      } else {
        await onDeleteStudent(deleteTarget.id);
        showNotice('success', `学员【${deleteTarget.name}】已成功从名册中移除！`);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showNotice('error', err.message || '删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit modal for Student
  const handleOpenEditStudent = (stu: Student) => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号只有管理签到权限，没有编辑学员资料的权限！');
      return;
    }
    setEditingStudent(stu);
    setEditStudentName(stu.name);
    setEditStudentGender(stu.gender);
    setEditStudentBirthDate(stu.birthDate || '2020-01-01');
    setEditStudentClassId(stu.classId);
    setEditStudentMemberCode(stu.memberCode || '');
    setEditStudentParentName(stu.parentName || '');
    setEditStudentParentPhone(stu.parentPhone || '');
    setIsStudentModalOpen(true);
  };

  // Submit edited student
  const handleSaveStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有编辑学员资料的权限！');
      return;
    }
    if (!editStudentName.trim()) {
      showNotice('error', '请输入学员姓名');
      return;
    }
    if (!editStudentClassId) {
      showNotice('error', '请选择学员所属班级/团契');
      return;
    }
    setIsSavingStudent(true);
    try {
      const updatedData: Student = {
        ...editingStudent,
        name: editStudentName.trim(),
        gender: editStudentGender,
        birthDate: editStudentBirthDate,
        age: calculateAge(editStudentBirthDate),
        classId: editStudentClassId,
        memberCode: editStudentMemberCode.trim(),
        parentName: editStudentParentName.trim(),
        parentPhone: editStudentParentPhone.trim(),
      };
      await onAddStudent(updatedData);
      showNotice('success', `学员「${updatedData.name}」资料已成功更新！`);
      setIsStudentModalOpen(false);
      setEditingStudent(null);
    } catch (err: any) {
      showNotice('error', err.message || '更新学员资料失败');
    } finally {
      setIsSavingStudent(false);
    }
  };

  // Batch Add Students Handler
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有添加学生的权限！');
      return;
    }
    if (!batchNamesText.trim()) return;
    setIsBatchAdding(true);
    try {
      const computedAge = calculateAge(batchBirthDate, 7);
      await onBatchAddStudents(batchClassId || classes[0]?.id, batchNamesText, computedAge, batchBirthDate);
      setBatchNamesText('');
      showNotice('success', '批量录入学员成功，学生人数与自动推算年龄已更新！');
    } catch (err: any) {
      showNotice('error', err.message || '批量录入失败');
    } finally {
      setIsBatchAdding(false);
    }
  };

  // Single Add Student Handler
  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号没有添加学生的权限！');
      return;
    }
    if (!singleName.trim()) return;
    setIsAddingSingle(true);
    try {
      const computedAge = calculateAge(singleBirthDate, 7);
      await onAddStudent({
        name: singleName.trim(),
        gender: singleGender,
        birthDate: singleBirthDate,
        age: computedAge,
        classId: singleClassId || classes[0]?.id,
        parentName: singleParent.trim(),
        parentPhone: singlePhone.trim(),
      });
      setSingleName('');
      setSingleParent('');
      setSinglePhone('');
      showNotice('success', `新学员已成功加入班级名册（自动计算年龄：${computedAge}岁）！`);
    } catch (err: any) {
      showNotice('error', err.message || '录入失败');
    } finally {
      setIsAddingSingle(false);
    }
  };

  // Save Toggle Option
  const handleToggleOption = async (key: keyof typeof optionsState, val: any) => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号只有管理签到权限，不能修改全局系统配置！');
      return;
    }
    const updated = { ...optionsState, [key]: val };
    setOptionsState(updated);
    try {
      await onSaveConfig({ [key]: val });
      showNotice('success', '默认选项已即时更新生效！');
    } catch (err: any) {
      showNotice('error', err.message || '更新失败');
    }
  };

  // Save Church & System
  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：除了总管理员之外，其他账号不能修改教会信息与系统密码！');
      return;
    }
    setIsSavingSystem(true);
    try {
      await onSaveConfig({
        churchName,
        schoolTitle,
        checkinStartTime: startTime,
        checkinEndTime: endTime,
        weeklyMemoryVerse: memoryVerse,
        memoryVerseReference: verseRef,
        adminPassword,
      });
      showNotice('success', '教会基础信息与系统时段已保存！');
    } catch (err: any) {
      showNotice('error', err.message || '保存失败');
    } finally {
      setIsSavingSystem(false);
    }
  };

  // Reset demo data handler
  const handleResetDataClick = async () => {
    if (!isSuperAdmin) {
      showNotice('error', '权限受限：只有总管理员有权重置示范数据！');
      return;
    }
    await onResetData();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              伯特利教会 • 后台综合管理系统
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            自定义班级与团契名称、调整学员人数与定额容量、掌控各项默认选项的开启与关闭
          </p>
        </div>

        {/* Current Operator State */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isSuperAdmin 
                  ? 'bg-amber-50 text-amber-900 border-amber-200' 
                  : 'bg-sky-50 text-sky-900 border-sky-200'
              }`}>
                {isSuperAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
                )}
                <span className="font-semibold">{currentUser.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  isSuperAdmin
                    ? 'bg-amber-200/80 text-amber-950'
                    : 'bg-sky-200/80 text-sky-950 flex items-center gap-0.5'
                }`}>
                  {!isSuperAdmin && <Lock className="w-2.5 h-2.5" />}
                  {isSuperAdmin ? '总管理员 (全部权限)' : '仅签到权限'}
                </span>
              </div>
              {!isSuperAdmin && (
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="切换为总管理员账号以获取班级/学生增删权限"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>切换为总管理员</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>登录管理员账号</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Permission Notification Banner for Non-Superadmins */}
      {!isSuperAdmin && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-2 text-amber-950">
                <span>权限限制通知：当前为【普通管理账号】</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                  仅限签到管理
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                按照系统权限配置：<strong>除了总管理员之外，其他账号只有管理签到权限，没有添加/删除班级与学生的权限。</strong>
                如需新增班级、编辑班级定额、批量录入学员或移出学员，请切换使用总管理员账号登录。
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLogin}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>切换总管理员登录</span>
          </button>
        </div>
      )}

      {/* Floating Notice */}
      {feedbackNotice && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 shadow-sm animate-in fade-in duration-200 ${
          feedbackNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedbackNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedbackNotice.msg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'classes'
              ? 'bg-amber-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Church className="w-3.5 h-3.5" />
          <span>班级与团契管理 (自定义名称与人数定额)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'students'
              ? 'bg-amber-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>学员花名册与人数扩充 (批量与单人录入)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('options')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'options'
              ? 'bg-amber-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>默认选项开启与关闭 (功能开关中心)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ml-auto ${
            activeSubTab === 'system'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>教会主日时段与密码</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CLASSES MANAGEMENT (自定义班级名称与学生人数定额) */}
      {/* ========================================================================= */}
      {activeSubTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              共配置 <span className="font-bold text-slate-900">{classes.length}</span> 个班级/团契。可随时查看班名、辅导老师与定额人数。
            </div>
            {isSuperAdmin ? (
              <button
                onClick={handleOpenNewClass}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建班级 / 团契</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>仅总管理员可新建班级</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              const enrolledCount = students.filter(s => s.classId === cls.id).length;
              const targetCap = cls.targetCapacity || 20;
              const ratio = Math.min(Math.round((enrolledCount / targetCap) * 100), 100);
              const isSundaySchool = cls.groupType !== 'fellowship';

              return (
                <div 
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-all group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${
                          isSundaySchool 
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-purple-50 text-purple-900 border-purple-200'
                        }`}>
                          {isSundaySchool ? '主日学班级' : '团契契组'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 font-serif leading-tight">
                          {cls.name}
                        </h4>
                      </div>

                      {isSuperAdmin ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="编辑班级名称与信息"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDeleteClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="删除班级"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200" title="无修改/删除权限（仅总管理员可操作）">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>只读</span>
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">辅导同工/老师:</span>
                        <span className="font-semibold text-slate-800">{cls.teacher}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">活动课室:</span>
                        <span className="text-slate-800">{cls.classroom}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">适配年龄段:</span>
                        <span className="text-slate-800">{cls.ageRange}</span>
                      </div>
                    </div>

                    {/* Capacity and Enrolled progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">学生人数规模:</span>
                        <span className="font-bold text-slate-900">
                          {enrolledCount} <span className="font-normal text-slate-400">/ 设额 {targetCap} 人</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSundaySchool ? 'bg-amber-600' : 'bg-purple-600'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>定额容量达成: {ratio}%</span>
                        <span className="text-amber-800 font-medium">{enrolledCount >= targetCap ? '已满员' : `尚余 ${targetCap - enrolledCount} 名额`}</span>
                      </div>
                    </div>
                  </div>

                  {cls.description && (
                    <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 truncate" title={cls.description}>
                      {cls.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STUDENTS ROSTER & CAPACITY EXPANSION (学生人数与花名册) */}
      {/* ========================================================================= */}
      {activeSubTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Student List & Filter */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">筛选班级/团契:</span>
                <select
                  value={selectedClassFilter}
                  onChange={e => setSelectedClassFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white"
                >
                  <option value="all">全部班级与团契 ({students.length}人)</option>
                  {classes.map(c => {
                    const count = students.filter(s => s.classId === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>{c.name} ({count}人)</option>
                    );
                  })}
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                当前筛选下：<span className="font-bold text-amber-900">{displayedStudents.length}</span> 位学员
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3.5 py-3">学号代号</th>
                      <th className="px-3.5 py-3">学员姓名</th>
                      <th className="px-3.5 py-3">所属班级</th>
                      <th className="px-3.5 py-3">出生年月日</th>
                      <th className="px-3.5 py-3">年龄(自动计算)</th>
                      <th className="px-3.5 py-3">性别</th>
                      <th className="px-3.5 py-3">家长/联系电话</th>
                      <th className="px-3.5 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                          暂无符合条件的学员，可通过右侧工具批量或单独录入
                        </td>
                      </tr>
                    ) : (
                      displayedStudents.map(stu => {
                        const cls = classes.find(c => c.id === stu.classId);
                        const computedAge = calculateAge(stu.birthDate, stu.age);
                        return (
                          <tr key={stu.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono text-slate-400 text-[11px]">
                              {stu.memberCode || stu.id.slice(-6)}
                            </td>
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                              {stu.name}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-900 text-[11px] font-medium">
                                {cls ? cls.name.split(' ')[0] : '未分班'}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-700 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-amber-700" />
                                <span>{formatBirthDate(stu.birthDate)}</span>
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-950 font-bold text-[11px]">
                                {computedAge} 岁
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600">
                              {stu.gender === 'boy' ? '男' : '女'}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                              {stu.parentName ? `${stu.parentName} (${stu.parentPhone})` : stu.parentPhone || '—'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              {isSuperAdmin ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditStudent(stu)}
                                    className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-amber-200/80 shadow-2xs"
                                    title="编辑学员档案资料"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>编辑</span>
                                  </button>
                                  <button
                                    onClick={() => handleRequestDeleteStudent(stu)}
                                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                    title="移出名册"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1 px-1 py-0.5" title="无修改权限（仅总管理员可操作）">
                                  <Lock className="w-3 h-3 text-slate-300" />
                                  <span>只读</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Col: Quick Batch Import & Single Add */}
          <div className="space-y-4">
            {isSuperAdmin ? (
              <>
                {/* Quick Batch Import Card */}
                <form onSubmit={handleBatchSubmit} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-slate-900">
                      一键批量录入 (快速扩充班级学生人数)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      选择目标班级 / 团契 *
                    </label>
                    <select
                      value={batchClassId}
                      onChange={e => setBatchClassId(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      批量粘贴学员姓名 (以空格、逗号或换行分隔)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={batchNamesText}
                      onChange={e => setBatchNamesText(e.target.value)}
                      placeholder="例如：王雅各 李马太 张保罗 刘约翰 陈以斯帖"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      支持从Excel名单、家教会通知或文档中直接复制整串学员姓名快速导入。
                    </p>
                  </div>

                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>预设出生年月日</span>
                      </label>
                      <span className="text-[11px] font-bold text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
                        推算年龄：{calculateAge(batchBirthDate, 7)} 岁
                      </span>
                    </div>
                    <input
                      type="date"
                      value={batchBirthDate}
                      onChange={e => setBatchBirthDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      批量加入的学员统一预设此出生年月日，年龄由系统自动计算生成。
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isBatchAdding || !batchNamesText.trim()}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isBatchAdding ? '批量录入中...' : '一键快速批量加入班级'}</span>
                  </button>
                </form>

                {/* Single Add Form */}
                <form onSubmit={handleSingleStudentSubmit} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-bold text-slate-900">
                      单个详细录入新学员
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      学员姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={singleName}
                      onChange={e => setSingleName(e.target.value)}
                      placeholder="姓名"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        分配班级
                      </label>
                      <select
                        value={singleClassId}
                        onChange={e => setSingleClassId(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        性别
                      </label>
                      <select
                        value={singleGender}
                        onChange={e => setSingleGender(e.target.value as 'boy' | 'girl')}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <option value="boy">男</option>
                        <option value="girl">女</option>
                      </select>
                    </div>
                  </div>

                  {/* 出生年月日与系统自动计算年龄 */}
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>出生年月日 *</span>
                      </label>
                      <span className="text-[11px] font-bold text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
                        系统自动计算：{calculateAge(singleBirthDate, 7)} 岁
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      value={singleBirthDate}
                      onChange={e => setSingleBirthDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      系统依据所选出生年月日即时推算精确周岁，无需手动计算。
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        家长姓名
                      </label>
                      <input
                        type="text"
                        value={singleParent}
                        onChange={e => setSingleParent(e.target.value)}
                        placeholder="家长姓名"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        联系电话
                      </label>
                      <input
                        type="text"
                        value={singlePhone}
                        onChange={e => setSinglePhone(e.target.value)}
                        placeholder="联系电话"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingSingle || !singleName.trim()}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>登记新学员档案</span>
                  </button>
                </form>
              </>
            ) : (
              /* Non-Superadmin Permission Lock Panel */
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-slate-900 font-serif">
                    学员添加与删除权限已锁定
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    除了<strong>总管理员（admin）</strong>之外，其他账号<strong>只有管理签到权限</strong>，没有添加/删除班级与学生的权限。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>您当前账号可执行的操作：</span>
                  </div>
                  <ul className="text-[11px] text-slate-500 pl-5 space-y-1 list-disc leading-relaxed">
                    <li>在「今日主日签到」页面进行实时打卡与请假登记</li>
                    <li>随时查阅左侧学员花名册与班级定额达成率</li>
                    <li>查阅月度全勤表与年度结业荣誉档案</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>使用总管理员账号登录以添加/删除学员</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DEFAULT OPTIONS TOGGLES (默认选项的开启或关闭) */}
      {/* ========================================================================= */}
      {activeSubTab === 'options' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-700" />
              <span>主日学签到系统 • 默认选项与业务开关中心</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              在此集中控制签到页面各个默认选项的状态。开关调整后即刻生效，无需重启服务。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. 迟到判定规则开关与时刻 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      是否启用「迟到」判定规则
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    开启后，超过设定时刻提交打卡的学员，系统将自动标记考勤状态为「迟到」。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleOption('enableLateRule', !optionsState.enableLateRule)}
                  className="cursor-pointer shrink-0"
                >
                  {optionsState.enableLateRule ? (
                    <ToggleRight className="w-9 h-9 text-amber-700" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {optionsState.enableLateRule && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-600 font-semibold">迟到判定时刻:</span>
                  <input
                    type="time"
                    value={optionsState.lateThresholdTime}
                    onChange={e => {
                      const val = e.target.value;
                      handleToggleOption('lateThresholdTime', val);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400">超过此时间打卡将计为迟到</span>
                </div>
              )}
            </div>

            {/* 2. 请假与随行代祷备注功能开关 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    是否开启「代祷/随行事项」输入项
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  点名时可为学生填写代祷事项、请假理由或随行状况备注。
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOption('enableExcusedNote', !optionsState.enableExcusedNote)}
                className="cursor-pointer shrink-0"
              >
                {optionsState.enableExcusedNote ? (
                  <ToggleRight className="w-9 h-9 text-amber-700" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* 3. 奉献打卡开关 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    是否开启主日「奉献」打卡项
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  开启后，签到卡片可标记学员是否参与主日奉献。
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOption('enableOfferingOption', !optionsState.enableOfferingOption)}
                className="cursor-pointer shrink-0"
              >
                {optionsState.enableOfferingOption ? (
                  <ToggleRight className="w-9 h-9 text-amber-700" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* 4. 测试模式开关 */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    测试/演练模式 (任意时间允许签到)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  开启后可临时突破周日和时间段限制，方便教务老师在周间提前测试演示点名出勤。
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOption('testMode', !optionsState.testMode)}
                className="cursor-pointer shrink-0"
              >
                {optionsState.testMode ? (
                  <ToggleRight className="w-9 h-9 text-amber-700" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* 5. 大屏悬浮弹窗喜报开关 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    5
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    大屏实时签到悬浮喜报
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  当在大堂或教室开启大屏点名看板时，有学员打卡签到将以弹出气泡祝贺到堂。
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOption('enableCheckinPopup', !optionsState.enableCheckinPopup)}
                className="cursor-pointer shrink-0"
              >
                {optionsState.enableCheckinPopup ? (
                  <ToggleRight className="w-9 h-9 text-amber-700" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-300" />
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SYSTEM INFO, TIME WINDOW & PASSWORD (教会信息与安全密码) */}
      {/* ========================================================================= */}
      {activeSubTab === 'system' && (
        <form onSubmit={handleSaveSystemConfig} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Church className="w-5 h-5 text-amber-700" />
              <span>伯特利教会主日学与团契 • 系统参数与安全设置</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              修改系统显示的教会全称、时段窗口限制、金句内容及管理员登入密码
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                教会全称
              </label>
              <input
                type="text"
                required
                value={churchName}
                onChange={e => setChurchName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                部门/系统名称
              </label>
              <input
                type="text"
                required
                value={schoolTitle}
                onChange={e => setSchoolTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                礼拜天签到开放起始时间
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                礼拜天签到截止时间
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>后台管理员登录密码</span>
                <span className="text-[10px] text-amber-800">可自定义修改</span>
              </label>
              <input
                type="text"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="密码 (默认 bethel2026)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Scripture Verse */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              每周主日学金句 (Memory Verse)
            </label>
            <textarea
              rows={2}
              value={memoryVerse}
              onChange={e => setMemoryVerse(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white leading-relaxed font-serif"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 shrink-0">经文出处:</span>
              <input
                type="text"
                value={verseRef}
                onChange={e => setVerseRef(e.target.value)}
                className="w-64 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onResetData}
              className="text-xs text-slate-500 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>恢复伯特利教会默认示范数据</span>
            </button>

            <button
              type="submit"
              disabled={isSavingSystem}
              className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSystem ? '保存中...' : '保存教会信息与规则'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* EDIT / NEW CLASS MODAL (自定义班级名称与定额人数弹窗) */}
      {/* ========================================================================= */}
      {isClassModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-linear-to-r from-amber-700 to-amber-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-serif">
                  {editingClass.id ? '编辑班级/团契信息' : '创建新班级 / 团契'}
                </h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  自定义班级名称、类别、年龄段及目标学员人数规模
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsClassModalOpen(false);
                  setEditingClass(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClassSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  班级 / 团契全称 *
                </label>
                <input
                  type="text"
                  required
                  value={editingClass.name || ''}
                  onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="例如: 恩典约书亚班 (6-8岁初小)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    组织性质
                  </label>
                  <select
                    value={editingClass.groupType || 'sunday_school'}
                    onChange={e => setEditingClass({ ...editingClass, groupType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="sunday_school">主日学班级 (儿童与青少)</option>
                    <option value="fellowship">教会团契 (青年/职场/长者)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    设定学生人数定额 (容量上限) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={editingClass.targetCapacity || 20}
                    onChange={e => setEditingClass({ ...editingClass, targetCapacity: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    辅导老师 / 带领同工
                  </label>
                  <input
                    type="text"
                    value={editingClass.teacher || ''}
                    onChange={e => setEditingClass({ ...editingClass, teacher: e.target.value })}
                    placeholder="例如: 张大卫 老师"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    活动课室 / 聚会地点
                  </label>
                  <input
                    type="text"
                    value={editingClass.classroom || ''}
                    onChange={e => setEditingClass({ ...editingClass, classroom: e.target.value })}
                    placeholder="例如: 副堂202室"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  年龄段范围
                </label>
                <input
                  type="text"
                  value={editingClass.ageRange || ''}
                  onChange={e => setEditingClass({ ...editingClass, ageRange: e.target.value })}
                  placeholder="例如: 6-8岁"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  班级简介或使命 (选填)
                </label>
                <input
                  type="text"
                  value={editingClass.description || ''}
                  onChange={e => setEditingClass({ ...editingClass, description: e.target.value })}
                  placeholder="一句话介绍班级特色与教学内容"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsClassModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-2xs"
                >
                  确认保存班级
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STUDENT MODAL (编辑学员档案与资料) */}
      {/* ========================================================================= */}
      {isStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-linear-to-r from-amber-700 to-amber-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-serif flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-200" />
                  <span>编辑学员档案资料</span>
                </h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  修改学员【{editingStudent.name}】的姓名、生日年龄、班级归属及家长联络信息
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    学员姓名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentName}
                    onChange={e => setEditStudentName(e.target.value)}
                    placeholder="例如: 张以诺 (Samuel)"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    性别 *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStudentGender('boy')}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        editStudentGender === 'boy'
                          ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      男 (弟兄)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStudentGender('girl')}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        editStudentGender === 'girl'
                          ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      女 (姊妹)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    出生年月日 *
                  </label>
                  <input
                    type="date"
                    required
                    value={editStudentBirthDate}
                    onChange={e => setEditStudentBirthDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <span className="text-[10px] text-amber-800 font-medium mt-1 block">
                    系统自动换算：{calculateAge(editStudentBirthDate)} 周岁
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    所属班级 / 团契 *
                  </label>
                  <select
                    value={editStudentClassId}
                    onChange={e => setEditStudentClassId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ageRange})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    学号 / 会友编号
                  </label>
                  <input
                    type="text"
                    value={editStudentMemberCode}
                    onChange={e => setEditStudentMemberCode(e.target.value)}
                    placeholder="例如: BTL-08"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    家长 / 监护人姓名
                  </label>
                  <input
                    type="text"
                    value={editStudentParentName}
                    onChange={e => setEditStudentParentName(e.target.value)}
                    placeholder="例如: 张建军 / 本人"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  家长紧急联络电话
                </label>
                <input
                  type="text"
                  value={editStudentParentPhone}
                  onChange={e => setEditStudentParentPhone(e.target.value)}
                  placeholder="例如: 13800559922"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStudentModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  {isSavingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSavingStudent ? '正在保存...' : '保存学员资料'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteTarget.type === 'class' ? '确认删除班级/团契？' : '确认移除在册学员？'}
                </h3>
                <div className="text-xs text-slate-600 mt-1.5 space-y-2 leading-relaxed">
                  {deleteTarget.type === 'class' ? (
                    <>
                      <p>
                        您即将删除班级 <strong className="text-slate-900 font-bold">【{deleteTarget.name}】</strong>。
                      </p>
                      {deleteTarget.enrolledCount > 0 ? (
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs leading-relaxed">
                          ⚠️ <strong>注意：</strong>该班级目前共有 <strong>{deleteTarget.enrolledCount}</strong> 名在册学员。
                          确认删除后，该班级及其学员档案与出勤记录将一并清除。
                        </div>
                      ) : (
                        <p className="text-slate-400">该班级目前无在册学员，删除后不可撤销。</p>
                      )}
                    </>
                  ) : (
                    <p>
                      您确定要将学员 <strong className="text-slate-900 font-bold">【{deleteTarget.name}】</strong> 从主日学名册中彻底移除吗？此操作将一并清除该学员的历史考勤记录。
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>正在删除...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>确认删除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
