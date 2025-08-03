// 动画调试脚本 - 在浏览器控制台中运行
console.log('=== 动画调试开始 ===');

// 检查基本元素
const slots = document.querySelectorAll('.slot-square');
console.log('找到槽位数量:', slots.length);

slots.forEach((slot, index) => {
  const slotItems = slot.querySelector('.slot-items');
  const reel = slot.querySelector('.slot-reel');
  const items = reel ? reel.querySelectorAll('.slot-item') : slot.querySelectorAll('.slot-item');
  
  console.log(`槽位 ${slot.id}:`);
  console.log('  - slotItems:', slotItems ? '✓' : '✗');
  console.log('  - reel:', reel ? '✓' : '✗');
  console.log('  - items数量:', items.length);
  
  if (items.length > 0) {
    console.log('  - 第一个item:', items[0].querySelector('img')?.alt || 'no alt');
    console.log('  - 最后一个item:', items[items.length-1].querySelector('img')?.alt || 'no alt');
  }
});

// 测试简单动画
function testSimpleAnimation() {
  const firstSlot = slots[0];
  const slotItems = firstSlot.querySelector('.slot-items');
  const reel = firstSlot.querySelector('.slot-reel');
  const items = Array.from(reel ? reel.querySelectorAll('.slot-item') : firstSlot.querySelectorAll('.slot-item'));
  
  if (!slotItems || items.length === 0) {
    console.error('无法进行动画测试 - 缺少必要元素');
    return;
  }
  
  console.log('开始简单动画测试...');
  let currentIndex = 0;
  let frameCount = 0;
  const maxFrames = 60; // 1秒测试
  
  const testAnimate = () => {
    if (frameCount >= maxFrames) {
      console.log('测试动画完成');
      return;
    }
    
    frameCount++;
    if (frameCount % 10 === 0) {
      currentIndex = (currentIndex + 1) % items.length;
      
      // 简单显示逻辑
      slotItems.innerHTML = '';
      const currentItem = items[currentIndex].cloneNode(true);
      slotItems.appendChild(currentItem);
      
      console.log(`测试帧 ${frameCount}: 显示 index=${currentIndex}, alt=${currentItem.querySelector('img')?.alt}`);
    }
    
    requestAnimationFrame(testAnimate);
  };
  
  testAnimate();
}

// 运行测试
testSimpleAnimation();