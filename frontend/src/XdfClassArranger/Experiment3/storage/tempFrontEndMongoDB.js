/**
 * TempFrontEndMongoDB - 前端MongoDB模拟器
 * 
 * 模拟MongoDB的Repository层接口，使用localStorage作为持久化存储
 * 提供类似MongoDB的CRUD操作和查询功能
 */

class TempFrontEndMongoDB {
  constructor() {
    this.storagePrefix = 'tempMongoDB_';
    this.collections = new Map();
    this.initializeCollections();
  }

  /**
   * 初始化所有集合
   */
  initializeCollections() {
    const collectionNames = [
      'students',
      'teachers',
      'classrooms',
      'courses',
      'metadata'
    ];
    
    collectionNames.forEach(name => {
      this.collections.set(name, this.loadCollection(name));
    });
    
    console.log('[TempMongoDB] Initialized collections:', collectionNames);
  }

  /**
   * 从localStorage加载集合
   */
  loadCollection(name) {
    const key = `${this.storagePrefix}${name}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      console.log(`[TempMongoDB] Collection ${name} not found, creating empty`);
      return [];
    }
    
    try {
      const parsed = JSON.parse(data, this.dateReviver);
      console.log(`[TempMongoDB] Loaded ${name}: ${parsed.length} documents`);
      return parsed;
    } catch (error) {
      console.error(`[TempMongoDB] Failed to parse ${name}:`, error);
      return [];
    }
  }

  /**
   * 保存集合到localStorage
   */
  saveCollection(name) {
    const key = `${this.storagePrefix}${name}`;
    const data = this.collections.get(name) || [];
    
    try {
      localStorage.setItem(key, JSON.stringify(data, this.dateReplacer));
      console.log(`[TempMongoDB] Saved ${name}: ${data.length} documents`);
    } catch (error) {
      console.error(`[TempMongoDB] Failed to save ${name}:`, error);
      throw new Error(`Failed to save collection ${name}: ${error.message}`);
    }
  }

  /**
   * 查找单个文档
   */
  async findOne(collectionName, query) {
    const collection = this.collections.get(collectionName) || [];
    const result = collection.find(doc => this.matchQuery(doc, query));
    
    console.log(`[TempMongoDB] findOne ${collectionName}:`, query, '→', result ? 'Found' : 'Not found');
    return result || null;
  }

  /**
   * 查找多个文档
   */
  async find(collectionName, query = {}, options = {}) {
    const { skip = 0, limit = 100, sort = {} } = options;
    let collection = [...(this.collections.get(collectionName) || [])];

    // Filter
    if (Object.keys(query).length > 0) {
      collection = collection.filter(doc => this.matchQuery(doc, query));
    }

    // Sort
    if (Object.keys(sort).length > 0) {
      collection = this.sortDocuments(collection, sort);
    }

    // Pagination
    const result = collection.slice(skip, skip + limit);
    
    console.log(`[TempMongoDB] find ${collectionName}:`, query, '→', result.length, 'documents');
    return result;
  }

  /**
   * 查找所有文档
   */
  async findAll(collectionName) {
    const result = this.collections.get(collectionName) || [];
    console.log(`[TempMongoDB] findAll ${collectionName}:`, result.length, 'documents');
    return [...result];
  }

  /**
   * 计数文档
   */
  async count(collectionName, query = {}) {
    const collection = this.collections.get(collectionName) || [];
    
    if (Object.keys(query).length === 0) {
      return collection.length;
    }
    
    const count = collection.filter(doc => this.matchQuery(doc, query)).length;
    console.log(`[TempMongoDB] count ${collectionName}:`, query, '→', count);
    return count;
  }

  /**
   * 插入文档
   */
  async insert(collectionName, doc) {
    const collection = this.collections.get(collectionName) || [];
    
    // 验证_id唯一性
    if (collection.some(d => d._id === doc._id)) {
      throw new Error(`Document with _id ${doc._id} already exists in ${collectionName}`);
    }
    
    collection.push(doc);
    this.collections.set(collectionName, collection);
    this.saveCollection(collectionName);
    
    console.log(`[TempMongoDB] insert ${collectionName}:`, doc._id);
    return doc;
  }

  /**
   * 插入多个文档
   */
  async insertMany(collectionName, docs) {
    const collection = this.collections.get(collectionName) || [];
    
    // 验证_id唯一性
    const existingIds = new Set(collection.map(d => d._id));
    const duplicates = docs.filter(d => existingIds.has(d._id));
    if (duplicates.length > 0) {
      throw new Error(`Duplicate _id found in insertMany: ${duplicates.map(d => d._id).join(', ')}`);
    }
    
    collection.push(...docs);
    this.collections.set(collectionName, collection);
    this.saveCollection(collectionName);
    
    console.log(`[TempMongoDB] insertMany ${collectionName}:`, docs.length, 'documents');
    return docs;
  }

  /**
   * 更新单个文档
   */
  async updateOne(collectionName, query, update) {
    const collection = this.collections.get(collectionName) || [];
    const index = collection.findIndex(doc => this.matchQuery(doc, query));
    
    if (index === -1) {
      console.log(`[TempMongoDB] updateOne ${collectionName}: No document found`);
      return null;
    }
    
    // 合并更新
    collection[index] = { ...collection[index], ...update };
    this.saveCollection(collectionName);
    
    console.log(`[TempMongoDB] updateOne ${collectionName}:`, collection[index]._id);
    return collection[index];
  }

  /**
   * 更新多个文档
   */
  async updateMany(collectionName, query, update) {
    const collection = this.collections.get(collectionName) || [];
    let count = 0;
    
    collection.forEach((doc, index) => {
      if (this.matchQuery(doc, query)) {
        collection[index] = { ...doc, ...update };
        count++;
      }
    });
    
    if (count > 0) {
      this.saveCollection(collectionName);
    }
    
    console.log(`[TempMongoDB] updateMany ${collectionName}:`, count, 'documents updated');
    return { modifiedCount: count };
  }

  /**
   * 删除单个文档
   */
  async deleteOne(collectionName, query) {
    const collection = this.collections.get(collectionName) || [];
    const index = collection.findIndex(doc => this.matchQuery(doc, query));
    
    if (index === -1) {
      console.log(`[TempMongoDB] deleteOne ${collectionName}: No document found`);
      return false;
    }
    
    const deleted = collection.splice(index, 1)[0];
    this.saveCollection(collectionName);
    
    console.log(`[TempMongoDB] deleteOne ${collectionName}:`, deleted._id);
    return true;
  }

  /**
   * 删除多个文档
   */
  async deleteMany(collectionName, query) {
    const collection = this.collections.get(collectionName) || [];
    const initialLength = collection.length;
    
    const filtered = collection.filter(doc => !this.matchQuery(doc, query));
    this.collections.set(collectionName, filtered);
    this.saveCollection(collectionName);
    
    const deletedCount = initialLength - filtered.length;
    console.log(`[TempMongoDB] deleteMany ${collectionName}:`, deletedCount, 'documents deleted');
    return { deletedCount };
  }

  /**
   * 清空集合
   */
  async clearCollection(collectionName) {
    this.collections.set(collectionName, []);
    this.saveCollection(collectionName);
    console.log(`[TempMongoDB] clearCollection ${collectionName}`);
  }

  /**
   * 匹配查询
   */
  matchQuery(doc, query) {
    return Object.entries(query).every(([key, value]) => {
      // 支持嵌套字段查询 (如 "scheduling.timeConstraints.allowedDays")
      if (key.includes('.')) {
        const docValue = this.getNestedValue(doc, key);
        return this.compareValues(docValue, value);
      }
      
      return this.compareValues(doc[key], value);
    });
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  }

  /**
   * 比较值（支持数组、对象等）
   */
  compareValues(a, b) {
    // 简单值比较
    if (a === b) return true;
    
    // null/undefined 处理
    if (a == null || b == null) return a === b;
    
    // 数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    // 对象比较
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * 排序文档
   */
  sortDocuments(collection, sort) {
    return collection.sort((a, b) => {
      for (const [key, order] of Object.entries(sort)) {
        const aVal = this.getNestedValue(a, key);
        const bVal = this.getNestedValue(b, key);
        
        if (aVal < bVal) return order === 1 ? -1 : 1;
        if (aVal > bVal) return order === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Date 序列化
   */
  dateReplacer(key, value) {
    if (value instanceof Date) {
      return { _date: value.toISOString() };
    }
    return value;
  }

  /**
   * Date 反序列化
   */
  dateReviver(key, value) {
    if (value && typeof value === 'object' && value._date) {
      return new Date(value._date);
    }
    return value;
  }

  /**
   * 导出所有数据
   */
  exportAll() {
    const data = {};
    this.collections.forEach((collection, name) => {
      data[name] = collection;
    });
    return data;
  }

  /**
   * 导入所有数据
   */
  importAll(data) {
    Object.entries(data).forEach(([name, collection]) => {
      this.collections.set(name, collection);
      this.saveCollection(name);
    });
    console.log('[TempMongoDB] Imported data for:', Object.keys(data).join(', '));
  }
}

// 单例模式
let instance = null;

export function getTempFrontEndMongoDB() {
  if (!instance) {
    instance = new TempFrontEndMongoDB();
  }
  return instance;
}

export function resetTempFrontEndMongoDB() {
  instance = null;
  console.log('[TempMongoDB] Instance reset');
}

export default TempFrontEndMongoDB;
