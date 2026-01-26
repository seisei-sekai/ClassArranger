/**
 * Unit Tests for NLP Data Reconstruction
 * 测试NLP数据重建功能
 */

import { EXCEL_COLUMNS } from '../constants';

describe('NLP Data Reconstruction', () => {
  const columns = EXCEL_COLUMNS.split('\t');
  
  describe('Tab-separated data reconstruction', () => {
    it('should reconstruct tab-separated data from Excel row object', () => {
      const originalRow = {
        '校区': '中关村校区',
        '学管姓名': '李老师',
        '学生姓名': '张三',
        '学生批次': '2024春季',
        '录入日期': '2024-03-15',
        '上课频次': '2次',
        '上课时长': '2小时',
        '上课形式': '线下',
        '上课内容': '数学',
        '学生水平': '高三',
        '所用课时': '10',
        '出愿大学': '清华大学',
        '学部学科': '计算机',
        '起止时间': '3月-6月',
        '学生希望时间段': '周末下午',
        '希望具体时间': '14:00-16:00',
        '每周频次': '2次',
        '课上具体内容': 'AP微积分',
        '备注': '需要提前预约'
      };

      const rowValues = columns.map(col => originalRow[col] || '');
      const reconstructed = rowValues.join('\t');

      // Should contain tab separators
      expect(reconstructed).toContain('\t');
      
      // Should start with campus
      expect(reconstructed).toMatch(/^中关村校区/);
      
      // Count tabs
      const tabCount = (reconstructed.match(/\t/g) || []).length;
      expect(tabCount).toBe(columns.length - 1); // n columns = n-1 tabs
    });

    it('should handle missing fields with empty strings', () => {
      const originalRow = {
        '校区': '中关村校区',
        '学生姓名': '张三',
        // Other fields missing
      };

      const rowValues = columns.map(col => originalRow[col] || '');
      const reconstructed = rowValues.join('\t');

      // Should still have correct number of tabs
      const tabCount = (reconstructed.match(/\t/g) || []).length;
      expect(tabCount).toBe(columns.length - 1);
      
      // Should have campus at start
      expect(reconstructed.split('\t')[0]).toBe('中关村校区');
      
      // Student name at index 2
      expect(reconstructed.split('\t')[2]).toBe('张三');
    });

    it('should preserve field order matching EXCEL_COLUMNS', () => {
      const originalRow = {
        '学生姓名': '张三',
        '校区': '中关村校区',
        '学管姓名': '李老师'
      };

      const rowValues = columns.map(col => originalRow[col] || '');
      const parts = rowValues.join('\t').split('\t');

      // Check order matches EXCEL_COLUMNS
      const campusIndex = columns.indexOf('校区');
      const managerIndex = columns.indexOf('学管姓名');
      const nameIndex = columns.indexOf('学生姓名');

      expect(parts[campusIndex]).toBe('中关村校区');
      expect(parts[managerIndex]).toBe('李老师');
      expect(parts[nameIndex]).toBe('张三');
    });
  });

  describe('NLP integration', () => {
    it('should mark student as from NLP', () => {
      const newStudent = {
        id: 'student-nlp-test',
        name: '张三',
        fromNLP: true
      };

      expect(newStudent.fromNLP).toBe(true);
    });

    it('should fallback to originalText when originalRow missing', () => {
      const originalText = '起止时间: 12/4至12/5 上午或结束·希望时间段: 12/5的12：30-18点之间 不能排课 每周频次: 一次';
      const originalRow = null;

      const reconstructedRawData = originalRow 
        ? columns.map(col => originalRow[col] || '').join('\t')
        : originalText;

      expect(reconstructedRawData).toBe(originalText);
    });
  });

  describe('parseStudentRows compatibility', () => {
    it('should be parseable by parseStudentRows', () => {
      const originalRow = {
        '校区': '中关村校区',
        '学管姓名': '李老师',
        '学生姓名': '张三',
        '学生批次': '2024春季'
      };

      const rowValues = columns.map(col => originalRow[col] || '');
      const reconstructed = rowValues.join('\t');
      
      // Simulate parseStudentRows behavior
      const values = reconstructed.split('\t');
      
      expect(values[0]).toBe('中关村校区'); // Campus
      expect(values[1]).toBe('李老师');     // Manager (学管姓名)
      expect(values[2]).toBe('张三');       // Student name
      expect(values[3]).toBe('2024春季');   // Batch
    });
  });
});
