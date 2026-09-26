console.clear();
console.log("index.js loaded");

// 入口：在 DOMContentLoaded 后绑定菜单交互逻辑，保证元素存在
document.addEventListener('DOMContentLoaded', () => {
	// 收集所有顶级菜单的 <li.menu-button>
	const menuButtons = Array.from(document.querySelectorAll('.menu-button'));

	// closeAll: 关闭所有已打开的下拉面板，并同步 aria 状态
	function closeAll() {
		menuButtons.forEach(li => {
			const btn = li.querySelector('.menu-button-f');
			const panel = li.querySelector('.menu-botton-down-c');
			li.classList.remove('open');
			if (btn) btn.setAttribute('aria-expanded', 'false');
			if (panel) panel.setAttribute('aria-hidden', 'true');
		});
	}

	// toggleMenu: 切换指定菜单的打开/关闭状态（并关闭其他菜单）
	function toggleMenu(li) {
		const btn = li.querySelector('.menu-button-f');
		const panel = li.querySelector('.menu-botton-down-c');
		const isOpen = li.classList.toggle('open');
		// 同步可访问性状态到触发按钮和面板
		if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

		// 关闭其它菜单，保证一次只能打开一个
		menuButtons.forEach(other => {
			if (other !== li) {
				other.classList.remove('open');
				const obtn = other.querySelector('.menu-button-f');
				const opanel = other.querySelector('.menu-botton-down-c');
				if (obtn) obtn.setAttribute('aria-expanded', 'false');
				if (opanel) opanel.setAttribute('aria-hidden', 'true');
			}
		});
	}

	// 绑定事件：点击切换、键盘（Enter/Space）触发
	menuButtons.forEach(li => {
		const btn = li.querySelector('.menu-button-f');
		const panel = li.querySelector('.menu-botton-down-c');
		if (!btn) return; // 有些 li 可能只是占位（logo）

		// 点击触发下拉
		btn.addEventListener('click', (e) => {
			e.stopPropagation(); // 阻止冒泡，避免 document click 立即关闭
			if (panel) {
				toggleMenu(li);
			}
		});

		// 键盘打开（提高可访问性）
		btn.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (panel) toggleMenu(li);
			}
		});
	});

	// 点击页面空白处关闭所有下拉
	document.addEventListener('click', (e) => {
		if (!e.target.closest('.menu-button')) {
			closeAll();
		}
	});

	// Esc 键关闭
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' || e.key === 'Esc') {
			closeAll();
		}
	});

	// 页面初始化：确保 aria-* 状态一致
	menuButtons.forEach(li => {
		const btn = li.querySelector('.menu-button-f');
		const panel = li.querySelector('.menu-botton-down-c');
		if (btn) btn.setAttribute('aria-expanded', 'false');
		if (panel) panel.setAttribute('aria-hidden', 'true');
	});

	// ----------------- 新建项目模态 iframe 功能 -----------------
	const createBtn = document.getElementById('btn-new-project');
	const modal = document.getElementById('create-modal');
	const modalClose = document.getElementById('create-modal-close');
	const modalIframe = document.getElementById('create-iframe');

	function openCreateModal() {
		if (!modal) return;
		modal.classList.remove('hidden');
		modal.setAttribute('aria-hidden', 'false');
		// 懒加载 iframe 的内容，避免初始加载成本
		if (modalIframe && (modalIframe.getAttribute('src') === 'about:blank' || !modalIframe.getAttribute('src'))) {
			modalIframe.setAttribute('src', 'create.html');
		}
		document.body.style.overflow = 'hidden';
	}

	function closeCreateModal() {
		if (!modal) return;
		modal.classList.add('hidden');
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		// 可选：保留 src 以便下次快速打开，或者清空以释放内存
		// modalIframe.setAttribute('src', 'about:blank');
	}

	if (createBtn) {
		createBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			openCreateModal();
		});
	}

	if (modalClose) modalClose.addEventListener('click', closeCreateModal);

	// 点击遮罩（不是 modal-content）时关闭
	if (modal) {
		modal.addEventListener('click', (e) => {
			if (e.target === modal) closeCreateModal();
		});
	}

	// Esc 关闭模态（与上面的 Esc 共用）
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' || e.key === 'Esc') {
			// 先尝试关闭模态，否则关闭下拉
			if (modal && modal.getAttribute('aria-hidden') === 'false') {
				closeCreateModal();
			} else {
				closeAll();
			}
		}
	});

	// 接收新建表单：校验元数据和必需素材后写入 IndexedDB。
	window.addEventListener('message', async (ev) => {
		if (ev.origin !== window.location.origin || ev.source !== modalIframe.contentWindow ||
			!ev.data || ev.data.type !== 'create-project') return;

		const formWindow = modalIframe.contentWindow;
		const reply = (type, message) => {
			if (formWindow) formWindow.postMessage({ type, message }, window.location.origin);
		};

		try {
			const data = ev.data.payload;
			if (!data || typeof data !== 'object') throw new Error('缺少铺面信息。');
			for (const [key, label] of [
				['name', '铺面名称'],
				['difficultyLevel', '难度等级'],
				['author', '作者'],
				['musicAuthor', '音乐作者'],
				['pictureAuthor', '插图作者']
			]) {
				if (typeof data[key] !== 'string' || !data[key].trim()) {
					throw new Error(`请填写${label}。`);
				}
			}
			if (!Number.isFinite(data.difficulty) || data.difficulty < 0 || data.difficulty > 30) {
				throw new Error('难度数值须为 0 到 30 之间的数字。');
			}
			if (!data.files || typeof data.files !== 'object') throw new Error('请上传音乐、插图和谱图文件。');
			for (const key of ['music', 'image', 'chart']) {
				const file = data.files[key];
				if (!file || typeof file.name !== 'string' || typeof file.slice !== 'function' || file.size === 0) {
					throw new Error('音乐、插图和谱图文件均为必填项，且文件不能为空。');
				}
			}
			if (!/\.(json|pec|pgr|pbc)$/i.test(data.files.chart.name)) {
				throw new Error('谱图文件扩展名须为 .json、.pec、.pgr 或 .pbc。');
			}
			if (data.files.unlockVideo &&
				(typeof data.files.unlockVideo.name !== 'string' || typeof data.files.unlockVideo.slice !== 'function')) {
				throw new Error('解锁视频文件无效，请重新选择。');
			}

			const cache = await window.LocalStrange.createChartCache(data);
			const mainFrame = document.getElementById('main-iframe');
			if (mainFrame.contentWindow) {
				mainFrame.contentWindow.postMessage(
					{ type: 'chart-cache-updated', cacheId: cache.id },
					window.location.origin
				);
			}
			reply('create-project-saved', cache.id);
			closeCreateModal();
		} catch (error) {
			const message = error instanceof Error ? error.message : '本地缓存创建失败。';
			console.error('保存铺面缓存失败：', error);
			reply('create-project-error', message);
		}
	});
});
console.clear();
