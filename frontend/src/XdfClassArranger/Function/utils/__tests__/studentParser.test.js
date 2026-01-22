import { describe, it, expect } from 'vitest';
import { parseStudentRows } from '../studentParser';

describe('studentParser.js', () => {
  describe('parseStudentRows', () => {
    it('should return empty array for empty input', () => {
      expect(parseStudentRows('')).toEqual([]);
      expect(parseStudentRows(null)).toEqual([]);
      expect(parseStudentRows(undefined)).toEqual([]);
      expect(parseStudentRows('   ')).toEqual([]);
    });

    it('should parse single student row', () => {
      const input = '校区A\t张老师\t小明\t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t无';
      const result = parseStudentRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', '小明');
      expect(result[0]).toHaveProperty('rawData', input);
    });

    it('should parse multiple student rows', () => {
      const input = `校区A\t张老师\t小明\t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t无
校区B\t李老师\t小红\t2024春季\t2024-01-01\t每周3次\t1小时\t线下\t英语\t高级\t15\t北京大学\t英语文学\t2024-01-01 至 2024-06-30\t周二上午\t10:00-11:00\t3\t阅读和写作\t无`;
      
      const result = parseStudentRows(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('小明');
      expect(result[1].name).toBe('小红');
    });

    it('should handle rows with missing student name', () => {
      const input = '校区A\t张老师\t\t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t无';
      const result = parseStudentRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toMatch(/^学生\d{17}$/); // 应该生成默认名称
    });

    it('should parse all expected fields', () => {
      const input = '校区A\t张老师\t小明\t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t备注信息';
      const result = parseStudentRows(input);
      const student = result[0];
      
      expect(student).toHaveProperty('campus', '校区A');
      expect(student).toHaveProperty('manager', '张老师');
      expect(student).toHaveProperty('name', '小明');
      expect(student).toHaveProperty('batch', '2024春季');
      expect(student).toHaveProperty('entryDate', '2024-01-01');
      expect(student).toHaveProperty('frequency', '每周2次');
      expect(student).toHaveProperty('duration', '1小时');
      expect(student).toHaveProperty('mode', '线上');
      expect(student).toHaveProperty('subject', '数学');
      expect(student).toHaveProperty('level', '中级');
      expect(student).toHaveProperty('hoursUsed', '10');
      expect(student).toHaveProperty('targetUniversity', '清华大学');
      expect(student).toHaveProperty('targetMajor', '计算机科学');
      expect(student).toHaveProperty('timeRange', '2024-01-01 至 2024-06-30');
      expect(student).toHaveProperty('preferredTime', '周一下午');
      expect(student).toHaveProperty('specificTime', '14:00-15:00');
      expect(student).toHaveProperty('weeklyFrequency', '2');
      expect(student).toHaveProperty('content', '代数和几何');
      expect(student).toHaveProperty('notes', '备注信息');
    });

    it('should handle cell line breaks (multiline cells)', () => {
      // 模拟 Excel 单元格内换行的情况
      const input = '校区A\t张老师\t小明\n额外信息在下一行\t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t无';
      const result = parseStudentRows(input);
      
      // 应该能正确处理并合并多行内容
      expect(result).toHaveLength(1);
    });

    it('should trim whitespace from fields', () => {
      const input = '  校区A  \t  张老师  \t  小明  \t2024春季\t2024-01-01\t每周2次\t1小时\t线上\t数学\t中级\t10\t清华大学\t计算机科学\t2024-01-01 至 2024-06-30\t周一下午\t14:00-15:00\t2\t代数和几何\t无';
      const result = parseStudentRows(input);
      
      expect(result[0].campus).toBe('校区A');
      expect(result[0].manager).toBe('张老师');
      expect(result[0].name).toBe('小明');
    });
  });
});

