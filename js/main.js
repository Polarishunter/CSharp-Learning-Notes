/** 共用教材目錄與 UI 功能。新增單元只需 HTML + data/lessons.json。 */
(() => {
    'use strict';

    const base = document.body.dataset.base || './';
    const page = document.body.dataset.page;
    const categoryNames = { csharp: 'C# 基礎語法', winforms: 'Windows Forms' };
    const categoryIcons = { csharp: '⌘', winforms: '▣' };
    const categoryOrder = ['csharp', 'winforms'];

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));

    function getTheme() {
        try { return localStorage.getItem('csharp-notes-theme') || 'light'; }
        catch { return 'light'; }
    }
    function setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.setAttribute('aria-label', theme === 'dark' ? '切換淺色模式' : '切換深色模式');
            button.title = theme === 'dark' ? '切換淺色模式' : '切換深色模式';
            button.innerHTML = theme === 'dark'
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15.8A8.5 8.5 0 0 1 8.2 4a8.5 8.5 0 1 0 11.8 11.8Z"/></svg>';
        }
        try { localStorage.setItem('csharp-notes-theme', theme); } catch { /* 私密模式可能禁止儲存 */ }
    }
    setTheme(getTheme());
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });

    const sidebar = document.getElementById('site-sidebar');
    const scrim = document.getElementById('sidebar-scrim');
    const openButton = document.getElementById('open-sidebar');
    function setSidebarOpen(isOpen) {
        sidebar?.classList.toggle('sidebar-open', isOpen);
        document.body.classList.toggle('sidebar-open-body', isOpen);
        if (scrim) scrim.hidden = !isOpen;
        openButton?.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) document.getElementById('close-sidebar')?.focus();
        else if (document.activeElement?.id === 'close-sidebar') openButton?.focus();
    }
    openButton?.addEventListener('click', () => setSidebarOpen(true));
    document.getElementById('close-sidebar')?.addEventListener('click', () => setSidebarOpen(false));
    scrim?.addEventListener('click', () => setSidebarOpen(false));
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar?.classList.contains('sidebar-open')) setSidebarOpen(false);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && sidebar?.classList.contains('sidebar-open')) setSidebarOpen(false);
    });

    function validateLesson(record) {
        // 只接受本站固定格式的本地教材路徑，避免載入意外的外部 URL。
        return record && typeof record.id === 'string' && /^[a-z0-9-]+$/.test(record.id)
            && categoryOrder.includes(record.category)
            && typeof record.title === 'string' && record.title.length > 0
            && typeof record.summary === 'string'
            && typeof record.order === 'number' && Number.isFinite(record.order)
            && typeof record.path === 'string'
            && /^lessons\/(csharp|winforms)\/[a-z0-9-]+\.html$/.test(record.path)
            && record.path.split('/')[1] === record.category;
    }
    function sortLessons(items) {
        return items.slice().sort((a, b) =>
            categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
            || a.order - b.order);
    }
    function url(lesson) { return `${base}${lesson.path}`; }

    function renderSidebar(lessons) {
        const currentId = document.querySelector('[data-lesson-id]')?.dataset.lessonId;
        const target = document.getElementById('sidebar-lessons');
        if (!target) return;
        target.innerHTML = categoryOrder.map((category) => {
            const items = lessons.filter((lesson) => lesson.category === category);
            return `<div class="sidebar-category"><div class="sidebar-category-heading"><span class="sidebar-category-icon">${categoryIcons[category]}</span><span>${categoryNames[category]}</span><span class="sidebar-category-count">${items.length}</span></div><div class="sidebar-links">${items.map((lesson) => `<a href="${url(lesson)}" class="sidebar-lesson${currentId === lesson.id ? ' is-active' : ''}"${currentId === lesson.id ? ' aria-current="page"' : ''}><span class="sidebar-lesson-dot"></span>${escapeHtml(lesson.title)}</a>`).join('')}</div></div>`;
        }).join('');
    }

    function renderHome(lessons) {
        const total = document.getElementById('total-count');
        if (total) total.textContent = String(lessons.length).padStart(2, '0');
        categoryOrder.forEach((category) => {
            const element = document.getElementById(`${category}-count`);
            if (element) element.textContent = String(lessons.filter((lesson) => lesson.category === category).length).padStart(2, '0');
        });
        const cards = document.getElementById('lesson-cards');
        const counter = document.getElementById('filtered-count');
        const empty = document.getElementById('lesson-empty');
        const search = document.getElementById('lesson-search');
        const buttons = [...document.querySelectorAll('[data-filter]')];
        let filter = 'all';

        function refresh() {
            const query = (search?.value || '').trim().toLocaleLowerCase();
            const visible = lessons.filter((lesson) => (filter === 'all' || lesson.category === filter)
                && `${lesson.title} ${lesson.summary} ${categoryNames[lesson.category]}`.toLocaleLowerCase().includes(query));
            if (counter) counter.textContent = `${visible.length} 個單元`;
            if (empty) empty.hidden = visible.length > 0;
            if (cards) {
                cards.innerHTML = visible.map((lesson) => {
                    const position = lessons.filter((item) => item.category === lesson.category).findIndex((item) => item.id === lesson.id) + 1;
                    return `<a class="lesson-card" href="${url(lesson)}">
                        <div class="lesson-card-top"><span class="pill ${lesson.category}">${escapeHtml(categoryNames[lesson.category])}</span><span class="lesson-card-number">LESSON ${String(position).padStart(2, '0')}</span></div>
                        <h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.summary)}</p><div class="lesson-card-bottom"><span>初階 · 教材閱讀</span><span class="lesson-card-action" aria-hidden="true">→</span></div>
                    </a>`;
                }).join('');
            }
        }
        buttons.forEach((button) => button.addEventListener('click', () => {
            filter = button.dataset.filter;
            buttons.forEach((item) => {
                const active = item === button;
                item.classList.toggle('is-selected', active);
                item.setAttribute('aria-pressed', String(active));
            });
            refresh();
        }));
        search?.addEventListener('input', refresh);
        document.querySelectorAll('[data-jump-category]').forEach((link) => {
            link.addEventListener('click', () => {
                document.querySelector(`[data-filter="${link.dataset.jumpCategory}"]`)?.click();
            });
        });
        refresh();
    }

    function renderPagination(lessons) {
        const currentId = document.querySelector('[data-lesson-id]')?.dataset.lessonId;
        const currentIndex = lessons.findIndex((lesson) => lesson.id === currentId);
        const target = document.getElementById('lesson-pagination');
        if (!target || currentIndex === -1) return;
        const previous = lessons[currentIndex - 1];
        const next = lessons[currentIndex + 1];
        target.innerHTML = `${previous ? `<a class="page-turn prev" href="${url(previous)}"><span>← 上一篇</span><strong>${escapeHtml(previous.title)}</strong></a>` : '<div class="page-turn-empty"></div>'}${next ? `<a class="page-turn next" href="${url(next)}"><span>下一篇 →</span><strong>${escapeHtml(next.title)}</strong></a>` : '<div class="page-turn-empty"></div>'}`;
    }

    // Highlight lesson C# snippets. Console outputs and inline code remain unchanged.
    if (window.hljs && window.hljs.getLanguage('csharp')) {
        document.querySelectorAll('.code-block pre code.language-csharp').forEach((code) => {
            window.hljs.highlightElement(code);
        });
    }

    // Copy controls require no external dependencies.
    document.querySelectorAll('.copy-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const code = button.closest('.code-block')?.querySelector('code')?.textContent;
            if (!code) return;
            try {
                await navigator.clipboard.writeText(code);
                const label = button.querySelector('span');
                if (label) label.textContent = '已複製';
                window.setTimeout(() => { if (label) label.textContent = '複製程式碼'; }, 1800);
            } catch {
                const label = button.querySelector('span');
                if (label) label.textContent = '請手動選取程式碼';
            }
        });
    });

    async function load() {
        try {
            const response = await fetch(`${base}data/lessons.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (!Array.isArray(json.lessons) || !json.lessons.every(validateLesson)) throw new Error('教材資料格式不正確');
            const lessons = sortLessons(json.lessons);
            renderSidebar(lessons);
            if (page === 'home') renderHome(lessons);
            else if (page === 'lesson') renderPagination(lessons);
        } catch (error) {
            const note = '<p class="load-error">無法讀取教材目錄。請使用本機 HTTP 伺服器或 GitHub Pages 瀏覽網站。</p>';
            const nav = document.getElementById('sidebar-lessons');
            if (nav) nav.innerHTML = note;
            const cards = document.getElementById('lesson-cards');
            if (cards) cards.innerHTML = note;
            console.error('教材目錄載入失敗：', error);
        }
    }
    load();
})();
