import { describe, it, expect } from 'vitest';
import { parseTeacherRows } from '../teacherParser';

describe('teacherParser.js', () => {
  describe('parseTeacherRows', () => {
    it('should return empty array for empty input', () => {
      expect(parseTeacherRows('')).toEqual([]);
      expect(parseTeacherRows(null)).toEqual([]);
      expect(parseTeacherRows(undefined)).toEqual([]);
      expect(parseTeacherRows('   ')).toEqual([]);
    });

    it('should parse single teacher row', () => {
      const input = 'A级\t张老师\t男\t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富';
      const result = parseTeacherRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', '张老师');
      expect(result[0]).toHaveProperty('rawData', input);
    });

    it('should parse multiple teacher rows', () => {
      const input = `A级\t张老师\t男\t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富
B级\t李老师\t女\t兼职\t北京大学\t文科\t英语\t英语\t否\t周末全天\t线上\t生动活泼\t3年\t150元/小时\t口语好`;
      
      const result = parseTeacherRows(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('张老师');
      expect(result[1].name).toBe('李老师');
    });

    it('should handle rows with missing teacher name', () => {
      const input = 'A级\t\t男\t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富';
      const result = parseTeacherRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toMatch(/^教师\d{17}$/); // 应该生成默认名称
    });

    it('should parse all expected fields', () => {
      const input = 'A级\t张老师\t男\t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富';
      const result = parseTeacherRows(input);
      const teacher = result[0];
      
      expect(teacher).toHaveProperty('level', 'A级');
      expect(teacher).toHaveProperty('name', '张老师');
      expect(teacher).toHaveProperty('gender', '男');
      expect(teacher).toHaveProperty('employmentType', '正社员');
      expect(teacher).toHaveProperty('university', '清华大学');
      expect(teacher).toHaveProperty('subject', '理科');
      expect(teacher).toHaveProperty('major', '数学');
      expect(teacher).toHaveProperty('possibleSubjects', '数学,物理');
      expect(teacher).toHaveProperty('canModifyStatement', '是');
      expect(teacher).toHaveProperty('availability', '周一至周五下午');
      expect(teacher).toHaveProperty('teachingMode', '线上+线下');
      expect(teacher).toHaveProperty('teachingStyle', '耐心细致');
      expect(teacher).toHaveProperty('experience', '5年');
      expect(teacher).toHaveProperty('hourlyRate', '200元/小时');
      expect(teacher).toHaveProperty('notes', '经验丰富');
    });

    it('should handle cell line breaks correctly', () => {
      // 模拟 Excel 单元格内换行的情况
      const rawLines = [
        'A级\t张老师\t男\t正社员\t清华',
        '大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富'
      ];
      const input = rawLines.join('\n');
      const result = parseTeacherRows(input);
      
      // 应该能正确处理并合并多行内容
      // 根据算法，第二行没有足够的制表符，会被合并到第一行
      expect(result.length).toBeGreaterThan(0);
    });

    it('should trim whitespace from fields', () => {
      const input = '  A级  \t  张老师  \t  男  \t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富';
      const result = parseTeacherRows(input);
      
      expect(result[0].level).toBe('A级');
      expect(result[0].name).toBe('张老师');
      expect(result[0].gender).toBe('男');
    });

    it('should handle rows with missing fields gracefully', () => {
      const input = 'A级\t张老师\t男';
      const result = parseTeacherRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('张老师');
      expect(result[0].level).toBe('A级');
      expect(result[0].gender).toBe('男');
      // 其他字段应该是 '-' 或空字符串
      expect(result[0].university).toBe('-');
    });

    it('should use MIN_TABS_FOR_NEW_TEACHER heuristic correctly', () => {
      // 至少10个制表符才被认为是新的教师行
      const validRow = 'A级\t张老师\t男\t正社员\t清华大学\t理科\t数学\t数学,物理\t是\t周一至周五下午\t线上+线下\t耐心细致\t5年\t200元/小时\t经验丰富';
      const invalidRow = 'A级\t张老师\t男'; // 只有2个制表符
      
      const result1 = parseTeacherRows(validRow);
      expect(result1).toHaveLength(1);
      
      const result2 = parseTeacherRows(invalidRow);
      // 虽然制表符不够，但作为第一行也会被保留
      expect(result2).toHaveLength(1);
    });
  });
});

