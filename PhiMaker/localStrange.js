(function () {
	'use strict';

	const databaseName = 'PhiMakerLocalStrange';
	const storeName = 'chartCaches';

	function openDatabase() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(databaseName, 1);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(storeName)) {
					request.result.createObjectStore(storeName, { keyPath: 'id' });
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error || new Error('无法打开本地缓存数据库。'));
			request.onblocked = () => reject(new Error('本地缓存数据库正在被其他页面占用，请关闭其他 PhiMaker 页面后重试。'));
		});
	}

	function transact(mode, operation) {
		return openDatabase().then(database => new Promise((resolve, reject) => {
			const transaction = database.transaction(storeName, mode);
			const request = operation(transaction.objectStore(storeName));
			let result;
			let settled = false;

			function fail(error) {
				if (settled) return;
				settled = true;
				database.close();
				reject(error || new Error('本地缓存数据库操作失败。'));
			}

			request.onsuccess = () => { result = request.result; };
			request.onerror = () => fail(request.error);
			transaction.oncomplete = () => {
				if (settled) return;
				settled = true;
				database.close();
				resolve(result);
			};
			transaction.onerror = () => fail(transaction.error);
			transaction.onabort = () => fail(transaction.error);
		}));
	}

	function fileEntry(file) {
		return file ? {
			name: file.name,
			type: file.type || 'application/octet-stream',
			size: file.size,
			blob: file
		} : null;
	}

	async function createChartCache(data) {
		const chart = fileEntry(data.files.chart);
		const music = fileEntry(data.files.music);
		const illustration = fileEntry(data.files.image);
		const unlockVideo = fileEntry(data.files.unlockVideo);
		const cache = {
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
			info: {
				name: data.name.trim(),
				difficulty: data.difficulty,
				level: data.difficultyLevel.trim(),
				charter: data.author.trim(),
				composer: data.musicAuthor.trim(),
				illustrator: data.pictureAuthor.trim(),
				chart: chart.name,
				music: music.name,
				illustration: illustration.name,
				unlockVideo: unlockVideo ? unlockVideo.name : null,
				format: null,
				tip: typeof data.tip === 'string' && data.tip.trim() ? data.tip.trim() : null
			},
			files: { chart, music, illustration, unlockVideo }
		};

		await transact('readwrite', store => store.put(cache));
		return cache;
	}

	function getChartCaches() {
		return transact('readonly', store => store.getAll())
			.then(caches => caches.sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
	}

	window.LocalStrange = { createChartCache, getChartCaches };
})();
