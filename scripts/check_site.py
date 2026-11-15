"""Validate static teaching-site structure using Python's standard library."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ["學習目標", "觀念講解", "程式碼範例", "執行結果", "練習題目"]
CATEGORIES = {"csharp": "cs-", "winforms": "wf-"}
errors = []

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.headings = []
        self.links = []
        self.ids = []
        self._heading = None
        self._heading_text = []
        self.lesson_id = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag in ("h1", "h2"):
            self._heading = tag
            self._heading_text = []
        if tag in ("a", "link", "script", "img"):
            value = attrs.get({"a": "href", "link": "href", "script": "src", "img": "src"}[tag])
            if value:
                self.links.append(value)
        if tag == "article":
            self.lesson_id = attrs.get("data-lesson-id")

    def handle_data(self, data):
        if self._heading:
            self._heading_text.append(data)

    def handle_endtag(self, tag):
        if tag == self._heading:
            self.headings.append((tag, "".join(self._heading_text).strip()))
            self._heading = None

def parse(path):
    page = Document()
    page.feed(path.read_text(encoding="utf-8"))
    for link in page.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc or link.startswith("//"):
            continue
        if parts.path:
            target = (path.parent / unquote(parts.path)).resolve()
            if not target.is_relative_to(ROOT.resolve()) or not target.is_file():
                errors.append(f"{path.relative_to(ROOT)}: 連結／資源不存在 {link}")
        elif parts.fragment and parts.fragment not in page.ids:
            errors.append(f"{path.relative_to(ROOT)}: 找不到本頁 anchor #{parts.fragment}")
    if len(page.ids) != len(set(page.ids)):
        errors.append(f"{path.relative_to(ROOT)}: 頁面有重複 id")
    return page

try:
    data = json.loads((ROOT / "data/lessons.json").read_text(encoding="utf-8"))
    entries = data["lessons"]
except (OSError, ValueError, KeyError, TypeError) as exc:
    sys.exit(f"教材 JSON 無法讀取：{exc}")

ids = set()
orders = set()
paths = set()
for entry in entries:
    if set(entry) != {"id", "category", "title", "path", "order", "summary"}:
        errors.append(f"教材資料缺少／多出欄位：{entry}")
        continue
    name = entry["id"]
    category = entry["category"]
    path_text = entry["path"]
    if category not in CATEGORIES:
        errors.append(f"未知分類 {category}")
        continue
    if not name.startswith(CATEGORIES[category]) or not re.fullmatch(r"[a-z0-9-]+", name):
        errors.append(f"教材 id 不符命名規則 {name}")
    if name in ids:
        errors.append(f"重複教材 id {name}")
    ids.add(name)
    if (category, entry["order"]) in orders:
        errors.append(f"重複排序值 {category}/{entry['order']}")
    orders.add((category, entry["order"]))
    if path_text in paths:
        errors.append(f"重複路徑 {path_text}")
    paths.add(path_text)
    if not re.fullmatch(rf"lessons/{category}/[a-z0-9-]+\.html", path_text):
        errors.append(f"教材路徑不符合規則 {path_text}")
    path = ROOT / path_text
    if not path.exists():
        errors.append(f"教材頁不存在 {path_text}")
        continue
    doc = parse(path)
    if doc.lesson_id != name:
        errors.append(f"{path_text} data-lesson-id 不符合 JSON id")
    h1 = [v for tag, v in doc.headings if tag == "h1"]
    h2 = [v for tag, v in doc.headings if tag == "h2"]
    if h1 != [entry["title"]]:
        errors.append(f"{path_text} 頁面主標題不符合 JSON")
    if h2 != REQUIRED:
        errors.append(f"{path_text} 五段式標題或順序有誤：{h2}")
    for section in ["goals", "concept", "examples", "result", "practice"]:
        if section not in doc.ids:
            errors.append(f"{path_text} 缺少 #{section}")
parse(ROOT / "index.html")
for file in ["AGENTS.md", "README.md", "css/style.css", "js/main.js", "templates/lesson-template.html"]:
    if not (ROOT / file).is_file():
        errors.append(f"缺少必要檔案：{file}")
if errors:
    print("驗收失敗：")
    for error in errors:
        print(f"  ✗ {error}")
    sys.exit(1)
print(f"✓ 成功：{len(entries)} 篇教材，JSON、五段式結構、檔案與靜態連結皆通過檢查。")
