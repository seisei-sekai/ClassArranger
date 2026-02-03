/**
 * Performance Cache Utilities
 * 性能缓存工具
 * 
 * Implements caching strategies for expensive computations
 * 实现昂贵计算的缓存策略
 */

/**
 * Computation Cache
 * 计算缓存
 */
class ComputationCache {
  constructor(maxAge = 5000) {
    this.cache = new Map();
    this.maxAge = maxAge; // milliseconds (毫秒)
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * Get cached value or compute it
   * 获取缓存值或计算它
   * 
   * @param {string} key - Cache key (缓存键)
   * @param {Function} computeFn - Computation function (计算函数)
   * @returns {*} Cached or computed value (缓存或计算的值)
   */
  getOrCompute(key, computeFn) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      this.hits++;
      return cached.value;
    }
    
    this.misses++;
    const value = computeFn();
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }
  
  /**
   * Set cache value directly
   * 直接设置缓存值
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get cache value
   * 获取缓存值
   */
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      this.hits++;
      return cached.value;
    }
    this.misses++;
    return null;
  }
  
  /**
   * Clear cache
   * 清除缓存
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * Invalidate specific key
   * 失效特定键
   */
  invalidate(key) {
    return this.cache.delete(key);
  }
  
  /**
   * Get cache statistics
   * 获取缓存统计
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size
    };
  }
}

/**
 * Memoization decorator
 * 记忆化装饰器
 */
export const memoize = (fn, keyFn = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
};

/**
 * Debounce function
 * 防抖函数
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * Throttle function
 * 节流函数
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  
  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Create global cache instance
 * 创建全局缓存实例
 */
export const globalCache = new ComputationCache(10000); // 10 seconds

export default ComputationCache;

