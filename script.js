class LotterySystem {
  constructor() {
    this.isSpinning = false;
    this.slots = [];
    this.results = [];
    this.spinIntervals = [];
    this.init();
  }

  init() {
    // 获取所有抽奖槽
    this.slots = [
      document.getElementById('slot1'),
      document.getElementById('slot2'),
      document.getElementById('slot3'),
      document.getElementById('slot4'),
      document.getElementById('slot5')
    ];

    // 获取按钮和结果显示区域
    this.startBtn = document.getElementById('startBtn');
    this.resultDiv = document.getElementById('result');

    // 绑定事件 - 支持移动端触摸
    this.startBtn.addEventListener('click', () => this.startLottery());
    this.startBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startLottery();
    }, { passive: false });

    // 移动端优化：防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // 移动端优化：防止页面滚动
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.slot-square') || e.target.closest('.start-btn')) {
        e.preventDefault();
      }
    }, { passive: false });

    // 初始化slot-item显示状态
    this.initializeSlotDisplay();

    // 初始化结果显示
    this.showResult('点击按钮开始5秒闪动！最后停的奖励即为获得奖励！', 'info');
  }

  initializeSlotDisplay() {
    this.slots.forEach(slot => {
      if (slot) {
        const items = slot.querySelectorAll('.slot-item');
        items.forEach((item, index) => {
          if (index === 0) {
            item.classList.add('selected');
          } else {
            item.classList.remove('selected');
          }
        });
      }
    });
  }

  startLottery() {
    if (this.isSpinning) return; // 如果正在滚动，忽略点击

    // 开始滚动
    this.isSpinning = true;
    this.startBtn.textContent = '🎯 装备中... 🎯';
    this.results = [];

    // 清除之前的结果
    this.clearResults();
    this.showResult('装备随机中...', 'info');

    // 为每个槽位设置5秒后停止
    const stopTime = 5000;

    this.slots.forEach((slot, index) => {
      this.spinSlot(slot, index, stopTime);
    });

    // 5秒后自动停止所有槽位
    setTimeout(() => {
      this.stopAllSpinning();
    }, stopTime);
  }

  spinSlot(slot, slotIndex, stopTime) {
    const items = slot.querySelectorAll('.slot-item');
    const itemCount = items.length;
    let currentIndex = 0;
    let speed = 100; // 闪动速度
    let isSpinning = true;
    let startTime = Date.now();

    // 随机打乱物品顺序
    this.shuffleItems(slot);

    // 添加激活状态
    slot.classList.add('active');

    const flash = () => {
      if (!isSpinning) return;

      // 隐藏所有物品
      items.forEach(item => {
        item.classList.remove('selected');
      });

      // 显示当前物品
      const currentItem = items[currentIndex];
      currentItem.classList.add('selected');

      // 更新索引
      currentIndex = (currentIndex + 1) % itemCount;

      // 计算已经过去的时间
      const elapsedTime = Date.now() - startTime;
      const remainingTime = stopTime - elapsedTime;

      // 逐渐减速：在最后2秒内逐渐变慢
      if (remainingTime < 2000) {
        const slowDownFactor = (2000 - remainingTime) / 2000;
        speed = 100 + (slowDownFactor * 300);
      }

      // 继续闪动或停止
      if (elapsedTime < stopTime && isSpinning) {
        const intervalId = setTimeout(flash, speed);
        this.spinIntervals[slotIndex] = { intervalId, stop: () => { isSpinning = false; } };
      } else {
        this.stopSlot(slot, slotIndex, currentIndex);
      }
    };

    flash();
  }

  stopSlot(slot, slotIndex, finalIndex) {
    const items = slot.querySelectorAll('.slot-item');

    // 隐藏所有物品
    items.forEach(item => {
      item.classList.remove('selected');
    });

    // 获取当前显示的物品
    const currentItem = items[finalIndex];

    // 显示并高亮最终物品
    currentItem.classList.add('selected');

    // 获取当前物品的奖品名称
    const prizeName = currentItem.querySelector('img').alt;
    this.results[slotIndex] = prizeName;
  }

  showFinalResults() {
    const resultText = `获得奖励：${this.results.join(' + ')}`;
    this.showResult(resultText, 'success');

    // 播放音效
    this.playSound();
  }

  showResult(message, type) {
    this.resultDiv.textContent = message;
    this.resultDiv.className = `result ${type}`;
  }

  shuffleItems(slot) {
    const items = Array.from(slot.querySelectorAll('.slot-item'));

    // Fisher-Yates 洗牌算法
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }

    // 重新排列DOM元素
    const slotItems = slot.querySelector('.slot-items');
    items.forEach(item => {
      slotItems.appendChild(item);
    });
  }

  stopAllSpinning() {
    // 停止所有槽位的滚动
    this.spinIntervals.forEach((intervalData, index) => {
      if (intervalData) {
        clearTimeout(intervalData.intervalId);
        intervalData.stop();

        // 获取当前选中的项
        const slot = this.slots[index];
        const items = slot.querySelectorAll('.slot-item');
        const selectedItem = slot.querySelector('.slot-item.selected');
        const currentIndex = Array.from(items).indexOf(selectedItem);

        // 停止该槽位
        this.stopSlot(slot, index, currentIndex);
      }
    });

    // 清空定时器数组
    this.spinIntervals = [];

    // 显示结果
    this.showFinalResults();
    this.isSpinning = false;
    this.startBtn.textContent = '🎯 随机装备 🎯';

    // 移除所有激活状态
    this.slots.forEach(slot => {
      slot.classList.remove('active');
    });
  }

  clearResults() {
    this.slots.forEach(slot => {
      const items = slot.querySelectorAll('.slot-item');
      items.forEach((item, index) => {
        item.classList.remove('selected');
        if (index === 0) {
          item.classList.add('selected');
        }
      });
      slot.classList.remove('active');
    });
  }

  playSound() {
    // 创建简单的音效（使用Web Audio API）
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
      // 音效播放失败时静默处理
    }
  }
}

// 添加一些额外的视觉效果
class VisualEffects {
  constructor() {
    this.initParticles();
  }

  initParticles() {
    // 创建粒子效果
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
    document.body.appendChild(particleContainer);

    // 定期创建粒子
    setInterval(() => {
      this.createParticle(particleContainer);
    }, 2000);
  }

  createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 50%;
            pointer-events: none;
            animation: float 3s ease-in-out infinite;
        `;

    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';

    container.appendChild(particle);

    // 3秒后移除粒子
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  }
}

// 添加浮动动画的CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new LotterySystem();
  new VisualEffects();

  // 初始化音频控制
  initAudioControl();

  // 添加图片错误处理
  initImageErrorHandling();
});

// 音频控制功能
function initAudioControl() {
  const audioBtn = document.getElementById('audioBtn');
  const volumeBtn = document.getElementById('volumeBtn');
  const bgMusic = document.getElementById('bgMusic');
  const audioIcon = audioBtn.querySelector('.audio-icon');
  const volumeIcon = volumeBtn.querySelector('.volume-icon');
  const audioStatus = document.querySelector('.audio-status');

  // 音频状态管理
  let isMuted = false;
  let currentVolume = 0.3;

  // 设置初始音量
  bgMusic.volume = currentVolume;

  // 更新状态显示
  function updateStatus(message) {
    if (audioStatus) {
      audioStatus.textContent = message;
    }
  }

  // 更新音量图标
  function updateVolumeIcon() {
    if (isMuted || bgMusic.volume === 0) {
      volumeIcon.textContent = '🔇';
    } else if (bgMusic.volume < 0.3) {
      volumeIcon.textContent = '🔉';
    } else if (bgMusic.volume < 0.7) {
      volumeIcon.textContent = '🔊';
    } else {
      volumeIcon.textContent = '🔊';
    }
  }

  // 添加音频加载事件监听
  bgMusic.addEventListener('loadeddata', () => {
    updateStatus('手动播放音乐');
    updateVolumeIcon();
  });

  bgMusic.addEventListener('error', (e) => {
    console.error('背景音乐加载失败:', e);
    audioIcon.textContent = '❌';
    updateStatus('音乐加载失败');
  });

  // 播放/暂停按钮 - 支持移动端触摸
  const handleAudioClick = () => {

    if (bgMusic.paused) {
      // 尝试播放音乐
      const playPromise = bgMusic.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioIcon.textContent = '🔊';
          audioBtn.classList.remove('muted');
          updateStatus('音乐播放中');
        }).catch((error) => {
          console.error('播放失败:', error);
          audioIcon.textContent = '❌';
          updateStatus('播放失败，请重试');
        });
      }
    } else {
      bgMusic.pause();
      audioIcon.textContent = '🔇';
      audioBtn.classList.add('muted');
      updateStatus('音乐已暂停');
    }
  };

  audioBtn.addEventListener('click', handleAudioClick);
  audioBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleAudioClick();
  }, { passive: false });

  // 音量控制按钮 - 支持移动端触摸
  const handleVolumeClick = () => {
    if (isMuted) {
      // 取消静音
      bgMusic.volume = currentVolume;
      isMuted = false;
      updateStatus(`音量: ${Math.round(currentVolume * 100)}%`);
    } else {
      // 静音
      currentVolume = bgMusic.volume;
      bgMusic.volume = 0;
      isMuted = true;
      updateStatus('已静音');
    }
    updateVolumeIcon();
  };

  volumeBtn.addEventListener('click', handleVolumeClick);
  volumeBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleVolumeClick();
  }, { passive: false });

  // 音量调节（鼠标滚轮）
  volumeBtn.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (isMuted) {
      isMuted = false;
    }

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    currentVolume = Math.max(0, Math.min(1, bgMusic.volume + delta));
    bgMusic.volume = currentVolume;

    updateVolumeIcon();
    updateStatus(`音量: ${Math.round(currentVolume * 100)}%`);
  });

  // 添加键盘快捷键控制音乐
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      audioBtn.click();
    }
    if (e.code === 'KeyV' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      volumeBtn.click();
    }
  });

  // 测试音频功能
  setTimeout(() => {
    if (bgMusic.readyState >= 2) {
      updateStatus('手动播放音乐');
    } else {
      updateStatus('音乐加载中...');
    }
  }, 1000);

  // 初始化音频上下文（解决某些浏览器的自动播放限制）
  function initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      // 音频上下文初始化失败时静默处理
    }
  }

  // 在用户点击音频按钮时初始化音频上下文
  audioBtn.addEventListener('click', initAudioContext, { once: true });
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.click();
    }
  }
});

// 移动端优化：防止意外触发
// 移除滑动手势功能，只保留按钮点击，避免误触

// 防止双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// 防止在特定区域的意外滚动
document.addEventListener('touchmove', (e) => {
  // 只在抽奖区域和按钮区域阻止默认滚动
  if (e.target.closest('.slot-machine') ||
    e.target.closest('.start-btn') ||
    e.target.closest('.control-section')) {
    e.preventDefault();
  }
}, { passive: false });

// 图片错误处理
function initImageErrorHandling() {
  // 为所有图片添加错误处理
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function() {
      // 创建占位符内容
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        width: ${this.width || 200}px;
        height: ${this.height || 200}px;
        background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 14px;
        text-align: center;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      placeholder.innerHTML = `<div>🖼️<br>${this.alt || '图片'}</div>`;
      
      // 替换失败的图片
      if (this.parentNode) {
        this.parentNode.replaceChild(placeholder, this);
      }
    });
  });
}