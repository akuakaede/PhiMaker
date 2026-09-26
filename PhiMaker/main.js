document.addEventListener('DOMContentLoaded', () => {
    const cacheList = document.getElementById('cache-list');
    const cacheStatus = document.getElementById('cache-status');

    function renderCaches(caches) {
        cacheList.replaceChildren();
        if (caches.length === 0) {
            cacheStatus.textContent = '还没有本地铺面。使用“文件 → 新建”创建一个。';
            return;
        }

        cacheStatus.textContent = `已缓存 ${caches.length} 个铺面`;
        caches.forEach(cache => {
            const card = document.createElement('article');
            card.className = 'cache-card';

            const heading = document.createElement('div');
            heading.className = 'cache-heading';
            const title = document.createElement('h2');
            title.textContent = cache.info.name;
            const level = document.createElement('span');
            level.className = 'cache-level';
            level.textContent = `${cache.info.level} · ${cache.info.difficulty}`;
            heading.append(title, level);

            const authors = document.createElement('p');
            authors.className = 'cache-authors';
            authors.textContent = `谱师 ${cache.info.charter}　·　曲师 ${cache.info.composer}　·　插画 ${cache.info.illustrator}`;

            const files = document.createElement('ul');
            files.className = 'cache-files';
            [
                ['谱图', cache.files.chart],
                ['音乐', cache.files.music],
                ['插图', cache.files.illustration],
                ['解锁视频', cache.files.unlockVideo]
            ].forEach(([label, file]) => {
                if (!file) return;
                const item = document.createElement('li');
                const fileLabel = document.createElement('span');
                fileLabel.textContent = label;
                const fileName = document.createElement('span');
                fileName.textContent = `${file.name} · ${formatSize(file.size)}`;
                item.append(fileLabel, fileName);
                files.append(item);
            });

            const created = document.createElement('time');
            created.className = 'cache-time';
            created.dateTime = cache.createdAt;
            created.textContent = `缓存于 ${new Date(cache.createdAt).toLocaleString()}`;
            card.append(heading, authors, files, created);
            cacheList.append(card);
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function refreshCaches() {
        window.LocalStrange.getChartCaches().then(renderCaches).catch(error => {
            console.error('读取铺面缓存失败：', error);
            cacheStatus.textContent = `读取本地缓存失败：${error instanceof Error ? error.message : '未知错误'}`;
        });
    }

    window.addEventListener('message', event => {
        if (event.origin !== window.location.origin || event.source !== window.parent ||
            !event.data || event.data.type !== 'chart-cache-updated') return;
        refreshCaches();
    });

    refreshCaches();
});
