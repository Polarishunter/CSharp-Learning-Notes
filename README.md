# C# 程式學習筆記站

以 **C# 基礎語法＋Windows Forms** 為主的繁體中文入門教材網站。專案採用原生 HTML、CSS、JavaScript 與 JSON，不需建置流程，可部署至 GitHub Pages。

## 網站內容

- **C# 基礎語法**：變數與資料型態、條件判斷、for 迴圈
- **Windows Forms**：Button 按鈕事件
- 每篇皆依照「學習目標 → 觀念講解 → 程式碼範例 → 執行結果 → 練習題目」編排。
- C# 範例支援語法高亮（highlight.js 11.9.0），可直接複製程式碼。
- 教材目錄由 `data/lessons.json` 產生，首頁和側邊欄會同步更新。
- 支援教材搜尋、分類篩選、手機版導覽與深淺色切換。

## 本機預覽

請在專案根目錄執行：

```bash
python -m http.server 8000
```

再開啟 `http://localhost:8000/`。由於教材目錄透過 `fetch()` 載入，**不要直接雙擊 HTML 檔案**（`file://` 可能無法取得 JSON）。

## 發布到 GitHub Pages

1. 在 GitHub 建立公開儲存庫，例如 `CSharp-Learning-Notes`。
2. 將**這個資料夾內的所有檔案**（包含 `index.html`、`AGENTS.md`、`data/` 和 `lessons/`）推送到儲存庫 `main` 分支的根目錄。
3. 前往儲存庫 **Settings → Pages → Build and deployment**，Source 選 `Deploy from a branch`，Branch 選 `main`、Folder 選 `/(root)`，再按 Save。
4. 等待 GitHub Pages 顯示部署成功後，開啟 GitHub Pages 所提供的網址，逐頁檢查導覽及教材內容。
5. 將實際的 Repository 與 Pages 網址填入作業繳交欄位。

**已部署網址**：<https://polarishunter.github.io/CSharp-Learning-Notes/>  
**GitHub Repository**：<https://github.com/Polarishunter/CSharp-Learning-Notes>

## AI 如何新增教材

**請先閱讀 [AGENTS.md](AGENTS.md)**，並依照 `templates/lesson-template.html` 建立教材。假設新增「for 迴圈」：

1. 複製模板到 `lessons/csharp/for-loop.html`。
2. 保留五個規定區塊，撰寫繁體中文教學與完整 C# 程式碼。
3. 將 `data-lesson-id` 設為 `cs-for-loop`，並調整 `<title>`、分類和標題。
4. 在 `data/lessons.json` 新增資料：`id: cs-for-loop`、`category: csharp`、`path: lessons/csharp/for-loop.html`、不重複的 `order` 等欄位。
5. 開啟網站，首頁、側邊欄及上一／下一篇導覽會自動讀取新的 JSON 資料，**不需要逐頁編輯導覽**。

## 目錄結構

```text
CSharp-Learning-Notes/
├── AGENTS.md
├── README.md
├── index.html
├── css/style.css
├── js/main.js
├── data/lessons.json
├── templates/lesson-template.html
├── lessons/csharp/variables.html
├── lessons/csharp/conditionals.html
├── lessons/csharp/for-loop.html
├── lessons/winforms/button-click.html
├── assets/images/
└── scripts/check_site.py
```

## 品質檢查

```bash
python scripts/check_site.py
```

檢查 JSON 格式、檔案是否存在、五段式結構、標題、重複識別碼與站內相對連結。這是靜態內容的自動檢查；**Windows Forms C# 程式仍需在 Windows / Visual Studio 中另外執行驗證**。

## 目前狀態

- 專案檔案：已建立（4 篇教材）
- GitHub Repository：**已公開上傳**
- GitHub Pages：**已部署成功**
- AGENTS.md 規範驗證：**已依規範新增「for 迴圈」教材，且僅需新增一篇 HTML 與一筆 JSON 資料**
