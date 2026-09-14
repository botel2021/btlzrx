// Date utilities for Sunday school calendar and check-in validation

export function getSundaysInMonth(year: number, monthIndex: number): string[] {
  // monthIndex: 0-11
  const sundays: string[] = [];
  const date = new Date(year, monthIndex, 1);
  while (date.getMonth() === monthIndex) {
    if (date.getDay() === 0) {
      sundays.push(formatDateYMD(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}

export function getAllSundaysInYear(year: number): string[] {
  const sundays: string[] = [];
  const date = new Date(year, 0, 1);
  while (date.getFullYear() === year) {
    if (date.getDay() === 0) {
      sundays.push(formatDateYMD(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}

export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatChineseDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export function formatShortChineseDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
}

export function getDayOfWeekName(date: Date): string {
  const days = ['主日 (周日)', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

export function checkIsWithinSundayWindow(
  now: Date,
  checkinStartTime: string,
  checkinEndTime: string,
  testMode: boolean
): { isAllowed: boolean; statusMsg: string; isSunday: boolean } {
  const isSunday = now.getDay() === 0;

  if (testMode) {
    return {
      isAllowed: true,
      statusMsg: '测试模式中：已解除时间限制，全天候均可打卡签到',
      isSunday,
    };
  }

  if (!isSunday) {
    const dayName = getDayOfWeekName(now);
    return {
      isAllowed: false,
      statusMsg: `今日为${dayName}。主日学签到只限礼拜天 ${checkinStartTime}~${checkinEndTime} 开放。`,
      isSunday: false,
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = checkinStartTime.split(':').map(Number);
  const [eh, em] = checkinEndTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (currentMinutes < startMin) {
    return {
      isAllowed: false,
      statusMsg: `签到未开放。今日签到将于 ${checkinStartTime} 正式开启。`,
      isSunday: true,
    };
  }

  if (currentMinutes > endMin) {
    return {
      isAllowed: false,
      statusMsg: `今日签到已于 ${checkinEndTime} 截止。如有漏签请联系主日学老师补录。`,
      isSunday: true,
    };
  }

  return {
    isAllowed: true,
    statusMsg: `主日学签到开放中 (${checkinStartTime} - ${checkinEndTime})`,
    isSunday: true,
  };
}
