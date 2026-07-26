# 2026 漫博免費好禮地圖

台灣 2026 漫畫博覽會「免費好禮地圖」網站，在地圖上標示哪些攤位有免費獎品可拿。

## 功能

- 綠色 = 免費拿取（無條件）
- 黃色 = 有條件免費拿取（集章、訂閱等）
- 灰色 = 無免費內容或未更新
- 點擊攤位可查看/編輯獎品資訊
- 免登入、可匿名編輯
- 手機優先，支援縮放地圖

## 技術棧

- 前端：Vite + Vue 3 + TypeScript + Tailwind CSS
- 後端：Supabase（Postgres + RLS + Edge Functions）
- 部署：GitHub Pages

## 開發

```bash
npm install
npm run dev
```

## 部署

1. 在 GitHub repo Settings → Pages → Source 選擇「GitHub Actions」
2. 在 repo Settings → Secrets and variables → Actions 加入：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. push 到 `main` 會自動部署

## 攤位標記工具

開啟 `tools/annotate.html` 可直接在瀏覽器中框選地圖攤位，匯出 JSON 後匯入 Supabase `booths` 表。

## 授權

本專案為粉絲創作，開源供大家使用。
