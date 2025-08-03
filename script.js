/**
 * 重构后的随机装备系统 - 模块化版本
 * =================================================================
 */

// =================================================================
// 配置数据层
// =================================================================
const CONFIG = {
  slots: [
    { id: 'slot1', type: '地图', icon: '🗺️' },
    { id: 'slot2', type: '人物', icon: '👤' },
    { id: 'slot3', type: '枪械', icon: '🔫' },
    { id: 'slot4', type: '头盔', icon: '🪖' },
    { id: 'slot5', type: '护甲', icon: '🛡️' }
  ],
  animation: {
    spinDuration: 2000,     // 基础滚动时间
    slotInterval: 800,      // 每个槽位停止间隔
    itemHeight: 130,        // 物品高度
    maxTotalTime: 12000     // 最大总时间 (增加到12秒)
  },
  storage: {
    countKey: 'delta_random_count',
    recordsKey: 'delta_random_records'
  }
};

// =================================================================
// 数据管理层
// =================================================================
class DataManager {
  static getRandomCount() {
    return parseInt(localStorage.getItem(CONFIG.storage.countKey)) || 0;
  }

  static setRandomCount(count) {
    localStorage.setItem(CONFIG.storage.countKey, count.toString());
  }

  static getRecords() {
    return JSON.parse(localStorage.getItem(CONFIG.storage.recordsKey)) || [];
  }

  static saveRecords(records) {
    localStorage.setItem(CONFIG.storage.recordsKey, JSON.stringify(records));
  }

  static addRecord(results) {
    const count = this.getRandomCount() + 1;
    this.setRandomCount(count);

    const record = {
      id: Date.now(),
      count,
      result: results.join(' + '),
      timestamp: new Date().toLocaleString('zh-CN'),
      details: {
        map: results[0] || '',
        character: results[1] || '',
        weapon: results[2] || '',
        helmet: results[3] || '',
        armor: results[4] || ''
      }
    };

    const records = this.getRecords();
    records.unshift(record);

    // 限制记录数量
    const maxRecords = parseInt(document.getElementById('maxRecords')?.value) || 15;
    if (records.length > maxRecords) {
      records.splice(maxRecords);
    }

    this.saveRecords(records);
    return { record, count };
  }

  static clearRecords() {
    localStorage.removeItem(CONFIG.storage.recordsKey);
  }

  static resetAll() {
    this.setRandomCount(0);
    this.clearRecords();
  }
}

// =================================================================
// 动画管理层 - 重新设计的老虎机效果
// =================================================================
class AnimationManager {
  constructor() {
    this.activeAnimations = new Map();
  }

  startSlotSpin(slotElement, onStop, imagePreloader = null) {
    const slotId = slotElement.id;
    const slotItems = slotElement.querySelector('.slot-items');
    const reel = slotElement.querySelector('.slot-reel');
    
    // 调试：打印DOM结构
    console.log(`${slotId} DOM检查:`);
    console.log('  - slotElement:', slotElement);
    console.log('  - slotItems:', slotItems);
    console.log('  - reel:', reel);
    console.log('  - reel display:', reel ? window.getComputedStyle(reel).display : 'N/A');
    
    // 确保reel存在
    if (!reel) {
      console.error(`槽位 ${slotId} 缺少 .slot-reel 元素`);
      return;
    }
    
    const items = Array.from(reel.querySelectorAll('.slot-item'));
    console.log(`${slotId} 动画启动: 找到 ${items.length} 个items`);
    
    if (items.length === 0) {
      console.error(`槽位 ${slotId} 没有找到任何slot-item`);
      return;
    }
    
    // 准备动画数据
    const itemCount = items.length;
    // 使用更好的随机种子，确保每次都不同
    let currentIndex = Math.floor((Math.random() + Date.now() % 1000 / 1000) * itemCount) % itemCount;
    let isRunning = true;
    let frameCount = 0;
    const totalFrames = Math.floor(Math.random() * 180) + 300; // 5-8秒的动画，增加动画时长
    
    // 添加激活状态
    slotElement.classList.add('active');
    
    // 显示slot-reel用于动画，隐藏slot-display
    reel.style.display = 'block';
    const displayArea = slotItems.querySelector('.slot-display');
    if (displayArea) {
      displayArea.style.display = 'none';
    }
    
    // 创建动画状态
    const animationState = {
      animationId: null,
      stop: () => { isRunning = false; },
      getCurrentIndex: () => currentIndex,
      isRunning: () => isRunning
    };

    // 立即开始显示第一个动画帧
    this.showReelItem(reel, items, currentIndex, 0);
    console.log(`[${slotId}] 动画初始化: items=${itemCount}, totalFrames=${totalFrames}, startIndex=${currentIndex}`);

    const animate = () => {
      if (!isRunning) {
        console.log(`[${slotId}] 动画停止 - isRunning=false`);
        return;
      }

      frameCount++;
      
      // 动态调整切换频率（开始快，后来慢）
      const progress = frameCount / totalFrames;
      const switchFrequency = Math.max(1, Math.floor(15 * (1 - progress * 0.8))); // 从快速切换到慢速
      
      if (frameCount % switchFrequency === 0) {
        currentIndex = (currentIndex + 1) % itemCount;
        this.showReelItem(reel, items, currentIndex, progress);
        
        if (frameCount <= 10 || frameCount % 30 === 0) {
          console.log(`[${slotId}] Frame ${frameCount}/${totalFrames}: index=${currentIndex}, progress=${progress.toFixed(2)}`);
        }
      }

      if (frameCount < totalFrames && isRunning) {
        animationState.animationId = requestAnimationFrame(animate);
      } else if (isRunning) {
        // 动画结束，确保停止状态
        isRunning = false;
        console.log(`[${slotId}] 动画结束: finalIndex=${currentIndex}, totalFrames=${totalFrames}`);
        // 显示最终结果
        this.finishSlotAnimation(slotElement, currentIndex);
        // 确保回调只执行一次
        setTimeout(() => onStop(currentIndex), 0);
      }
    };

    // 设置动画状态并开始
    this.activeAnimations.set(slotId, animationState);
    animate();
  }

  showReelItem(reel, items, index, progress = 0) {
    // 隐藏所有items
    items.forEach((item, i) => {
      if (i === index) {
        // 显示当前索引的item
        item.style.display = 'flex';
        item.style.position = 'absolute';
        item.style.top = '0';
        item.style.left = '0';
        item.style.width = '100%';
        item.style.height = '100%';
        item.style.zIndex = '10';
        
        // 清除之前的效果
        item.style.filter = '';
        item.style.transform = '';
        item.style.boxShadow = '';
        
        // 根据动画进度添加效果
        if (progress > 0) {
          const intensity = Math.max(0, 1 - progress * 2);
          if (intensity > 0) {
            item.style.filter = `blur(${intensity * 3}px)`;
            item.style.transform = `scale(${0.95 + intensity * 0.1})`;
          }
        }
        
        // 添加发光效果（动画期间）
        if (progress < 1) {
          item.style.boxShadow = `0 0 ${10 + Math.sin(Date.now() * 0.01) * 5}px rgba(14, 251, 160, 0.5)`;
        }
      } else {
        // 隐藏其他items
        item.style.display = 'none';
      }
    });
  }

  showSlotItem(container, items, index, progress = 0, imagePreloader = null) {
    // 调试信息
    if (progress === 0) {
      console.log(`showSlotItem: index=${index}/${items.length}, progress=${progress}`);
    }
    
    // 清除容器内容
    container.innerHTML = '';
    
    // 验证索引有效性
    if (index >= items.length || index < 0) {
      console.error(`Invalid index: ${index}, items.length: ${items.length}`);
      return;
    }
    
    // 创建当前显示的item
    const currentItem = items[index].cloneNode(true);
    const img = currentItem.querySelector('img');
    
    // 图片加载处理
    if (img) {
      const src = img.src;
      
      // 检查图片是否已经预加载
      if (imagePreloader && imagePreloader.loadedImages.has(src)) {
        // 图片已预加载，直接显示
        currentItem.classList.remove('loading');
      } else {
        // 图片未预加载，显示loading状态
        currentItem.classList.add('loading');
        
        // 尝试加载图片
        const newImg = new Image();
        newImg.onload = () => {
          currentItem.classList.remove('loading');
          if (imagePreloader) {
            imagePreloader.loadedImages.add(src);
          }
        };
        newImg.onerror = () => {
          console.warn(`图片加载失败: ${src}`);
          currentItem.classList.add('error');
        };
        
        // 设置新的src来触发加载
        if (img.src !== src) {
          img.src = src;
        } else {
          newImg.src = src;
        }
      }
    }
    
    // 根据动画进度添加效果
    if (progress > 0) {
      const intensity = Math.max(0, 1 - progress * 2); // 前半段有模糊效果
      if (intensity > 0) {
        currentItem.style.filter = `blur(${intensity * 3}px)`;
        currentItem.style.transform = `scale(${0.95 + intensity * 0.1})`;
      }
    }
    
    // 添加发光效果（动画期间）
    if (progress < 1) {
      currentItem.style.boxShadow = `0 0 ${10 + Math.sin(Date.now() * 0.01) * 5}px rgba(14, 251, 160, 0.5)`;
    }
    
    container.appendChild(currentItem);
  }

  stopSlotSpin(slotElement, callback) {
    const slotId = slotElement.id;
    const animation = this.activeAnimations.get(slotId);
    
    if (!animation) return;

    // 停止动画
    if (animation.animationId) {
      cancelAnimationFrame(animation.animationId);
    }
    animation.stop();

    // 获取当前索引
    const finalIndex = animation.getCurrentIndex();
    
    // 立即完成动画
    this.finishSlotAnimation(slotElement, finalIndex);
    callback(finalIndex);
  }

  finishSlotAnimation(slotElement, finalIndex) {
    const slotItems = slotElement.querySelector('.slot-items');
    const reel = slotElement.querySelector('.slot-reel');
    
    if (!reel) {
      console.error(`槽位 ${slotElement.id} 缺少 .slot-reel`);
      return;
    }
    
    const items = Array.from(reel.querySelectorAll('.slot-item'));
    console.log(`${slotElement.id} 完成动画: finalIndex=${finalIndex}, items.length=${items.length}`);
    
    // 移除激活状态，添加完成状态
    slotElement.classList.remove('active');
    slotElement.classList.add('completed');

    // 清理所有slot-item的内联样式
    items.forEach(item => {
      item.style.display = '';
      item.style.position = '';
      item.style.top = '';
      item.style.left = '';
      item.style.width = '';
      item.style.height = '';
      item.style.zIndex = '';
      item.style.filter = '';
      item.style.transform = '';
      item.style.boxShadow = '';
    });

    // 隐藏reel，显示最终结果在display area
    reel.style.display = 'none';
    
    if (items[finalIndex]) {
      let displayArea = slotItems.querySelector('.slot-display');
      if (!displayArea) {
        displayArea = document.createElement('div');
        displayArea.className = 'slot-display';
        slotItems.appendChild(displayArea);
      }
      
      const finalItem = items[finalIndex].cloneNode(true);
      // 清理克隆项目的样式
      finalItem.style.display = '';
      finalItem.style.position = '';
      finalItem.style.top = '';
      finalItem.style.left = '';
      finalItem.style.width = '';
      finalItem.style.height = '';
      finalItem.style.zIndex = '';
      finalItem.style.filter = '';
      finalItem.style.transform = '';
      finalItem.style.boxShadow = '';
      finalItem.classList.add('highlighted');
      
      displayArea.innerHTML = '';
      displayArea.appendChild(finalItem);
      displayArea.style.display = 'flex';
      
      console.log(`${slotElement.id} 显示最终结果: ${finalItem.querySelector('img')?.alt}`);
    } else {
      console.error(`${slotElement.id} 无效的finalIndex: ${finalIndex}`);
    }

    // 清理动画记录
    this.activeAnimations.delete(slotElement.id);
  }

  stopAllAnimations() {
    console.log('停止所有动画');
    this.activeAnimations.forEach((animation, slotId) => {
      if (animation.animationId) {
        cancelAnimationFrame(animation.animationId);
      }
      animation.stop();
      
      // 清理对应槽位的状态
      const slotElement = document.getElementById(slotId);
      if (slotElement) {
        slotElement.classList.remove('active');
        const items = slotElement.querySelectorAll('.slot-item');
        items.forEach(item => {
          item.style.display = '';
          item.style.position = '';
          item.style.top = '';
          item.style.left = '';
          item.style.width = '';
          item.style.height = '';
          item.style.zIndex = '';
          item.style.filter = '';
          item.style.transform = '';
          item.style.boxShadow = '';
        });
      }
    });
    this.activeAnimations.clear();
  }
}

// =================================================================
// UI管理层
// =================================================================
class UIManager {
  constructor() {
    this.elements = {
      startBtn: document.getElementById('startBtn'),
      resultDiv: document.getElementById('result'),
      visitCount: document.getElementById('visitCount'),
      totalCount: document.getElementById('totalCount'),
      recordCount: document.getElementById('recordCount'),
      recordsList: document.getElementById('recordsList')
    };
  }

  updateStartButton(text, disabled = false) {
    this.elements.startBtn.textContent = text;
    this.elements.startBtn.disabled = disabled;
  }

  showResult(message, type = 'info') {
    this.elements.resultDiv.textContent = message;
    this.elements.resultDiv.className = `result ${type}`;
  }

  updateVisitCounter(count) {
    this.animateNumber(this.elements.visitCount, count);
  }

  updateStats() {
    const totalCount = DataManager.getRandomCount();
    const records = DataManager.getRecords();

    this.elements.totalCount.textContent = totalCount;
    this.elements.recordCount.textContent = records.length;
    this.updateRecordsList(records);
  }

  updateRecordsList(records) {
    if (records.length === 0) {
      this.elements.recordsList.innerHTML = '<div class="no-records">暂无随机记录</div>';
      return;
    }

    const maxRecords = parseInt(document.getElementById('maxRecords')?.value) || 15;
    const displayRecords = records.slice(0, maxRecords);

    this.elements.recordsList.innerHTML = displayRecords.map(record => `
      <div class="record-item">
        <div class="record-content">
          <div class="record-result">${record.result}</div>
          <div class="record-time">${record.timestamp}</div>
        </div>
        <div class="record-number">#${record.count}</div>
      </div>
    `).join('');

    this.elements.recordsList.scrollTop = 0;
  }

  animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = targetValue;
        element.style.animation = 'counterBlink 0.5s ease-in-out';
        setTimeout(() => element.style.animation = '', 500);
      }
    };

    requestAnimationFrame(update);
  }

  clearCompletedStates() {
    document.querySelectorAll('.slot-square').forEach(slot => {
      slot.classList.remove('completed', 'active');
      slot.querySelectorAll('.slot-item').forEach(item => {
        item.classList.remove('highlighted');
      });
      
      // 重新初始化槽位显示第一个项目
      const slotItems = slot.querySelector('.slot-items');
      const reel = slot.querySelector('.slot-reel');
      const items = Array.from(reel ? reel.querySelectorAll('.slot-item') : slot.querySelectorAll('.slot-item'));
      
      if (items.length > 0 && slotItems) {
        // 清除当前内容并显示第一个项目
        slotItems.innerHTML = '';
        const firstItem = items[0].cloneNode(true);
        firstItem.classList.remove('loading', 'error', 'highlighted');
        slotItems.appendChild(firstItem);
        
        // reel已通过CSS隐藏，不需要额外设置
        // 保持reel元素的可访问性用于动画
      }
    });
  }
}

// =================================================================
// 音频管理层
// =================================================================
class AudioManager {
  constructor() {
    this.bgMusic = document.getElementById('bgMusic');
    this.isMuted = false;
    this.currentVolume = 0.3;
    this.init();
  }

  init() {
    if (this.bgMusic) {
      this.bgMusic.volume = this.currentVolume;
      this.setupControls();
    }
  }

  setupControls() {
    const audioBtn = document.getElementById('audioBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    
    if (audioBtn) {
      audioBtn.addEventListener('click', () => this.togglePlay());
    }
    
    if (volumeBtn) {
      volumeBtn.addEventListener('click', () => this.toggleMute());
    }
  }

  togglePlay() {
    if (!this.bgMusic) return;

    if (this.bgMusic.paused) {
      this.bgMusic.play().catch(console.error);
    } else {
      this.bgMusic.pause();
    }
  }

  toggleMute() {
    if (!this.bgMusic) return;

    if (this.isMuted) {
      this.bgMusic.volume = this.currentVolume;
      this.isMuted = false;
    } else {
      this.currentVolume = this.bgMusic.volume;
      this.bgMusic.volume = 0;
      this.isMuted = true;
    }
  }

  playWinSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // 静默处理音频错误
    }
  }
}

// =================================================================
// 边栏管理层
// =================================================================
class SidebarManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.sidebar = document.getElementById('recordsSidebar');
    this.overlay = document.getElementById('sidebarOverlay');
    this.init();
  }

  init() {
    this.setupControls();
    this.setupEventListeners();
  }

  setupControls() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    const clearBtn = document.getElementById('clearRecords');
    const maxRecordsSelect = document.getElementById('maxRecords');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearRecords());
    }

    if (maxRecordsSelect) {
      maxRecordsSelect.addEventListener('change', () => this.updateRecordsLimit());
    }
  }

  setupEventListeners() {
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.sidebar?.classList.add('open');
    this.overlay?.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    const toggleText = document.querySelector('.toggle-text');
    if (toggleText) toggleText.textContent = '关闭记录';
  }

  close() {
    this.sidebar?.classList.remove('open');
    this.overlay?.classList.remove('show');
    document.body.style.overflow = '';
    
    const toggleText = document.querySelector('.toggle-text');
    if (toggleText) toggleText.textContent = '查看记录';
  }

  isOpen() {
    return this.sidebar?.classList.contains('open') || false;
  }

  clearRecords() {
    if (confirm('确定要清空所有随机记录吗？随机次数不会被重置。\\n\\n这个操作不能撤销！')) {
      DataManager.clearRecords();
      this.uiManager.updateStats();
    }
  }

  updateRecordsLimit() {
    const maxRecords = parseInt(document.getElementById('maxRecords')?.value) || 15;
    const records = DataManager.getRecords();
    
    if (records.length > maxRecords) {
      const trimmedRecords = records.slice(0, maxRecords);
      DataManager.saveRecords(trimmedRecords);
    }
    
    this.uiManager.updateStats();
  }
}

// =================================================================
// 图片预加载管理器
// =================================================================
class ImagePreloader {
  constructor() {
    this.loadedImages = new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.loadedImages.has(src)) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(src);
        resolve(src);
      };
      img.onerror = () => {
        console.warn(`图片加载失败: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  async preloadSlotImages(slotElement) {
    const images = Array.from(slotElement.querySelectorAll('img'));
    const promises = images.map(img => this.preloadImage(img.src));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('部分图片预加载失败:', error);
    }
  }

  async preloadAllImages() {
    if (this.isPreloading) return;
    this.isPreloading = true;

    const allSlots = document.querySelectorAll('.slot-square');
    const promises = Array.from(allSlots).map(slot => this.preloadSlotImages(slot));
    
    try {
      await Promise.allSettled(promises);
      console.log('图片预加载完成');
    } catch (error) {
      console.warn('图片预加载过程中出现错误:', error);
    } finally {
      this.isPreloading = false;
    }
  }
}

// =================================================================
// 主控制器
// =================================================================
class LotteryController {
  constructor() {
    this.isSpinning = false;
    this.results = [];
    this.completedSlots = 0;
    
    this.imagePreloader = new ImagePreloader();
    this.animationManager = new AnimationManager();
    this.uiManager = new UIManager();
    this.audioManager = new AudioManager();
    this.sidebarManager = new SidebarManager(this.uiManager);
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeDisplay();
    this.setupKeyboardShortcuts();
    
    // 启动图片预加载
    setTimeout(() => {
      this.imagePreloader.preloadAllImages();
    }, 1000);
  }

  setupEventListeners() {
    this.uiManager.elements.startBtn?.addEventListener('click', () => this.startLottery());
    
    // 设置双击重置功能
    const visitCounter = document.querySelector('.visit-counter');
    if (visitCounter) {
      let clickCount = 0;
      visitCounter.addEventListener('click', () => {
        clickCount++;
        setTimeout(() => {
          if (clickCount === 2) {
            this.resetAllData();
          }
          clickCount = 0;
        }, 300);
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!this.isSpinning) this.startLottery();
          break;
        case 'KeyM':
          e.preventDefault();
          this.audioManager.togglePlay();
          break;
        case 'KeyV':
          e.preventDefault();
          this.audioManager.toggleMute();
          break;
      }
    });
  }

  initializeDisplay() {
    this.uiManager.updateVisitCounter(DataManager.getRandomCount());
    this.uiManager.updateStats();
    this.uiManager.showResult('点击按钮开始随机装备！', 'info');
    
    // 初始化所有槽位显示第一个项目
    this.initializeSlots();
  }

  initializeSlots() {
    const slots = CONFIG.slots.map(config => document.getElementById(config.id)).filter(Boolean);
    
    slots.forEach(slot => {
      const slotItems = slot.querySelector('.slot-items');
      const reel = slot.querySelector('.slot-reel');
      
      // 确保reel存在且可访问
      if (!reel) {
        console.error(`槽位 ${slot.id} 缺少 .slot-reel 元素`);
        return;
      }
      
      const items = Array.from(reel.querySelectorAll('.slot-item'));
      console.log(`初始化槽位 ${slot.id}: 找到 ${items.length} 个items`);
      
      if (items.length > 0) {
        // 隐藏slot-reel但保留在DOM中，以便动画使用
        reel.style.display = 'none';
        
        // 创建显示区域来显示当前选中的项目
        let displayArea = slotItems.querySelector('.slot-display');
        if (!displayArea) {
          displayArea = document.createElement('div');
          displayArea.className = 'slot-display';
          slotItems.appendChild(displayArea);
        }
        
        // 显示第一个项目
        const firstItem = items[0].cloneNode(true);
        firstItem.classList.remove('loading', 'error');
        displayArea.innerHTML = '';
        displayArea.appendChild(firstItem);
        console.log(`槽位 ${slot.id} 初始化完成，显示: ${firstItem.querySelector('img')?.alt}`);
      } else {
        console.error(`槽位 ${slot.id} 没有找到任何items`);
      }
    });
  }

  async startLottery() {
    if (this.isSpinning) {
      console.log('动画已在运行中，忽略重复请求');
      return;
    }

    // 强制停止所有现有动画
    this.animationManager.stopAllAnimations();

    this.isSpinning = true;
    this.results = [];
    this.completedSlots = 0;

    this.uiManager.updateStartButton('🎯 装备中... 🎯', true);
    this.uiManager.showResult('装备随机中...', 'info');
    
    // 清理所有槽位状态
    document.querySelectorAll('.slot-square').forEach(slot => {
      slot.classList.remove('completed', 'active');
      
      // 清理所有slot-item的样式
      slot.querySelectorAll('.slot-item').forEach(item => {
        item.classList.remove('highlighted');
        item.style.display = '';
        item.style.position = '';
        item.style.top = '';
        item.style.left = '';
        item.style.width = '';
        item.style.height = '';
        item.style.zIndex = '';
        item.style.filter = '';
        item.style.transform = '';
        item.style.boxShadow = '';
      });
    });

    // 获取所有槽位
    const slots = CONFIG.slots.map(config => document.getElementById(config.id)).filter(Boolean);

    // 启动所有槽位动画，每个槽位延迟一点开始，错开停止时间
    console.log('开始启动动画，总槽位数:', slots.length);
    slots.forEach((slot, index) => {
      const startDelay = index * 300; // 每个槽位延迟300ms开始
      console.log(`准备启动 ${slot.id} 动画，延迟 ${startDelay}ms`);
      
      setTimeout(() => {
        if (this.isSpinning) {
          console.log(`启动 ${slot.id} 动画`);
          this.animationManager.startSlotSpin(slot, (finalIndex) => {
            console.log(`${slot.id} 动画完成，finalIndex=${finalIndex}`);
            this.stopSlot(slot, index, finalIndex);
          }, this.imagePreloader);
        } else {
          console.log(`${slot.id} 动画取消 - isSpinning=false`);
        }
      }, startDelay);
    });

    // 设置安全超时时间（只保留一个超时机制，避免冲突）
    setTimeout(() => {
      if (this.isSpinning) {
        console.log('动画安全超时，强制完成所有槽位');
        this.forceComplete();
      }
    }, CONFIG.animation.maxTotalTime);
  }

  stopSlot(slotElement, slotIndex, finalIndex = null) {
    const reel = slotElement.querySelector('.slot-reel');
    if (!reel) {
      console.error(`槽位 ${slotElement.id} 缺少 .slot-reel 元素`);
      return;
    }
    
    const items = Array.from(reel.querySelectorAll('.slot-item'));
    console.log(`${slotElement.id} 停止动画: finalIndex=${finalIndex}, items.length=${items.length}`);
    
    if (finalIndex !== null) {
      // 动画自然结束，直接使用结果
      const prizeName = items[finalIndex]?.querySelector('img')?.alt || '';
      this.results[slotIndex] = prizeName;
      console.log(`${slotElement.id} 结果: ${prizeName}`);

      this.completedSlots++;

      // 检查是否所有槽位都完成
      if (this.completedSlots >= CONFIG.slots.length) {
        this.finishLottery();
      }
    } else {
      // 强制停止动画
      this.animationManager.stopSlotSpin(slotElement, (finalIndex) => {
        const prizeName = items[finalIndex]?.querySelector('img')?.alt || '';
        this.results[slotIndex] = prizeName;
        console.log(`${slotElement.id} 强制停止结果: ${prizeName}`);

        this.completedSlots++;

        // 检查是否所有槽位都完成
        if (this.completedSlots >= CONFIG.slots.length) {
          this.finishLottery();
        }
      });
    }
  }

  finishLottery() {
    this.isSpinning = false;
    
    // 显示结果
    const resultText = `获得奖励：${this.results.join(' + ')}`;
    this.uiManager.showResult(resultText, 'success');
    
    // 播放音效
    this.audioManager.playWinSound();
    
    // 保存记录并更新显示
    const { count } = DataManager.addRecord(this.results);
    this.uiManager.updateVisitCounter(count);
    this.uiManager.updateStats();
    
    // 重置按钮
    this.uiManager.updateStartButton('🎯 随机装备 🎯', false);
    
    // 清理视觉效果，但保持结果显示
    setTimeout(() => {
      document.querySelectorAll('.slot-square').forEach(slot => {
        slot.classList.remove('completed', 'active');
        // 不调用clearCompletedStates，以保持最终结果显示
      });
    }, 3000);
  }

  forceComplete() {
    console.log('强制完成动画，当前完成槽位数:', this.completedSlots);
    this.animationManager.stopAllAnimations();
    
    // 为未完成的槽位随机选择结果
    CONFIG.slots.forEach((config, index) => {
      if (!this.results[index]) {
        const slot = document.getElementById(config.id);
        const reel = slot?.querySelector('.slot-reel');
        const items = reel?.querySelectorAll('.slot-item') || slot?.querySelectorAll('.slot-item');
        if (items?.length) {
          const randomIndex = Math.floor(Math.random() * items.length);
          this.results[index] = items[randomIndex].querySelector('img')?.alt || '';
          console.log(`强制完成槽位 ${config.id}: ${this.results[index]}`);
          
          // 手动显示最终结果
          this.animationManager.finishSlotAnimation(slot, randomIndex);
        }
      }
    });

    // 确保所有槽位都有结果后完成
    this.completedSlots = CONFIG.slots.length;
    this.finishLottery();
  }

  resetAllData() {
    if (confirm('确定要重置所有数据吗？\\n\\n这将清空：\\n• 随机次数统计\\n• 所有随机记录\\n\\n此操作不能撤销！')) {
      DataManager.resetAll();
      this.uiManager.updateVisitCounter(0);
      this.uiManager.updateStats();
    }
  }
}

// =================================================================
// 初始化应用
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
  new LotteryController();
});

// 添加计数器闪烁动画
const style = document.createElement('style');
style.textContent = `
  @keyframes counterBlink {
    0%, 100% { 
      color: var(--primary-color); 
      text-shadow: 0 0 5px rgba(14, 251, 160, 0.3);
    }
    50% { 
      color: #ffffff; 
      text-shadow: 0 0 10px rgba(14, 251, 160, 0.8);
    }
  }
`;
document.head.appendChild(style);