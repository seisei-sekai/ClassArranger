/**
 * Subject Parser
 * 科目解析器
 * 
 * Extract course information and requirements from text
 * 从文本中提取课程信息和要求
 */

class SubjectParser {
  constructor() {
    this.subjectKeywords = this.initializeSubjectKeywords();
    this.difficultyLevels = this.initializeDifficultyLevels();
    this.specialRequirements = this.initializeSpecialRequirements();
  }
  
  /**
   * Initialize subject keywords
   * 初始化科目关键词
   */
  initializeSubjectKeywords() {
    return {
      '面试': {
        keywords: ['面试', '面接', 'interview', 'メンセツ'],
        category: 'interview',
        nameJa: '面接',
        nameZh: '面试',
        nameEn: 'Interview'
      },
      '志望理由書': {
        keywords: ['志望理由書', '志望理由书', '理由书', '志愿书', 'statement', 'purpose'],
        category: 'statement',
        nameJa: '志望理由書',
        nameZh: '志望理由书',
        nameEn: 'Statement of Purpose'
      },
      'EJU日語': {
        keywords: ['EJU', '留考', '日语', '日本語', 'japanese'],
        category: 'eju_japanese',
        nameJa: 'EJU日本語',
        nameZh: 'EJU日语',
        nameEn: 'EJU Japanese'
      },
      'EJU数学': {
        keywords: ['EJU数学', '留考数学', '数学', 'math', 'mathematics', '數學'],
        category: 'eju_math',
        nameJa: 'EJU数学',
        nameZh: 'EJU数学',
        nameEn: 'EJU Mathematics'
      },
      'EJU理科': {
        keywords: ['EJU理科', '留考理科', '物理', '化学', '生物', 'physics', 'chemistry', 'biology'],
        category: 'eju_science',
        nameJa: 'EJU理科',
        nameZh: 'EJU理科',
        nameEn: 'EJU Science'
      },
      'EJU文综': {
        keywords: ['EJU文综', '留考文综', '综合科目', '文综', 'comprehensive'],
        category: 'eju_social',
        nameJa: 'EJU総合科目',
        nameZh: 'EJU文综',
        nameEn: 'EJU Social Studies'
      },
      '小論文': {
        keywords: ['小论文', '小論文', 'essay', '论文', '作文'],
        category: 'essay',
        nameJa: '小論文',
        nameZh: '小论文',
        nameEn: 'Essay Writing'
      },
      '日本語': {
        keywords: ['日语', '日本語', '日语课', 'japanese language', 'JLPT', 'N1', 'N2', 'N3'],
        category: 'japanese',
        nameJa: '日本語',
        nameZh: '日语',
        nameEn: 'Japanese Language'
      },
      '英語': {
        keywords: ['英语', '英語', 'english', 'TOEFL', 'IELTS', 'TOEIC'],
        category: 'english',
        nameJa: '英語',
        nameZh: '英语',
        nameEn: 'English'
      },
      '大学入試': {
        keywords: ['大学入试', '入試', '入试', '考试', 'university', 'exam'],
        category: 'university_exam',
        nameJa: '大学入試',
        nameZh: '大学入试',
        nameEn: 'University Entrance Exam'
      },
      '其他': {
        keywords: ['其他', 'other', '特殊', 'special'],
        category: 'other',
        nameJa: 'その他',
        nameZh: '其他',
        nameEn: 'Other'
      }
    };
  }
  
  /**
   * Initialize difficulty levels
   * 初始化难度级别
   */
  initializeDifficultyLevels() {
    return {
      'beginner': {
        keywords: ['初级', '初級', 'beginner', '入门', '基础', '基礎'],
        level: 1,
        nameZh: '初级',
        nameJa: '初級',
        nameEn: 'Beginner'
      },
      'intermediate': {
        keywords: ['中级', '中級', 'intermediate', '进阶', '中等'],
        level: 2,
        nameZh: '中级',
        nameJa: '中級',
        nameEn: 'Intermediate'
      },
      'advanced': {
        keywords: ['高级', '高級', 'advanced', '高等', '进阶'],
        level: 3,
        nameZh: '高级',
        nameJa: '上級',
        nameEn: 'Advanced'
      }
    };
  }
  
  /**
   * Initialize special requirements
   * 初始化特殊要求
   */
  initializeSpecialRequirements() {
    return {
      'urgent': ['急', '紧急', '緊急', 'urgent', '马上', 'ASAP'],
      'exam_prep': ['考前', '备考', '準備', 'preparation', '冲刺', '集训'],
      'review': ['复习', '復習', 'review', '温习', '总复习'],
      'new_content': ['新内容', '新课', '新しい', 'new'],
      'practice': ['练习', '練習', 'practice', '做题', '刷题'],
      'one_on_one': ['1v1', '1对1', '1對1', '個別', '个别', 'private'],
      'group': ['小组', '小班', '班级', 'group', 'class'],
      'online': ['线上', '網上', 'online', '远程', 'remote', 'zoom'],
      'offline': ['线下', '対面', '面授', 'offline', 'in-person']
    };
  }
  
  /**
   * Parse course content text
   * 解析课程内容文本
   * 
   * @param {string} text - Course content text (课程内容文本)
   * @returns {Object} Parsed course information (解析的课程信息)
   */
  parse(text) {
    if (!text || typeof text !== 'string') {
      return this.createDefaultResult();
    }
    
    const result = {
      subject: this.parseSubject(text),
      difficulty: this.parseDifficulty(text),
      specialRequirements: this.parseSpecialRequirements(text),
      duration: this.parseDuration(text),
      frequency: this.parseFrequency(text),
      targetUniversity: this.parseTargetUniversity(text),
      rawText: text
    };
    
    return result;
  }
  
  /**
   * Parse subject type
   * 解析科目类型
   */
  parseSubject(text) {
    const textLower = text.toLowerCase();
    
    // Try each subject keyword (尝试每个科目关键词)
    for (const [subjectName, subjectData] of Object.entries(this.subjectKeywords)) {
      for (const keyword of subjectData.keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          return {
            name: subjectName,
            category: subjectData.category,
            nameJa: subjectData.nameJa,
            nameZh: subjectData.nameZh,
            nameEn: subjectData.nameEn,
            confidence: 1.0
          };
        }
      }
    }
    
    // Default to '其他' if no match (如果没有匹配则默认为'其他')
    return {
      name: '其他',
      category: 'other',
      nameJa: 'その他',
      nameZh: '其他',
      nameEn: 'Other',
      confidence: 0.0
    };
  }
  
  /**
   * Parse difficulty level
   * 解析难度级别
   */
  parseDifficulty(text) {
    const textLower = text.toLowerCase();
    
    for (const [level, data] of Object.entries(this.difficultyLevels)) {
      for (const keyword of data.keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          return {
            level: data.level,
            name: level,
            nameZh: data.nameZh,
            nameJa: data.nameJa,
            nameEn: data.nameEn
          };
        }
      }
    }
    
    // Default to intermediate (默认为中级)
    return {
      level: 2,
      name: 'intermediate',
      nameZh: '中级',
      nameJa: '中級',
      nameEn: 'Intermediate'
    };
  }
  
  /**
   * Parse special requirements
   * 解析特殊要求
   */
  parseSpecialRequirements(text) {
    const textLower = text.toLowerCase();
    const requirements = [];
    
    for (const [reqType, keywords] of Object.entries(this.specialRequirements)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          requirements.push({
            type: reqType,
            keyword: keyword
          });
          break; // Only add once per type (每种类型只添加一次)
        }
      }
    }
    
    return requirements;
  }
  
  /**
   * Parse course duration
   * 解析课程时长
   */
  parseDuration(text) {
    // Pattern for "X小时" or "X时间" or "Xh"
    // "X小时"或"X时间"或"Xh"的模式
    const hourPatterns = [
      /(\d+(?:\.\d+)?)\s*[小时時]/g,
      /(\d+(?:\.\d+)?)\s*hours?/gi,
      /(\d+(?:\.\d+)?)\s*h\b/gi
    ];
    
    for (const pattern of hourPatterns) {
      const match = text.match(pattern);
      if (match) {
        const hours = parseFloat(match[0].match(/\d+(?:\.\d+)?/)[0]);
        return {
          hours: hours,
          minutes: hours * 60,
          slots: Math.floor(hours * 12) // 12 slots per hour (每小时12个槽)
        };
      }
    }
    
    // Check for common durations mentioned (检查常见时长提及)
    if (text.includes('2小时') || text.includes('2時間') || text.includes('two hour')) {
      return { hours: 2, minutes: 120, slots: 24 };
    }
    if (text.includes('1.5小时') || text.includes('90分') || text.includes('1時間半')) {
      return { hours: 1.5, minutes: 90, slots: 18 };
    }
    
    // Default duration: 2 hours (默认时长：2小时)
    return { hours: 2, minutes: 120, slots: 24 };
  }
  
  /**
   * Parse frequency
   * 解析频率
   */
  parseFrequency(text) {
    const frequency = {
      timesPerWeek: null,
      totalSessions: null,
      pattern: null
    };
    
    // Pattern for "每周X次" (X times per week)
    const weeklyPattern = /每[周週]\s*(\d+)\s*[次回]/;
    const weeklyMatch = text.match(weeklyPattern);
    if (weeklyMatch) {
      frequency.timesPerWeek = parseInt(weeklyMatch[1]);
    }
    
    // Pattern for "共X次" (Total X sessions)
    const totalPattern = /[共总總計]\s*(\d+)\s*[次回]/;
    const totalMatch = text.match(totalPattern);
    if (totalMatch) {
      frequency.totalSessions = parseInt(totalMatch[1]);
    }
    
    // Detect patterns (检测模式)
    if (text.includes('每天') || text.includes('daily')) {
      frequency.pattern = 'daily';
      frequency.timesPerWeek = 7;
    } else if (text.includes('隔天') || text.includes('every other day')) {
      frequency.pattern = 'every_other_day';
      frequency.timesPerWeek = 3.5;
    }
    
    return frequency;
  }
  
  /**
   * Parse target university
   * 解析目标大学
   */
  parseTargetUniversity(text) {
    // Common university keywords (常见大学关键词)
    const universities = {
      '東京大学': ['東大', '东大', 'Tokyo University', 'UTokyo'],
      '京都大学': ['京大', '京都大', 'Kyoto University'],
      '早稲田大学': ['早稲田', '早稻田', 'Waseda'],
      '慶應義塾大学': ['慶應', '庆应', 'Keio'],
      '一橋大学': ['一橋', '一桥', 'Hitotsubashi'],
      '大阪大学': ['阪大', '大阪大', 'Osaka University'],
      '名古屋大学': ['名大', 'Nagoya University'],
      '東北大学': ['東北大', 'Tohoku University'],
      '北海道大学': ['北大', 'Hokkaido University'],
      '九州大学': ['九大', 'Kyushu University']
    };
    
    const textLower = text.toLowerCase();
    
    for (const [fullName, aliases] of Object.entries(universities)) {
      for (const alias of aliases) {
        if (textLower.includes(alias.toLowerCase())) {
          return {
            name: fullName,
            alias: alias,
            found: true
          };
        }
      }
    }
    
    // Try to find any text with "大学" (university)
    // 尝试查找包含"大学"的文本
    const uniPattern = /([^\s、，。]+[大學学])/g;
    const matches = text.match(uniPattern);
    if (matches && matches.length > 0) {
      return {
        name: matches[0],
        alias: matches[0],
        found: true,
        confidence: 0.5
      };
    }
    
    return {
      name: null,
      found: false
    };
  }
  
  /**
   * Create default parsing result
   * 创建默认解析结果
   */
  createDefaultResult() {
    return {
      subject: {
        name: '其他',
        category: 'other',
        nameJa: 'その他',
        nameZh: '其他',
        nameEn: 'Other',
        confidence: 0.0
      },
      difficulty: {
        level: 2,
        name: 'intermediate',
        nameZh: '中级',
        nameJa: '中級',
        nameEn: 'Intermediate'
      },
      specialRequirements: [],
      duration: { hours: 2, minutes: 120, slots: 24 },
      frequency: {
        timesPerWeek: null,
        totalSessions: null,
        pattern: null
      },
      targetUniversity: {
        name: null,
        found: false
      },
      rawText: ''
    };
  }
  
  /**
   * Extract teacher requirements
   * 提取教师要求
   */
  extractTeacherRequirements(text) {
    const requirements = {
      preferredTeacher: null,
      teacherGender: null,
      teacherExperience: null,
      teacherQualifications: []
    };
    
    // Preferred teacher name pattern (偏好教师姓名模式)
    const teacherNamePattern = /([老师老師][:：\s]*([^\s，。、]+))|([^\s，。、]+[老师老師])/;
    const teacherMatch = text.match(teacherNamePattern);
    if (teacherMatch) {
      requirements.preferredTeacher = teacherMatch[2] || teacherMatch[3];
    }
    
    // Gender preference (性别偏好)
    if (text.includes('男老师') || text.includes('male teacher')) {
      requirements.teacherGender = 'male';
    } else if (text.includes('女老师') || text.includes('female teacher')) {
      requirements.teacherGender = 'female';
    }
    
    // Experience level (经验水平)
    if (text.includes('经验丰富') || text.includes('experienced') || text.includes('资深')) {
      requirements.teacherExperience = 'experienced';
    } else if (text.includes('新人') || text.includes('junior')) {
      requirements.teacherExperience = 'junior';
    }
    
    return requirements;
  }
}

export default SubjectParser;

