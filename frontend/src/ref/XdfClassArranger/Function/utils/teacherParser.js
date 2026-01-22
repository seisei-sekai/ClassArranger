import { TEACHER_COLUMNS } from './constants';

/**
 * 解析教师数据行
 * 处理从 Excel 复制的教师数据，支持多行数据
 * 能够正确处理单元格内的换行符
 * 
 * @param {string} rawData - 从 Excel 复制的原始数据
 * @returns {Array} 解析后的教师对象数组
 */
export const parseTeacherRows = (rawData) => {
  if (!rawData || !rawData.trim()) {
    return [];
  }

  const rawLines = rawData.split('\n');
  const MIN_TABS_FOR_NEW_TEACHER = 10; // 启发式：至少10个制表符才是新的教师行（15列数据需要14个制表符，设为10提供容错空间）

  // 合并跨行的单元格内容
  const mergedLines = [];
  rawLines.forEach(line => {
    if (line.trim() === '') return;

    const tabCount = (line.match(/\t/g) || []).length;

    if (tabCount >= MIN_TABS_FOR_NEW_TEACHER) {
      // 这是一个新的教师记录
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      // 这是上一个教师记录的延续（单元格内换行）
      mergedLines[mergedLines.length - 1] += ' ' + line;
    } else {
      // 第一行但制表符不够，也保留
      mergedLines.push(line);
    }
  });

  // 解析每一行为教师对象
  return mergedLines.map((line, index) => {
    const values = line.split('\t');
    
    // 获取教师姓名（第2列，索引1）
    let teacherName = values[1] ? values[1].trim() : '';

    // 如果姓名为空，生成默认名称
    if (!teacherName) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      teacherName = `教师${timestamp}`;
    }

    return {
      rawData: line,
      name: teacherName,
      values: values,
      // 提取关键信息
      level: values[0] ? values[0].trim() : '-', // 教师级别
      gender: values[2] ? values[2].trim() : '-', // 性别
      employmentType: values[3] ? values[3].trim() : '-', // 兼职/正社员
      university: values[4] ? values[4].trim() : '-', // 出身校
      subject: values[5] ? values[5].trim() : '-', // 学科分类
      major: values[6] ? values[6].trim() : '-', // 专业
      possibleSubjects: values[7] ? values[7].trim() : '-', // 可带科目（可多选）
      canModifyStatement: values[8] ? values[8].trim() : '-', // 可否修改志望理由书（10天修改）
      availability: values[9] ? values[9].trim() : '-', // 可带时间
      teachingMode: values[10] ? values[10].trim() : '-', // 上课形式
      teachingStyle: values[11] ? values[11].trim() : '-', // 授课风格
      experience: values[12] ? values[12].trim() : '-', // 教龄
      hourlyRate: values[13] ? values[13].trim() : '-', // 时薪
      notes: values[14] ? values[14].trim() : '-' // 备注
    };
  });
};

