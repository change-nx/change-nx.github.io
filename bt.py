#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json

DOC_DIR = "Doc/"
OUTPUT_FILE = "docs.json"

def scan_dir(dir_path, relative_path=""):
    result = []
    
    if not os.path.exists(dir_path):
        print(f"错误：目录 {dir_path} 不存在")
        return result
    
    items = sorted(os.listdir(dir_path))
    
    # 把"首页.md"排到最前面
    def sort_key(item):
        if item == "首页.md":
            return (0, item)
        else:
            return (1, item)
    items.sort(key=sort_key)
    
    for item in items:
        if item.startswith('.'):
            continue
        
        full_path = os.path.join(dir_path, item)
        name_without_ext = os.path.splitext(item)[0]
        ext = os.path.splitext(item)[1].lower()
        
        if os.path.isdir(full_path):
            children = scan_dir(full_path, os.path.join(relative_path, item))
            if children:
                result.append({
                    "name": name_without_ext,
                    "list": children
                })
        elif ext == ".md":
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 构建路径（用于定位）
            path_key = os.path.join(relative_path, name_without_ext)
            path_key = path_key.replace('\\', '/')
            
            result.append({
                "name": name_without_ext,
                "path": path_key,
                "content": content
            })
    
    return result

def main():
    print(f"正在扫描目录: {DOC_DIR}")
    docs_tree = scan_dir(DOC_DIR)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(docs_tree, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已生成 {OUTPUT_FILE}")
    print(f"📁 共处理 {len(docs_tree)} 个顶层项目")

if __name__ == "__main__":
    main()