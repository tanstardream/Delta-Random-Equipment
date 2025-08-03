#!/usr/bin/env python3
"""
检查图片文件并生成正确的HTML代码
"""
import os
import json

def check_images():
    base_path = "/mnt/d/project/html/Delta Random Equipment"
    
    categories = {
        "map": "地图",
        "character": "人物", 
        "gang": "枪械",
        "head": "头盔",
        "body": "护甲"
    }
    
    results = {}
    missing_files = []
    
    for category, name in categories.items():
        category_path = os.path.join(base_path, category)
        if os.path.exists(category_path):
            files = [f for f in os.listdir(category_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
            files.sort()
            results[category] = {
                "name": name,
                "files": files,
                "count": len(files)
            }
            print(f"{name} ({category}): {len(files)} 个文件")
            for f in files[:5]:  # 显示前5个文件
                print(f"  - {f}")
            if len(files) > 5:
                print(f"  ... 还有 {len(files)-5} 个文件")
        else:
            print(f"目录不存在: {category_path}")
            missing_files.append(category_path)
    
    return results, missing_files

def generate_html_slots(results):
    """生成HTML槽位代码"""
    
    # 图标映射
    icons = {
        "map": "🗺️",
        "character": "👤", 
        "gang": "🔫",
        "head": "🪖",
        "body": "🛡️"
    }
    
    # 生成每个槽位的HTML
    slot_id = 1
    for category, data in results.items():
        print(f"\n<!-- {data['name']} 槽位 -->")
        print(f'<div class="slot-square" id="slot{slot_id}" data-type="{data["name"]}">')
        print(f'  <span class="slot-label">{icons[category]}</span>')
        print(f'  <div class="slot-items">')
        print(f'    <div class="slot-reel">')
        
        for file in data["files"]:
            filename_without_ext = os.path.splitext(file)[0]
            print(f'      <div class="slot-item"><img loading="lazy" src="{category}/{file}" alt="{filename_without_ext}"></div>')
        
        print(f'    </div>')
        print(f'  </div>')
        print(f'</div>')
        
        slot_id += 1

if __name__ == "__main__":
    print("检查图片文件...")
    results, missing = check_images()
    
    if missing:
        print(f"\n❌ 缺少的目录: {missing}")
    
    print(f"\n📊 总计: {sum(data['count'] for data in results.values())} 个图片文件")
    
    print("\n" + "="*50)
    print("生成的HTML代码:")
    print("="*50)
    generate_html_slots(results)