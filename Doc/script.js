// 侧边栏切换功能
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

// 生成目录
function generateTOC() {
    const headings = document.querySelectorAll('.markdown-content h2, .markdown-content h3');
    const sidebarMenu = document.getElementById('sidebarMenu');

    sidebarMenu.innerHTML = ''; // 清空原有内容

    headings.forEach(heading => {
        const level = heading.tagName.toLowerCase();
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.className = `sidebar-link ${level}`;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('sidebar').classList.remove('active');
            document.querySelector(`#${heading.id}`).scrollIntoView({
                behavior: 'smooth'
            });
        });

        sidebarMenu.appendChild(link);
    });
}

// 初始化代码高亮
function initHighlight() {
    document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    generateTOC();
    initHighlight();
});