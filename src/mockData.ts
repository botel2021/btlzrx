import type { ClassGroup, Student, SystemConfig, AttendanceRecord, AdminUser } from './types';

export const initialClasses: ClassGroup[] = [
  { 
    id: 'class-1', 
    name: '喜乐幼童班 (3-5岁幼儿)', 
    ageRange: '3-5岁', 
    teacher: '李路得 老师', 
    classroom: '副堂101课室', 
    color: 'bg-emerald-500',
    groupType: 'sunday_school',
    targetCapacity: 15,
    description: '主日学低幼启蒙班，圣经故事与赞美诗律动'
  },
  { 
    id: 'class-2', 
    name: '恩典约书亚班 (6-8岁初小)', 
    ageRange: '6-8岁', 
    teacher: '张大卫 老师', 
    classroom: '副堂202课室', 
    color: 'bg-amber-500',
    groupType: 'sunday_school',
    targetCapacity: 20,
    description: '初小学生班，研读圣经品格与主日学金句背诵'
  },
  { 
    id: 'class-3', 
    name: '信望爱少年班 (9-12岁高小)', 
    ageRange: '9-12岁', 
    teacher: '王提摩太 传道', 
    classroom: '宣教楼301室', 
    color: 'bg-blue-500',
    groupType: 'sunday_school',
    targetCapacity: 25,
    description: '高小学生班，圣经地理、门徒训练与基督徒品格实践'
  },
  { 
    id: 'class-4', 
    name: '提摩太青年团契 (初高青少)', 
    ageRange: '13-18岁', 
    teacher: '陈保罗 同工', 
    classroom: '多功能青年活动厅', 
    color: 'bg-purple-500',
    groupType: 'fellowship',
    targetCapacity: 30,
    description: '伯特利青少团契，诗歌敬拜、信仰答疑与小组分享'
  },
  { 
    id: 'class-5', 
    name: '迦勒常青团契 (成年与长者)', 
    ageRange: '50岁以上', 
    teacher: '赵彼得 长老', 
    classroom: '伯特利副堂恩慈厅', 
    color: 'bg-rose-500',
    groupType: 'fellowship',
    targetCapacity: 35,
    description: '长者长青团契，彼此代祷、赞美读经与团契互助'
  }
];

export const initialStudents: Student[] = [
  { id: 's-101', name: '陈恩诺 (Enoch)', gender: 'boy', birthDate: '2022-03-15', age: 4, classId: 'class-1', parentName: '陈建国', parentPhone: '13800111201', memberCode: 'BTL-01', joinDate: '2025-09-01' },
  { id: 's-102', name: '林恩雅 (Grace)', gender: 'girl', birthDate: '2021-07-20', age: 5, classId: 'class-1', parentName: '林海燕', parentPhone: '13900223342', memberCode: 'BTL-02', joinDate: '2025-09-01' },
  { id: 's-103', name: '黄乐天 (Joy)', gender: 'boy', birthDate: '2022-05-08', age: 4, classId: 'class-1', parentName: '黄明辉', parentPhone: '13700335621', memberCode: 'BTL-03', joinDate: '2026-03-01' },
  { id: 's-104', name: '周迦南 (Canaan)', gender: 'girl', birthDate: '2021-04-12', age: 5, classId: 'class-1', parentName: '周小芳', parentPhone: '13600448811', memberCode: 'BTL-04', joinDate: '2025-09-01' },

  { id: 's-201', name: '张以诺 (Samuel)', gender: 'boy', birthDate: '2019-02-18', age: 7, classId: 'class-2', parentName: '张建军', parentPhone: '13800559922', memberCode: 'BTL-05', joinDate: '2025-03-01' },
  { id: 's-202', name: '李哈拿 (Hannah)', gender: 'girl', birthDate: '2018-06-25', age: 8, classId: 'class-2', parentName: '李美华', parentPhone: '13500664477', memberCode: 'BTL-06', joinDate: '2024-09-01' },
  { id: 's-203', name: '吴主恩 (Charis)', gender: 'girl', birthDate: '2019-08-10', age: 7, classId: 'class-2', parentName: '吴振华', parentPhone: '15900772311', memberCode: 'BTL-07', joinDate: '2025-09-01' },
  { id: 's-204', name: '刘提摩太 (Timothy)', gender: 'boy', birthDate: '2018-10-05', age: 8, classId: 'class-2', parentName: '刘晓琴', parentPhone: '18600887765', memberCode: 'BTL-08', joinDate: '2025-09-01' },
  { id: 's-205', name: '赵便雅悯 (Benjamin)', gender: 'boy', birthDate: '2020-04-22', age: 6, classId: 'class-2', parentName: '赵志强', parentPhone: '13100998844', memberCode: 'BTL-09', joinDate: '2026-02-15' },

  { id: 's-301', name: '杨多加 (Dorcas)', gender: 'girl', birthDate: '2016-01-14', age: 10, classId: 'class-3', parentName: '杨立新', parentPhone: '13300121122', memberCode: 'BTL-10', joinDate: '2024-09-01' },
  { id: 's-302', name: '孙所罗门 (Solomon)', gender: 'boy', birthDate: '2015-05-30', age: 11, classId: 'class-3', parentName: '孙国平', parentPhone: '18800236633', memberCode: 'BTL-11', joinDate: '2024-03-01' },
  { id: 's-303', name: '郑路得 (Ruth)', gender: 'girl', birthDate: '2015-08-19', age: 11, classId: 'class-3', parentName: '郑晓春', parentPhone: '13400347788', memberCode: 'BTL-12', joinDate: '2024-09-01' },
  { id: 's-304', name: '冯司提反 (Stephen)', gender: 'boy', birthDate: '2014-04-06', age: 12, classId: 'class-3', parentName: '冯伟民', parentPhone: '15800459090', memberCode: 'BTL-13', joinDate: '2025-09-01' },

  { id: 's-401', name: '朱以赛亚 (Isaiah)', gender: 'boy', birthDate: '2012-07-17', age: 14, classId: 'class-4', parentName: '朱明礼', parentPhone: '13900562233', memberCode: 'BTL-14', joinDate: '2023-09-01' },
  { id: 's-402', name: '钱以斯帖 (Esther)', gender: 'girl', birthDate: '2011-09-28', age: 15, classId: 'class-4', parentName: '钱桂英', parentPhone: '13800676611', memberCode: 'BTL-15', joinDate: '2023-09-01' },
  { id: 's-403', name: '许约瑟 (Joseph)', gender: 'boy', birthDate: '2010-03-03', age: 16, classId: 'class-4', parentName: '许德盛', parentPhone: '13600785522', memberCode: 'BTL-16', joinDate: '2023-03-01' },
  { id: 's-404', name: '何保罗 (Paul)', gender: 'boy', birthDate: '2009-08-21', age: 17, classId: 'class-4', parentName: '何清华', parentPhone: '18900891100', memberCode: 'BTL-17', joinDate: '2024-03-01' },

  { id: 's-501', name: '梁迦勒 (Caleb)', gender: 'boy', birthDate: '1964-05-12', age: 62, classId: 'class-5', parentName: '本人', parentPhone: '13700902233', memberCode: 'BTL-18', joinDate: '2022-09-01' },
  { id: 's-502', name: '吴撒拉 (Sarah)', gender: 'girl', birthDate: '1968-11-06', age: 58, classId: 'class-5', parentName: '本人', parentPhone: '13500913344', memberCode: 'BTL-19', joinDate: '2022-09-01' },
  { id: 's-503', name: '沈亚伯拉罕 (Abraham)', gender: 'boy', birthDate: '1960-03-29', age: 66, classId: 'class-5', parentName: '本人', parentPhone: '13800924455', memberCode: 'BTL-20', joinDate: '2021-09-01' }
];

export const initialSystemConfig: SystemConfig = {
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
};

export const presetAdmins: AdminUser[] = [
  { username: 'admin', displayName: '伯特利教会 • 主任牧师/管理员', role: 'superadmin' },
  { username: 'teacher', displayName: '主日学主班教务老师', role: 'teacher' },
  { username: 'fellowship', displayName: '团契带领同工', role: 'fellowship_leader' }
];

export function generateInitialRecords(studentsList: Student[] = initialStudents): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const pastSundays = [
    '2026-06-07', '2026-06-14', '2026-06-21', '2026-06-28',
    '2026-07-05', '2026-07-12', '2026-07-19', '2026-07-26',
    '2026-08-02', '2026-08-09', '2026-08-16', '2026-08-23', '2026-08-30',
    '2026-09-06'
  ];

  pastSundays.forEach((sundayDate, sIdx) => {
    studentsList.forEach((student, stuIdx) => {
      const seed = (sIdx * 19 + stuIdx * 13) % 100;
      let status: 'present' | 'late' | 'excused' | 'absent' = 'present';
      let memoryVerse = true;

      if (seed < 4) {
        status = 'absent';
        memoryVerse = false;
      } else if (seed < 10) {
        status = 'excused';
        memoryVerse = false;
      } else if (seed < 22) {
        status = 'late';
        memoryVerse = true;
      }

      records.push({
        id: `rec-${sundayDate}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        date: sundayDate,
        timestamp: `${sundayDate}T${status === 'late' ? '09:42:15' : '09:05:30'}Z`,
        timeStr: status === 'late' ? '09:42' : '09:05',
        status,
        method: 'attendance',
        memoryVerseCompleted: memoryVerse,
        offeringCompleted: (seed % 3) === 0,
        notes: status === 'excused' ? '家长微信提前请假' : ''
      });
    });
  });

  return records;
}
