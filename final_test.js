// 最终测试脚本 - 验证所有修复后的状态
console.log('=== 最终DOM结构测试 ===');

// 检查所有槽位
const slots = document.querySelectorAll('.slot-square');
console.log('找到槽位数量:', slots.length);

let allReelsFound = true;

for (let i = 0; i < slots.length; i++) {
  const slot = slots[i];
  const slotItems = slot.querySelector('.slot-items');
  const reel = slot.querySelector('.slot-reel');
  
  console.log(`\n检查槽位 ${slot.id}:`);
  console.log('  - slotItems存在:', !!slotItems);
  console.log('  - reel存在:', !!reel);
  
  if (!reel) {
    console.error(`  ❌ 槽位 ${slot.id} 缺少 .slot-reel 元素!`);
    allReelsFound = false;
    continue;
  }
  
  // 检查CSS状态
  const reelStyles = window.getComputedStyle(reel);
  console.log('  - reel display:', reelStyles.display);
  console.log('  - reel position:', reelStyles.position);
  console.log('  - reel opacity:', reelStyles.opacity);
  
  // 检查slot-items
  const items = Array.from(reel.querySelectorAll('.slot-item'));
  console.log('  - items数量:', items.length);
  
  if (items.length > 0) {
    console.log('  - 第一个item:', items[0].querySelector('img')?.alt || 'no alt');
    console.log('  - ✅ 槽位结构正常');
  } else {
    console.error(`  ❌ 槽位 ${slot.id} 没有找到任何items!`);
    allReelsFound = false;
  }
}

console.log('\n=== 测试结果 ===');
if (allReelsFound) {
  console.log('🎉 所有槽位DOM结构正常！');
  console.log('📝 动画系统应该可以正常工作了');
  console.log('🎯 可以点击"随机装备"按钮开始测试');
} else {
  console.error('❌ 发现DOM结构问题，需要检查HTML');
}

// 检查是否有内联样式覆盖
console.log('\n=== 检查内联样式 ===');
slots.forEach(slot => {
  const reel = slot.querySelector('.slot-reel');
  if (reel && reel.style.display) {
    console.warn(`⚠️ 槽位 ${slot.id} 的reel有内联display样式: ${reel.style.display}`);
    // 清除内联样式
    reel.style.removeProperty('display');
    console.log(`✅ 已清除槽位 ${slot.id} 的内联display样式`);
  }
});