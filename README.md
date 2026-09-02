# 文档免费下载 (Kill-Doc)

基于原版 `kill-doc` 深度重构与精简优化的高效在线文档转 PDF 工具。

专注于提供**单次点击一键全自动渲染、智能裁切无白边、1:1 原生比例自适应、一键旋转校正**的高清 PDF 下载体验。

---

## 🚀 特性与亮点

- **🎯 纯粹极简**：剔除冗余代码与废弃功能，专注于高质量 **PDF 一键下载**。
- **⚡ 单次点击全自动调度**：点击 `📥 下载 PDF` 自动触发全量懒加载滚动、数据抓取、PDF 合成与保存。
- **📐 1:1 原貌尺寸自适应**：废除死板的 A4 强制拉伸，Word 纵向文档与 PPT 横向幻灯片自动采用 1:1 物理尺寸与横竖方向。
- **✂️ 智能边缘探测与裁切**：自动探测并去除平台（如道客巴巴等）嵌入在竖版框架里的上下大面积白边，还原原生幻灯片。
- **🔄 一键旋转校正**：支持识别网页原生旋转矩阵，并提供工具栏 `🔄 旋转: 0°/90°/180°/270°` 一键纠正倒置文档。
- **🛡️ 双重下载兜底保障**：支持 `GM_download`、标准浏览器下载、右上角弹窗直链以及隐藏 iframe 打印另存为。

---

## 📥 安装与更新

### 方式一：一键安装 / 更新（推荐）

点击下方链接直接在 Tampermonkey 中安装或更新：

👉 **[安装 / 更新脚本 (raw.githubusercontent.com)](https://raw.githubusercontent.com/wayner6/kill-doc/master/script/index.js)**

### 方式二：手动导入

1. 打开浏览器扩展 **Tampermonkey** 管理面板；
2. 新建用户脚本，将 `script/index.js` 中的全部内容复制粘贴进去并保存即可。

---

## 📖 支持平台

| 平台名称 | 域名 | 支持状态 |
| :--- | :--- | :---: |
| **道客巴巴** | doc88.com | ✅ 完全支持 |
| **原创力文档** | book118.com | ✅ 完全支持 |
| **人人文库** | renrendoc.com | ✅ 完全支持 |
| **豆丁网 / 豆丁建筑** | docin.com | ✅ 完全支持 |
| **百度文库** | wenku.baidu.com | ✅ 完全支持 |
| **MBA 智库文档** | doc.mbalib.com | ✅ 完全支持 |
| **得力文库** | deliwenku.com | ✅ 完全支持 |
| **淘豆网** | taodocs.com | ✅ 完全支持 |
| **360 文库** | wenku.so.com | ✅ 完全支持 |
| **金锄头 / 蚂蚁文库 / 读根网** | jinchutou.com / mayiwenku.com / dugen.com | ✅ 完全支持 |
| **国家标准 / 行业标准** | openstd.samr.gov.cn / hbba.sacinfo.org.cn / c.gb688.cn | ✅ 完全支持 |
| **飞书文档 / 腾讯文档** | feishu.cn / weboffice.qq.com | ✅ 完全支持 |

---

## 🛠️ 项目构建

如需本地修改书签或更新脚本：

```bash
# 安装依赖
npm install

# 构建/校验
npm run build
```

---

## ⚖️ 开源协议

本项目基于 [Apache-2.0 License](LICENSE) 开源发布。
