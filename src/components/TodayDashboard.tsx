import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  UserX, 
  FileText, 
  BookOpen, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertCircle,
  Phone,
  ChevronDown,
  Church
} from 'lucide-react';
import type { Student, ClassGroup, AttendanceRecord, SystemConfig } from '../types';
import { formatChineseDate } from '../utils/dateUtils';
import { calculateAge, formatBirthDate } from '../utils/studentUtils';

interface TodayDashboardProps {
  config: SystemConfig;
  classes: ClassGroup[];
  students: Student[];
  records: AttendanceRecord[];
  activeSunday: string;
  onManualUpdate: (data: {
    studentId: string;
    date: string;
    status: 'present' | 'late' | 'excused' | 'absent';
    memoryVerseCompleted?: boolean;
    offeringCompleted?: boolean;
    notes?: string;
  }) => Promise<void>;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  config,
  classes,
  students,
  records,
  activeSunday,
  onManualUpdate,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [excuseModalStudent, setExcuseModalStudent] = useState<Student | null>(null);
  const [excuseReason, setExcuseReason] = useState<string>('');
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  // Today's records
  const todayRecords = records.filter(r => r.date === activeSunday);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchClass = selectedClassId === 'all' || student.classId === selectedClassId;
    const matchSearch = searchKeyword.trim() === '' || 
      student.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      student.parentPhone.includes(searchKeyword) ||
      student.parentName.includes(searchKeyword);
    return matchClass && matchSearch;
  });

  // Calculate statistics
  const totalCount = students.length;
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const excusedCount = todayRecords.filter(r => r.status === 'excused').length;
  const checkedInTotal = presentCount + lateCount;
  const absentCount = totalCount - checkedInTotal - excusedCount;
  const attendanceRate = totalCount > 0 ? Math.round((checkedInTotal / totalCount) * 100) : 0;
  const verseCount = todayRecords.filter(r => r.memoryVerseCompleted).length;

  const handleQuickStatus = async (
    studentId: string,
    status: 'present' | 'late' | 'excused' | 'absent',
    verse?: boolean
  ) => {
    setLoadingStudentId(studentId);
    try {
      const existing = todayRecords.find(r => r.studentId === studentId);
      await onManualUpdate({
        studentId,
        date: activeSunday,
        status,
        memoryVerseCompleted: verse !== undefined ? verse : (existing ? existing.memoryVerseCompleted : true),
        offeringCompleted: false,
      });
    } finally {
      setLoadingStudentId(null);
    }
  };

  const handleToggleVerse = async (studentId: string) => {
    const existing = todayRecords.find(r => r.studentId === studentId);
    if (!existing) return;
    setLoadingStudentId(studentId);
    try {
      await onManualUpdate({
        studentId,
        date: activeSunday,
        status: existing.status,
        memoryVerseCompleted: !existing.memoryVerseCompleted,
        offeringCompleted: false,
      });
    } finally {
      setLoadingStudentId(null);
    }
  };

  const handleOpenExcuseModal = (student: Student) => {
    const existing = todayRecords.find(r => r.studentId === student.id);
    setExcuseReason(existing?.notes || '主日随父母探亲外出请假');
    setExcuseModalStudent(student);
  };

  const handleConfirmExcuse = async () => {
    if (!excuseModalStudent) return;
    setLoadingStudentId(excuseModalStudent.id);
    try {
      await onManualUpdate({
        studentId: excuseModalStudent.id,
        date: activeSunday,
        status: 'excused',
        memoryVerseCompleted: false,
        offeringCompleted: false,
        notes: excuseReason,
      });
      setExcuseModalStudent(null);
    } finally {
      setLoadingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Statistics Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-700" />
              <span>今日主日学实时签到看板</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              当前主日：{formatChineseDate(activeSunday)} • 学生实时出勤统计
            </p>
          </div>
        </div>

        {/* 5 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">应到总人数</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
              <span className="text-xs text-slate-400">人</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>准时出勤</span>
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-700">{presentCount}</span>
              <span className="text-xs text-emerald-600 font-medium">人</span>
            </div>
          </div>

          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <span className="text-xs text-amber-800 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>迟到人数</span>
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-800">{lateCount}</span>
              <span className="text-xs text-amber-700 font-medium">人</span>
            </div>
          </div>

          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 shadow-2xs">
            <span className="text-xs text-blue-700 font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>请假人数</span>
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-700">{excusedCount}</span>
              <span className="text-xs text-blue-600 font-medium">人</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-slate-400" />
              <span>暂未到校</span>
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-700">{absentCount > 0 ? absentCount : 0}</span>
              <span className="text-xs text-slate-400">人</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-700 to-amber-800 p-3.5 rounded-xl text-white shadow-xs">
            <span className="text-xs text-amber-100 font-medium">今日到勤率</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold">{attendanceRate}%</span>
              <span className="text-[10px] text-amber-200">背诵:{verseCount}人</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter & Operations Bar - All Classes Fully Visible Without Horizontal Scroll */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        
        {/* Class Tabs Header & Wrapped Chips */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2.5">
            <Church className="w-4 h-4 text-amber-700" />
            <span>班级与团契快速切换</span>
          </div>

          {/* All classes wrapped */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                selectedClassId === 'all'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <span>全部班级</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                selectedClassId === 'all' ? 'bg-amber-800 text-amber-100' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {todayRecords.filter(r => r.status === 'present' || r.status === 'late').length}/{students.length}人
              </span>
            </button>

            {classes.map(cls => {
              const clsStudentCount = students.filter(s => s.classId === cls.id).length;
              const clsPresentCount = todayRecords.filter(r => r.classId === cls.id && (r.status === 'present' || r.status === 'late')).length;
              const isSelected = selectedClassId === cls.id;

              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{cls.name.split(' ')[0]}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isSelected ? 'bg-amber-800 text-amber-100' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {clsPresentCount}/{clsStudentCount}人
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input & Quick Batch Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="搜索学员姓名、学号或家长联系电话..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">
              当前名单：<strong className="text-slate-900">{filteredStudents.length}</strong> 位学员
            </span>
          </div>
        </div>

      </div>

      {/* Students Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStudents.map(student => {
          const record = todayRecords.find(r => r.studentId === student.id);
          const classGroup = classes.find(c => c.id === student.classId);
          const isLoading = loadingStudentId === student.id;

          return (
            <div
              key={student.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs transition-all relative ${
                record?.status === 'present'
                  ? 'border-emerald-200/90 ring-1 ring-emerald-500/20'
                  : record?.status === 'late'
                    ? 'border-amber-300 ring-1 ring-amber-500/20'
                    : record?.status === 'excused'
                      ? 'border-blue-200 bg-blue-50/20'
                      : 'border-slate-200/80 hover:border-amber-300'
              }`}
            >
              {/* Top Row: Name, Class, Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    student.gender === 'boy' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {student.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{student.name}</span>
                      <span className="text-[10px] text-amber-900 bg-amber-100/80 font-medium px-1.5 py-0.2 rounded-md">
                        {calculateAge(student.birthDate, student.age)}岁
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {classGroup?.name.split(' ')[0]} • 出生:{formatBirthDate(student.birthDate)}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {record ? (
                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status === 'present' && <Check className="w-3 h-3" />}
                        {record.status === 'late' && <Clock className="w-3 h-3" />}
                        {record.status === 'excused' && <FileText className="w-3 h-3" />}
                        <span>
                          {record.status === 'present' ? '已准时签到' : record.status === 'late' ? '迟到打卡' : '已请假'}
                        </span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        ⏰ {record.timeStr}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      未打卡
                    </span>
                  )}
                </div>
              </div>

              {/* Badges / Notes row if checked in */}
              {record && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    {config.enableMemoryVerseOption !== false && (
                      <button
                        onClick={() => handleToggleVerse(student.id)}
                        className={`px-1.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                          record.memoryVerseCompleted
                            ? 'bg-amber-100 text-amber-900 font-medium'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                        title="点击切换金句背诵状态"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>{record.memoryVerseCompleted ? '金句已背诵 ★' : '未背金句'}</span>
                      </button>
                    )}
                  </div>

                  {record.notes && (
                    <span className="text-slate-500 text-[10px] truncate max-w-[120px]" title={record.notes}>
                      备注: {record.notes}
                    </span>
                  )}
                </div>
              )}

              {/* Teacher Quick Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  disabled={isLoading}
                  onClick={() => handleQuickStatus(student.id, 'present', true)}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    record?.status === 'present'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>到校</span>
                </button>

                <button
                  disabled={isLoading}
                  onClick={() => handleQuickStatus(student.id, 'late', false)}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    record?.status === 'late'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>迟到</span>
                </button>

                <button
                  disabled={isLoading}
                  onClick={() => handleOpenExcuseModal(student)}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    record?.status === 'excused'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>请假</span>
                </button>

                {record && (
                  <button
                    disabled={isLoading}
                    onClick={() => handleQuickStatus(student.id, 'absent')}
                    className="text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                    title="清除本次签到记录"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Excuse Modal */}
      {excuseModalStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              学员请假登记 - {excuseModalStudent.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              请录入本次主日请假原因（将计入请假统计，不扣减品行分）：
            </p>
            <textarea
              rows={3}
              value={excuseReason}
              onChange={e => setExcuseReason(e.target.value)}
              placeholder="例如：身体不适就医 / 家中有事外出 / 参加学校期末考..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExcuseModalStudent(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmExcuse}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-xs"
              >
                确认登记请假
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
