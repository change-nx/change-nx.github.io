// 文件扫描器 - 自动获取 docs/ 目录下的文件列表
class FileScanner {
    constructor() {
        this.files = [];
        this.fileTree = {};
    }

    // 扫描 docs 目录
    async scanDocsDirectory() {
        try {
            // 先尝试读取一个已知文件来测试
            const testFiles = [
                'docs/README.md',
                'docs/index.md',
                'docs/guide/index.md'
            ];
            
            // 检查哪些文件存在
            const existingFiles = [];
            for (const file of testFiles) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        existingFiles.push(file);
                    }
                } catch (e) {
                    // 文件不存在，继续检查下一个
                }
            }
            
            // 如果没有任何已知文件，返回空
            if (existingFiles.length === 0) {
                console.warn('未找到任何文档文件');
                return [];
            }
            
            // 基于找到的文件构建树结构
            return this.buildFileTreeFromExisting(existingFiles);
            
        } catch (error) {
            console.error('扫描文档目录失败:', error);
            return [];
        }
    }

    // 从现有文件构建树结构
    buildFileTreeFromExisting(files) {
        const tree = {};
        
        files.forEach(file => {
            const path = file.replace('docs/', '');
            const parts = path.split('/');
            
            let current = tree;
            parts.forEach((part, index) => {
                const isFile = part.endsWith('.md');
                const name = isFile ? part.replace('.md', '') : part;
                
                if (!current[name]) {
                    current[name] = {
                        name: name,
                        type: isFile ? 'file' : 'folder',
                        path: path,
                        children: {}
                    };
                }
                
                if (index < parts.length - 1) {
                    current = current[name].children;
                }
            });
        });
        
        // 添加一些常见结构
        this.addCommonStructures(tree);
        
        return tree;
    }

    // 添加常见文档结构
    addCommonStructures(tree) {
        const commonFolders = ['guide', 'tutorial', 'api', 'reference', 'faq', 'examples'];
        const commonFiles = ['getting-started', 'installation', 'configuration', 'usage'];
        
        commonFolders.forEach(folder => {
            if (!tree[folder]) {
                tree[folder] = {
                    name: folder,
                    type: 'folder',
                    path: folder,
                    children: {}
                };
            }
        });
        
        // 确保每个文件夹都有 index.md
        Object.values(tree).forEach(item => {
            if (item.type === 'folder' && !item.children['index']) {
                item.children['index'] = {
                    name: 'index',
                    type: 'file',
                    path: `${item.path}/index.md`
                };
            }
        });
        
        // 添加一些常见文件到 guide 文件夹
        if (tree.guide && tree.guide.children) {
            commonFiles.forEach(file => {
                if (!tree.guide.children[file]) {
                    tree.guide.children[file] = {
                        name: file,
                        type: 'file',
                        path: `guide/${file}.md`
                    };
                }
            });
        }
    }

    // 生成文件树 HTML
    generateFileTreeHTML(tree, level = 0) {
        let html = '';
        
        // 先添加文件夹
        const folders = Object.values(tree)
            .filter(item => item.type === 'folder')
            .sort((a, b) => a.name.localeCompare(b.name));
        
        folders.forEach(folder => {
            const hasChildren = Object.keys(folder.children).length > 0;
            const isOpen = level === 0; // 默认展开第一级
            
            html += `
                <div class="tree-item tree-folder ${isOpen ? 'open' : ''}" data-path="docs/${folder.path}">
                    <i class="fas fa-folder"></i>
                    <span class="tree-label">${this.formatName(folder.name)}</span>
                    ${hasChildren ? `
                        <i class="fas fa-chevron-right folder-toggle ${isOpen ? 'rotated' : ''}"></i>
                    ` : ''}
                </div>
                ${hasChildren ? `
                    <div class="tree-children" style="display: ${isOpen ? 'block' : 'none'}">
                        ${this.generateFileTreeHTML(folder.children, level + 1)}
                    </div>
                ` : ''}
            `;
        });
        
        // 再添加文件
        const files = Object.values(tree)
            .filter(item => item.type === 'file')
            .sort((a, b) => a.name.localeCompare(b.name));
        
        files.forEach(file => {
            html += `
                <div class="tree-item tree-file" data-path="docs/${file.path}">
                    <i class="fas fa-file-alt"></i>
                    <span class="tree-label">${this.formatName(file.name)}</span>
                </div>
            `;
        });
        
        return html;
    }

    // 格式化名称（将连字符/下划线转换为空格，并首字母大写）
    formatName(name) {
        if (name === 'index') return '首页';
        if (name === 'README') return '文档首页';
        
        return name
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    // 初始化文件树
    async initFileTree() {
        const treeElement = document.getElementById('fileTree');
        
        if (!treeElement) {
            console.error('文件树容器不存在');
            return;
        }
        
        treeElement.innerHTML = `
            <div class="tree-loading">
                <i class="fas fa-spinner fa-spin"></i>
                正在扫描文档目录...
            </div>
        `;
        
        try {
            // 扫描文档目录
            const fileTree = await this.scanDocsDirectory();
            
            // 生成HTML
            const treeHTML = this.generateFileTreeHTML(fileTree);
            
            treeElement.innerHTML = treeHTML || '<div class="tree-empty">暂无文档</div>';
            
            // 添加点击事件
            this.bindTreeEvents();
            
            // 初始化第一个文件为选中状态
            this.selectFirstFile();
            
        } catch (error) {
            console.error('初始化文件树失败:', error);
            treeElement.innerHTML = `
                <div class="tree-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>无法加载文档列表</p>
                    <button onclick="location.reload()">重新加载</button>
                </div>
            `;
        }
    }

    // 绑定树形菜单事件
    bindTreeEvents() {
        // 文件夹点击事件
        document.querySelectorAll('.tree-folder').forEach(folder => {
            folder.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const children = folder.nextElementSibling;
                if (children && children.classList.contains('tree-children')) {
                    const isHidden = children.style.display === 'none';
                    children.style.display = isHidden ? 'block' : 'none';
                    
                    const toggle = folder.querySelector('.folder-toggle');
                    if (toggle) {
                        toggle.classList.toggle('rotated', isHidden);
                    }
                    
                    folder.classList.toggle('open', isHidden);
                }
            });
        });
        
        // 文件点击事件
        document.querySelectorAll('.tree-file').forEach(file => {
            file.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const filePath = file.getAttribute('data-path');
                if (filePath) {
                    // 移除所有active状态
                    document.querySelectorAll('.tree-folder, .tree-file').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // 添加当前active状态
                    file.classList.add('active');
                    
                    // 加载文件
                    await loadPage(filePath);
                    
                    // 在移动端自动关闭侧边栏
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.remove('active');
                    }
                }
            });
        });
    }

    // 选择第一个文件
    selectFirstFile() {
        const firstFile = document.querySelector('.tree-file');
        if (firstFile) {
            firstFile.classList.add('active');
            const filePath = firstFile.getAttribute('data-path');
            
            // 检查URL参数，如果有指定页面，则使用指定的
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get('page');
            
            if (!page && filePath) {
                // 没有URL参数时，自动加载第一个文件
                setTimeout(() => {
                    loadPage(filePath);
                }, 100);
            }
        }
    }

    // 搜索文件
    searchFiles(query) {
        if (!query.trim()) {
            // 清空搜索，显示所有文件
            document.querySelectorAll('.tree-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        const searchLower = query.toLowerCase();
        
        document.querySelectorAll('.tree-item').forEach(item => {
            const label = item.querySelector('.tree-label');
            if (label) {
                const text = label.textContent.toLowerCase();
                const filePath = item.getAttribute('data-path') || '';
                
                if (text.includes(searchLower) || filePath.toLowerCase().includes(searchLower)) {
                    item.style.display = '';
                    
                    // 展开父文件夹
                    let parent = item.closest('.tree-children');
                    while (parent) {
                        const folder = parent.previousElementSibling;
                        if (folder && folder.classList.contains('tree-folder')) {
                            parent.style.display = 'block';
                            const toggle = folder.querySelector('.folder-toggle');
                            if (toggle) {
                                toggle.classList.add('rotated');
                            }
                            folder.classList.add('open');
                        }
                        parent = parent.parentElement.closest('.tree-children');
                    }
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }
}

// 创建全局实例
const fileScanner = new FileScanner();

// 导出给main.js使用
window.fileScanner = fileScanner;