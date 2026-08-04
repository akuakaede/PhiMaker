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

	// 接收来自 iframe 的新建项目消息（通过 postMessage）
	window.addEventListener('message', (ev) => {
		if (!ev || !ev.data) return;
		const msg = ev.data;
		if (msg.type === 'create-project') {
			const data = msg.payload || {};
			// 简单校验
			if (!data.name) {
				console.warn('收到创建请求但缺少 name', data);
				return;
			}
			console.log('收到新建项目请求：', data.name, data);
			// 关闭模态
			if (typeof closeCreateModal === 'function') closeCreateModal();
		}
	});

	// 简单逃逸函数，用于插入到 DOM（避免 XSS）
	function escapeHtml(s) {
		if (!s) return '';
		return String(s).replace(/[&<>"]/g, function(c){
			return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
		});
	}
});
console.clear();