# Lecture to Course

把一份或多份课程 PDF 转化为可以离线学习的桌面课程网站：由 lecture 确定知识范围，围绕概念理解重新设计讲解。默认使用英文讲解和测验，附可搜索的英中术语表；每个知识点可以链接回原始 PDF 的具体页码。

本项目包含一份 Codex 技能、PDF 辅助脚本、网站模板和自编概率论示例。**脚本负责提取、构建和检查；课程讲解需要结合原始页面阅读、编写和核对。** 它不是无需审核的一键 OCR 或自动授课服务。

## 功能

- 为多份 PDF 建立有序索引，标记文本较少、需要视觉核对的页面。
- 按概念及其前置知识组织讲解，在 lecture 内重组页面，同时保留重要推导、适用条件和关键例题。
- 提供选择题反馈、答案解释、重试、章节导航和阅读进度。
- 支持英中术语搜索、键盘操作及离线 MathML 公式。
- 生成包含课件原件的静态网站，可直接打开，也可通过仅本机可访问的启动器阅读。

## 怎样把概念讲清楚

先建立“来源页面 → 概念 → 前置知识 → 学习目标 → 章节”的覆盖表，再编写正文。可从问题、直觉和简单例子切入，逐步连接到正式定义或公式，用误区辨析和变式题检查理解；按概念调整结构，不要求每节套用相同栏目。

用自己的话解释原有概念时直接写入正文并附来源。新设计的情境简短标为“Author-created example / exercise”，超出 lecture 范围的背景标为“Supplementary explanation”并放入可展开阅读。核心推理和必要条件默认可见；简化讲解仍保留课程深度，原材料含糊处明确说明。

自编概率论示例先用 100 人、40 人、24 人的群体图解释分母，再进入公式、条件概率与联合概率的比较，以及新情境练习。自检覆盖“用自己的话解释、判断适用条件、完成变式题”。阅读进度仅记录浏览位置，不能证明已经掌握。

## 快速体验

需要 **Python 3.10 或更新版本**。下面的命令在仓库根目录运行；Windows 可按环境使用 `python` 或 `py` 代替 `python3`。

```bash
git clone https://github.com/FriendlyPasser/lecture-to-course.git
cd lecture-to-course
python3 -m venv .local/venv
source .local/venv/bin/activate
python -m pip install --cache-dir .local/cache/pip -r requirements.txt
python -B lecture-to-course/scripts/build_course.py demo/course.json --out .local/demo/site
python -B lecture-to-course/scripts/check_site.py .local/demo/site
python -B .local/demo/site/launch_course.py
```

上面的虚拟环境激活命令适用于 macOS/Linux。Windows 请根据使用的终端，替换其中的 `source .local/venv/bin/activate`：

- **PowerShell：** `.\.local\venv\Scripts\Activate.ps1`
- **CMD：** `.local\venv\Scripts\activate.bat`

激活后，继续运行其余安装、构建和启动命令。启动器会打印当前本机地址并打开默认浏览器；学习期间保留终端窗口，按 `Ctrl+C` 停止。

也可以直接打开 `.local/demo/site/index.html`。macOS 用户可双击生成目录中的 `打开课程.command`，作为直接打开受限时的替代入口。生成的网站不需要 Node.js、API 密钥、CDN 或在线服务；本机启动器需要 Python 3。

构建器不会覆盖非空目录。重复构建时请使用新的输出目录，例如 `--out .local/work/demo-v2`。

### 在指定浏览器中打开

如需自行选择浏览器，可让启动器只打印本机地址，不自动打开默认浏览器：

```bash
python -B .local/demo/site/launch_course.py --no-browser
```

复制终端打印的完整地址，在所需浏览器中打开。学习期间保持终端窗口开启，按 `Ctrl+C` 停止服务。启动器会自动选择可用端口，每次重新启动后请使用新打印的地址；该地址仅供本机访问，无需联网。

## 用自己的课件创建课程

1. **提取索引。** 按授课顺序传入本地 PDF。

   ```bash
   python -B lecture-to-course/scripts/extract_pdf.py .local/lecture-01.pdf .local/lecture-02.pdf --out .local/work/source-index
   ```

2. **核对原始页面。** 安装 [Poppler](https://poppler.freedesktop.org/) 并确保 `pdftoppm` 在 PATH 中；macOS 可使用 `brew install poppler`，Ubuntu 可使用 `sudo apt-get install poppler-utils`。

   ```bash
   python -B lecture-to-course/scripts/render_pages.py .local/work/source-index/sources/01-lecture-01.pdf --pages 1-8 --out .local/work/review/lecture-01
   ```

   页码从 1 开始，以 PDF 实际页序为准。可通过 `--renderer /path/to/pdftoppm` 或 `PDFTOPPM` 指定渲染器。文本较少的标记只是线索，所有页面仍需视觉核对。

3. **组织概念并编写课程。** 参考 [教学要求](lecture-to-course/references/teaching.md)、[输入格式与组件](lecture-to-course/references/authoring.md) 和 [自编示例](demo/course.json)，先写覆盖表，再准备课程 JSON、章节 HTML、术语表及必要图片。保留 lecture 边界，内部可按理解依赖重排；节选应声明页码范围和未覆盖部分。覆盖表是编写资料，不增加 JSON 字段。JSON 中的文件路径相对于 JSON 所在目录。

4. **构建和验证。**

   ```bash
   python -B lecture-to-course/scripts/build_course.py .local/work/course.json --out .local/work/site
   python -B lecture-to-course/scripts/check_site.py .local/work/site
   python -B .local/work/site/launch_course.py
   ```

   检查来源页码、公式和测验理由，并在 1024、1440 像素宽度下检查阅读和交互。静态检查用于发现常见依赖问题，不能证明教学内容正确，也不是任意 HTML 的安全沙箱。HTML 片段应由可信作者编写。

完整的代理工作流程见 [SKILL.md](lecture-to-course/SKILL.md)。使用 Codex 技能时，安装的是仓库内的 `lecture-to-course/` 子目录，保留其中的脚本、模板和参考文档。

## 项目结构

```text
lecture-to-course/       可复用技能包
  SKILL.md              代理工作流程
  agents/               技能界面元数据
  scripts/              PDF 索引、页面渲染、站点构建和检查
  assets/template/      离线网页及本机启动器
  references/           教学、内容格式和浏览器兼容说明
demo/                   自编示例源文件，不含真实教师课件
  input/                两份合成 PDF，共四页
  assets/               示例中的两向表图片
  course.json           可直接构建的课程配置
  lecture-*.html        课程章节内容
tests/                  流水线、回归和浏览器测试
scripts/                开发依赖安装与工具入口
.local/                 本地资料、生成结果、依赖和缓存（不上传）
.github/workflows/      自动检查
```

`.gitignore` 只包含 `/.local/` 一条规则。真实课件、历史课程输出、截图、压缩包、虚拟环境、开发依赖和缓存都放在 `.local/`，新课件与工作文件建议放在 `.local/work/`。`demo/` 只保留可版本管理的自编示例源文件；首次构建不依赖已有截图目录或 Poppler。

## 开发与测试

先按快速体验创建并激活 `.local/venv`，再运行 Python 检查与测试。使用 `-B` 防止在源码目录产生字节码缓存；Ruff 缓存自动放在 `.local/cache/ruff`。

```bash
python -m pip install --cache-dir .local/cache/pip -r requirements-dev.txt
python -B -m ruff check .
python -B -m ruff format --check .
python -B -m unittest discover -s tests -v
```

浏览器测试需要 Node.js 22 或更新版本。`npm run setup` 使用根目录的依赖声明与锁文件，将依赖安装到 `.local/node_modules`；npm 缓存与测试浏览器分别放在 `.local/cache/npm` 和 `.local/cache/playwright`。

```bash
npm run setup
npm run browsers:install
npm run format:check
python -B lecture-to-course/scripts/build_course.py demo/course.json --out .local/demo/site
npm run test:browser
```

如果已经按快速体验构建了 `.local/demo/site`，跳过上述构建步骤。可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定已安装的 Chrome/Chromium。浏览器测试使用离线模式和直接文件地址，截图写入被忽略的 `.local/demo/review/`；Python 测试另外验证本机 HTTP 启动器。

测试新目录中的自编示例时，可传入站点和截图目录：`npm run test:browser -- .local/work/demo-v2 .local/work/demo-v2-review`。不传参数时仍使用上述默认目录。

格式化代码：

```bash
python -B -m ruff check --fix .
python -B -m ruff format .
npm run format
```

`tests/make_demo.py` 可重新生成两份合成 PDF，依赖 Pillow 和 ReportLab。重新生成后，如需同步两向表图片，请将第二份 PDF 的第 2 页渲染到新的临时目录，再复制为 `demo/assets/two-way-table.png`。测试结果及边界见 [VALIDATION.md](VALIDATION.md)。

## 致谢

工作流程受到 [zarazhangrui/codebase-to-course](https://github.com/zarazhangrui/codebase-to-course) 启发；本项目采用独立编写、面向课程 PDF 的桌面模板。
