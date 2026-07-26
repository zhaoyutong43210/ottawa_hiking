# Google Sheet 活动数据接入说明

本项目已支持从 Google Sheet 加载活动数据。

## 1. 代码已完成的能力

- 首页会优先读取 Google Sheet 的 CSV 数据。
- 如果 Google Sheet 配置为空或请求失败，会自动回退到本地 `files/activities.json`。
- 每次刷新首页都会重新请求（`cache: no-store`），确保尽可能拿到最新活动。

## 2. Google Sheet 表头要求

请在 Google Sheet 第一行使用以下表头（建议完全一致）：

id,type,status,date,difficulty,capacity,seatsLeft,distanceKm,elevationGainM,locationZh,locationEn,titleZh,titleEn,summaryZh,summaryEn,gpxFile,lat,lng

说明：
- `date` 格式建议 `YYYY-MM-DD`
- `capacity` 可填 `unlimited` 或数字
- `gpxFile` 可填本地文件名（如 `walk.gpx`）或完整 URL
- `lat/lng` 可留空；点位活动可填写经纬度

## 3. 从现有 JSON 转入 Google Sheet

1. 打开 `files/activities-sheet-template.csv`。
2. 将内容复制到 Google Sheet（或导入 CSV）。
3. 检查中文/英文字段是否完整。

## 4. 发布 Google Sheet 为 CSV

1. 在 Google Sheet 点击 `文件 -> 共享 -> 发布到网络`。
2. 选择包含活动数据的工作表（例如 `activities`）。
3. 格式选择 `CSV`，点击发布。
4. 复制发布后的 CSV 链接。

常见链接形态（示例）：

`https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=activities`

## 5. 在页面中配置 URL

编辑 `index.html` 头部的 meta：

```html
<meta name="activities-sheet-csv-url" content="你的 Google Sheet CSV URL" />
```

保存并刷新首页后，活动数据将来自 Google Sheet。

## 6. 验证是否生效

- 修改 Google Sheet 中某个活动标题
- 刷新首页
- 若首页立刻显示新标题，说明已接入成功

## 7. 故障排查

- 页面仍是旧数据：检查是否真的配置了 `activities-sheet-csv-url`
- 加载失败：确认 Sheet 已“发布到网络”，且链接是 CSV 链接
- 字段缺失：检查表头是否拼写一致
- 若 Google Sheet 暂时不可访问，页面会自动使用本地 JSON 继续运行
