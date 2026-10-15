import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAgeGroup,
  getCapacityStatus,
  getSportPopularity,
  getAgeDistribution,
  getHourlyPeakAnalysis,
} from './sportsLogic.ts';
import type { CheckInRecord } from '../types/index.ts';

test('calculateAgeGroup categorizes ages into correct demographic brackets', () => {
  assert.equal(calculateAgeGroup(15), 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)');
  assert.equal(calculateAgeGroup(17), 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)');
  assert.equal(calculateAgeGroup(18), 'วัยรุ่น/นักศึกษา (18-24 ปี)');
  assert.equal(calculateAgeGroup(24), 'วัยรุ่น/นักศึกษา (18-24 ปี)');
  assert.equal(calculateAgeGroup(25), 'วัยทำงาน (25-45 ปี)');
  assert.equal(calculateAgeGroup(45), 'วัยทำงาน (25-45 ปี)');
  assert.equal(calculateAgeGroup(46), 'วัยผู้ใหญ่ (46-59 ปี)');
  assert.equal(calculateAgeGroup(59), 'วัยผู้ใหญ่ (46-59 ปี)');
  assert.equal(calculateAgeGroup(60), 'ผู้สูงอายุ (60 ปีขึ้นไป)');
  assert.equal(calculateAgeGroup(80), 'ผู้สูงอายุ (60 ปีขึ้นไป)');
});

test('getCapacityStatus accurately assigns warning and critical alert levels', () => {
  // Low occupancy: 50 / 200 = 25%
  const normal = getCapacityStatus(50, 200, 'stad-1');
  assert.equal(normal.percentage, 25);
  assert.equal(normal.level, 'normal');
  assert.equal(normal.isOvercrowded, false);
  assert.equal(normal.canAcceptMore, true);

  // Moderate: 140 / 200 = 70%
  const moderate = getCapacityStatus(140, 200, 'stad-1');
  assert.equal(moderate.percentage, 70);
  assert.equal(moderate.level, 'moderate');
  assert.equal(moderate.isOvercrowded, false);

  // Warning: 170 / 200 = 85%
  const warning = getCapacityStatus(170, 200, 'stad-1');
  assert.equal(warning.percentage, 85);
  assert.equal(warning.level, 'warning');
  assert.equal(warning.isOvercrowded, true);
  assert.equal(warning.canAcceptMore, true);

  // Critical Overcrowding: 195 / 200 = 98%
  const critical = getCapacityStatus(195, 200, 'stad-1');
  assert.equal(critical.percentage, 98);
  assert.equal(critical.level, 'critical');
  assert.equal(critical.isOvercrowded, true);
  assert.equal(critical.canAcceptMore, false);
});

test('getSportPopularity calculates rankings based on participants', () => {
  const sampleRecords: CheckInRecord[] = [
    {
      id: '1',
      stadiumId: 's1',
      stadiumName: 'สนามกีฬา กทม.',
      districtName: 'ดินแดง',
      zone: 'กรุงเทพกลาง',
      age: 22,
      ageGroup: 'วัยรุ่น/นักศึกษา (18-24 ปี)',
      gender: 'ชาย',
      sportType: 'บาสเกตบอล',
      durationMinutes: 60,
      partySize: 5,
      checkInTime: '2026-10-15T08:00:00Z',
      isActive: true,
    },
    {
      id: '2',
      stadiumId: 's1',
      stadiumName: 'สนามกีฬา กทม.',
      districtName: 'ดินแดง',
      zone: 'กรุงเทพกลาง',
      age: 30,
      ageGroup: 'วัยทำงาน (25-45 ปี)',
      gender: 'หญิง',
      sportType: 'วิ่ง / จ็อกกิ้ง',
      durationMinutes: 45,
      partySize: 2,
      checkInTime: '2026-10-15T08:15:00Z',
      isActive: true,
    },
    {
      id: '3',
      stadiumId: 's1',
      stadiumName: 'สนามกีฬา กทม.',
      districtName: 'ดินแดง',
      zone: 'กรุงเทพกลาง',
      age: 35,
      ageGroup: 'วัยทำงาน (25-45 ปี)',
      gender: 'ชาย',
      sportType: 'บาสเกตบอล',
      durationMinutes: 90,
      partySize: 3,
      checkInTime: '2026-10-15T09:00:00Z',
      isActive: true,
    },
  ];

  const pop = getSportPopularity(sampleRecords);
  assert.equal(pop[0].sport, 'บาสเกตบอล');
  assert.equal(pop[0].totalParticipants, 8); // 5 + 3
  assert.equal(pop[1].sport, 'วิ่ง / จ็อกกิ้ง');
  assert.equal(pop[1].totalParticipants, 2);
});

test('getAgeDistribution aggregates records properly', () => {
  const sampleRecords: CheckInRecord[] = [
    {
      id: '1',
      stadiumId: 's1',
      stadiumName: 'สนามกีฬา กทม.',
      districtName: 'ดินแดง',
      zone: 'กรุงเทพกลาง',
      age: 16,
      ageGroup: 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)',
      gender: 'ชาย',
      sportType: 'ฟุตบอล / ฟุตซอล',
      durationMinutes: 60,
      partySize: 4,
      checkInTime: '2026-10-15T10:00:00Z',
      isActive: true,
    },
    {
      id: '2',
      stadiumId: 's1',
      stadiumName: 'สนามกีฬา กทม.',
      districtName: 'ดินแดง',
      zone: 'กรุงเทพกลาง',
      age: 65,
      ageGroup: 'ผู้สูงอายุ (60 ปีขึ้นไป)',
      gender: 'หญิง',
      sportType: 'เปตอง',
      durationMinutes: 90,
      partySize: 2,
      checkInTime: '2026-10-15T10:30:00Z',
      isActive: true,
    },
  ];

  const dist = getAgeDistribution(sampleRecords);
  const youth = dist.find((d) => d.ageGroup === 'เด็ก/เยาวชน (ต่ำกว่า 18 ปี)');
  const senior = dist.find((d) => d.ageGroup === 'ผู้สูงอายุ (60 ปีขึ้นไป)');

  assert.equal(youth?.count, 4);
  assert.equal(senior?.count, 2);
});

test('getHourlyPeakAnalysis places timestamps in correct buckets', () => {
  const sampleRecords: CheckInRecord[] = [
    {
      id: '1',
      stadiumId: 's1',
      stadiumName: 'สนาม A',
      districtName: 'ปทุมวัน',
      zone: 'กรุงเทพใต้',
      age: 20,
      ageGroup: 'วัยรุ่น/นักศึกษา (18-24 ปี)',
      gender: 'ชาย',
      sportType: 'แบดมินตัน',
      durationMinutes: 60,
      partySize: 2,
      checkInTime: '2026-10-15T18:30:00',
      isActive: true,
    },
  ];

  const peaks = getHourlyPeakAnalysis(sampleRecords);
  const hour18 = peaks.find((p) => p.hour === 18);
  assert.equal(hour18?.count, 2);
});
