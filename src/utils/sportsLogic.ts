import type { AgeGroup, CapacityAlertLevel, CapacityStatus, CheckInRecord, SportType } from '../types/index.ts';

/**
 * Categorize age into official public health / BMA age brackets
 */
export function calculateAgeGroup(age: number): AgeGroup {
  if (age < 18) {
    return 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)';
  } else if (age <= 24) {
    return 'วัยรุ่น/นักศึกษา (18-24 ปี)';
  } else if (age <= 45) {
    return 'วัยทำงาน (25-45 ปี)';
  } else if (age <= 59) {
    return 'วัยผู้ใหญ่ (46-59 ปี)';
  } else {
    return 'ผู้สูงอายุ (60 ปีขึ้นไป)';
  }
}

/**
 * Determine stadium capacity status and safety alert level
 * Thresholds:
 * - < 60%: normal (ว่าง/พร้อมใช้งาน)
 * - 60% - 79%: moderate (เริ่มมีผู้ใช้บริการ)
 * - 80% - 94%: warning (หนาแน่นสูง - เตรียมจำกัดการเข้า)
 * - >= 95%: critical (เกินขีดจำกัดความปลอดภัย - ปิดรับชั่วคราว)
 */
export function getCapacityStatus(
  currentOccupancy: number,
  maxCapacity: number,
  stadiumId: string = ''
): CapacityStatus {
  if (maxCapacity <= 0) {
    return {
      stadiumId,
      currentOccupancy: 0,
      maxCapacity: 1,
      percentage: 0,
      level: 'normal',
      alertMessage: 'ข้อมูลความจุไม่ถูกต้อง',
      isOvercrowded: false,
      canAcceptMore: true,
    };
  }

  const safeCurrent = Math.max(0, currentOccupancy);
  const percentage = Math.round((safeCurrent / maxCapacity) * 100);

  let level: CapacityAlertLevel = 'normal';
  let alertMessage = 'สนามพร้อมให้บริการตามปกติ อัตราใช้งานต่ำ';
  let isOvercrowded = false;
  let canAcceptMore = true;

  if (percentage >= 95) {
    level = 'critical';
    alertMessage = '⚠️ อันตราย! สนามหนาแน่นเกินกำหนดความปลอดภัย กรุณาชะลอการเข้าและรอผู้ใช้ชุดเดิมเช็คเอาท์';
    isOvercrowded = true;
    canAcceptMore = false;
  } else if (percentage >= 80) {
    level = 'warning';
    alertMessage = '⚡ แจ้งเตือน! ความหนาแน่นใกล้เต็มพิกัด (เกิน 80%) เจ้าหน้าที่โปรดเฝ้าระวังความปลอดภัย';
    isOvercrowded = true;
    canAcceptMore = true;
  } else if (percentage >= 60) {
    level = 'moderate';
    alertMessage = 'ความหนาแน่นปานกลาง มีผู้ใช้บริการต่อเนื่อง สามารถเข้าใช้งานได้';
    isOvercrowded = false;
    canAcceptMore = true;
  }

  return {
    stadiumId,
    currentOccupancy: safeCurrent,
    maxCapacity,
    percentage,
    level,
    alertMessage,
    isOvercrowded,
    canAcceptMore,
  };
}

/**
 * Group check-in records by date string (YYYY-MM-DD)
 */
export function groupRecordsByDate(records: CheckInRecord[]): Record<string, CheckInRecord[]> {
  const map: Record<string, CheckInRecord[]> = {};
  for (const r of records) {
    const dateStr = r.checkInTime.slice(0, 10);
    if (!map[dateStr]) {
      map[dateStr] = [];
    }
    map[dateStr].push(r);
  }
  return map;
}

/**
 * Calculate sports popularity ranking from records
 */
export function getSportPopularity(records: CheckInRecord[]): {
  sport: SportType;
  count: number;
  totalParticipants: number;
  percentage: number;
}[] {
  const countMap = new Map<SportType, { count: number; totalParticipants: number }>();
  let totalAll = 0;

  for (const r of records) {
    const prev = countMap.get(r.sportType) || { count: 0, totalParticipants: 0 };
    const participants = r.partySize || 1;
    countMap.set(r.sportType, {
      count: prev.count + 1,
      totalParticipants: prev.totalParticipants + participants,
    });
    totalAll += participants;
  }

  const result = Array.from(countMap.entries()).map(([sport, stats]) => ({
    sport,
    count: stats.count,
    totalParticipants: stats.totalParticipants,
    percentage: totalAll > 0 ? Math.round((stats.totalParticipants / totalAll) * 100) : 0,
  }));

  return result.sort((a, b) => b.totalParticipants - a.totalParticipants);
}

/**
 * Calculate age group distribution from records
 */
export function getAgeDistribution(records: CheckInRecord[]): {
  ageGroup: AgeGroup;
  count: number;
  percentage: number;
  avgDuration: number;
}[] {
  const groups: AgeGroup[] = [
    'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)',
    'วัยรุ่น/นักศึกษา (18-24 ปี)',
    'วัยทำงาน (25-45 ปี)',
    'วัยผู้ใหญ่ (46-59 ปี)',
    'ผู้สูงอายุ (60 ปีขึ้นไป)',
  ];

  const map = new Map<AgeGroup, { count: number; totalDuration: number }>();
  for (const g of groups) {
    map.set(g, { count: 0, totalDuration: 0 });
  }

  let totalCount = 0;
  for (const r of records) {
    const item = map.get(r.ageGroup) || { count: 0, totalDuration: 0 };
    item.count += r.partySize || 1;
    item.totalDuration += (r.durationMinutes || 60) * (r.partySize || 1);
    map.set(r.ageGroup, item);
    totalCount += r.partySize || 1;
  }

  return groups.map((g) => {
    const stats = map.get(g)!;
    return {
      ageGroup: g,
      count: stats.count,
      percentage: totalCount > 0 ? Math.round((stats.count / totalCount) * 100) : 0,
      avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
    };
  });
}

/**
 * Calculate hourly peak distribution (0-23 hours)
 */
export function getHourlyPeakAnalysis(records: CheckInRecord[]): {
  hour: number;
  label: string;
  count: number;
}[] {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    count: 0,
  }));

  for (const r of records) {
    try {
      const d = new Date(r.checkInTime);
      const h = d.getHours();
      if (h >= 0 && h < 24) {
        hours[h].count += r.partySize || 1;
      }
    } catch {
      // ignore date parse issues
    }
  }

  return hours;
}

/**
 * Format CSV content for export
 */
export function exportRecordsToCsv(records: CheckInRecord[]): string {
  const headers = [
    'รหัสเช็คอิน (ID)',
    'วันที่-เวลา (Check-in Time)',
    'ชื่อสนามกีฬา (Stadium)',
    'เขต (District)',
    'โซน (Zone)',
    'ประเภทกีฬา (Sport)',
    'อายุ (Age)',
    'กลุ่มอายุ (Age Group)',
    'เพศ (Gender)',
    'ระยะเวลา (นาที)',
    'จำนวนคน (Party Size)',
    'สถานะ (Status)',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${new Date(r.checkInTime).toLocaleString('th-TH')}"`,
    `"${r.stadiumName}"`,
    `"${r.districtName}"`,
    `"${r.zone}"`,
    `"${r.sportType}"`,
    r.age,
    `"${r.ageGroup}"`,
    `"${r.gender}"`,
    r.durationMinutes,
    r.partySize,
    r.isActive ? '"กำลังใช้งาน"' : '"เช็คเอาท์แล้ว"',
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}
