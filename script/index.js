// ==UserScript==
// @name         文档免费下载
// @namespace    https://github.com/wayner6/kill-doc
// @version      9.1.0
// @description  基于 kill-doc 深度重构。单次点击一键全自动渲染并导出高清 1:1 原貌尺寸 PDF，智能裁切消除白边，支持随时中断下载。
// @author       kill-doc-dev
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
// @icon         https://dtking.cn/favicon.ico
// @run-at       document-idle
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        unsafeWindow
// @license      Apache-2.0
// ==/UserScript==

(function() {
	'use strict';

	// ==================== 基础工具与 DOM 增强 ====================
	function generateRandomString(len = 5) {
		let res = '';
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		for (let i = 0; i < len; i++) {
			res += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return res;
	}

	const prefix = generateRandomString() + "_";
	const boxId = generateRandomString();

	const styles = `
		#${prefix}${boxId} {
			position: fixed;
			top: 50%;
			transform: translateY(-50%);
			right: 20px;
			gap: 12px;
			flex-direction: column;
			z-index: 2147483647;
			display: flex;
			user-select: none;
		}
		.${prefix}box {
			padding: 10px 14px;
			cursor: pointer;
			border: 1px solid #0066ff;
			border-radius: 6px;
			background-color: #ffffff;
			color: #0066ff;
			font-size: 13px;
			font-weight: bold;
			box-shadow: 0 2px 10px rgba(0,0,0,0.15);
			transition: all 0.2s;
			text-align: center;
			min-width: 96px;
			outline: none;
		}
		.${prefix}box:hover {
			background-color: #0066ff;
			color: #ffffff;
		}
		.${prefix}active {
			color: #28a745;
			border-color: #28a745;
			background-color: #f0fff4;
			cursor: default;
		}
		.${prefix}active:hover {
			background-color: #f0fff4;
			color: #28a745;
		}
		#${prefix}stop {
			border-color: #dc3545;
			color: #dc3545;
		}
		#${prefix}stop:hover {
			background-color: #dc3545;
			color: #ffffff;
		}
		@media print {
			html { height: auto !important; }
			body { display: block !important; }
			#${prefix}${boxId}, #mf-download-dialog, .menubar, .top-bar-right, .user-guide, .reader-thumb, .related-doc-list {
				display: none !important;
			}
		}
	`;

	// 阻止平台反外挂篡改 drawImage
	const canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;
	const originalDrawImage = canvasRenderingContext2DPrototype.drawImage;
	Object.defineProperty(canvasRenderingContext2DPrototype, 'drawImage', {
		value: originalDrawImage,
		writable: false,
		configurable: false
	});

	// 重写 setTimeout，防止关键回调被平台干扰
	const originalSetTimeout = unsafeWindow.setTimeout;
	unsafeWindow.setTimeout = function(callback, delay, ...args) {
		const toStr = callback?.toString();
		if (toStr && toStr.includes('revokeObjectURL')) return true;
		const wrappedCallback = function() {
			if (callback instanceof Function) {
				callback(...args);
			}
		};
		return originalSetTimeout(wrappedCallback, delay);
	};

	class Utility {
		style(e, data) {
			Object.keys(data).forEach(key => {
				e.style[key] = data[key];
			});
		}

		appendStyle(css) {
			const style = document.createElement('style');
			style.textContent = css;
			style.type = 'text/css';
			(document.head || document.documentElement).appendChild(style);
		}

		createEl(id, elType, data) {
			const el = document.createElement(elType);
			el.id = id || '';
			if (data) this.style(el, data);
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
			if (elNode) elNode.innerText = text;
		}

		sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		preview(current, total, content) {
			return new Promise(async (resolve) => {
				if (current === -1) {
					this.update('#' + prefix + 'text', content || "已完成");
				} else {
					const p = (current / total) * 100;
					const ps = p.toFixed(0) > 100 ? 100 : p.toFixed(0);
					this.update('#' + prefix + 'text', content || `进度 ${ps}%`);
					await this.sleep(120);
				}
				resolve();
			});
		}

		preText(content) {
			this.update('#' + prefix + 'text', content);
		}

		gui(boxs) {
			const oldBox = document.getElementById(prefix + boxId);
			if (oldBox) oldBox.remove();
			const box = this.createEl(prefix + boxId, 'div');
			for (let x in boxs) {
				const item = boxs[x];
				if (!item || !item.id) continue;
				const el = this.createEl(prefix + item.id, 'button');
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
	}

	class Box {
		constructor(id, label, action) {
			this.id = id;
			this.label = label;
			this.action = action;
		}
	}

	const u = new Utility();

	// ==================== 站点定义与配置 ====================
	const domain = {
		book118: 'book118.com',
		renrendoc: 'renrendoc.com',
		docin: 'docin.com',
		doc88: 'doc88.com',
		mbalib: 'doc.mbalib.com',
		deliwenku: 'deliwenku.com',
		jinchutou: 'jinchutou.com',
		goldhoe: 'goldhoe.com',
		mayiwenku: 'mayiwenku.com',
		dugen: 'dugen.com',
		cxk: '7cxk.com',
		ishare: 'ishare.iask.com',
		sina: 'down.sina.com.cn',
		wenku: 'wenku.baidu.com',
		chochina: 'chochina.com',
		weizhuannet: 'weizhuannet.com',
		taodocs: 'taodocs.com',
		so: 'wenku.so.com',
		tres: '360tres.com',
		wenkub: 'wenkub.com',
		gb688: 'c.gb688.cn',
		samr: 'openstd.samr.gov.cn',
		spc: 'jjg.spc.org.cn',
		baijiayun: 'pro-img-brtm.baijiayun.com',
		sacinfo: 'hbba.sacinfo.org.cn',
		qzoffice: 'qzoffice.com',
		nrsis: 'nrsis.org.cn',
		feishu: 'feishu.cn',
		larkoffice: 'larkoffice.com',
		jtysbz: 'jtysbz.cn',
		nssi: 'nssi.org.cn',
		online71nc: 'online.71nc.cn',
		kfs114: '114.251.111.103',
		cebpubservice: 'cebpubservice.com',
		flash: 'flash/previewImg.jsp',
		rbtest: 'rbtest.cnca.cn',
		qq: 'weboffice.qq.com',
		gbservice: 'gbservice.cn',
		sgcc: 'ecp.sgcc.com.cn',
		quark: 'quark.cn',
		jtst: 'jtst.mot.gov.cn'
	};

	const { host, href } = window.location;
	const jsPDF = jspdf.jsPDF;

	let doc = null;
	let collectedImages = [];
	let title = document.title;
	let select = null;
	let dom = null;
	let beforeFun = null;
	let isRunning = false;
	let isAborted = false;

	// ==================== PDF 与图像处理核心引擎 ====================
	const resetState = () => {
		doc = null;
		collectedImages = [];
	};

	const cropCanvasWhiteBorders = (canvas) => {
		if (!canvas || !canvas.width || !canvas.height) return canvas;
		const width = canvas.width;
		const height = canvas.height;

		try {
			const ctx = canvas.getContext('2d');
			const imgData = ctx.getImageData(0, 0, width, height);
			const data = imgData.data;

			let top = 0;
			for (let y = 0; y < height; y++) {
				let hasContent = false;
				for (let x = 0; x < width; x += 4) {
					const idx = (y * width + x) * 4;
					const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
					if (a > 20 && (r < 245 || g < 245 || b < 245)) {
						hasContent = true;
						break;
					}
				}
				if (hasContent) {
					top = Math.max(0, y - 2);
					break;
				}
			}

			let bottom = height;
			for (let y = height - 1; y >= 0; y--) {
				let hasContent = false;
				for (let x = 0; x < width; x += 4) {
					const idx = (y * width + x) * 4;
					const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
					if (a > 20 && (r < 245 || g < 245 || b < 245)) {
						hasContent = true;
						break;
					}
				}
				if (hasContent) {
					bottom = Math.min(height, y + 3);
					break;
				}
			}

			const cropH = bottom - top;
			if ((top > 20 || bottom < height - 20) && cropH > 100) {
				const croppedCanvas = document.createElement('canvas');
				croppedCanvas.width = width;
				croppedCanvas.height = cropH;
				const cCtx = croppedCanvas.getContext('2d');
				cCtx.fillStyle = '#FFFFFF';
				cCtx.fillRect(0, 0, width, cropH);
				cCtx.drawImage(canvas, 0, top, width, cropH, 0, 0, width, cropH);
				return croppedCanvas;
			}
		} catch (e) {
			console.warn('Canvas 边缘探测跳过:', e);
		}
		return canvas;
	};

	const savePageToPDF = (canvasOrImg, i, width, height) => {
		const target_w = Math.round(width || (canvasOrImg && (canvasOrImg.naturalWidth || canvasOrImg.width)) || 595);
		const target_h = Math.round(height || (canvasOrImg && (canvasOrImg.naturalHeight || canvasOrImg.height)) || 842);
		const dir = target_w > target_h ? 'l' : 'p';

		let dataUrl = '';
		if (canvasOrImg && typeof canvasOrImg.toDataURL === 'function') {
			try {
				dataUrl = canvasOrImg.toDataURL('image/jpeg', 0.95);
			} catch (e) {}
		}

		if (dataUrl) {
			collectedImages.push({
				src: dataUrl,
				width: target_w,
				height: target_h,
				orientation: dir
			});
		}

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

		const source = dataUrl || canvasOrImg;
		doc.addImage(source, 'JPEG', 0, 0, target_w, target_h, undefined, 'FAST');

		// 严格约束总页数，剔除溢出空白页
		while (doc.getNumberOfPages() > i + 1) {
			doc.deletePage(doc.getNumberOfPages());
		}
	};

	// ==================== 下载与打印调度 ====================
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
		const evt = new MouseEvent('click', { bubbles: false, cancelable: true });
		link.dispatchEvent(evt);
		setTimeout(() => {
			if (document.body.contains(link)) document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
		}, 10000);
	};

	const showDownloadDialog = (safeTitle, pdfBlob) => {
		const oldDialog = document.getElementById('mf-download-dialog');
		if (oldDialog) oldDialog.remove();

		const dialog = document.createElement('div');
		dialog.id = 'mf-download-dialog';
		dialog.style.cssText = 'position:fixed;top:30px;right:30px;z-index:2147483647;background:#ffffff;border:2px solid #0066ff;border-radius:10px;padding:18px 22px;box-shadow:0 8px 30px rgba(0,0,0,0.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-width:320px;max-width:420px;';

		const blobUrl = pdfBlob ? URL.createObjectURL(pdfBlob) : null;
		const fileName = `${safeTitle}.pdf`;

		dialog.innerHTML = `
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
				<span style="font-weight:bold;color:#0066ff;font-size:16px;">🎉 文档已生成就绪</span>
				<span id="mf-close-btn" style="cursor:pointer;font-size:20px;color:#999;font-weight:bold;line-height:1;">&times;</span>
			</div>
			<div style="font-size:13px;color:#333;margin-bottom:15px;word-break:break-all;line-height:1.5;">
				${fileName}
			</div>
			<div style="display:flex;gap:10px;flex-wrap:wrap;">
				${blobUrl ? `<a id="mf-direct-download" href="${blobUrl}" download="${fileName}" style="flex:1;text-align:center;padding:10px 14px;background:#0066ff;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;cursor:pointer;display:inline-block;box-shadow:0 2px 6px rgba(0,102,255,0.3);">📥 点击保存 PDF</a>` : ''}
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

		const printBtn = document.getElementById('mf-print-btn');
		if (printBtn) {
			printBtn.onclick = () => printCollectedImages(safeTitle);
		}
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
				${collectedImages.map(item => `<div class=\"print-page\"><img src=\"${typeof item === 'string' ? item : item.src}\" /></div>`).join('')}
			</body>
			</html>
		`);
		docIframe.close();

		setTimeout(() => {
			iframe.contentWindow.focus();
			iframe.contentWindow.print();
		}, 500);
	};

	const exportPDF = () => {
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
			u.preText('下载完成');
		} catch (e) {
			console.error('输出 PDF Blob 失败，降级 doc.save', e);
			showDownloadDialog(safeTitle, null);
			doc.save(`${safeTitle}.pdf`, { returnPromise: true });
			u.preText('下载完成');
		}
	};

	// ==================== 全自动预览与数据抓取管道 ====================
	const autoScrollAndRenderAllPages = async () => {
		if (beforeFun) {
			try {
				new Function(beforeFun)();
			} catch (e) {}
		}

		// 道客巴巴特定优化
		if (host.includes(domain.doc88)) {
			const continueBtn = document.querySelector('#continueButton');
			if (continueBtn) continueBtn.click();
			const pages = u.queryAll(select || '#pageContainer .inner_page');
			const total = pages.length;
			for (let i = 0; i < total; i++) {
				if (isAborted) return false;
				const page = pages[i];
				page.scrollIntoView({ behavior: 'auto', block: 'center' });
				u.preview(i + 1, total, `加载第 ${i + 1}/${total} 页`);
				await u.sleep(250);
			}
			return true;
		}

		// 常规滚动容器
		if (dom) {
			const scrollStep = 600;
			let maxScroll = dom.scrollHeight - dom.clientHeight;
			let current = 0;
			while (current < maxScroll) {
				if (isAborted) return false;
				current += scrollStep;
				dom.scrollTo({ top: current, behavior: 'smooth' });
				u.preview(current, maxScroll);
				await u.sleep(250);
				maxScroll = dom.scrollHeight - dom.clientHeight;
			}
			return true;
		} else if (select) {
			const els = u.queryAll(select);
			const total = els.length;
			for (let i = 0; i < total; i++) {
				if (isAborted) return false;
				els[i].scrollIntoView({ behavior: 'auto', block: 'center' });
				u.preview(i + 1, total);
				await u.sleep(200);
			}
			return true;
		}
		return true;
	};

	const processAndExtractPages = async () => {
		const nodes = u.queryAll(select);
		const length = nodes.length;
		let validCount = 0;

		for (let i = 0; i < length; i++) {
			if (isAborted) return false;
			const item = nodes[i];
			let canvas = item.tagName === 'CANVAS' ? item : item.querySelector('canvas');
			let img = item.tagName === 'IMG' ? item : item.querySelector('img');

			if ((!canvas || !canvas.width) && (!img || !img.naturalWidth)) {
				item.scrollIntoView({ behavior: "auto", block: "center" });
				await u.sleep(250);
				canvas = item.tagName === 'CANVAS' ? item : item.querySelector('canvas');
				img = item.tagName === 'IMG' ? item : item.querySelector('img');
			}

			if (isAborted) return false;

			if (canvas && canvas.width > 0 && canvas.height > 0) {
				const processedCanvas = cropCanvasWhiteBorders(canvas);
				savePageToPDF(processedCanvas, validCount, processedCanvas.width, processedCanvas.height);
				validCount++;
			} else if (img && (img.naturalWidth || img.width)) {
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = img.naturalWidth || img.width;
				tempCanvas.height = img.naturalHeight || img.height;
				const tCtx = tempCanvas.getContext('2d');
				tCtx.drawImage(img, 0, 0);

				const processedCanvas = cropCanvasWhiteBorders(tempCanvas);
				savePageToPDF(processedCanvas, validCount, processedCanvas.width, processedCanvas.height);
				validCount++;
			}
			await u.preview(i + 1, length, `合成第 ${i + 1}/${length} 页`);
		}

		if (isAborted) return false;

		console.log(`处理完成，共捕获 ${validCount}/${length} 页`);
		if (validCount === 0) {
			alert('未能捕获到已渲染页面！请重新尝试下载。');
			return false;
		}
		return true;
	};

	const startDownloadPipeline = async () => {
		if (isRunning) {
			alert('已有下载任务正在进行中！如需终止请点击【中断下载】');
			return;
		}
		isRunning = true;
		isAborted = false;
		resetState();
		u.preText('正在自动加载...');

		try {
			// 1. 全量自动滚动与渲染
			const scrollOk = await autoScrollAndRenderAllPages();
			if (isAborted || scrollOk === false) {
				u.preText('已中断下载');
				return;
			}

			// 2. 图像抽取、裁切与 PDF 合成
			u.preText('正在生成 PDF...');
			const extractOk = await processAndExtractPages();
			if (isAborted || extractOk === false) {
				u.preText('已中断下载');
				return;
			}

			// 3. 导出与触发保存
			exportPDF();
		} catch (err) {
			if (isAborted) {
				u.preText('已中断下载');
				return;
			}
			console.error('下载流程异常:', err);
			u.preText('处理出错');
			alert('下载流程遇到错误：' + (err.message || err));
		} finally {
			isRunning = false;
		}
	};

	const stopDownloadPipeline = () => {
		if (!isRunning) {
			u.preText('当前未在下载');
			setTimeout(() => u.preText('文档免费下载'), 2000);
			return;
		}
		isAborted = true;
		isRunning = false;
		u.preText('已中断下载');
	};

	// ==================== 界面交互与初始化 ====================
	const btns = [
		new Box('text', '文档免费下载', null),
		new Box('pdf', '📥 下载 PDF', () => startDownloadPipeline()),
		new Box('stop', '🛑 中断下载', () => stopDownloadPipeline())
	];

	const init = () => {
		u.appendStyle(styles);
		const ogTitle = u.query('meta[property="og:title"]');
		title = (ogTitle ? ogTitle.content : document.title || 'document').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();

		// 站点选择器自适应配置
		if (host.includes(domain.doc88)) {
			if (!/.+doc88\.com\/.+$/.test(href)) return;
			select = "#pageContainer .inner_page";
			beforeFun = "let eb = document.querySelector('#continueButton');if (eb) {eb.click();}";
		} else if (host.includes(domain.renrendoc)) {
			select = "#page img";
		} else if (host.includes(domain.book118)) {
			select = ".webpreview-item img";
		} else if (host.includes(domain.docin)) {
			select = "#contentcontainer canvas";
		} else if (host.includes(domain.wenku)) {
			select = "#original-creader-root canvas";
		} else if (host.includes(domain.mbalib)) {
			select = "#viewer .page";
		} else if (host.includes(domain.samr)) {
			select = ".viewerContainer .page";
		} else if (host.includes(domain.taodocs)) {
			select = "#canvas .page";
		} else if (host.includes(domain.feishu)) {
			select = ".render-unit-wrapper canvas, .docx-page canvas";
		} else {
			select = "#pageContainer .inner_page, #viewer .page, .page canvas, #original-creader-root canvas, #canvas .page";
		}

		u.gui(btns);
	};

	(() => {
		console.log('[kill-doc] 脚本已就绪');
		setTimeout(init, 1000);
	})();
})();
