import { initialClasses, initialStudents, initialSystemConfig, generateInitialRecords } from '../mockData';
import type { ClassGroup, Student, SystemConfig, AttendanceRecord, AdminUser } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'bethel_classes',
  STUDENTS: 'bethel_students',
  CONFIG: 'bethel_config',
  RECORDS: 'bethel_records',
  ACTIVE_SUNDAY: 'bethel_active_sunday',
  INITIALIZED: 'bethel_data_initialized'
};

export function getLocalData() {
  if (typeof window === 'undefined') {
    return {
      classes: initialClasses,
      students: initialStudents,
      config: initialSystemConfig,
      records: generateInitialRecords(),
      activeSunday: '2026-09-13'
    };
  }

  try {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      const records = generateInitialRecords(initialStudents);
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialSystemConfig));
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SUNDAY, '2026-09-13');
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      return {
        classes: initialClasses,
        students: initialStudents,
        config: initialSystemConfig,
        records,
        activeSunday: '2026-09-13'
      };
    }

    const rawClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
    const classes: ClassGroup[] = rawClasses ? JSON.parse(rawClasses) : initialClasses;

    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const students: Student[] = rawStudents ? JSON.parse(rawStudents) : initialStudents;

    const rawConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const config: SystemConfig = rawConfig ? { ...initialSystemConfig, ...JSON.parse(rawConfig) } : initialSystemConfig;

    const rawRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const records: AttendanceRecord[] = rawRecords ? JSON.parse(rawRecords) : generateInitialRecords(students);

    const rawSunday = localStorage.getItem(STORAGE_KEYS.ACTIVE_SUNDAY);
    const activeSunday = rawSunday || '2026-09-13';

    return { classes, students, config, records, activeSunday };
  } catch (e) {
    console.warn('Failed reading from localStorage, using fallback defaults', e);
    return {
      classes: initialClasses,
      students: initialStudents,
      config: initialSystemConfig,
      records: generateInitialRecords(initialStudents),
      activeSunday: '2026-09-13'
    };
  }
}

export function saveLocalData(data: {
  classes?: ClassGroup[];
  students?: Student[];
  config?: SystemConfig;
  records?: AttendanceRecord[];
  activeSunday?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    if (data.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data.classes));
    if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
    if (data.records) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    if (data.activeSunday) localStorage.setItem(STORAGE_KEYS.ACTIVE_SUNDAY, data.activeSunday);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } catch (e) {
    console.warn('Failed saving to localStorage', e);
  }
}

export function resetLocalData() {
  if (typeof window === 'undefined') return;
  try {
    const records = generateInitialRecords(initialStudents);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialSystemConfig));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SUNDAY, '2026-09-13');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return {
      classes: initialClasses,
      students: initialStudents,
      config: initialSystemConfig,
      records,
      activeSunday: '2026-09-13'
    };
  } catch (e) {
    console.warn('Failed resetting localStorage', e);
  }
}

export function localLogin(username: string, password: string): AdminUser | null {
  const cleanU = username.trim().toLowerCase();
  const cleanP = password.trim();

  // Superadmin
  if (cleanU === 'admin') {
    const local = getLocalData();
    const adminPass = local.config.adminPassword || 'bethel2026';
    if (cleanP === adminPass || cleanP === 'bethel2026') {
      return {
        username: 'admin',
        displayName: '伯特利教会 • 主任牧师/管理员',
        role: 'superadmin',
        token: 'local-admin-token'
      };
    }
  }

  // Teacher
  if (cleanU === 'teacher' && (cleanP === 'teacher2026' || cleanP === '123456')) {
    return {
      username: 'teacher',
      displayName: '主日学主班教务老师',
      role: 'teacher',
      token: 'local-teacher-token'
    };
  }

  // Fellowship Leader
  if (cleanU === 'fellowship' && (cleanP === 'fellowship2026' || cleanP === '123456')) {
    return {
      username: 'fellowship',
      displayName: '团契带领同工',
      role: 'fellowship_leader',
      token: 'local-fellowship-token'
    };
  }

  return null;
}
