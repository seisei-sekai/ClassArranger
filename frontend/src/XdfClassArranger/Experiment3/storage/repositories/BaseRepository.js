/**
 * BaseRepository - 基础Repository类
 * 
 * 提供MongoDB风格的CRUD操作
 * 所有具体Repository继承此类
 */

import { getTempFrontEndMongoDB } from '../tempFrontEndMongoDB.js';

export class BaseRepository {
  constructor(collectionName) {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }
    
    this.collectionName = collectionName;
    this.db = getTempFrontEndMongoDB();
    
    console.log(`[${this.constructor.name}] Initialized for collection: ${collectionName}`);
  }

  /**
   * CREATE - 创建新文档
   */
  async create(data) {
    const doc = {
      _id: this.generateId(),
      _version: 4,
      _createdAt: new Date(),
      _updatedAt: new Date(),
      ...data
    };
    
    await this.db.insert(this.collectionName, doc);
    console.log(`[${this.constructor.name}] Created:`, doc._id);
    return doc;
  }

  /**
   * CREATE MANY - 批量创建
   */
  async createMany(dataArray) {
    const docs = dataArray.map(data => ({
      _id: this.generateId(),
      _version: 4,
      _createdAt: new Date(),
      _updatedAt: new Date(),
      ...data
    }));
    
    await this.db.insertMany(this.collectionName, docs);
    console.log(`[${this.constructor.name}] Created ${docs.length} documents`);
    return docs;
  }

  /**
   * READ - 根据ID查找
   */
  async findById(id) {
    const result = await this.db.findOne(this.collectionName, { _id: id });
    console.log(`[${this.constructor.name}] findById:`, id, '→', result ? 'Found' : 'Not found');
    return result;
  }

  /**
   * READ - 查找单个文档
   */
  async findOne(query) {
    const result = await this.db.findOne(this.collectionName, query);
    console.log(`[${this.constructor.name}] findOne:`, query, '→', result ? 'Found' : 'Not found');
    return result;
  }

  /**
   * READ - 查找多个文档
   */
  async findMany(query = {}, options = {}) {
    const result = await this.db.find(this.collectionName, query, options);
    console.log(`[${this.constructor.name}] findMany:`, query, '→', result.length, 'documents');
    return result;
  }

  /**
   * READ - 查找所有文档
   */
  async findAll() {
    const result = await this.db.findAll(this.collectionName);
    console.log(`[${this.constructor.name}] findAll:`, result.length, 'documents');
    return result;
  }

  /**
   * READ - 计数
   */
  async count(query = {}) {
    const result = await this.db.count(this.collectionName, query);
    console.log(`[${this.constructor.name}] count:`, query, '→', result);
    return result;
  }

  /**
   * UPDATE - 根据ID更新
   */
  async updateById(id, updateData) {
    const update = {
      ...updateData,
      _updatedAt: new Date()
    };
    
    const result = await this.db.updateOne(
      this.collectionName,
      { _id: id },
      update
    );
    
    console.log(`[${this.constructor.name}] updateById:`, id, '→', result ? 'Updated' : 'Not found');
    return result;
  }

  /**
   * UPDATE - 更新单个文档
   */
  async updateOne(query, updateData) {
    const update = {
      ...updateData,
      _updatedAt: new Date()
    };
    
    const result = await this.db.updateOne(this.collectionName, query, update);
    console.log(`[${this.constructor.name}] updateOne:`, query, '→', result ? 'Updated' : 'Not found');
    return result;
  }

  /**
   * UPDATE - 更新多个文档
   */
  async updateMany(query, updateData) {
    const update = {
      ...updateData,
      _updatedAt: new Date()
    };
    
    const result = await this.db.updateMany(this.collectionName, query, update);
    console.log(`[${this.constructor.name}] updateMany:`, query, '→', result.modifiedCount, 'updated');
    return result;
  }

  /**
   * DELETE - 根据ID删除
   */
  async deleteById(id) {
    const result = await this.db.deleteOne(this.collectionName, { _id: id });
    console.log(`[${this.constructor.name}] deleteById:`, id, '→', result ? 'Deleted' : 'Not found');
    return result;
  }

  /**
   * DELETE - 删除单个文档
   */
  async deleteOne(query) {
    const result = await this.db.deleteOne(this.collectionName, query);
    console.log(`[${this.constructor.name}] deleteOne:`, query, '→', result ? 'Deleted' : 'Not found');
    return result;
  }

  /**
   * DELETE - 删除多个文档
   */
  async deleteMany(query) {
    const result = await this.db.deleteMany(this.collectionName, query);
    console.log(`[${this.constructor.name}] deleteMany:`, query, '→', result.deletedCount, 'deleted');
    return result;
  }

  /**
   * UTILITY - 检查是否存在
   */
  async exists(query) {
    const count = await this.count(query);
    return count > 0;
  }

  /**
   * UTILITY - 生成唯一ID
   */
  generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.collectionName}_${timestamp}_${random}`;
  }

  /**
   * UTILITY - 清空集合
   */
  async clear() {
    await this.db.clearCollection(this.collectionName);
    console.log(`[${this.constructor.name}] Collection cleared`);
  }
}

export default BaseRepository;
