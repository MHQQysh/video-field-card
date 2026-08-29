# 视频研究团队论文卡片库

这是一个完全由本地数据驱动的静态论文网站，集中展示 11 个视频研究团队公开可核验、具有 arXiv ID 的历史 Video 相关论文。论文检索、团队归属核验和中文分析在提交数据前完成；网页和 GitHub Actions 都不会在线搜索论文或调用模型 API。

## 覆盖团队

1. NUS Show Lab
2. NJU MCG
3. OpenGVLab
4. OpenDriveLab / HKU
5. Autonomous Vision Group, University of Tuebingen
6. Chenliang Xu Group, University of Rochester
7. MMLab@NTU / S-Lab
8. MMLab@HKU
9. NUS HPC-AI Lab / HPC-AI Tech
10. PKU-YuanGroup / 兔展 AIGC 联合实验室
11. THUDM / 智谱 CogVideo 团队

收录方向包括视频理解、动作识别、时序表征、视频分割、Video-LMM、视频生成与编辑、视频评价、视频世界模型，以及明确使用连续视觉序列的自动驾驶研究。纯静态图像、纯单帧 3D/点云和无法核验团队归属的条目不进入正式目录，边界候选会保存在排除审计中。

## AlphaXiv 原文链接

每张卡片和每篇详情页的“原文”入口都使用以下固定格式：

```text
https://www.alphaxiv.org/pdf/<arxiv-id>
```

arXiv ID 仍作为内部唯一标识，用于跨团队合并和去重。

## 本地运行

项目只使用 Python 标准库构建网站，无需 DeepSeek、OpenAI 或其他 API Key。

```powershell
python scripts/export_fulltext_records.py --require-complete
python scripts/build_fulltext_template_site.py
python scripts/audit_static_site.py
python -m unittest discover -s tests -v
python -m http.server 8000 --directory site
```

浏览器打开 `http://127.0.0.1:8000`。生成结果位于 `site/`，首页支持团队、年份、方向和关键词筛选，每篇论文都有独立详情页。

## 从完整 PDF 重建长文卡片

静态站运行时不需要模型；只有重新生成论文分析时需要本机已经登录的 Codex。每篇论文由
一个全新 writer 会话从第一页读到最后一页，再由不同的全新 reviewer 会话独立阅读全文、
逐条核对页码、表格行列、数字和证据。审稿不通过会进入 `revision_required`，由另一个
全新 writer 返修，不能由 reviewer 直接改稿或放行。

```powershell
# 下载完整 PDF，并按页抽取正文；低于 6 GB 可用空间时自动停止
python scripts/fulltext_prepare.py --workers 3 --limit 545 --reserve-gb 6

# 复用本机 ChatGPT/Codex 登录并维持 12 路一次性 writer/reviewer
codex login status
python scripts/fulltext_supervisor.py start `
  --max-concurrency 12 --max-attempts 20 `
  --model gpt-5.6-sol --reasoning-effort ultra

# 查看真实队列与后台代理
python scripts/fulltext_queue.py status
python scripts/fulltext_supervisor.py status --repo .
```

`codex exec` 可以复用本机 ChatGPT 登录，但该登录凭据不是、也不能导出成通用
`OPENAI_API_KEY`。如果改用官方 Responses API，需要单独的 OpenAI API key 和对应 API
额度。正式建站只接受独立审稿已批准的记录：

```powershell
python scripts/export_fulltext_records.py --require-complete
python scripts/build_fulltext_template_site.py
python scripts/audit_static_site.py
```

## 数据文件

- `data/labs.json`：11 个团队的规范名称、别名和官方主页。
- `data/research/*.json`：互相独立的研究批次和逐条归属证据。
- `data/papers.json`：合并去重后的唯一生产数据源。
- `data/fulltext-papers.json`：仅包含独立审稿通过记录的建站输入。
- `data/exclusions.json`：已检查但不符合收录条件的边界候选。
- `fulltext/pdfs/`、`fulltext/text/`：完整 PDF 与逐页抽取正文。
- `fulltext/drafts/`、`fulltext/reviews/`、`fulltext/approved/`：写稿、独立审稿与批准快照。
- `reports/coverage.md`：各团队收录量、排除量和来源覆盖审计。

每篇正式记录必须包含：

- 规范化 arXiv ID、标题、arXiv `Submitted on` 日期和作者
- 一个或多个团队标签及归属证据
- 视频主题标签和原始摘要
- 六部分中文分析：研究单位与团队归属、论文概述、核心贡献、方法描述、数据集与资源、评估与结果
- 精确的 AlphaXiv PDF 链接
- 用于核验的公开来源 URL

## 重新合并研究批次

研究批次更新后运行：

```powershell
python scripts/merge_catalog.py
python scripts/validate_catalog.py
python scripts/build_static_site.py
```

合并脚本按规范化 arXiv ID 去重。同一论文被多个团队列出时只生成一张卡片，同时保留所有已核验的团队标签与来源。

## GitHub Pages

`.github/workflows/deploy.yml` 只在推送 `master`/`main` 或手动触发时执行以下步骤：

1. 检出仓库中已经提交并在本地验收过的 `site/`。
2. 原样上传该目录并部署 GitHub Pages。

Workflow 不运行 Python、不重新建站、没有定时任务，不抓取 arXiv，不调用 DeepSeek，不抓取在线图片，不自动提交或推送仓库，也不需要任何 Secret。网页打开后只操作已经生成的本地 HTML、CSS 和 JavaScript；只有用户主动点击“原文”时才会访问 AlphaXiv。

## 项目结构

```text
.
├── data/
│   ├── labs.json
│   ├── papers.json
│   ├── fulltext-papers.json
│   ├── exclusions.json
│   └── research/
├── fulltext/
│   ├── pdfs/
│   ├── text/
│   ├── drafts/
│   ├── reviews/
│   └── approved/
├── reports/coverage.md
├── scripts/
│   ├── validate_catalog.py
│   ├── fulltext_supervisor.py
│   ├── export_fulltext_records.py
│   ├── build_fulltext_template_site.py
│   └── audit_static_site.py
├── tests/
├── site/
│   ├── index.html
│   ├── assets/
│   └── papers/<arxiv-id>/index.html
└── .github/workflows/deploy.yml
```

## 完整性边界

“全部”依据构建日能够从团队官方出版物页、官方项目/代码仓库、arXiv 元数据和可靠学术索引公开核验的记录。`reports/coverage.md` 是当前快照的证据清单；无法证明团队归属或没有 arXiv ID 的论文不会被伪装成已收录。
