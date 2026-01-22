/**
 * 学生数据解析模块
 * 负责解析从Excel粘贴的学生数据
 */

/**
 * 解析多行学生数据
 * 处理单元格内换行符，合并被分割的行
 * @param {string} rawData - 从Excel粘贴的原始数据
 * @returns {Array} 解析后的学生数组，每个元素包含 {rawData, name, values}
 */
export const parseStudentRows = (rawData) => {
  // 按行分割
  const rawLines = rawData.split('\n');
  
  // 合并被单元格内换行符分割的行
  // 判断标准：完整的学生数据应该有约19个字段（18个tab）
  // 如果某行tab数量少于10个，说明是上一行的延续
  const MIN_TABS_FOR_NEW_STUDENT = 10;
  const mergedLines = [];
  
  rawLines.forEach(line => {
    if (line.trim() === '') return; // 跳过空行
    
    const tabCount = (line.match(/\t/g) || []).length;
    
    if (tabCount >= MIN_TABS_FOR_NEW_STUDENT) {
      // 这是一个新的学生记录
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      // 这是上一行的延续，合并到上一行
      // 用空格替换换行，避免数据混乱
      mergedLines[mergedLines.length - 1] += ' ' + line;
    } else {
      // 第一行但tab不够，可能是不完整数据，先保存
      mergedLines.push(line);
    }
  });
  
  return mergedLines.map(line => {
    const values = line.split('\t');
    let studentName = values[2] ? values[2].trim() : '';
    
    // 如果学生姓名为空，生成默认名称
    if (!studentName) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      studentName = `学生${timestamp}`;
    }
    
    return {
      rawData: line,
      name: studentName,
      values: values
    };
  });
};

