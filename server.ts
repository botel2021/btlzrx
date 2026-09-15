import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import type { Student, ClassGroup, AttendanceRecord, SystemConfig, AdminUser } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initial Classes for Bethel Church (伯特利教会主日学与团契)
const initialClasses: ClassGroup[] = [
  { 
    id: 'class-1', 
    name: '小小班', 
    ageRange: '2-3岁', 
    teacher: '李路得 老师', 
    subjectTeacher: '陈约瑟 老师',
    classroom: '副堂101课室', 
    color: 'bg-emerald-500',
    groupType: 'sunday_school',
    description: '小小班启蒙，圣经故事与赞美诗律动'
  },
  { 
    id: 'class-2', 
    name: '小班', 
    ageRange: '3-4岁', 
    teacher: '张爱华 老师', 
    subjectTeacher: '王信实 老师',
    classroom: '副堂102课室', 
    color: 'bg-teal-500',
    groupType: 'sunday_school',
    description: '幼儿诗歌、圣经小品格与常规模范'
  },
  { 
    id: 'class-3', 
    name: '中班', 
    ageRange: '4-5岁', 
    teacher: '王恩典 老师', 
    subjectTeacher: '刘喜乐 老师',
    classroom: '副堂201课室', 
    color: 'bg-amber-500',
    groupType: 'sunday_school',
    description: '主日学中班，研读神造万物与感恩顺服'
  },
  { 
    id: 'class-4', 
    name: '大班', 
    ageRange: '5-6岁', 
    teacher: '张大卫 老师', 
    subjectTeacher: '周和平 老师',
    classroom: '副堂202课室', 
    color: 'bg-orange-500',
    groupType: 'sunday_school',
    description: '幼小衔接班，研读圣经品格与敬拜学习'
  },
  { 
    id: 'class-5', 
    name: '初中班', 
    ageRange: '12-14岁', 
    teacher: '王提摩太 传道', 
    subjectTeacher: '赵忍耐 老师',
    classroom: '宣教楼301室', 
    color: 'bg-blue-500',
    groupType: 'sunday_school',
    description: '初中学生班，圣经真理根基、门徒训练与少年团契'
  },
  { 
    id: 'class-6', 
    name: '高中班', 
    ageRange: '15-17岁', 
    teacher: '陈保罗 同工', 
    subjectTeacher: '孙恩慈 老师',
    classroom: '宣教楼302室', 
    color: 'bg-indigo-500',
    groupType: 'sunday_school',
    description: '高中门徒，圣经世界观、信仰思辨与基督徒侍奉实践'
  },
  { 
    id: 'class-7', 
    name: '以斯拉团契', 
    ageRange: '18-35岁', 
    teacher: '林腓利 同工', 
    subjectTeacher: '钱良善 老师',
    classroom: '多功能青年活动厅', 
    color: 'bg-purple-500',
    groupType: 'fellowship',
    description: '青年团契，职场得胜见证、诗歌敬拜与专案服侍'
  },
  { 
    id: 'class-8', 
    name: '雅歌团契', 
    ageRange: '家庭与成年', 
    teacher: '赵彼得 长老', 
    subjectTeacher: '吴忠信 老师',
    classroom: '伯特利副堂恩慈厅', 
    color: 'bg-rose-500',
    groupType: 'fellowship',
    description: '成年与家庭团契，夫妻建造、彼此代祷与互助团契'
  }
];

// Helper to compute age from birthDate
function calculateAge(birthDate?: string, fallbackAge?: number): number {
  if (!birthDate) return fallbackAge ?? 0;
  const parts = birthDate.split('-');
  const birthYear = parseInt(parts[0], 10);
  if (isNaN(birthYear)) return fallbackAge ?? 0;
  const birthMonth = parts[1] ? parseInt(parts[1], 10) : 1;
  const birthDay = parts[2] ? parseInt(parts[2], 10) : 1;

  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const monthDiff = (now.getMonth() + 1) - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDay)) {
    age--;
  }
  return Math.max(0, age);
}

// Initial Students / Fellowship Members for Bethel Church (with 出生年月日)
const initialStudents: Student[] = [
  // 小小班 (2-3岁)
  { id: 's-101', name: '陈恩诺 (Enoch)', gender: 'boy', birthDate: '2023-04-12', age: 3, classId: 'class-1', parentName: '陈建国', parentPhone: '13800111201', memberCode: 'BTL-01', joinDate: '2025-09-01' },
  { id: 's-102', name: '周迦南 (Canaan)', gender: 'girl', birthDate: '2023-08-15', age: 3, classId: 'class-1', parentName: '周小芳', parentPhone: '13600448811', memberCode: 'BTL-02', joinDate: '2025-09-01' },
  { id: 's-103', name: '黄乐天 (Joy)', gender: 'boy', birthDate: '2024-02-18', age: 2, classId: 'class-1', parentName: '黄明辉', parentPhone: '13700335621', memberCode: 'BTL-03', joinDate: '2026-03-01' },

  // 小班 (3-4岁)
  { id: 's-201', name: '林恩雅 (Grace)', gender: 'girl', birthDate: '2022-07-20', age: 4, classId: 'class-2', parentName: '林海燕', parentPhone: '13900223342', memberCode: 'BTL-04', joinDate: '2025-09-01' },
  { id: 's-202', name: '赵便雅悯 (Benjamin)', gender: 'boy', birthDate: '2022-11-10', age: 4, classId: 'class-2', parentName: '赵志强', parentPhone: '13100998844', memberCode: 'BTL-05', joinDate: '2026-02-15' },

  // 中班 (4-5岁)
  { id: 's-301', name: '吴主恩 (Charis)', gender: 'girl', birthDate: '2021-05-18', age: 5, classId: 'class-3', parentName: '吴振华', parentPhone: '15900772311', memberCode: 'BTL-06', joinDate: '2025-09-01' },
  { id: 's-302', name: '孙所罗门 (Solomon)', gender: 'boy', birthDate: '2021-09-08', age: 5, classId: 'class-3', parentName: '孙国平', parentPhone: '18800236633', memberCode: 'BTL-07', joinDate: '2025-03-01' },

  // 大班 (5-6岁)
  { id: 's-401', name: '张以诺 (Samuel)', gender: 'boy', birthDate: '2020-03-22', age: 6, classId: 'class-4', parentName: '张建军', parentPhone: '13800559922', memberCode: 'BTL-08', joinDate: '2025-03-01' },
  { id: 's-402', name: '李哈拿 (Hannah)', gender: 'girl', birthDate: '2020-06-25', age: 6, classId: 'class-4', parentName: '李美华', parentPhone: '13500664477', memberCode: 'BTL-09', joinDate: '2024-09-01' },
  { id: 's-403', name: '刘提摩太 (Timothy)', gender: 'boy', birthDate: '2020-10-05', age: 6, classId: 'class-4', parentName: '刘晓琴', parentPhone: '18600887765', memberCode: 'BTL-10', joinDate: '2025-09-01' },

  // 初中班 (12-14岁)
  { id: 's-501', name: '杨多加 (Dorcas)', gender: 'girl', birthDate: '2013-04-14', age: 13, classId: 'class-5', parentName: '杨立新', parentPhone: '13300121122', memberCode: 'BTL-11', joinDate: '2024-09-01' },
  { id: 's-502', name: '冯司提反 (Stephen)', gender: 'boy', birthDate: '2012-11-06', age: 14, classId: 'class-5', parentName: '冯伟民', parentPhone: '15800459090', memberCode: 'BTL-12', joinDate: '2025-09-01' },
  { id: 's-503', name: '郑路得 (Ruth)', gender: 'girl', birthDate: '2014-02-19', age: 12, classId: 'class-5', parentName: '郑晓春', parentPhone: '13400347788', memberCode: 'BTL-13', joinDate: '2024-09-01' },

  // 高中班 (15-17岁)
  { id: 's-601', name: '朱以赛亚 (Isaiah)', gender: 'boy', birthDate: '2010-07-17', age: 16, classId: 'class-6', parentName: '朱明礼', parentPhone: '13900562233', memberCode: 'BTL-14', joinDate: '2023-09-01' },
  { id: 's-602', name: '钱以斯帖 (Esther)', gender: 'girl', birthDate: '2009-09-28', age: 17, classId: 'class-6', parentName: '钱桂英', parentPhone: '13800676611', memberCode: 'BTL-15', joinDate: '2023-09-01' },
  { id: 's-603', name: '许约瑟 (Joseph)', gender: 'boy', birthDate: '2011-03-03', age: 15, classId: 'class-6', parentName: '许德盛', parentPhone: '13600785522', memberCode: 'BTL-16', joinDate: '2023-03-01' },

  // 以斯拉团契 (18-35岁青年)
  { id: 's-701', name: '何保罗 (Paul)', gender: 'boy', birthDate: '2001-08-21', age: 25, classId: 'class-7', parentName: '本人', parentPhone: '18900891100', memberCode: 'BTL-17', joinDate: '2024-03-01' },
  { id: 's-702', name: '梁迦勒 (Caleb Jr)', gender: 'boy', birthDate: '1998-05-12', age: 28, classId: 'class-7', parentName: '本人', parentPhone: '13700902233', memberCode: 'BTL-18', joinDate: '2022-09-01' },

  // 雅歌团契 (成年与家庭)
  { id: 's-801', name: '吴撒拉 (Sarah)', gender: 'girl', birthDate: '1975-11-06', age: 51, classId: 'class-8', parentName: '本人', parentPhone: '13500913344', memberCode: 'BTL-19', joinDate: '2022-09-01' },
  { id: 's-802', name: '沈亚伯拉罕 (Abraham)', gender: 'boy', birthDate: '1970-03-29', age: 56, classId: 'class-8', parentName: '本人', parentPhone: '13800924455', memberCode: 'BTL-20', joinDate: '2021-09-01' }
];

// System Config for Bethel Church
let systemConfig: SystemConfig = {
  churchName: '伯特利教会',
  schoolTitle: '主日学与团契',
  allowedDayOfWeek: 0, // 0 is Sunday
  checkinStartTime: '08:30',
  checkinEndTime: '12:30',
  testMode: true, // Enabled for testing preview
  currentYear: 2026,
  currentSemester: '2026年秋季学期',
  weeklyMemoryVerse: '雅各就给那地方起名叫伯特利。他说：这地方何等可畏！这不是别的，乃是神的殿，也是天的门。',
  memoryVerseReference: '创世记 28:17,19',
  qrSecretToken: 'BETHEL_SUNDAY_2026_TOKEN',

  // Customizable Default Options
  enableMemoryVerseOption: true, // 是否启用「金句背诵」
  defaultMemoryVerseChecked: true, // 打卡时默认是否勾选金句
  enableOfferingOption: false,
  defaultOfferingChecked: false,
  enableLateRule: true, // 是否启用迟到判定
  lateThresholdTime: '09:30', // 迟到判定时刻
  enableExcusedNote: true, // 是否启用请假事由备注
  enableCheckinPopup: true, // 大屏模式实时弹窗
  adminPassword: 'bethel2026', // 管理员登录密码
};

// Preset Admin Accounts for Bethel Church
const presetAdmins: AdminUser[] = [
  { username: 'admin', displayName: '伯特利教会 • 总管理员', role: 'superadmin' },
  { username: 'teacher', displayName: '主日学主班教务老师', role: 'teacher' },
  { username: 'fellowship', displayName: '团契带领同工', role: 'fellowship_leader' }
];

// Active sessions storage
const activeSessions = new Map<string, AdminUser>();

// Helper to verify if requester is superadmin
// 规则：除了总管理员之外，其他账号只有管理签到，没有添加/删除班级与学生的权限
function verifySuperAdminPermission(req: express.Request): { allowed: boolean; role: string; message?: string } {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-admin-token'] as string);
  const userRoleHeader = req.headers['x-user-role'] as string;
  const usernameHeader = req.headers['x-username'] as string;

  // 1. Check session token if present in activeSessions
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    if (session.role === 'superadmin') {
      return { allowed: true, role: 'superadmin' };
    }
    return {
      allowed: false,
      role: session.role,
      message: '权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加或删除班级与学生的权限！'
    };
  }

  // 2. Explicit non-superadmin check from role header
  if (userRoleHeader === 'teacher' || userRoleHeader === 'fellowship_leader') {
    return {
      allowed: false,
      role: userRoleHeader,
      message: '权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加或删除班级与学生的权限！'
    };
  }

  // 3. Superadmin check (e.g. token or credentials of admin)
  if (userRoleHeader === 'superadmin' || (usernameHeader && usernameHeader.toLowerCase() === 'admin')) {
    return { allowed: true, role: 'superadmin' };
  }

  return {
    allowed: false,
    role: 'guest',
    message: '权限不足：除了总管理员之外，其他账号只有管理签到权限，没有添加或删除班级与学生的权限！'
  };
}

let classes: ClassGroup[] = [...initialClasses];
let students: Student[] = [...initialStudents];
let records: AttendanceRecord[] = [];

// Helper to generate historical records for 2026
function generateMockHistoricalRecords() {
  records = [];
  const pastSundays = [
    '2026-06-07', '2026-06-14', '2026-06-21', '2026-06-28',
    '2026-07-05', '2026-07-12', '2026-07-19', '2026-07-26',
    '2026-08-02', '2026-08-09', '2026-08-16', '2026-08-23', '2026-08-30',
    '2026-09-06'
  ];

  pastSundays.forEach((sundayDate, sIdx) => {
    students.forEach((student, stuIdx) => {
      const seed = (sIdx * 19 + stuIdx * 13) % 100;
      let status: 'present' | 'late' | 'excused' | 'absent' = 'present';
      let memoryVerse = true;

      if (seed < 4) {
        status = 'absent';
        memoryVerse = false;
      } else if (seed < 10) {
        status = 'excused';
        memoryVerse = false;
      } else if (seed < 18) {
        status = 'late';
        memoryVerse = seed % 2 === 0;
      } else {
        status = 'present';
        memoryVerse = seed > 20;
      }

      if (status !== 'absent') {
        const hour = status === 'late' ? 9 : 8;
        const minute = status === 'late' ? 35 + (seed % 20) : 45 + (seed % 14);
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        records.push({
          id: `rec-${sundayDate}-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          date: sundayDate,
          timestamp: `${sundayDate}T${timeStr}:00.000Z`,
          timeStr,
          status,
          method: 'attendance',
          memoryVerseCompleted: memoryVerse,
          offeringCompleted: false,
          notes: status === 'excused' ? '外出事由请假' : undefined
        });
      }
    });
  });

  // Today/Current Sunday (2026-09-13)
  const todaySunday = '2026-09-13';
  const initialTodayCheckedIn = ['s-101', 's-102', 's-201', 's-202', 's-301', 's-401', 's-501'];
  initialTodayCheckedIn.forEach((stuId, idx) => {
    const student = students.find(s => s.id === stuId);
    if (student) {
      records.push({
        id: `rec-${todaySunday}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        date: todaySunday,
        timestamp: `${todaySunday}T08:${50 + idx * 2}:15.000Z`,
        timeStr: `08:${50 + idx * 2}`,
        status: 'present',
        method: 'attendance',
        memoryVerseCompleted: true,
        offeringCompleted: false,
        notes: '主日学准时到堂'
      });
    }
  });
}

generateMockHistoricalRecords();

function getActiveSundayDate(): string {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) {
    return now.toISOString().split('T')[0];
  }
  return '2026-09-13';
}

function isCheckinWindowAllowed(now: Date, config: SystemConfig): { allowed: boolean; reason?: string } {
  if (config.testMode) {
    return { allowed: true };
  }

  const day = now.getDay();
  if (day !== config.allowedDayOfWeek) {
    const days = ['主日 (周日)', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      allowed: false,
      reason: `今天为${days[day]}，系统限定仅在礼拜天开放签到。如需测试，请管理员在后台开启“测试模式”。`
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = config.checkinStartTime.split(':').map(Number);
  const [endH, endM] = config.checkinEndTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return {
      allowed: false,
      reason: `当前时间不在签到开放时段内。伯特利教会主日签到开放时间为 ${config.checkinStartTime} 至 ${config.checkinEndTime}。`
    };
  }

  return { allowed: true };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Get entire app state
app.get('/api/state', (req, res) => {
  const activeSunday = getActiveSundayDate();
  res.json({
    config: systemConfig,
    classes,
    students,
    records,
    activeSunday,
    serverTime: new Date().toISOString()
  });
});

// 2. Admin Authentication Login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和登录密码' });
    }

    const trimmedUser = String(username).trim();
    const targetAdmin = presetAdmins.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());

    // Check against configured admin password or preset password
    const validPasswords = [systemConfig.adminPassword || 'bethel2026', 'bethel123', 'fellowship123'];
    const isPasswordValid = validPasswords.includes(password) || password === 'bethel2026';

    if (targetAdmin && isPasswordValid) {
      const userSession: AdminUser = {
        username: targetAdmin.username,
        displayName: targetAdmin.displayName,
        role: targetAdmin.role,
        token: `btl_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };
      activeSessions.set(userSession.token, userSession);
      return res.json({ success: true, user: userSession, message: `欢迎登录，${userSession.displayName}！` });
    }

    // Generic match if user enters custom username with correct admin password
    if (password === (systemConfig.adminPassword || 'bethel2026')) {
      const userSession: AdminUser = {
        username: trimmedUser,
        displayName: `伯特利教会管理员 (${trimmedUser})`,
        role: 'superadmin',
        token: `btl_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };
      activeSessions.set(userSession.token, userSession);
      return res.json({ success: true, user: userSession, message: '登录成功！' });
    }

    return res.status(401).json({ error: '用户名或密码错误，请检查（默认管理员密码：bethel2026）' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student / Member check-in (WeChat scan / mobile QR)
app.post('/api/checkin', (req, res) => {
  try {
    const { studentId, memoryVerseCompleted, offeringCompleted, notes = '' } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: '请选择或输入打卡学员姓名' });
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: '未在伯特利教会名册中找到该学员，请联系老师登记' });
    }

    const now = new Date();
    const windowCheck = isCheckinWindowAllowed(now, systemConfig);
    if (!windowCheck.allowed) {
      return res.status(403).json({ error: windowCheck.reason });
    }

    const targetDate = getActiveSundayDate();
    const existing = records.find(r => r.studentId === studentId && r.date === targetDate);
    if (existing) {
      return res.json({
        success: true,
        alreadyCheckedIn: true,
        record: existing,
        student,
        message: `${student.name} 今天已经完成打卡啦！签到时间：${existing.timeStr}。`
      });
    }

    // Determine late status based on systemConfig.enableLateRule
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const curTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    let isLate = false;
    if (systemConfig.enableLateRule && !systemConfig.testMode) {
      const [lateH, lateM] = (systemConfig.lateThresholdTime || '09:30').split(':').map(Number);
      if (hours > lateH || (hours === lateH && minutes > lateM)) {
        isLate = true;
      }
    }
    const status: 'present' | 'late' = isLate ? 'late' : 'present';

    // Defaults from config
    const verseCheck = memoryVerseCompleted !== undefined 
      ? Boolean(memoryVerseCompleted) 
      : systemConfig.defaultMemoryVerseChecked;
    const offCheck = offeringCompleted !== undefined 
      ? Boolean(offeringCompleted) 
      : systemConfig.defaultOfferingChecked;

    const newRecord: AttendanceRecord = {
      id: `rec-${targetDate}-${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      date: targetDate,
      timestamp: now.toISOString(),
      timeStr: curTimeStr,
      status,
      method: 'wechat_scan',
      memoryVerseCompleted: systemConfig.enableMemoryVerseOption ? verseCheck : false,
      offeringCompleted: systemConfig.enableOfferingOption ? offCheck : false,
      notes: notes ? String(notes).trim() : undefined
    };

    records.push(newRecord);

    res.json({
      success: true,
      record: newRecord,
      student,
      message: `🎉 签到成功！愿主赐福 ${student.name}，主日蒙恩！`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '打卡失败，请重试' });
  }
});

// 4. Manual checkin / excuse / delete
app.post('/api/manual-checkin', (req, res) => {
  try {
    const { studentId, date, status, memoryVerseCompleted, offeringCompleted, notes } = req.body;
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: '学员不存在' });
    }

    const targetDate = date || getActiveSundayDate();
    const existingIdx = records.findIndex(r => r.studentId === studentId && r.date === targetDate);

    if (status === 'absent') {
      if (existingIdx !== -1) {
        records.splice(existingIdx, 1);
      }
      return res.json({ success: true, message: '已标记为缺席/未签到' });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (existingIdx !== -1) {
      records[existingIdx] = {
        ...records[existingIdx],
        status: status || records[existingIdx].status,
        memoryVerseCompleted: memoryVerseCompleted !== undefined ? memoryVerseCompleted : records[existingIdx].memoryVerseCompleted,
        offeringCompleted: offeringCompleted !== undefined ? offeringCompleted : records[existingIdx].offeringCompleted,
        notes: notes !== undefined ? notes : records[existingIdx].notes
      };
      return res.json({ success: true, record: records[existingIdx], message: '考勤记录已更新' });
    }

    const record: AttendanceRecord = {
      id: `rec-${targetDate}-${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      date: targetDate,
      timestamp: now.toISOString(),
      timeStr,
      status: status || 'present',
      method: 'manual_teacher',
      memoryVerseCompleted: memoryVerseCompleted !== undefined ? Boolean(memoryVerseCompleted) : systemConfig.defaultMemoryVerseChecked,
      offeringCompleted: offeringCompleted !== undefined ? Boolean(offeringCompleted) : systemConfig.defaultOfferingChecked,
      notes
    };
    records.push(record);

    res.json({ success: true, record, message: '老师/同工登记成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '操作失败' });
  }
});

// 5. Batch Check-in
app.post('/api/batch-checkin', (req, res) => {
  try {
    const { classId, date, status = 'present' } = req.body;
    const targetDate = date || getActiveSundayDate();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const targetStudents = classId && classId !== 'all'
      ? students.filter(s => s.classId === classId)
      : students;

    let updatedCount = 0;
    targetStudents.forEach(stu => {
      const existingIdx = records.findIndex(r => r.studentId === stu.id && r.date === targetDate);
      if (existingIdx !== -1) {
        records[existingIdx].status = status;
      } else {
        records.push({
          id: `rec-${targetDate}-${stu.id}-${Date.now()}`,
          studentId: stu.id,
          studentName: stu.name,
          classId: stu.classId,
          date: targetDate,
          timestamp: now.toISOString(),
          timeStr,
          status,
          method: 'manual_teacher',
          memoryVerseCompleted: systemConfig.defaultMemoryVerseChecked,
          offeringCompleted: systemConfig.defaultOfferingChecked
        });
      }
      updatedCount++;
    });

    res.json({ success: true, message: `已成功为 ${updatedCount} 位学员登记到校！` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manage Classes (自定义班级/团契名称、班级负责、任课老师、首页显示/隐藏) - 仅限总管理员
app.post('/api/classes', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    const { id, name, ageRange, teacher, subjectTeacher, classroom, color, groupType, description, isHiddenFromHome } = req.body;
    if (!name) {
      return res.status(400).json({ error: '班级/团契名称为必填项' });
    }

    if (id) {
      const idx = classes.findIndex(c => c.id === id);
      if (idx !== -1) {
        classes[idx] = {
          ...classes[idx],
          name,
          ageRange: ageRange || classes[idx].ageRange,
          teacher: teacher || classes[idx].teacher,
          subjectTeacher: subjectTeacher !== undefined ? subjectTeacher : classes[idx].subjectTeacher,
          classroom: classroom || classes[idx].classroom,
          color: color || classes[idx].color,
          groupType: groupType || classes[idx].groupType || 'sunday_school',
          description: description !== undefined ? description : classes[idx].description,
          isHiddenFromHome: isHiddenFromHome !== undefined ? !!isHiddenFromHome : (classes[idx].isHiddenFromHome || false),
        };
        return res.json({ success: true, class: classes[idx], message: '班级信息修改成功' });
      }
    }

    const newClass: ClassGroup = {
      id: `class-${Date.now().toString().slice(-6)}`,
      name,
      ageRange: ageRange || '自选年龄段',
      teacher: teacher || '班级负责人',
      subjectTeacher: subjectTeacher || '任课老师',
      classroom: classroom || '主堂教室',
      color: color || 'bg-amber-500',
      groupType: groupType || 'sunday_school',
      description: description || '',
      isHiddenFromHome: !!isHiddenFromHome,
    };
    classes.push(newClass);
    res.json({ success: true, class: newClass, message: '成功新增班级/团契' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Class - 仅限总管理员
app.delete('/api/classes/:id', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    const { id } = req.params;
    const enrolledStudents = students.filter(s => s.classId === id);
    
    // Clean enrolled students and their records
    const studentIdsToDelete = new Set(enrolledStudents.map(s => s.id));
    students = students.filter(s => s.classId !== id);
    records = records.filter(r => !studentIdsToDelete.has(r.studentId));

    const idx = classes.findIndex(c => c.id === id);
    if (idx !== -1) {
      const clsName = classes[idx].name;
      classes.splice(idx, 1);
      return res.json({ 
        success: true, 
        message: `班级【${clsName}】已成功删除${enrolledStudents.length > 0 ? `（同时清除了 ${enrolledStudents.length} 名在册学员档案）` : ''}` 
      });
    }
    res.status(404).json({ error: '班级不存在' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Manage Students (单人添加/修改) - 仅限总管理员
app.post('/api/students', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    let { id, name, gender, birthDate, age, classId, parentName, parentPhone, memberCode } = req.body;
    if (!name || !classId) {
      return res.status(400).json({ error: '姓名与所属班级/团契为必填项' });
    }

    // If birthDate not provided, generate from age; otherwise calculate age from birthDate
    if (!birthDate && age) {
      const year = new Date().getFullYear() - Number(age);
      birthDate = `${year}-06-01`;
    } else if (!birthDate) {
      birthDate = '2019-06-01';
    }

    const computedAge = calculateAge(birthDate, Number(age) || 7);

    if (id) {
      const idx = students.findIndex(s => s.id === id);
      if (idx !== -1) {
        students[idx] = { 
          ...students[idx], 
          name, 
          gender: gender || 'boy', 
          birthDate,
          age: computedAge, 
          classId, 
          parentName: parentName || '', 
          parentPhone: parentPhone || '',
          memberCode: memberCode || students[idx].memberCode
        };
        return res.json({ success: true, student: students[idx], message: '学员信息已更新' });
      }
    }

    const nextCodeNum = students.length + 1;
    const newStudent: Student = {
      id: `s-${Date.now().toString().slice(-6)}`,
      name,
      gender: gender || 'boy',
      birthDate,
      age: computedAge,
      classId,
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      memberCode: memberCode || `BTL-${String(nextCodeNum).padStart(2, '0')}`,
      joinDate: new Date().toISOString().split('T')[0]
    };
    students.push(newStudent);
    res.json({ success: true, student: newStudent, message: '学员档案建立成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Import Students - 仅限总管理员
app.post('/api/students/batch', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    const { classId, namesText, defaultGender = 'boy', defaultBirthDate, defaultAge } = req.body;
    if (!classId || !namesText) {
      return res.status(400).json({ error: '请选择班级并输入学员姓名列表' });
    }

    // Calculate birthDate & age
    let birthDate = defaultBirthDate;
    if (!birthDate) {
      const ageNum = Number(defaultAge) || 7;
      birthDate = `${new Date().getFullYear() - ageNum}-06-01`;
    }
    const computedAge = calculateAge(birthDate, Number(defaultAge) || 7);

    // Split names by comma, newline or space
    const rawNames = String(namesText)
      .split(/[\n,，\s]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (rawNames.length === 0) {
      return res.status(400).json({ error: '未识别到有效姓名' });
    }

    const added: Student[] = [];
    rawNames.forEach((name, i) => {
      const nextCodeNum = students.length + 1;
      const stu: Student = {
        id: `s-${Date.now().toString().slice(-5)}${i}`,
        name,
        gender: defaultGender,
        birthDate,
        age: computedAge,
        classId,
        parentName: '家长/联系人',
        parentPhone: '138****0000',
        memberCode: `BTL-${String(nextCodeNum).padStart(2, '0')}`,
        joinDate: new Date().toISOString().split('T')[0]
      };
      students.push(stu);
      added.push(stu);
    });

    res.json({ success: true, count: added.length, message: `成功批量录入 ${added.length} 名学员，已自动推算年龄为 ${computedAge} 岁！` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student - 仅限总管理员
app.delete('/api/students/:id', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    const { id } = req.params;
    const idx = students.findIndex(s => s.id === id);
    if (idx !== -1) {
      students.splice(idx, 1);
      // clean associated records
      records = records.filter(r => r.studentId !== id);
      return res.json({ success: true, message: '学员已从名册中移除' });
    }
    res.status(404).json({ error: '学员不存在' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Update System Config & Default Options - 仅限总管理员
app.post('/api/config', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    const updates = req.body;
    systemConfig = { ...systemConfig, ...updates };
    res.json({ success: true, config: systemConfig, message: '系统设置与默认选项已成功保存！' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Reset data with Bethel Church default dataset - 仅限总管理员
app.post('/api/reset-data', (req, res) => {
  try {
    const auth = verifySuperAdminPermission(req);
    if (!auth.allowed) {
      return res.status(403).json({ error: auth.message });
    }

    classes = [...initialClasses];
    students = [...initialStudents];
    systemConfig = {
      ...systemConfig,
      churchName: '伯特利教会',
      schoolTitle: '主日学与团契',
    };
    generateMockHistoricalRecords();
    res.json({ success: true, message: '已重置为伯特利教会主日学与团契官方示范数据' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const possibleDistPaths = [
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, 'dist'),
      path.join(__dirname, '../dist'),
      __dirname
    ];
    const distPath = possibleDistPaths.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) || possibleDistPaths[0];
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send(`<!DOCTYPE html><html><body><h3>应用加载中...</h3><p>请稍候刷新页面。</p></body></html>`);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bethel Church Sunday School & Fellowship Attendance App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
