#!/usr/bin/env python3
"""
生成完整的枪械槽位HTML
"""
import os

def generate_weapon_slots():
    base_path = "/mnt/d/project/html/Delta Random Equipment"
    gang_path = os.path.join(base_path, "gang")
    
    if not os.path.exists(gang_path):
        print(f"目录不存在: {gang_path}")
        return
    
    files = [f for f in os.listdir(gang_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
    files.sort()
    
    print(f"找到 {len(files)} 个武器文件")
    print("\n枪械槽位HTML代码:")
    print('            <div class="slot-reel">')
    
    for file in files:
        filename_without_ext = os.path.splitext(file)[0]
        print(f'              <div class="slot-item"><img loading="lazy" src="gang/{file}" alt="{filename_without_ext}"></div>')
    
    print('            </div>')

if __name__ == "__main__":
    generate_weapon_slots()