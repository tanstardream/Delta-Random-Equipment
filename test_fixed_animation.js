// 测试修复后的动画系统
console.log('=== 测试修复后的动画系统 ===');

// 检查DOM结构
const slots = document.querySelectorAll('.slot-square');
console.log('找到槽位数量:', slots.length);

let allGood = true;

slots.forEach((slot, index) => {
  const slotItems = slot.querySelector('.slot-items');
  const reel = slot.querySelector('.slot-reel');
  
  console.log(`检查槽位 ${slot.id}:`);
  console.log('  - slotItems:', slotItems ? '✓' : '✗');
  console.log('  - reel:', reel ? '✓' : '✗');
  
  if (!reel) {
    console.error(`  ❌ 槽位 ${slot.id} 缺少 .slot-reel`);
    allGood = false;
    return;
  }
  
  const items = Array.from(reel.querySelectorAll('.slot-item'));
  console.log('  - items数量:', items.length);
  
  if (items.length === 0) {
    console.error(`  ❌ 槽位 ${slot.id} 没有找到任何 .slot-item`);
    allGood = false;
    return;
  }
  
  // 测试第一个和最后一个item
  const firstImg = items[0].querySelector('img');
  const lastImg = items[items.length-1].querySelector('img');
  
  console.log('  - 第一个item:', firstImg?.alt || 'no alt');
  console.log('  - 最后一个item:', lastImg?.alt || 'no alt');
  console.log('  - ✓ 槽位结构正常');
});

if (allGood) {
  console.log('🎉 所有槽位结构检查通过！');
  console.log('📝 动画系统应该可以正常工作了');
  
  // 测试开启一次动画
  if (window.lotteryController) {
    console.log('尝试测试动画...');
    // 不实际启动，只是检查是否可以调用
    console.log('LotteryController存在，可以手动点击按钮测试');
  }
} else {
  console.error('❌ 发现结构问题，需要进一步修复');
}