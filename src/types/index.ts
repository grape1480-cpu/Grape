export type BangkokZone =
  | 'กรุงเทพกลาง'
  | 'กรุงเทพใต้'
  | 'กรุงเทพเหนือ'
  | 'กรุงเทพตะวันออก'
  | 'กรุงธนเหนือ'
  | 'กรุงธนใต้';

export type SportType =
  | 'ฟุตบอล / ฟุตซอล'
  | 'บาสเกตบอล'
  | 'แบดมินตัน'
  | 'วิ่ง / จ็อกกิ้ง'
  | 'สระว่ายน้ำ'
  | 'ฟิตเนส / เวทเทรนนิ่ง'
  | 'เทนนิส / พิคเคิลบอล'
  | 'วอลเลย์บอล'
  | 'ปิงปอง'
  | 'แอโรบิก / โยคะ'
  | 'เปตอง'
  | 'สเก็ตบอร์ด / เอ็กซ์ตรีม'
  | 'ตะกร้อ'
  | 'มวยไทย / ศิลปะการต่อสู้';

export type AgeGroup =
  | 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)'
  | 'วัยรุ่น/นักศึกษา (18-24 ปี)'
  | 'วัยทำงาน (25-45 ปี)'
  | 'วัยผู้ใหญ่ (46-59 ปี)'
  | 'ผู้สูงอายุ (60 ปีขึ้นไป)';

export type Gender = 'ชาย' | 'หญิง' | 'LGBTQ+' | 'ไม่ระบุ';

export type CapacityAlertLevel = 'normal' | 'moderate' | 'warning' | 'critical';

export interface Stadium {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  zone: BangkokZone;
  address: string;
  maxCapacity: number;
  currentOccupancy: number;
  sportsAvailable: SportType[];
  openingHours: string;
  phone: string;
  amenities: string[];
  imageUrl?: string;
  status: 'open' | 'closed' | 'maintenance';
}

export interface CheckInRecord {
  id: string;
  stadiumId: string;
  stadiumName: string;
  districtName: string;
  zone: BangkokZone;
  userName?: string;
  phone?: string;
  age: number;
  ageGroup: AgeGroup;
  gender: Gender;
  sportType: SportType;
  durationMinutes: number; // e.g., 60, 90, 120
  partySize: number; // default 1
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string if checked out
  isActive: boolean; // true if currently inside
  notes?: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  totalCheckIns: number;
  uniqueUsers: number;
  peakHour: string;
  peakCount: number;
  topSport: SportType;
  overcrowdIncidents: number;
}

export interface CapacityStatus {
  stadiumId: string;
  currentOccupancy: number;
  maxCapacity: number;
  percentage: number;
  level: CapacityAlertLevel;
  alertMessage: string;
  isOvercrowded: boolean;
  canAcceptMore: boolean;
}
