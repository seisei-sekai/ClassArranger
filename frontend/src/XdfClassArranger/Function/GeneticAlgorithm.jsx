/**
 * Enhanced Genetic Algorithm - Automated Scheduling Engine
 * 增强遗传算法核心 - 自动排课引擎
 * 
 * Enhanced with:
 * - Constraint engine integration (约束引擎集成)
 * - Intelligent mutation (智能变异)
 * - Adaptive parameters (自适应参数)
 * - Improved fitness function (改进的适应度函数)
 * 
 * Based on AlmanacAI methodology (基于 AlmanacAI 的思想实现)
 */

class GeneticAlgorithm {
  constructor(config) {
    // Population parameters (种群参数)
    this.populationSize = config.populationSize || 100;
    this.baseMutationRate = config.mutationRate || 0.15;
    this.mutationRate = this.baseMutationRate;
    this.crossoverRate = config.crossoverRate || 0.8;
    this.elitismRate = config.elitismRate || 0.1;
    this.maxGenerations = config.maxGenerations || 200;
    
    // Scheduling constraints (排课约束)
    this.teachers = config.teachers || [];
    this.students = config.students || [];
    this.rooms = config.rooms || [];
    this.courses = config.courses || [];
    this.timeSlots = config.timeSlots || [];
    
    // Enhanced features (增强功能)
    this.constraintEngine = config.constraintEngine || null;
    this.initialSchedule = config.initialSchedule || null; // From heuristic search (来自启发式搜索)
    
    // Adaptive parameters (自适应参数)
    this.stagnationCounter = 0;
    this.bestFitnessHistory = [];
    this.diversityThreshold = 0.3;
    
    // Statistics (统计)
    this.generationStats = [];
  }

  /**
   * Generate initial population with intelligent initialization
   * 生成初始种群（智能初始化）
   * 
   * If initialSchedule provided, use it as seed (如果提供初始解，用作种子)
   */
  generateInitialPopulation() {
    const population = [];
    
    // If initial schedule provided, add it first (如果提供了初始解，首先添加它)
    if (this.initialSchedule && this.initialSchedule.length > 0) {
      population.push([...this.initialSchedule]);
      
      // Create variations of initial schedule (创建初始解的变体)
      const variationCount = Math.floor(this.populationSize * 0.3);
      for (let i = 0; i < variationCount; i++) {
        const variation = this.createVariation(this.initialSchedule);
        population.push(variation);
      }
    }
    
    // Fill rest with random schedules (用随机课表填充剩余)
    while (population.length < this.populationSize) {
      population.push(this.createRandomSchedule());
    }
    
    return population;
  }
  
  /**
   * Create variation of a schedule
   * 创建课表的变体
   */
  createVariation(schedule) {
    const variation = JSON.parse(JSON.stringify(schedule));
    const mutationCount = Math.floor(variation.length * 0.1); // Mutate 10%
    
    for (let i = 0; i < mutationCount; i++) {
      const randomIndex = Math.floor(Math.random() * variation.length);
      const course = variation[randomIndex];
      
      // Randomly change time or room (随机改变时间或教室)
      if (Math.random() < 0.5 && this.timeSlots.length > 0) {
        course.timeSlot = this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)];
      } else if (this.rooms.length > 0) {
        course.room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      }
    }
    
    return variation;
  }

  // 创建随机课表（一个个体）
  createRandomSchedule() {
    const schedule = [];
    
    this.courses.forEach(course => {
      const randomTimeSlot = this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)];
      const randomRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      
      schedule.push({
        id: `${course.id}-${Date.now()}-${Math.random()}`,
        courseId: course.id,
        courseName: course.name,
        teacher: course.teacher,
        student: course.student,
        room: randomRoom,
        timeSlot: randomTimeSlot,
        duration: course.duration || 2, // 默认2小时
        color: course.color || this.getRandomColor()
      });
    });
    
    return schedule;
  }

  /**
   * Enhanced fitness function with constraint engine integration
   * 增强的适应度函数（集成约束引擎）
   * 
   * @param {Array} schedule - Course schedule (课表)
   * @returns {number} Fitness score (适应度分数)
   */
  calculateFitness(schedule) {
    // If constraint engine available, use it (如果有约束引擎，使用它)
    if (this.constraintEngine) {
      const result = this.constraintEngine.calculateViolationScore(schedule, {
        teachers: this.teachers,
        students: this.students,
        rooms: this.rooms
      });
      return result.score;
    }
    
    // Fallback to legacy fitness calculation (回退到传统适应度计算)
    return this.calculateLegacyFitness(schedule);
  }
  
  /**
   * Legacy fitness calculation
   * 传统适应度计算
   */
  calculateLegacyFitness(schedule) {
    let fitness = 100;
    const conflicts = this.findConflicts(schedule);
    
    // Hard constraint violations (严重扣分) (硬约束违规)
    fitness -= conflicts.teacherConflicts * 20;  // Teacher conflicts (教师冲突)
    fitness -= conflicts.studentConflicts * 20;  // Student conflicts (学生冲突)
    fitness -= conflicts.roomConflicts * 15;     // Room conflicts (教室冲突)
    
    // Soft constraint violations (轻微扣分) (软约束违规)
    fitness -= conflicts.lunchTimeViolations * 5; // Lunch time (午休时间)
    fitness -= conflicts.consecutiveClasses * 3;  // Consecutive classes (连续上课过多)
    fitness -= conflicts.earlyMorningClasses * 2; // Early morning (早晨课程)
    fitness -= conflicts.lateEveningClasses * 2;  // Late evening (晚间课程)
    
    // Reward distributed scheduling (奖励分散的课程安排)
    fitness += this.calculateDistributionScore(schedule) * 2;
    
    return Math.max(0, fitness);
  }

  // 查找冲突
  findConflicts(schedule) {
    const conflicts = {
      teacherConflicts: 0,
      studentConflicts: 0,
      roomConflicts: 0,
      lunchTimeViolations: 0,
      consecutiveClasses: 0,
      earlyMorningClasses: 0,
      lateEveningClasses: 0
    };

    for (let i = 0; i < schedule.length; i++) {
      const currentClass = schedule[i];

      for (let j = i + 1; j < schedule.length; j++) {
        const otherClass = schedule[j];

        if (this.timeOverlaps(currentClass, otherClass)) {
          // 教师冲突
          if (currentClass.teacher === otherClass.teacher) {
            conflicts.teacherConflicts++;
          }
          // 学生冲突
          if (currentClass.student === otherClass.student) {
            conflicts.studentConflicts++;
          }
          // 教室冲突
          if (currentClass.room.id === otherClass.room.id) {
            conflicts.roomConflicts++;
          }
        }
      }

      // 检查午休时间（12:00-13:00）
      const hour = parseInt(currentClass.timeSlot.start.split(':')[0]);
      if (hour === 12) {
        conflicts.lunchTimeViolations++;
      }

      // 检查早晨课程（8:00之前）
      if (hour < 8) {
        conflicts.earlyMorningClasses++;
      }

      // 检查晚间课程（20:00之后）
      if (hour >= 20) {
        conflicts.lateEveningClasses++;
      }
    }

    return conflicts;
  }

  // 时间重叠检测
  timeOverlaps(class1, class2) {
    if (class1.timeSlot.day !== class2.timeSlot.day) {
      return false;
    }

    const start1 = this.timeToMinutes(class1.timeSlot.start);
    const end1 = start1 + (class1.duration * 60);
    const start2 = this.timeToMinutes(class2.timeSlot.start);
    const end2 = start2 + (class2.duration * 60);

    return (start1 < end2 && end1 > start2);
  }

  // 时间转换为分钟
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // 计算分散度得分
  calculateDistributionScore(schedule) {
    const dailyLoad = {};
    schedule.forEach(cls => {
      const day = cls.timeSlot.day;
      dailyLoad[day] = (dailyLoad[day] || 0) + 1;
    });

    const loads = Object.values(dailyLoad);
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;
    
    return Math.max(0, 10 - variance); // 方差越小，分散度越好
  }

  // 选择操作（轮盘赌选择）
  selection(population, fitnessScores) {
    const totalFitness = fitnessScores.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalFitness;
    
    let sum = 0;
    for (let i = 0; i < population.length; i++) {
      sum += fitnessScores[i];
      if (sum >= random) {
        return population[i];
      }
    }
    
    return population[population.length - 1];
  }

  // 交叉操作（单点交叉）
  crossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1, parent2];
    }

    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    
    const child1 = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint)
    ];
    
    const child2 = [
      ...parent2.slice(0, crossoverPoint),
      ...parent1.slice(crossoverPoint)
    ];

    return [child1, child2];
  }

  // 变异操作
  mutate(schedule) {
    const mutated = [...schedule];
    
    for (let i = 0; i < mutated.length; i++) {
      if (Math.random() < this.mutationRate) {
        // 随机改变时间段
        if (Math.random() < 0.5) {
          mutated[i] = {
            ...mutated[i],
            timeSlot: this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)]
          };
        } else {
          // 随机改变教室
          mutated[i] = {
            ...mutated[i],
            room: this.rooms[Math.floor(Math.random() * this.rooms.length)]
          };
        }
      }
    }
    
    return mutated;
  }

  // 主进化循环
  evolve() {
    let population = this.generateInitialPopulation();
    let bestSchedule = null;
    let bestFitness = -Infinity;
    let generation = 0;
    let stagnationCounter = 0;
    const stagnationLimit = 20;

    console.log('[GA] 开始遗传算法排课...');

    while (generation < this.maxGenerations && bestFitness < 95) {
      // 计算适应度
      const fitnessScores = population.map(schedule => this.calculateFitness(schedule));
      
      // 找到最佳个体
      const maxFitness = Math.max(...fitnessScores);
      const maxIndex = fitnessScores.indexOf(maxFitness);
      
      if (maxFitness > bestFitness) {
        bestFitness = maxFitness;
        bestSchedule = population[maxIndex];
        stagnationCounter = 0;
      } else {
        stagnationCounter++;
      }

      console.log(`代数 ${generation + 1}: 最佳适应度 = ${bestFitness.toFixed(2)}`);

      // 检查停滞
      if (stagnationCounter > stagnationLimit) {
        console.log('检测到停滞，重新初始化部分种群...');
        const keepSize = Math.floor(this.populationSize * 0.3);
        population = [
          ...population.slice(0, keepSize),
          ...this.generateInitialPopulation().slice(keepSize)
        ];
        stagnationCounter = 0;
      }

      // 创建新种群
      const newPopulation = [];
      
      // 精英保留
      const eliteCount = Math.floor(this.populationSize * this.elitismRate);
      const sortedIndices = fitnessScores
        .map((fitness, index) => ({ fitness, index }))
        .sort((a, b) => b.fitness - a.fitness);
      
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(population[sortedIndices[i].index]);
      }

      // 生成新个体
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.selection(population, fitnessScores);
        const parent2 = this.selection(population, fitnessScores);
        
        const [child1, child2] = this.crossover(parent1, parent2);
        
        newPopulation.push(this.mutate(child1));
        if (newPopulation.length < this.populationSize) {
          newPopulation.push(this.mutate(child2));
        }
      }

      population = newPopulation;
      generation++;
    }

    console.log(`[GA] 进化完成！最终适应度: ${bestFitness.toFixed(2)}`);
    console.log(`冲突分析:`, this.findConflicts(bestSchedule));

    return {
      schedule: bestSchedule,
      fitness: bestFitness,
      generations: generation,
      conflicts: this.findConflicts(bestSchedule)
    };
  }

  // 获取随机颜色
  getRandomColor() {
    const colors = [
      '#5A6C7D', '#6B7C6E', '#A08B7A', '#7A8C9E',
      '#8B7C6E', '#6E7C8B', '#9E7676', '#7A9E76'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 转换为 FullCalendar 事件格式
  convertToCalendarEvents(schedule) {
    return schedule.map(cls => {
      const dateStr = this.getDateForWeekday(cls.timeSlot.day);
      const startTime = cls.timeSlot.start;
      const endMinutes = this.timeToMinutes(startTime) + (cls.duration * 60);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      return {
        id: cls.id,
        title: `${cls.courseName} - ${cls.student}`,
        start: `${dateStr}T${startTime}:00`,
        end: `${dateStr}T${endTime}:00`,
        backgroundColor: cls.color,
        borderColor: cls.color,
        textColor: '#FFFFFF',
        extendedProps: {
          student: cls.student,
          teacher: cls.teacher,
          campus: cls.room.campus || '未指定',
          room: cls.room.name,
          description: cls.courseName
        }
      };
    });
  }

  // 获取星期对应的日期（本周）
  getDateForWeekday(weekday) {
    const dayMap = {
      '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0
    };
    
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = dayMap[weekday];
    const diff = targetDay - currentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

export default GeneticAlgorithm;

