(function () {
  "use strict";

  var state = {
    lang: "zh",
    activities: [],
    filteredActivities: [],
    map: null,
    routeLayers: {},
    elevationControl: null,
    activeId: null
  };

  var styleByDifficulty = {
    easy: { color: "#3cae61", weight: 4, opacity: 0.9 },
    moderate: { color: "#d6962c", weight: 4, opacity: 0.92 },
    hard: { color: "#bb4b35", weight: 5, opacity: 0.95 }
  };

  var ui = {
    langBtns: document.querySelectorAll(".lang-btn"),
    cardsWrap: document.getElementById("historyCards"),
    catalogStats: document.getElementById("catalogStats"),
    typeFilter: document.getElementById("historyTypeFilter"),
    yearFilter: document.getElementById("historyYearFilter"),
    applyBtn: document.getElementById("historyApplyBtn"),
    resetBtn: document.getElementById("historyResetBtn"),
    expandAllBtn: document.getElementById("expandAllBtn"),
    collapseAllBtn: document.getElementById("collapseAllBtn"),
    toast: document.getElementById("toast")
  };

  function t(zh, en) {
    return state.lang === "zh" ? zh : en;
  }

  function typeText(type) {
    if (type === "walking") { return t("徒步", "Walking"); }
    if (type === "paddling") { return t("划船", "Paddling"); }
    if (type === "cycling") { return t("骑行", "Cycling"); }
    return type;
  }

  function difficultyText(level) {
    if (level === "easy") { return t("简单", "Easy"); }
    if (level === "moderate") { return t("中等", "Moderate"); }
    if (level === "hard") { return t("困难", "Hard"); }
    return level;
  }

  function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add("show");
    window.setTimeout(function () { ui.toast.classList.remove("show"); }, 2200);
  }

  function updateStaticText() {
    document.getElementById("heroTitle").textContent = t("历史活动档案", "Historical Activity Archive");
    document.getElementById("heroDesc").textContent = t(
      "该页面还在建设中。",
      "This page is under construction."
    );
    document.getElementById("catalogTitle").textContent = t("活动条目", "Activity Items");
    document.getElementById("filterTypeLabel").textContent = t("活动类型", "Activity Type");
    document.getElementById("filterYearLabel").textContent = t("年份", "Year");
    ui.applyBtn.textContent = t("应用筛选", "Apply");
    ui.resetBtn.textContent = t("重置", "Reset");
    ui.expandAllBtn.textContent = t("展开全部细节", "Expand All Details");
    ui.collapseAllBtn.textContent = t("收起全部细节", "Collapse All Details");
    document.getElementById("mapTitle").textContent = t("GPX 轨迹可视化", "GPX Route Visualization");
    document.getElementById("legendEasy").textContent = t("简单", "Easy");
    document.getElementById("legendModerate").textContent = t("中等", "Moderate");
    document.getElementById("legendHard").textContent = t("困难", "Hard");
    ui.catalogStats.textContent = t("筛选结果：", "Filtered: ") + state.filteredActivities.length + t(" / ", " / ") + state.activities.length + t(" 项历史活动", " historical activities");
  }

  function bindLanguage() {
    ui.langBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.lang = btn.getAttribute("data-lang") === "en" ? "en" : "zh";
        ui.langBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        updateStaticText();
        renderCards();
        refreshLayerPopups();
      });
    });
  }

  function applyFilters() {
    var type = ui.typeFilter.value;
    var year = ui.yearFilter.value;

    state.filteredActivities = state.activities.filter(function (a) {
      if (type !== "all" && a.type !== type) {
        return false;
      }
      if (year !== "all" && String(a.date).slice(0, 4) !== year) {
        return false;
      }
      return true;
    });

    renderCards();
    syncRouteVisibility();
    updateStaticText();
  }

  function resetFilters() {
    ui.typeFilter.value = "all";
    ui.yearFilter.value = "all";
    applyFilters();
  }

  function bindFilterActions() {
    ui.applyBtn.addEventListener("click", applyFilters);
    ui.resetBtn.addEventListener("click", resetFilters);
  }

  function bindExpandCollapseActions() {
    ui.expandAllBtn.addEventListener("click", function () {
      ui.cardsWrap.querySelectorAll("details.card-detail").forEach(function (d) {
        d.open = true;
      });
    });

    ui.collapseAllBtn.addEventListener("click", function () {
      ui.cardsWrap.querySelectorAll("details.card-detail").forEach(function (d) {
        d.open = false;
      });
    });
  }

  function hydrateYearFilter() {
    var years = {};
    state.activities.forEach(function (a) {
      years[String(a.date).slice(0, 4)] = true;
    });

    Object.keys(years).sort().reverse().forEach(function (y) {
      var opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      ui.yearFilter.appendChild(opt);
    });
  }

  function getHistorySheetCsvUrl() {
    var meta = document.querySelector('meta[name="history-sheet-csv-url"]');
    if (!meta) {
      return "";
    }
    return (meta.getAttribute("content") || "").trim();
  }

  function parseSheetUrlInfo(rawUrl) {
    var input = String(rawUrl || "").trim();
    if (!input) {
      return null;
    }

    var idMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      return {
        jsonUrl: input,
        csvUrl: input
      };
    }

    var sheetId = idMatch[1];
    var gid = "";
    var sheetName = "";

    try {
      var parsed = new URL(input);
      gid = parsed.searchParams.get("gid") || "";
      sheetName = parsed.searchParams.get("sheet") || "";
      if (!gid && parsed.hash) {
        var hashMatch = parsed.hash.match(/gid=(\d+)/);
        gid = hashMatch ? hashMatch[1] : "";
      }
    } catch (e) {
      gid = "";
      sheetName = "";
    }

    var queryParts = ["tqx=out:json"];
    var csvQueryParts = ["tqx=out:csv"];
    if (gid) {
      queryParts.push("gid=" + encodeURIComponent(gid));
      csvQueryParts.push("gid=" + encodeURIComponent(gid));
    }
    if (sheetName) {
      queryParts.push("sheet=" + encodeURIComponent(sheetName));
      csvQueryParts.push("sheet=" + encodeURIComponent(sheetName));
    }

    return {
      jsonUrl: "https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?" + queryParts.join("&"),
      csvUrl: "https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?" + csvQueryParts.join("&")
    };
  }

  function parseGoogleVisualizationJson(responseText) {
    var text = String(responseText || "").trim();
    var match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
    if (!match || !match[1]) {
      throw new Error("Invalid Google gviz response");
    }

    var payload = JSON.parse(match[1]);
    var table = payload && payload.table;
    if (!table || !Array.isArray(table.cols) || !Array.isArray(table.rows)) {
      throw new Error("Google gviz table is missing");
    }

    var headers = table.cols.map(function (col, idx) {
      var label = col && (col.label || col.id);
      return String(label || ("col" + idx)).trim();
    });

    var types = table.cols.map(function (col) {
      return col && col.type ? String(col.type) : "";
    });

    return table.rows.map(function (row) {
      var cells = (row && row.c) || [];
      var obj = {};
      headers.forEach(function (header, idx) {
        var cell = cells[idx];
        var value = "";
        if (cell) {
          if (types[idx] === "date" && cell.f) {
            value = cell.f;
          } else if (cell.v !== null && cell.v !== undefined) {
            value = cell.v;
          } else if (cell.f !== null && cell.f !== undefined) {
            value = cell.f;
          }
        }
        obj[header] = value === null || value === undefined ? "" : String(value);
      });
      return obj;
    });
  }

  function parseCsvLine(line) {
    var result = [];
    var current = "";
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }

    result.push(current);
    return result;
  }

  function parseCsvRows(csvText) {
    var text = String(csvText || "").replace(/^\uFEFF/, "").trim();
    if (!text) {
      return [];
    }

    var lines = text.split(/\r?\n/).filter(function (line) {
      return line.trim().length > 0;
    });
    if (!lines.length) {
      return [];
    }

    var headers = parseCsvLine(lines[0]).map(function (h) {
      return String(h || "").trim();
    });

    return lines.slice(1).map(function (line) {
      var cols = parseCsvLine(line);
      var row = {};

      headers.forEach(function (header, idx) {
        row[header] = (cols[idx] || "").trim();
      });

      return row;
    });
  }

  function normalizeHeaderKey(key) {
    return String(key || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  }

  function normalizeRecordKeys(record) {
    var normalized = {};
    Object.keys(record || {}).forEach(function (key) {
      normalized[normalizeHeaderKey(key)] = record[key];
    });
    return normalized;
  }

  function pickField(record, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = record[normalizeHeaderKey(keys[i])];
      if (v !== undefined && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
    return "";
  }

  function parseOptionalNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    var n = parseFloat(String(value).trim());
    return isFinite(n) ? n : null;
  }

  function parseDetailLines(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return String(item || "").trim();
      }).filter(function (item) {
        return item.length > 0;
      });
    }

    var text = String(value || "").trim();
    if (!text) {
      return [];
    }

    return text.split(/\|\||\r?\n/).map(function (item) {
      return String(item || "").trim();
    }).filter(function (item) {
      return item.length > 0;
    });
  }

  function buildHistoryActivity(rawRow, index) {
    var row = normalizeRecordKeys(rawRow);
    var detailZhRaw = rawRow && rawRow.detailZh !== undefined ? rawRow.detailZh : pickField(row, ["detailZh", "detailsZh"]);
    var detailEnRaw = rawRow && rawRow.detailEn !== undefined ? rawRow.detailEn : pickField(row, ["detailEn", "detailsEn"]);

    return {
      id: pickField(row, ["id"]) || ("history-" + (index + 1)),
      type: pickField(row, ["type"]) || "walking",
      date: pickField(row, ["date"]),
      difficulty: pickField(row, ["difficulty"]) || "moderate",
      distanceKm: parseOptionalNumber(pickField(row, ["distanceKm", "distance"])) || 0,
      elevationGainM: parseOptionalNumber(pickField(row, ["elevationGainM", "elevation", "elevationGain"])) || 0,
      participants: parseOptionalNumber(pickField(row, ["participants", "participantCount"])) || 0,
      locationZh: pickField(row, ["locationZh", "location"]),
      locationEn: pickField(row, ["locationEn", "locationEnglish", "locationEnUs"]),
      titleZh: pickField(row, ["titleZh", "title"]),
      titleEn: pickField(row, ["titleEn", "titleEnglish", "titleEnUs"]),
      summaryZh: pickField(row, ["summaryZh", "summary", "descriptionZh"]),
      summaryEn: pickField(row, ["summaryEn", "descriptionEn", "descriptionEnglish"]),
      detailZh: parseDetailLines(detailZhRaw),
      detailEn: parseDetailLines(detailEnRaw),
      gpxFile: pickField(row, ["gpxFile", "gpx", "routeGpx"])
    };
  }

  function isAbsoluteUrl(path) {
    return /^https?:\/\//i.test(path || "");
  }

  function resolveGpxUrl(activity) {
    if (!activity || !activity.gpxFile) {
      return "";
    }

    if (isAbsoluteUrl(activity.gpxFile)) {
      return activity.gpxFile;
    }

    return "files/gpx/" + activity.gpxFile;
  }

  function fetchSheetRowsFromJson(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load Google Sheet gviz JSON: " + res.status);
        }
        return res.text();
      })
      .then(parseGoogleVisualizationJson);
  }

  function fetchSheetRowsFromCsv(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load Google Sheet CSV: " + res.status);
        }
        return res.text();
      })
      .then(parseCsvRows);
  }

  function loadDataFromGoogleSheet() {
    var rawUrl = getHistorySheetCsvUrl();
    if (!rawUrl) {
      return Promise.reject(new Error("History Google Sheet URL is not configured"));
    }

    var urlInfo = parseSheetUrlInfo(rawUrl);
    if (!urlInfo) {
      return Promise.reject(new Error("History Google Sheet URL is invalid"));
    }

    return fetchSheetRowsFromJson(urlInfo.jsonUrl)
      .catch(function (jsonErr) {
        console.warn("History sheet JSON load failed, trying CSV.", jsonErr);
        return fetchSheetRowsFromCsv(urlInfo.csvUrl);
      })
      .then(function (rows) {
        if (!rows.length) {
          throw new Error("History sheet data is empty");
        }
        return rows.map(buildHistoryActivity).filter(function (a) {
          return !!(a.date && a.titleZh && a.titleEn);
        });
      });
  }

  function loadDataFromLocalJson() {
    return fetch("files/history-activities.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load history-activities.json");
        }
        return res.json();
      })
      .then(function (data) {
        return (data.activities || []).map(function (item, idx) {
          return buildHistoryActivity(item, idx);
        });
      });
  }

  function loadData() {
    return loadDataFromGoogleSheet()
      .catch(function (sheetErr) {
        console.warn("History sheet load failed, fallback to local JSON.", sheetErr);
        return loadDataFromLocalJson();
      })
      .then(function (items) {
        state.activities = items;
      });
  }

  function renderCards() {
    if (!state.filteredActivities.length) {
      ui.cardsWrap.innerHTML = "<div class=\"history-card\"><div class=\"card-head\">" + t("没有符合筛选条件的历史活动。", "No historical activities match the current filters.") + "</div></div>";
      return;
    }

    ui.cardsWrap.innerHTML = state.filteredActivities.map(function (a) {
      var title = state.lang === "zh" ? a.titleZh : a.titleEn;
      var summary = state.lang === "zh" ? a.summaryZh : a.summaryEn;
      var location = state.lang === "zh" ? a.locationZh : a.locationEn;
      var details = state.lang === "zh" ? (a.detailZh || []) : (a.detailEn || []);
      var detailsHtml = details.map(function (d) {
        return "<li>" + d + "</li>";
      }).join("");

      return ""
        + "<article class=\"history-card\" data-id=\"" + a.id + "\">"
        + "<div class=\"card-head\">"
        + "<div class=\"card-badges\">"
        + "<span class=\"badge\">" + typeText(a.type) + "</span>"
        + "<span class=\"badge " + a.difficulty + "\">" + difficultyText(a.difficulty) + "</span>"
        + "<span class=\"badge\">" + a.date + "</span>"
        + "</div>"
        + "<h3 class=\"card-title\">" + title + "</h3>"
        + "<p class=\"card-meta\">" + location + " | " + t("参与人数", "Participants") + ": " + a.participants + " | "
        + a.distanceKm + " km / +" + a.elevationGainM + " m</p>"
        + "<p class=\"card-meta\">" + summary + "</p>"
        + "<div class=\"card-actions\">"
        + "<button class=\"primary\" data-action=\"focus\" data-id=\"" + a.id + "\">" + t("地图查看", "Show On Map") + "</button>"
        + (a.gpxFile
          ? (isAbsoluteUrl(resolveGpxUrl(a))
            ? "<a href=\"" + resolveGpxUrl(a) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + t("下载 GPX", "Download GPX") + "</a>"
            : "<a href=\"" + resolveGpxUrl(a) + "\" download>" + t("下载 GPX", "Download GPX") + "</a>")
          : "<a href=\"#\" aria-disabled=\"true\">" + t("无轨迹", "No GPX") + "</a>")
        + "</div>"
        + "</div>"
        + "<details class=\"card-detail\">"
        + "<summary>" + t("下拉查看活动细节", "Expand Activity Details") + "</summary>"
        + "<div class=\"detail-content\">"
        + "<ul class=\"detail-list\">" + detailsHtml + "</ul>"
        + "</div>"
        + "</details>"
        + "</article>";
    }).join("");

    bindCardEvents();
  }

  function syncRouteVisibility() {
    var visibleIds = {};
    state.filteredActivities.forEach(function (a) {
      visibleIds[a.id] = true;
    });

    Object.keys(state.routeLayers).forEach(function (id) {
      var layer = state.routeLayers[id];
      var activity = state.activities.find(function (a) { return a.id === id; });
      if (!layer || !activity || !layer.setStyle) {
        return;
      }

      if (visibleIds[id]) {
        layer.setStyle(styleByDifficulty[activity.difficulty] || styleByDifficulty.moderate);
      } else {
        layer.setStyle({ color: "#bfbfbf", weight: 2, opacity: 0.08 });
      }
    });

    if (state.activeId && !visibleIds[state.activeId]) {
      state.activeId = null;
    }

    if (!state.activeId && state.filteredActivities.length) {
      var firstId = state.filteredActivities[0].id;
      emphasizeRoute(firstId, false);
    }
  }

  function bindCardEvents() {
    ui.cardsWrap.querySelectorAll("button[data-action='focus']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        focusActivity(btn.getAttribute("data-id"));
      });
    });
  }

  function initMap() {
    state.map = L.map("historyMap").setView([45.47, -75.75], 9);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    state.elevationControl = L.control.elevation({
      detached: true,
      elevationDiv: "historyElevation",
      theme: "steelblue-theme",
      height: 150,
      width: 520,
      distanceMarkers: false,
      summary: false,
      followMarker: false
    }).addTo(state.map);
  }

  function loadRoutes() {
    var loadedAny = false;

    state.activities.forEach(function (a) {
      if (!a.gpxFile) {
        return;
      }

      var route = new L.GPX(resolveGpxUrl(a), {
        async: true,
        marker_options: {
          startIconUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-icon-start.png",
          endIconUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-icon-end.png",
          shadowUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-shadow.png"
        },
        polyline_options: [styleByDifficulty[a.difficulty] || styleByDifficulty.moderate]
      });

      route.on("loaded", function (evt) {
        var layer = evt.target;
        state.routeLayers[a.id] = layer;
        bindPopup(a, layer);

        if (!loadedAny) {
          loadedAny = true;
          state.map.fitBounds(layer.getBounds().pad(0.2));
          state.activeId = a.id;
          highlightCard(a.id);
          updateElevation(layer);
          emphasizeRoute(a.id, true);
        }
      });

      route.addTo(state.map);
    });
  }

  function bindPopup(activity, layer) {
    var title = state.lang === "zh" ? activity.titleZh : activity.titleEn;
    layer.bindPopup(title + "<br/>" + difficultyText(activity.difficulty));
  }

  function refreshLayerPopups() {
    Object.keys(state.routeLayers).forEach(function (id) {
      var activity = state.activities.find(function (a) { return a.id === id; });
      var layer = state.routeLayers[id];
      if (!activity || !layer) {
        return;
      }
      bindPopup(activity, layer);
    });
  }

  function updateElevation(layer) {
    if (!state.elevationControl || !layer || !layer.toGeoJSON) {
      return;
    }
    if (state.elevationControl.clear) {
      state.elevationControl.clear();
    }
    state.elevationControl.addData(layer.toGeoJSON());
  }

  function emphasizeRoute(activityId, keepMap) {
    Object.keys(state.routeLayers).forEach(function (id) {
      var layer = state.routeLayers[id];
      var activity = state.activities.find(function (a) { return a.id === id; });
      var style = styleByDifficulty[(activity && activity.difficulty) || "moderate"];
      if (layer && layer.setStyle) {
        layer.setStyle(style);
      }
    });

    var target = state.routeLayers[activityId];
    if (!target || !target.setStyle) {
      showToast(t("该活动暂无 GPX 轨迹。", "This activity has no GPX route."));
      return;
    }

    target.setStyle({ color: "#5b1d12", weight: 7, opacity: 1 });
    if (!keepMap) {
      state.map.fitBounds(target.getBounds().pad(0.24));
    }

    updateElevation(target);
    state.activeId = activityId;
    highlightCard(activityId);
  }

  function highlightCard(id) {
    document.querySelectorAll(".history-card").forEach(function (card) {
      card.classList.toggle("active", card.getAttribute("data-id") === id);
    });
  }

  function focusActivity(id) {
    var existsInFiltered = state.filteredActivities.some(function (a) { return a.id === id; });
    if (!existsInFiltered) {
      showToast(t("该活动当前不在筛选结果中。", "This activity is not in current filter results."));
      return;
    }
    emphasizeRoute(id, false);
  }

  function start() {
    bindLanguage();
    bindFilterActions();
    bindExpandCollapseActions();
    initMap();

    loadData()
      .then(function () {
        hydrateYearFilter();
        state.filteredActivities = state.activities.slice();
        updateStaticText();
        renderCards();
        loadRoutes();
      })
      .catch(function (err) {
        console.error(err);
        ui.cardsWrap.innerHTML = "<div class=\"history-card\"><div class=\"card-head\">" + t("历史活动数据加载失败。", "Failed to load history activity data.") + "</div></div>";
      });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
