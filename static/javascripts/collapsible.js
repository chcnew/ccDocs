// ==================== 标题折叠功能 JavaScript（支持 MkDocs Material 即时加载）====================

(function () {
    'use strict';

    // 初始化函数
    function initCollapsible() {
        // 清理旧的事件监听器，避免重复绑定
        cleanupOldListeners();

        // 获取所有需要折叠功能的标题（h2-h6）
        const headers = document.querySelectorAll('.md-typeset h2, .md-typeset h3, .md-typeset h4, .md-typeset h5, .md-typeset h6');

        headers.forEach(header => {
            // 检查是否已经初始化过
            if (header.dataset.collapsibleInit) {
                return;
            }

            // 标记为已初始化
            header.dataset.collapsibleInit = 'true';

            // 为每个标题添加点击事件
            const clickHandler = function (e) {
                // 防止点击标题中的链接时触发折叠
                if (e.target.tagName === 'A') return;
                e.preventDefault();
                toggleCollapse(this);
            };

            header.addEventListener('click', clickHandler);
            // 保存事件处理器引用，便于后续清理
            header._collapsibleHandler = clickHandler;

            // 初始化：为每个标题包装其后续内容
            wrapContentAfterHeader(header);
        });

        // 恢复之前保存的折叠状态
        setTimeout(() => {
            headers.forEach(header => {
                restoreCollapseState(header);
            });
        }, 100);
    }

    // 清理旧的事件监听器
    function cleanupOldListeners() {
        const headers = document.querySelectorAll('.md-typeset h2, .md-typeset h3, .md-typeset h4, .md-typeset h5, .md-typeset h6');
        headers.forEach(header => {
            if (header._collapsibleHandler) {
                header.removeEventListener('click', header._collapsibleHandler);
                delete header._collapsibleHandler;
            }
            delete header.dataset.collapsibleInit;
        });
    }

    function wrapContentAfterHeader(header) {
        // 如果已经包装过，跳过
        if (header.nextElementSibling?.classList.contains('collapsible-content')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-content';

        // 获取当前标题的级别
        const currentLevel = parseInt(header.tagName.substring(1));

        // 收集该标题下的所有内容，直到遇到同级或更高级的标题
        let nextElement = header.nextElementSibling;
        const elementsToWrap = [];

        while (nextElement) {
            // 如果遇到标题
            if (nextElement.tagName && nextElement.tagName.match(/^H[1-6]$/)) {
                const nextLevel = parseInt(nextElement.tagName.substring(1));
                // 如果是同级或更高级的标题，停止收集
                if (nextLevel <= currentLevel) {
                    break;
                }
            }

            elementsToWrap.push(nextElement);
            nextElement = nextElement.nextElementSibling;
        }

        // 将收集到的元素移动到包装器中
        if (elementsToWrap.length > 0) {
            elementsToWrap.forEach(el => {
                wrapper.appendChild(el);
            });

            // 将包装器插入到标题后面
            header.parentNode.insertBefore(wrapper, header.nextSibling);
        }
    }

    function toggleCollapse(header) {
        const content = header.nextElementSibling;

        if (!content || !content.classList.contains('collapsible-content')) {
            return;
        }

        // 切换折叠状态
        const isCollapsed = header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');

        // 保存折叠状态到 localStorage
        saveCollapseState(header, isCollapsed);

        // 添加动画效果
        if (!isCollapsed) {
            // 展开时的动画
            content.style.maxHeight = content.scrollHeight + 'px';
            setTimeout(() => {
                content.style.maxHeight = '10000px';
            }, 400);
        }
    }

    // 保存折叠状态到 localStorage
    function saveCollapseState(header, isCollapsed) {
        try {
            const headerId = getHeaderId(header);
            const pageUrl = window.location.pathname;
            const storageKey = `collapse_${pageUrl}_${headerId}`;

            localStorage.setItem(storageKey, isCollapsed ? 'true' : 'false');
        } catch (e) {
            console.warn('无法保存折叠状态:', e);
        }
    }

    // 恢复折叠状态
    function restoreCollapseState(header) {
        try {
            const headerId = getHeaderId(header);
            const pageUrl = window.location.pathname;
            const storageKey = `collapse_${pageUrl}_${headerId}`;

            const isCollapsed = localStorage.getItem(storageKey) === 'true';

            if (isCollapsed) {
                header.classList.add('collapsed');
                const content = header.nextElementSibling;
                if (content?.classList.contains('collapsible-content')) {
                    content.classList.add('collapsed');
                }
            }
        } catch (e) {
            console.warn('无法恢复折叠状态:', e);
        }
    }

    // 获取标题的唯一标识
    function getHeaderId(header) {
        // 优先使用标题的 id 属性
        if (header.id) {
            return header.id;
        }

        // 否则使用标题文本内容
        return header.textContent.trim().replace(/\s+/g, '_');
    }

    // 添加键盘快捷键支持
    function addKeyboardShortcuts() {
        // 避免重复绑定
        if (window._collapsibleKeyboardInit) {
            return;
        }
        window._collapsibleKeyboardInit = true;

        document.addEventListener('keydown', function (e) {
            // Alt + C: 折叠所有标题
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                collapseAll();
            }

            // Alt + E: 展开所有标题
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                expandAll();
            }
        });
    }

    // 折叠所有标题
    function collapseAll() {
        const headers = document.querySelectorAll('.md-typeset h2:not(.collapsed), .md-typeset h3:not(.collapsed), .md-typeset h4:not(.collapsed), .md-typeset h5:not(.collapsed), .md-typeset h6:not(.collapsed)');
        headers.forEach(header => {
            toggleCollapse(header);
        });
    }

    // 展开所有标题
    function expandAll() {
        const headers = document.querySelectorAll('.md-typeset h2.collapsed, .md-typeset h3.collapsed, .md-typeset h4.collapsed, .md-typeset h5.collapsed, .md-typeset h6.collapsed');
        headers.forEach(header => {
            toggleCollapse(header);
        });
    }

    // ==================== 主初始化逻辑 ====================

    // 首次加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initCollapsible();
            addKeyboardShortcuts();
        });
    } else {
        initCollapsible();
        addKeyboardShortcuts();
    }

    // 监听 MkDocs Material 的即时加载事件
    // 当页面内容通过 AJAX 加载时触发
    document.addEventListener('DOMContentSwitch', function () {
        console.log('页面切换，重新初始化折叠功能');
        setTimeout(initCollapsible, 100);
    });

    // 备用方案：监听 location.href 变化
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL 变化，重新初始化折叠功能');
            setTimeout(initCollapsible, 100);
        }
    }).observe(document, {subtree: true, childList: true});

    // 暴露全局函数（可选，用于调试）
    window.collapsibleUtils = {
        init: initCollapsible, collapseAll: collapseAll, expandAll: expandAll
    };

})();
