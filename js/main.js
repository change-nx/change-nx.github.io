// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化marked
    initMarked();
    
    // 初始化文件树
    initFileTree();
    
    // 初始化主题
    initTheme();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 检查URL参数加载页面
    loadPageFromUrl();
});

// 初始化marked配置
function initMarked() {
    if (typeof marked === 'undefined') {
        console.error('marked.js 未加载！');
        return;
    }
    
    marked.setOptions({
        gfm: true,
        breaks: true,
        smartLists: true,
        smartypants: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {
                    console.warn('代码高亮失败:', err);
                }
            }
            return code;
        }
    });
}

// 初始化文件树
async function initFileTree() {
    await window.fileScanner.initFileTree();
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    updateCodeHighlightTheme(savedTheme);
}

// 更新主题按钮图标
function updateThemeButton(theme) {
    const button = document.getElementById('themeToggle');
    if (button) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.theme-text');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            if (text) text.textContent = '日间模式';
        } else {
            icon.className = 'fas fa-moon';
            if (text) text.textContent = '夜间模式';
        }
    }
}

// 更新代码高亮主题
function updateCodeHighlightTheme(theme) {
    const link = document.getElementById('highlight-theme');
    if (link) {
        link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${theme === 'dark' ? 'github-dark' : 'github'}.min.css`;
    }
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeButton(newTheme);
    updateCodeHighlightTheme(newTheme);
}

// 初始化事件监听器
function initEventListeners() {
    // 主题切换按钮
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 侧边栏切换按钮
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.fileScanner.searchFiles(e.target.value);
        });
        
        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === 'Escape') {
                searchInput.blur();
                searchInput.value = '';
                window.fileScanner.searchFiles('');
            }
        });
    }
    
    // 返回顶部按钮
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        // 滚动显示/隐藏按钮
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
    }
    
    // 点击外部关闭侧边栏（移动端）
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (window.innerWidth <= 768 && 
            sidebar && 
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
    
    // 窗口大小变化时调整侧边栏
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth > 768 && sidebar) {
            sidebar.classList.add('active');
        }
    });
    
    // 初始化时根据屏幕大小设置侧边栏
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('active');
        }
    }
}

// 加载页面内容
async function loadPage(filePath) {
    try {
        // 显示加载动画
        showLoader();
        
        // 获取Markdown内容
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const markdown = await response.text();
        
        // 解析Markdown
        const html = marked.parse(markdown);
        
        // 更新页面内容
        document.getElementById('markdownContent').innerHTML = html;
        
        // 高亮代码
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
        
        // 更新面包屑导航
        updateBreadcrumb(filePath);
        
        // 更新URL
        updateUrl(filePath);
        
        // 更新最后修改时间
        updateLastModified();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('加载页面失败:', error);
        showErrorPage(filePath);
    } finally {
        // 隐藏加载动画
        hideLoader();
    }
}

// 显示加载动画
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('active');
    }
}

// 隐藏加载动画
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('active');
    }
}

// 显示错误页面
function showErrorPage(filePath) {
    const content = document.getElementById('markdownContent');
    content.innerHTML = `
        <div class="error-page">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2>页面加载失败</h2>
            <p>无法加载文档: <code>${filePath}</code></p>
            <p>请检查文件是否存在，或返回<a href="#" onclick="loadPage('docs/README.md')">首页</a>。</p>
            <div class="error-actions">
                <button class="btn" onclick="loadPage('docs/README.md')">
                    <i class="fas fa-home"></i> 返回首页
                </button>
                <button class="btn btn-outline" onclick="location.reload()">
                    <i class="fas fa-redo"></i> 刷新页面
                </button>
            </div>
        </div>
    `;
}

// 更新面包屑导航
function updateBreadcrumb(filePath) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    // 移除 docs/ 前缀和 .md 后缀
    const relativePath = filePath.replace('docs/', '').replace('.md', '');
    const parts = relativePath.split('/');
    
    let breadcrumbHTML = '<a href="#" onclick="loadPage(\'docs/README.md\')">首页</a>';
    let currentPath = '';
    
    parts.forEach((part, index) => {
        if (part) {
            currentPath += (currentPath ? '/' : '') + part;
            const isLast = index === parts.length - 1;
            
            if (!isLast) {
                breadcrumbHTML += `
                    <span class="separator">/</span>
                    <a href="#" onclick="loadPage('docs/${currentPath}.md')">
                        ${formatBreadcrumbName(part)}
                    </a>
                `;
            } else {
                breadcrumbHTML += `
                    <span class="separator">/</span>
                    <span class="current">${formatBreadcrumbName(part)}</span>
                `;
            }
        }
    });
    
    breadcrumb.innerHTML = breadcrumbHTML;
}

// 格式化面包屑名称
function formatBreadcrumbName(name) {
    if (name === 'README' || name === 'index') return '首页';
    return name.replace(/[-_]/g, ' ')
              .replace(/\b\w/g, char => char.toUpperCase());
}

// 更新URL
function updateUrl(filePath) {
    const relativePath = filePath.replace('docs/', '').replace('.md', '');
    const url = relativePath === 'README' ? '/' : `?page=${relativePath}`;
    history.pushState({ filePath }, '', url);
}

// 更新最后修改时间
function updateLastModified() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 从URL参数加载页面
function loadPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    
    if (page) {
        const filePath = `docs/${page}.md`;
        loadPage(filePath);
    } else if (!window.location.search) {
        // 如果没有参数，加载README
        loadPage('docs/README.md');
    }
}

// 复制当前页面链接
function copyUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        // 显示成功提示
        showToast('链接已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制链接');
    });
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 显示关于信息
function showAbout() {
    document.getElementById('markdownContent').innerHTML = `
        <div class="about-page">
            <h1>关于文档中心</h1>
            <p>这是一个现代化的文档站点，支持以下功能：</p>
            <ul>
                <li>📁 自动扫描文档目录结构</li>
                <li>🌙 日间/夜间模式切换</li>
                <li>🔍 实时搜索文档内容</li>
                <li>📱 响应式设计，适配移动设备</li>
                <li>💎 美观的Markdown渲染</li>
                <li>⚡ 代码语法高亮</li>
                <li>📖 文件夹优先的侧边栏导航</li>
            </ul>
            <p>使用技术：HTML5, CSS3, JavaScript, Marked.js, Highlight.js</p>
            <div class="about-actions">
                <button class="btn" onclick="loadPage('docs/README.md')">
                    <i class="fas fa-book"></i> 开始阅读
                </button>
            </div>
        </div>
    `;
}

// 处理浏览器前进/后退
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.filePath) {
        loadPage(event.state.filePath);
    } else {
        loadPageFromUrl();
    }
});

// 添加toast样式
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--primary-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--card-shadow);
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
`;
document.head.appendChild(toastStyle);

// 导出全局函数
window.loadPage = loadPage;
window.toggleTheme = toggleTheme;
window.copyUrl = copyUrl;
window.showAbout = showAbout;