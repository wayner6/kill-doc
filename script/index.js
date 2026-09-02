// ==UserScript==
// @name         文档免费下载
// @namespace    https://github.com/wayner6/kill-doc
// @version      8.3.1
// @description  基于 kill-doc 深度重构与二次开发。点击下载自动强制全量预览并导出高清 1:1 原貌尺寸 PDF/图片/纯文本，杜绝死锁与白边。
// @author       kill-doc-dev (基于 Mr.Fang 二次开发修复)
// @downloadURL  https://raw.githubusercontent.com/wayner6/kill-doc/master/script/index.js
// @updateURL    https://raw.githubusercontent.com/wayner6/kill-doc/master/script/index.js
// @match        https://*.book118.com/*
// @match        https://*.renrendoc.com/*
// @match        https://*.docin.com/*
// @match        https://*.doc88.com/*
// @match        https://doc.mbalib.com/*
// @match        https://*.deliwenku.com/*
// @match        https://www.jinchutou.com/*
// @match        https://*.goldhoe.com/*
// @match        https://*.mayiwenku.com/*
// @match        https://*.dugen.com/*
// @match        https://*.7cxk.com/*
// @match        https://ishare.iask.com/*
// @match        https://swf.iask.com/*
// @match        https://*.down.sina.com.cn/*
// @match        https://wenku.baidu.com/*
// @match        https://wkbjcloudbos.bdimg.com/*
// @match        https://wkretype.bdimg.com/*
// @match        https://*.chochina.com/*
// @match        https://*.weizhuannet.com/*
// @match        https://www.taodocs.com/*
// @match        https://wenku.so.com/*
// @match        https://*.360tres.com/*
// @match        https://www.wenkub.com/*
// @match        http://c.gb688.cn/*
// @match        https://openstd.samr.gov.cn/bzgk/*
// @match        https://jjg.spc.org.cn/resmea/view/stdonline
// @match        https://pro-img-brtm.baijiayun.com/*
// @match        https://hbba.sacinfo.org.cn/attachment/onlineRead/*
// @match        https://www.qzoffice.com/*
// @match        http://www.nrsis.org.cn/mnr_kfs/file/read/*
// @match        https://*.feishu.cn/space/*
// @match        https://*.feishu.cn/file/*
// @match        https://*.larkoffice.com/space/api/box/stream/download/preview_tpl3/*
// @match        http://www.jtysbz.cn:8009/pdf/viewer/*
// @match        https://www.nssi.org.cn/cssn/js/pdfjs/web/preview.jsp*
// @match        https://online.71nc.cn/*
// @match        https://114.251.111.103:18080/kfs/file/read/*
// @match        https://bulletin.cebpubservice.com/resource/ceb/js/pdfjs-dist/web/viewer.html*
// @match        http://121.36.94.83:9008/jsp/yishenqing/appladd/biaozhunfile/flash/previewImg.jsp*
// @match        http://rbtest.cnca.cn/cnca_kfs/file/read/*
// @match        https://weboffice.qq.com/pdf/*
// @match        https://gbservice.cn/*
// @match        https://ecp.sgcc.com.cn/*
// @match        https://vt.quark.cn/blm/quark-doc-main-pc-966/**
// @match        https://wenku-img.docs.quark.cn/*
// @match        https://preview-wenku.quark.cn/*
// @match        https://jtst.mot.gov.cn/kfs/file/read/*
// @require      https://unpkg.com/jspdf@2.4.0/dist/jspdf.umd.min.js
// @require      https://unpkg.com/@zip.js/zip.js@2.7.34/dist/zip.min.js
// @require      https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.js
// @icon         https://dtking.cn/favicon.ico
// @run-at 		 document-idle
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        unsafeWindow
// @license      Apache-2.0
// ==/UserScript==
(function() {
	'use strict';

	function generateRandomString() {
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const charactersLength = characters.length;
		for (let i = 0; i < 5; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	const prefix = generateRandomString() + "_";
	const boxId = generateRandomString();
	let styles =
		`#${prefix}${boxId}{position:fixed;top:50%;transform:translateY(-50%);right:20px;gap:12px;flex-direction:column;z-index:2147483647;display:flex;user-select:none;}`;
	styles +=
		`.${prefix}box{padding:10px 14px;cursor:pointer;border:1px solid #0066ff;border-radius:6px;background-color:#ffffff;color:#0066ff;font-size:13px;font-weight:bold;box-shadow:0 2px 10px rgba(0,0,0,0.15);transition:all 0.2s;text-align:center;min-width:96px;outline:none;}.${prefix}box:hover{background-color:#0066ff;color:#ffffff;}.${prefix}active{color:#28a745;border-color:#28a745;background-color:#f0fff4;cursor:default;}.${prefix}active:hover{background-color:#f0fff4;color:#28a745;}`;
	styles +=
		`@media print{html{height:auto !important}body{display:block !important}#app-left{display:none !important}#app-right{display:none !important}#${prefix}${boxId}{display:none !important}.menubar{display:none !important}.top-bar-right{display:none !important}.user-guide{display:none !important}#app-reader-editor-below{display:none !important}.no-full-screen{display:none !important}.comp-vip-pop{display:none !important}.center-wrapper{width:auto !important}.reader-thumb,.related-doc-list,.fold-page-content,.try-end-fold-page,.lazy-load,#${prefix}textarea,#nav-menu-wrap{display:none !important}}`;

	// canvas 禁止重写 drawImage
	const canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;
	const originalDrawImage = canvasRenderingContext2DPrototype.drawImage;
	Object.defineProperty(canvasRenderingContext2DPrototype, 'drawImage', {
		value: originalDrawImage,
		writable: false,
		configurable: false
	});

	// 重写 setTimeout
	const originalSetTimeout = unsafeWindow.setTimeout;
	unsafeWindow.setTimeout = function(callback, delay, ...args) {
		let toStr = callback?.toString();
		if (toStr && toStr.includes('revokeObjectURL')) return true;
		const wrappedCallback = function() {
			if (callback instanceof Function) {
				callback(...args);
			}
		};
		return originalSetTimeout(wrappedCallback, delay);
	};

	// 移除禁止导出监听功能
	const originalAddEventListener = EventTarget.prototype.addEventListener;
	EventTarget.prototype.addEventListener = function(type, listener, options) {
		if (type === 'click' && listener && listener.toString().includes('download')) {
			return;
		}
		return originalAddEventListener.call(this, type, listener, options);
	};

	const MF_addURL = (url) => {
		let images = [];
		if (GM_getValue('listData')) {
			images = JSON.parse(GM_getValue('listData'));
		}
		if (typeof url === 'string') {
			images.push({ src: url });
		} else if (Array.isArray(url)) {
			url.forEach(item => images.push({ src: item }));
		}
		GM_setValue('listData', JSON.stringify(images));
	};

	const MF_ImageToBase64 = (url) => {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.crossOrigin = 'Anonymous';
			image.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				canvas.toBlob((blob) => {
					resolve({
						blob,
						width: image.naturalWidth,
						height: image.naturalHeight
					});
				}, "image/png", 1);
			};
			image.onerror = (e) => reject(e);
			image.src = url;
		});
	};

	const joinDownloadURL = (baseUrl) => {
		const size = window.Page?.size || 10;
		const urls = [];
		for (var i = 0; i < size; i++) {
			urls.push(baseUrl + '/' + i + '.png');
		}
		MF_addURL(urls);
	};

	class Box {
		id = "";
		label = "";
		action = null; // 真实的函数引用
		constructor(id, label, action) {
			this.id = id;
			this.label = label;
			this.action = action;
		}
	}

	class Utility {
		debug = true;

		style(e, data) {
			Object.keys(data).forEach(key => {
				e.style[key] = data[key];
			});
		}

		attr(e, key, val) {
			if (!val) {
				return e ? e.getAttribute(key) : null;
			} else if (e) {
				e.setAttribute(key, val);
			}
		}

		appendStyle(css) {
			let style = this.createEl('', 'style');
			style.textContent = css;
			style.type = 'text/css';
			let dom = document.head || document.documentElement;
			dom.appendChild(style);
		}

		createEl(id, elType, data) {
			const el = document.createElement(elType);
			el.id = id || '';
			if (data) {
				this.style(el, data);
			}
			return el;
		}

		query(el) {
			return document.querySelector(el);
		}

		queryAll(el) {
			return document.querySelectorAll(el);
		}

		update(el, text) {
			const elNode = this.query(el);
			if (elNode) {
				elNode.innerText = text;
			}
		}

		preview(current, total, content) {
			return new Promise(async (resolve) => {
				if (current === -1) {
					this.update('#' + prefix + 'text', content ? content : "已完成");
				} else {
					let p = (current / total) * 100;
					let ps = p.toFixed(0) > 100 ? 100 : p.toFixed(0);
					this.update('#' + prefix + 'text', content ? content : '进度 ' + ps + '%');
					await this.sleep(200);
				}
				resolve();
			});
		}

		preText(content) {
			this.update('#' + prefix + 'text', content);
		}

		gui(boxs) {
			let oldBox = document.getElementById(prefix + boxId);
			if (oldBox) oldBox.remove();
			const box = this.createEl(prefix + boxId, 'div');
			for (let x in boxs) {
				let item = boxs[x];
				if (!item || !item.id) continue;
				let el = this.createEl(prefix + item.id, 'button');
				el.textContent = item.label;
				if (x === '0' || item.id === 'text') {
					el.className = prefix + 'box ' + prefix + "active";
				} else {
					el.className = prefix + "box";
				}
				if (typeof item.action === 'function') {
					el.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();
						item.action();
					});
				}
				box.append(el);
			}
			document.body.append(box);
		}

		sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		log(msg) {
			if (this.debug) {
				console.log('[kill-doc]', msg);
			}
		}
	}

	const u = new Utility();

	const domain = {
		renrendoc: "renrendoc.com",
		book118: 'book118.com',
		docin: 'docin.com',
		wenku: 'wenku.baidu.com',
		so: 'wenku.so.com',
		doc88: 'doc88.com',
		mbalib: 'doc.mbalib.com',
		deliwenku: 'deliwenku.com',
		cxk: '7cxk.com',
		jinchutou: 'jinchutou.com',
		mayiwenku: 'mayiwenku.com',
		dugen: 'ww.dugen.com',
		iask: 'ishare.iask.com',
		chochina: 'chochina.com',
		weizhuan: 'weizhuannet.com',
		taodocs: 'taodocs.com',
		wenkub: 'wenkub.com',
		gb688: 'gb688.cn',
		openstd: 'openstd.samr.gov.cn',
		jjg: 'jjg.spc.org.cn',
		shengtongedu: 'pro-img-brtm.baijiayun.com',
		sacinfo: 'hbba.sacinfo.org.cn',
		qzoffice: 'www.qzoffice.com',
		nrsis: 'www.nrsis.org.cn',
		nea: '114.251.111.103:18080',
		nssi: 'www.nssi.org.cn',
		feishu: 'feishu.cn',
		bytedance: 'larkoffice.com',
		jtysbz: 'www.jtysbz.cn:8009',
		cebpubservice: 'bulletin.cebpubservice.com',
		jsjlw: '121.36.94.83:9008',
		mwr: 'online.71nc.cn',
		rbtest: 'rbtest.cnca.cn',
		weboffice: 'weboffice.qq.com',
		gbservice: 'gbservice.cn',
		sgcc: 'ecp.sgcc.com.cn',
		quark: 'quark.cn',
		jtst: 'jtst.mot.gov.cn'
	};

	const { host, href, origin } = window.location;
	const params = new URLSearchParams(window.location.search);
	const jsPDF = jspdf.jsPDF;

	let zipWriter = null;
	let collectedImages = [];
	let doc = null;

	const resetDocAndZip = () => {
		doc = null;
		zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"), {
			bufferedWrite: true,
			useCompressionStream: false
		});
		collectedImages = [];
	};
	resetDocAndZip();

	let pdf_w = 446,
		pdf_h = 631,
		pdf_ratio = 0.56,
		title = document.title,
		fileType = '',
		downType = 1,
		select = null,
		dom = null,
		beforeFun = null;

	// 核心下载调度：点击下载按钮 -> 自动全量强制滚动预览 -> 抓取合成 -> 输出
	let isRunning = false;
	const startDownloadPipeline = async (type) => {
		if (isRunning) {
			alert('正在处理中，请稍候...');
			return;
		}
		isRunning = true;
		downType = type;
		resetDocAndZip();
		localStorage.removeItem('down');
		u.preText('正在自动加载...');

		try {
			// 1. 自动全量滚动渲染（确保所有页面加载完成）
			await autoScrollAndRenderAllPages();

			// 2. 执行对应站点的抓取与数据合成
			u.preText('正在生成文件...');
			await executeDownload(downType);

			u.preText('下载完成');
		} catch (err) {
			console.error('下载流程异常:', err);
			u.preText('处理出错');
			alert('下载流程遇到错误：' + (err.message || err));
		} finally {
			isRunning = false;
		}
	};

	// 通用全量自动滚动与渲染函数
	const autoScrollAndRenderAllPages = async () => {
		before();

		// 道客巴巴
		if (host.includes(domain.doc88)) {
			const continueBtn = document.querySelector('#continueButton');
			if (continueBtn) continueBtn.click();
			const pages = u.queryAll(select || '#pageContainer .inner_page');
			const total = pages.length;
			for (let i = 0; i < total; i++) {
				const page = pages[i];
				page.scrollIntoView({ behavior: 'auto', block: 'center' });
				u.preview(i + 1, total, `加载第 ${i + 1}/${total} 页`);
				await u.sleep(350);
			}
			return;
		}

		// 常规带容器滚动的站点
		if (dom) {
			const scrollStep = 600;
			let maxScroll = dom.scrollHeight - dom.clientHeight;
			let current = 0;
			while (current < maxScroll) {
				current += scrollStep;
				dom.scrollTo({ top: current, behavior: 'smooth' });
				u.preview(current, maxScroll);
				await u.sleep(350);
				maxScroll = dom.scrollHeight - dom.clientHeight;
			}
		} else if (select) {
			const els = u.queryAll(select);
			const total = els.length;
			for (let i = 0; i < total; i++) {
				els[i].scrollIntoView({ behavior: 'auto', block: 'center' });
				u.preview(i + 1, total);
				await u.sleep(300);
			}
		}
	};

	const btns = [
		new Box('text', '文档免费下载', null),
		new Box('pdf', '📥 下载 PDF', () => startDownloadPipeline(1)),
		new Box('down', '🖼️ 下载图片', () => startDownloadPipeline(2))
	];

	const before = () => {
		if (beforeFun) {
			try {
				new Function(beforeFun)();
			} catch (e) {}
		}
	};

	const saveImageAndPDF = (imageData, blob, i, width, height) => {
		// 动态获取原始天然宽高，实现全局所有站点 1:1 原貌自适应
		const naturalW = width || (imageData && (imageData.naturalWidth || imageData.width)) || 595;
		const naturalH = height || (imageData && (imageData.naturalHeight || imageData.height)) || 842;
		const target_w = Math.round(naturalW);
		const target_h = Math.round(naturalH);
		const dir = target_w > target_h ? 'l' : 'p';

		if (blob) {
			zipWriter.add(`${i}.png`, new zip.BlobReader(blob));
		}

		// 保存渲染数据用于直接打印或备用
		let dataUrl = '';
		if (imageData && typeof imageData.toDataURL === 'function') {
			try {
				dataUrl = imageData.toDataURL('image/jpeg', 0.95);
			} catch (e) {}
		} else if (typeof imageData === 'string') {
			dataUrl = imageData;
		}

		if (dataUrl) {
			collectedImages.push({
				src: dataUrl,
				width: target_w,
				height: target_h,
				orientation: dir
			});
		}

		// 动态自适应页面尺寸：PPT等宽屏文档自动生成横版页面，Word等纵向文档自动生成竖版页面
		if (!doc || i === 0) {
			doc = new jsPDF({
				orientation: dir,
				unit: 'pt',
				format: [target_w, target_h],
				compress: true
			});
		} else {
			doc.addPage([target_w, target_h], dir);
		}

		const source = dataUrl || imageData;
		doc.addImage(source, 'JPEG', 0, 0, target_w, target_h, undefined, 'FAST');

		// 强制校验与自愈：确保页数严格匹配，剔除意外溢出页
		while (doc.getNumberOfPages() > i + 1) {
			doc.deletePage(doc.getNumberOfPages());
		}
	};

	const showDownloadDialog = (safeTitle, pdfBlob) => {
		let oldDialog = document.getElementById('mf-download-dialog');
		if (oldDialog) oldDialog.remove();

		const dialog = document.createElement('div');
		dialog.id = 'mf-download-dialog';
		dialog.style.cssText = 'position:fixed;top:30px;right:30px;z-index:2147483647;background:#ffffff;border:2px solid #0066ff;border-radius:10px;padding:18px 22px;box-shadow:0 8px 30px rgba(0,0,0,0.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-width:320px;max-width:420px;';

		const blobUrl = pdfBlob ? URL.createObjectURL(pdfBlob) : null;

		dialog.innerHTML = `
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
				<span style="font-weight:bold;color:#0066ff;font-size:16px;">🎉 文档已生成就绪</span>
				<span id="mf-close-btn" style="cursor:pointer;font-size:20px;color:#999;font-weight:bold;line-height:1;">&times;</span>
			</div>
			<div style="font-size:13px;color:#333;margin-bottom:15px;word-break:break-all;line-height:1.5;">
				${safeTitle}
			</div>
			<div style="display:flex;gap:10px;flex-wrap:wrap;">
				${blobUrl ? `<a id="mf-direct-download" href="${blobUrl}" download="${safeTitle}.pdf" style="flex:1;text-align:center;padding:10px 14px;background:#0066ff;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;cursor:pointer;display:inline-block;box-shadow:0 2px 6px rgba(0,102,255,0.3);">📥 点击保存 PDF</a>` : ''}
				<button id="mf-print-btn" style="flex:1;padding:10px 14px;background:#28a745;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 2px 6px rgba(40,167,69,0.3);">🖨️ 打印另存为</button>
			</div>
		`;

		document.body.appendChild(dialog);

		document.getElementById('mf-close-btn').onclick = () => dialog.remove();

		const directBtn = document.getElementById('mf-direct-download');
		if (directBtn) {
			directBtn.onclick = () => {
				u.preText('已触发保存');
				setTimeout(() => dialog.remove(), 4000);
			};
		}

		document.getElementById('mf-print-btn').onclick = () => {
			printCollectedImages(safeTitle);
		};
	};

	const printCollectedImages = (safeTitle) => {
		if (!collectedImages || collectedImages.length === 0) {
			alert('未捕获到页面图像，请重新点击下载！');
			return;
		}
		let iframe = document.getElementById('mf-print-iframe');
		if (iframe) iframe.remove();
		iframe = document.createElement('iframe');
		iframe.id = 'mf-print-iframe';
		iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
		document.body.appendChild(iframe);

		const firstPage = collectedImages[0] || {};
		const isLandscape = (firstPage.width && firstPage.height) ? (firstPage.width > firstPage.height) : true;
		const orientationCss = isLandscape ? 'landscape' : 'portrait';

		const docIframe = iframe.contentWindow.document;
		docIframe.open();
		docIframe.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>${safeTitle}</title>
				<style>
					@page {
						size: ${orientationCss};
						margin: 0mm !important;
					}
					* {
						margin: 0 !important;
						padding: 0 !important;
						box-sizing: border-box !important;
					}
					html, body {
						margin: 0 !important;
						padding: 0 !important;
						background: #fff;
						width: 100%;
						height: 100%;
					}
					.print-page {
						width: 100vw;
						height: 100vh;
						page-break-inside: avoid !important;
						break-inside: avoid !important;
						page-break-after: always !important;
						break-after: page !important;
						display: flex;
						align-items: center;
						justify-content: center;
						overflow: hidden;
					}
					.print-page:last-child {
						page-break-after: avoid !important;
						break-after: avoid !important;
					}
					img {
						width: 100%;
						height: 100%;
						object-fit: contain;
						display: block;
					}
				</style>
			</head>
			<body>
				${collectedImages.map(item => `<div class="print-page"><img src="${typeof item === 'string' ? item : item.src}" /></div>`).join('')}
			</body>
			</html>
		`);
		docIframe.close();

		setTimeout(() => {
			iframe.contentWindow.focus();
			iframe.contentWindow.print();
		}, 500);
	};

	const MF_SafeDownload = (blob, filename) => {
		const safeName = (filename || 'document').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
		const blobUrl = URL.createObjectURL(blob);
		if (typeof GM_download === 'function') {
			try {
				GM_download({
					url: blobUrl,
					name: safeName,
					saveAs: false,
					onload: () => {
						setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
					},
					onerror: (err) => {
						console.warn('[GM_download 失败，回退标准下载]', err);
						triggerNativeDownload(blobUrl, safeName);
					}
				});
				return;
			} catch (e) {
				console.warn('[GM_download 异常]', e);
			}
		}
		triggerNativeDownload(blobUrl, safeName);
	};

	const triggerNativeDownload = (blobUrl, filename) => {
		const link = document.createElement('a');
		link.href = blobUrl;
		link.download = filename;
		link.style.display = 'none';
		document.body.appendChild(link);
		const evt = new MouseEvent('click', {
			bubbles: false,
			cancelable: true
		});
		link.dispatchEvent(evt);
		setTimeout(() => {
			if (document.body.contains(link)) {
				document.body.removeChild(link);
			}
			URL.revokeObjectURL(blobUrl);
		}, 10000);
	};

	const downzip = () => {
		const safeTitle = (title || 'document').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
		zipWriter.close().then(blob => {
			MF_SafeDownload(blob, `${safeTitle}.zip`);
		}).catch(error => {
			console.error(error);
		});
	};

	const downpdf = () => {
		const safeTitle = (title || 'document').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
		try {
			if (doc && collectedImages.length > 0) {
				while (doc.getNumberOfPages() > collectedImages.length) {
					doc.deletePage(doc.getNumberOfPages());
				}
			}
			const pdfBlob = doc.output('blob');
			showDownloadDialog(safeTitle, pdfBlob);
			MF_SafeDownload(pdfBlob, `${safeTitle}.pdf`);
		} catch (e) {
			console.error('输出 PDF Blob 失败，降级 doc.save', e);
			showDownloadDialog(safeTitle, null);
			doc.save(`${safeTitle}.pdf`, {
				returnPromise: true
			});
		}
	};

	const downtxt = () => {
		const images = JSON.parse(GM_getValue('listData') || '[]');
		const text = images.map(item => item.src).join("\n");
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
		MF_SafeDownload(blob, `${title || 'urls'}.txt`);
	};

	const fullText = () => {
		let text = '';
		if (host.includes(domain.doc88)) {
			const texts = window.Core?.api?._bf || window.Core?.api?._VM;
			if (texts) {
				for (let i = 0; i < texts.length; i++) {
					text += `\n\n====第${i+1}页====\n\n` + texts[i];
				}
			}
		} else {
			text = document.body.innerText;
		}
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
		MF_SafeDownload(blob, `${title || 'text'}.txt`);
	};

	const conditionDownload = () => {
		if (downType === 1) {
			downpdf();
		} else if (downType === 2) {
			downzip();
		}
		u.preText('下载完成');
	};

	const MF_CanvasToBase64 = (canvas) => {
		return new Promise((resolve) => {
			if (!canvas || typeof canvas.toBlob !== 'function') {
				console.warn('目标不是有效 Canvas 元素:', canvas);
				resolve({
					blob: null,
					width: 0,
					height: 0
				});
				return;
			}
			const { width, height } = canvas;
			canvas.toBlob(
				(blob) => {
					resolve({
						blob,
						width,
						height
					});
				},
				"image/png",
				1
			);
		});
	};

	const imageToBase64 = async () => {
		const nodes = u.queryAll(select);
		const length = nodes.length;
		let validCount = 0;
		for (let i = 0; i < length; i++) {
			let item = nodes[i];
			let canvas = item.tagName === 'CANVAS' ? item : item.querySelector('canvas');
			let img = item.tagName === 'IMG' ? item : item.querySelector('img');

			if ((!canvas || !canvas.width) && (!img || !img.naturalWidth)) {
				item.scrollIntoView({
					behavior: "auto",
					block: "center"
				});
				await u.sleep(300);
				canvas = item.tagName === 'CANVAS' ? item : item.querySelector('canvas');
				img = item.tagName === 'IMG' ? item : item.querySelector('img');
			}

			if (canvas && canvas.width > 0 && canvas.height > 0) {
				let { blob, width, height } = await MF_CanvasToBase64(canvas);
				saveImageAndPDF(canvas, blob, validCount, width, height);
				validCount++;
			} else if (img && (img.naturalWidth || img.width)) {
				let width = img.naturalWidth || img.width;
				let height = img.naturalHeight || img.height;
				saveImageAndPDF(img, null, validCount, width, height);
				validCount++;
			}
			await u.preview(i + 1, length);
		}
		console.log(`处理完成，共捕获 ${validCount}/${length} 页`);
		if (validCount === 0) {
			alert('未能捕获到已渲染页面！请重新尝试下载。');
			return false;
		}
		return true;
	};

	const executeDownload = async (type) => {
		downType = type;
		if (host.includes(domain.doc88) || host.includes(domain.taodocs) || host.includes(domain.nrsis) || host.includes(domain.nea) || host.includes(domain.rbtest) || host.includes(domain.jtst)) {
			const ok = await imageToBase64();
			if (ok !== false) {
				conditionDownload();
			}
		} else {
			const ok = await imageToBase64();
			if (ok !== false) {
				conditionDownload();
			}
		}
	};

	const init = () => {
		u.appendStyle(styles);
		const ogTitle = u.query('meta[property="og:title"]');
		title = (ogTitle ? ogTitle.content : document.title || 'document').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();

		if (host.includes(domain.doc88)) {
			if (!/.+doc88\.com\/.+$/.test(href)) return;
			select = "#pageContainer .inner_page";
			beforeFun = "let eb = document.querySelector('#continueButton');if (eb) {eb.click();}";
			btns.push(new Box('get-text', '📋 复制文本', () => fullText()));
		} else if (host.includes(domain.renrendoc)) {
			select = "#page img";
			btns.push(new Box('PPT', '📋 获取地址', () => downtxt()));
		} else if (host.includes(domain.book118)) {
			select = ".webpreview-item img";
			btns.push(new Box('PPT', '📋 获取地址', () => downtxt()));
		} else if (host.includes(domain.docin)) {
			select = "#contentcontainer canvas";
		} else if (host.includes(domain.wenku)) {
			select = "#original-creader-root canvas";
			btns.push(new Box('get-text', '📋 复制文本', () => fullText()));
		} else if (host.includes(domain.mbalib)) {
			select = "#viewer .page";
			btns.push(new Box('get-text', '📋 复制文本', () => fullText()));
		} else {
			select = "#pageContainer .inner_page, #viewer .page, .page canvas";
		}

		u.gui(btns);
	};

	// 页面渲染完成后初始化
	(() => {
		console.log('[kill-doc] 脚本已就绪');
		setTimeout(() => {
			init();
		}, 1000);
	})();
})();
