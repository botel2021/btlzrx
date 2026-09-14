import React, { useState } from 'react';
import { 
  Award, 
  Printer, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Download, 
  Church, 
  User,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import type { Student, ClassGroup, AttendanceRecord, SystemConfig } from '../types';
import { getAllSundaysInYear, formatChineseDate } from '../utils/dateUtils';

interface AnnualReportViewProps {
  config: SystemConfig;
  classes: ClassGroup[];
  students: Student[];
  records: AttendanceRecord[];
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  config,
  classes,
  students,
  records,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(config.currentYear || 2026);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [certificateViewStudent, setCertificateViewStudent] = useState<Student | null>(students[0] || null);

  // All Sundays in 2026 (52 sundays)
  const allSundaysInYear = getAllSundaysInYear(selectedYear);
  const totalSundaysInYear = allSundaysInYear.length;

  // Filter records for the selected year
  const yearRecords = records.filter(r => r.date.startsWith(String(selectedYear)));

  // Calculate annual stats for each student
  const studentAnnualStats = students.map(student => {
    const studentRecords = yearRecords.filter(r => r.studentId === student.id);
    const presentCount = studentRecords.filter(r => r.status === 'present').length;
    const lateCount = studentRecords.filter(r => r.status === 'late').length;
    const excusedCount = studentRecords.filter(r => r.status === 'excused').length;
    const totalAttended = presentCount + lateCount;
    const verseCount = studentRecords.filter(r => r.memoryVerseCompleted).length;
    
    // Using recorded past sundays count (e.g. 15 past Sundays up to current month) or full year
    const pastSundaysRecorded = Array.from(new Set(yearRecords.map(r => r.date))).length || 15;
    const rate = pastSundaysRecorded > 0 ? Math.round((totalAttended / pastSundaysRecorded) * 100) : 0;

    let honorTitle = '勤勉好学奖';
    let badgeColor = 'bg-blue-100 text-blue-900 border-blue-200';
    if (rate >= 95) {
      honorTitle = '年度卓越全勤奖';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (rate >= 85) {
      honorTitle = '年度忠心侍奉奖';
      badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    } else if (rate >= 70) {
      honorTitle = '年度勤勉好学奖';
      badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-200';
    }

    return {
      student,
      presentCount,
      lateCount,
      excusedCount,
      totalAttended,
      verseCount,
      rate,
      honorTitle,
      badgeColor,
      pastSundaysRecorded,
    };
  });

  // Top tiers
  const fullAttendanceCount = studentAnnualStats.filter(s => s.rate >= 95).length;
  const excellentCount = studentAnnualStats.filter(s => s.rate >= 85 && s.rate < 95).length;
  const averageRate = studentAnnualStats.length > 0 
    ? Math.round(studentAnnualStats.reduce((sum, s) => sum + s.rate, 0) / studentAnnualStats.length)
    : 0;
  const totalVersesYear = studentAnnualStats.reduce((sum, s) => sum + s.verseCount, 0);

  const activeStat = studentAnnualStats.find(s => s.student.id === (certificateViewStudent?.id || selectedStudentId)) || studentAnnualStats[0];

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-700" />
            <span>{selectedYear}年度 主日学学年完成进度与荣誉结业报告</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            全年度52周主日历程追踪、学员年度画像与精美结业/全勤荣誉证书
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            全年度共计 52 次主日
          </div>
          <button
            onClick={handlePrintCertificate}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印荣誉证书 / 报告</span>
          </button>
        </div>
      </div>

      {/* Annual Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-linear-to-br from-amber-50 to-orange-50/60 p-4 rounded-xl border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
            <span>年度卓越全勤奖 (≥95%)</span>
            <Award className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-900">{fullAttendanceCount}</span>
            <span className="text-xs text-amber-800 font-medium">人荣获全勤勋章</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800">
            风雨无阻、每周坚守主日敬拜
          </p>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span>忠心侍奉奖 (≥85%)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-700">{excellentCount}</span>
            <span className="text-xs text-emerald-600 font-medium">人荣获优异证书</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-700">
            出席稳定、表现卓越
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>全年度平均出勤率</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{averageRate}%</span>
            <span className="text-xs text-slate-400">持续保持高位</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${averageRate}%` }} />
          </div>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-800 font-medium">
            <span>年度金句背诵总量</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-800">{totalVersesYear}</span>
            <span className="text-xs text-blue-600 font-medium">条圣经神圣话语</span>
          </div>
          <p className="mt-2 text-[11px] text-blue-700">
            神的话语藏在孩童心里
          </p>
        </div>

      </div>

      {/* Main Layout: Left Roster & Progress Rankings + Right Certificate Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Student Annual Progress List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-700" />
                <span>年度学员成长榜单 (点击生成证书)</span>
              </h3>
              <span className="text-xs text-slate-400">{students.length} 名学员</span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {studentAnnualStats.map(item => {
                const isSelected = certificateViewStudent?.id === item.student.id;
                const cls = classes.find(c => c.id === item.student.classId);

                return (
                  <div
                    key={item.student.id}
                    onClick={() => setCertificateViewStudent(item.student)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-600 ring-1 ring-amber-600 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.student.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{item.student.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {cls?.name.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>已出席 {item.totalAttended} 周</span>
                          <span className="text-amber-700">★金句 {item.verseCount} 次</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {item.rate}%
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 inline-block ${item.badgeColor}`}>
                        {item.honorTitle.replace('年度', '')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Exquisite Printable Annual Honor Certificate */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>精美结业与全勤荣誉证书实时预览</span>
              </span>
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                A4纸张标准格式 • 可直接打印
              </span>
            </div>

            {/* The Actual Certificate Card */}
            {activeStat && (
              <div 
                id="printable-certificate" 
                className="bg-amber-50/20 border-8 border-double border-amber-700/80 p-6 sm:p-8 rounded-2xl relative shadow-md overflow-hidden text-center"
                style={{
                  backgroundImage: 'radial-gradient(#d97706 0.5px, transparent 0.5px)',
                  backgroundSize: '16px 16px',
                  backgroundColor: '#fffdfa'
                }}
              >
                {/* Certificate Corner Ornaments */}
                <div className="absolute top-2 left-2 text-amber-700/40 text-lg font-serif">✥</div>
                <div className="absolute top-2 right-2 text-amber-700/40 text-lg font-serif">✥</div>
                <div className="absolute bottom-2 left-2 text-amber-700/40 text-lg font-serif">✥</div>
                <div className="absolute bottom-2 right-2 text-amber-700/40 text-lg font-serif">✥</div>

                {/* Inner Thin Border */}
                <div className="border border-amber-300 p-6 rounded-xl relative">
                  
                  {/* Church Header */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-700 text-white shadow-md mb-2">
                    <Church className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-serif tracking-widest text-amber-900 font-bold uppercase">
                    {config.churchName} • 主日学部
                  </h4>
                  
                  {/* Certificate Title */}
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight mt-2 text-amber-950">
                    主 日 学 结 业 荣 誉 证 书
                  </h3>
                  <p className="text-[11px] font-serif text-amber-800 tracking-widest uppercase mt-0.5">
                    Certificate of Sunday School Excellence & Attendance
                  </p>

                  <div className="w-24 h-0.5 bg-linear-to-r from-transparent via-amber-700 to-transparent mx-auto my-4" />

                  {/* Body Text */}
                  <div className="max-w-md mx-auto space-y-3 text-slate-800 text-xs sm:text-sm leading-relaxed font-serif">
                    <p>
                      兹证明{' '}
                      <span className="text-base sm:text-lg font-bold text-amber-900 underline underline-offset-4 decoration-amber-600 decoration-2 px-1">
                        {activeStat.student.name}
                      </span>{' '}
                      学员：
                    </p>
                    <p className="text-justify text-xs text-slate-700 leading-normal">
                      在 <span className="font-semibold text-slate-900">{selectedYear}年度</span>{' '}
                      <span className="font-semibold text-slate-900">{classes.find(c => c.id === activeStat.student.classId)?.name}</span>{' '}
                      学习期间，风雨无阻、渴慕真理，出勤率达到{' '}
                      <span className="font-bold text-amber-900 font-mono text-sm">{activeStat.rate}%</span>
                      ，熟记圣经金句{' '}
                      <span className="font-bold text-blue-900 font-mono text-sm">{activeStat.verseCount}</span>{' '}
                      条，展现了对神的敬虔与信实。
                    </p>
                    <p className="font-bold text-sm sm:text-base text-amber-900 py-1">
                      特授予：『 {activeStat.honorTitle} 』
                    </p>
                  </div>

                  {/* Scripture Verse */}
                  <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/90 rounded-lg text-left max-w-md mx-auto">
                    <p className="text-[11px] text-slate-700 font-serif italic leading-relaxed">
                      “你当竭力在神面前得蒙喜悦，作无愧的工人，按着正意分解真理的道。”
                    </p>
                    <p className="text-[10px] text-amber-800 text-right mt-0.5 font-medium">
                      —— 提摩太后书 2:15
                    </p>
                  </div>

                  {/* Signatures & Seal Area */}
                  <div className="mt-6 pt-4 border-t border-amber-200/70 flex items-end justify-between max-w-md mx-auto text-xs text-slate-700">
                    <div className="text-left space-y-1">
                      <p className="text-[11px] text-slate-500">颁证导师：</p>
                      <p className="font-serif font-bold text-slate-800">
                        {classes.find(c => c.id === activeStat.student.classId)?.teacher}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        日期：{selectedYear}年9月
                      </p>
                    </div>

                    {/* Red Mock Seal Stamp */}
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-600/80 flex items-center justify-center p-1 transform rotate-[-8deg] opacity-85 shadow-2xs">
                        <div className="w-full h-full rounded-full border border-dashed border-red-500 flex flex-col items-center justify-center text-center text-red-600 text-[9px] font-serif font-bold leading-tight">
                          <span>★ {config.churchName} ★</span>
                          <span className="text-[10px]">主日学团契印</span>
                          <span>BETHEL CHURCH</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-[11px] text-slate-500">主日学与团契牧长：</p>
                      <p className="font-serif font-bold text-slate-800">陈牧师 / 辅导同工</p>
                      <p className="text-[10px] text-slate-400">证书编号：BTL-{selectedYear}-{activeStat.student.id.slice(-3)}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Quick Actions under Certificate */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                可点击左侧列表切换其他学员姓名实时生成对应证书
              </span>
              <button
                onClick={handlePrintCertificate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印本张荣誉证书</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
