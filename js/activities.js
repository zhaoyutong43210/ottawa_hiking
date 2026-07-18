(function () {
  "use strict";

  var state = {
    lang: "zh",
    activities: [],
    filtered: [],
    map: null,
    routeLayers: {},
    markersLayer: null,
    activeId: null,
    elevationControl: null
  };

  var difficultyStyles = {
    easy: { color: "#3cae61", weight: 4, opacity: 0.9 },
    moderate: { color: "#d6962c", weight: 4, opacity: 0.9 },
    hard: { color: "#bb4b35", weight: 5, opacity: 0.95 }
  };

  var mapReady = false;

  var ui = {
    cardsWrap: document.getElementById("activityCards"),
    stats: document.getElementById("resultStats"),
    typeFilter: document.getElementById("typeFilter"),
    timeFilter: document.getElementById("timeFilter"),
    monthFilter: document.getElementById("monthFilter"),
    seatFilter: document.getElementById("seatFilter"),
    applyBtn: document.getElementById("applyFilterBtn"),
    resetBtn: document.getElementById("resetFilterBtn"),
    langBtns: document.querySelectorAll(".lang-btn"),
    signupDialog: document.getElementById("signupDialog"),
    signupTitle: document.getElementById("signupTitle"),
    signupForm: document.getElementById("signupForm"),
    signupActivityId: document.getElementById("signupActivityId"),
    globalWaiverAck: document.getElementById("globalWaiverAck"),
    signupWaiverAck: document.getElementById("signupWaiverAck"),
    closeSignupBtn: document.getElementById("closeSignupBtn"),
    cancelSignupBtn: document.getElementById("cancelSignupBtn"),
    toast: document.getElementById("toast")
  };

  function t(zh, en) {
    return state.lang === "zh" ? zh : en;
  }

  function getQueryState() {
    var params = new URLSearchParams(window.location.search);
    return {
      lang: params.get("lang") || "zh",
      type: params.get("type") || "all",
      time: params.get("time") || "all",
      month: params.get("month") || "all",
      seats: params.get("seats") || "all"
    };
  }

  function syncQuery(filters) {
    var params = new URLSearchParams();
    params.set("lang", state.lang);
    if (filters.type !== "all") { params.set("type", filters.type); }
    if (filters.time !== "all") { params.set("time", filters.time); }
    if (filters.month !== "all") { params.set("month", filters.month); }
    if (filters.seats !== "all") { params.set("seats", filters.seats); }
    var newUrl = window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newUrl);
  }

  function initLanguage(initial) {
    state.lang = initial === "en" ? "en" : "zh";
    ui.langBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === state.lang);
      btn.addEventListener("click", function () {
        state.lang = btn.getAttribute("data-lang");
        ui.langBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderCards(state.filtered);
        updateStaticText();
        syncQuery(currentFilters());
      });
    });

    updateStaticText();
  }

  function updateStaticText() {
    document.getElementById("heroTitle").textContent = t("渥太华华人徒步群 | 活动主页", "Ottawa Chinese Outdoor Club | Activities");
    document.getElementById("heroDesc").textContent = t(
      "像选购产品一样浏览活动：可按类型、月份、历史/未来筛选，查看轨迹、海拔和难度，再完成报名。",
      "Browse activities like products: filter by type, month, and time, then review route, elevation, and difficulty before signup."
    );
    document.getElementById("chip1").textContent = t("默认中文", "Chinese First");
    document.getElementById("chip2").textContent = t("库存席位", "Seat Inventory");
    document.getElementById("chip3").textContent = t("GPX 轨迹", "GPX Routes");
    document.getElementById("chip4").textContent = t("海拔剖面", "Elevation Profile");

    document.getElementById("clubTitle").textContent = t("俱乐部介绍", "About The Club");
    document.getElementById("clubDesc1").textContent = t(
      "渥太华华人徒步群是一个面向华人社区的户外活动俱乐部，组织徒步、划船、骑行等活动，强调安全、协作和长期体能建设。",
      "Ottawa Chinese Outdoor Club organizes walking, paddling, and cycling events for the community with a focus on safety, teamwork, and long-term fitness."
    );
    document.getElementById("clubDesc2").textContent = t(
      "我们通过领队分工、路线分级、出发前风险简报和活动后复盘来提升活动质量。欢迎不同经验水平成员参与，选择适合自己的活动强度。",
      "Our structure uses route grading, pre-trip briefings, and post-event reviews so members of different experience levels can choose the right intensity."
    );
    document.getElementById("clubBullet1").textContent = t(
      "组织结构：发起人、活动领队、安全协助、后勤与新人成员支持。",
      "Team structure: organizers, trip leaders, safety support, logistics, and newcomer support."
    );
    document.getElementById("clubBullet2").textContent = t(
      "活动原则：尊重自然、团队互助、守时守约、风险透明。",
      "Principles: respect nature, support each other, stay punctual, and keep risk communication transparent."
    );
    document.getElementById("clubBullet3").textContent = t(
      "参与要求：具备基础自我照护能力，服从现场安全安排与天气调整。",
      "Participation requirement: basic self-care ability and compliance with on-site safety and weather decisions."
    );

    document.getElementById("joinTitle").textContent = t("如何加入俱乐部", "How To Join The Club");
    document.getElementById("joinIntro").textContent = t(
      "欢迎新成员加入。你可以先阅读活动与免责声明，再通过微信联系管理员完成入群与审核。",
      "New members are welcome. Please review activities and the disclaimer first, then contact an admin via WeChat for onboarding."
    );
    document.getElementById("joinStep1").textContent = t(
      "阅读主页中的活动说明与免责声明，确认你能遵守安全与团队规则。",
      "Read the activity notes and disclaimer, and confirm you can follow safety and team rules."
    );
    document.getElementById("joinStep2").textContent = t(
      "扫码添加任一管理员微信，备注“渥太华徒步群 + 姓名”。",
      "Scan either admin WeChat QR and add a note: \"Ottawa Outdoor Club + Your Name\"."
    );
    document.getElementById("joinStep3").textContent = t(
      "通过简单审核后入群，按活动强度选择合适线路参与。",
      "After a short review, join the group and choose suitable routes based on activity intensity."
    );
    document.getElementById("qrPlaceholder1").textContent = t("微信二维码位置 1", "WeChat QR Slot 1");
    document.getElementById("qrCaption1").textContent = t("管理员 A（新成员咨询）", "Admin A (New Member Questions)");
    document.getElementById("qrPlaceholder2").textContent = t("微信二维码位置 2", "WeChat QR Slot 2");
    document.getElementById("qrCaption2").textContent = t("管理员 B（活动报名咨询）", "Admin B (Activity Signup Help)");

    document.getElementById("disclaimerTitle").textContent = t("免责声明与风险告知", "Legal Disclaimer And Risk Notice");
    document.getElementById("disclaimerLead").textContent = t(
      "本俱乐部为公益性非营利组织。户外活动存在固有风险，参与人需自行评估健康与技能条件，并自备必要装备与保险。",
      "The club is a public-benefit non-profit organization. Outdoor activities carry inherent risks, and participants must assess their own readiness and carry suitable equipment and insurance."
    );
    document.getElementById("disclaimerShort").textContent = t(
      "在法律允许的最大范围内，参与人同意自行承担活动风险，并同意详细责任条款以完整版免责声明为准。",
      "To the fullest extent permitted by law, participants assume activity risks and agree that detailed liability terms are governed by the full disclaimer."
    );
    document.getElementById("fullDisclaimerLink").textContent = t(
      "查看完整版免责声明",
      "Read Full Disclaimer"
    );
    document.getElementById("globalWaiverText").textContent = t(
      "我已阅读简短版，并同意完整版免责声明条款。",
      "I have read the short notice and agree to the full disclaimer terms."
    );
    document.getElementById("signupWaiverText").textContent = t(
      "我已阅读并同意完整版免责声明条款。",
      "I have read and agree to the full disclaimer terms."
    );

    document.getElementById("labelType").textContent = t("活动类型", "Activity Type");
    document.getElementById("labelTime").textContent = t("时间维度", "Time Window");
    document.getElementById("labelMonth").textContent = t("活动月份", "Month");
    document.getElementById("labelSeats").textContent = t("席位状态", "Seat Status");
    ui.applyBtn.textContent = t("应用筛选", "Apply");
    ui.resetBtn.textContent = t("重置", "Reset");
    document.getElementById("mapTitle").textContent = t("轨迹地图与海拔", "Route Map & Elevation");
    document.getElementById("legendEasy").textContent = t("简单", "Easy");
    document.getElementById("legendModerate").textContent = t("中等", "Moderate");
    document.getElementById("legendHard").textContent = t("困难", "Hard");

    document.getElementById("teamTitle").textContent = t("团队风采", "Meet The Team");
    document.getElementById("teamIntro").textContent = t(
      "以下是俱乐部六位关键人物，分别负责组织运营、安全、训练、路线和社区协作。",
      "These six key members lead operations, safety, training, route design, and community support."
    );

    document.getElementById("member1Name").textContent = t("赵林", "Lin Zhao");
    document.getElementById("member1Role").textContent = t("发起人 / 总协调", "Founder / General Coordinator");
    document.getElementById("member1Bio").textContent = t(
      "统筹全年活动计划与外部合作，负责跨季节路线策略和团队标准制定。",
      "Leads annual planning and external partnerships, and defines multi-season route strategy and team standards."
    );

    document.getElementById("member2Name").textContent = t("陈雨", "Yu Chen");
    document.getElementById("member2Role").textContent = t("安全官", "Safety Officer");
    document.getElementById("member2Bio").textContent = t(
      "负责风险评估、天气窗口判断、出发前安全简报与应急流程维护。",
      "Handles risk assessment, weather-window decisions, pre-trip briefings, and emergency workflow maintenance."
    );

    document.getElementById("member3Name").textContent = t("王磊", "Lei Wang");
    document.getElementById("member3Role").textContent = t("徒步领队", "Hiking Lead");
    document.getElementById("member3Bio").textContent = t(
      "擅长山脊线与林线穿越活动，负责徒步分级路线设计与节奏控制。",
      "Specializes in ridge and treeline routes, responsible for graded hiking design and pacing control."
    );

    document.getElementById("member4Name").textContent = t("刘敏", "Min Liu");
    document.getElementById("member4Role").textContent = t("划船领队", "Paddling Lead");
    document.getElementById("member4Bio").textContent = t(
      "负责水域活动编队训练、通信口令规范和逆流段技术指导。",
      "Leads water-team formation drills, communication commands, and upstream technique guidance."
    );

    document.getElementById("member5Name").textContent = t("孙浩", "Hao Sun");
    document.getElementById("member5Role").textContent = t("骑行教练", "Cycling Coach");
    document.getElementById("member5Bio").textContent = t(
      "负责骑行线路踏勘、队列纪律训练和新人骑行技术提升。",
      "Responsible for route scouting, formation discipline, and skills improvement for new riders."
    );

    document.getElementById("member6Name").textContent = t("李佳", "Jia Li");
    document.getElementById("member6Role").textContent = t("社区与后勤", "Community & Logistics");
    document.getElementById("member6Bio").textContent = t(
      "负责新成员接待、活动摄影记录、补给协调与社群沟通支持。",
      "Manages newcomer onboarding, photo records, supply coordination, and community communications."
    );
  }

  function loadActivities() {
    return fetch("files/activities.json")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load activities.json");
        }
        return res.json();
      })
      .then(function (data) {
        state.activities = (data.activities || []).map(function (a) {
          a.month = String(a.date).slice(5, 7);
          return a;
        });
      });
  }

  function currentFilters() {
    return {
      type: ui.typeFilter.value,
      time: ui.timeFilter.value,
      month: ui.monthFilter.value,
      seats: ui.seatFilter.value
    };
  }

  function applyFilters() {
    var f = currentFilters();
    var now = new Date();

    state.filtered = state.activities.filter(function (a) {
      if (f.type !== "all" && a.type !== f.type) {
        return false;
      }

      if (f.time !== "all") {
        var isFuture = new Date(a.date + "T00:00:00") >= now;
        if (f.time === "future" && !isFuture) {
          return false;
        }
        if (f.time === "past" && isFuture) {
          return false;
        }
      }

      if (f.month !== "all" && a.month !== f.month) {
        return false;
      }

      if (f.seats === "available" && a.seatsLeft <= 0) {
        return false;
      }
      if (f.seats === "full" && a.seatsLeft > 0) {
        return false;
      }

      return true;
    });

    syncQuery(f);
    renderCards(state.filtered);
    refreshMapLayers();
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

  function statusText(a) {
    return a.status === "future" ? t("未来活动", "Upcoming") : t("历史活动", "Past Event");
  }

  function renderCards(items) {
    if (!items.length) {
      ui.cardsWrap.innerHTML = "<div class=\"panel\" style=\"padding:16px;\">" + t("没有符合条件的活动。", "No activities match your filters.") + "</div>";
      ui.stats.textContent = t("筛选结果：0 个活动", "Results: 0 activities");
      return;
    }

    ui.stats.textContent = t("筛选结果：", "Results: ") + items.length + t(" 个活动", " activities");

    ui.cardsWrap.innerHTML = items.map(function (a) {
      var title = state.lang === "zh" ? a.titleZh : a.titleEn;
      var summary = state.lang === "zh" ? a.summaryZh : a.summaryEn;
      var location = state.lang === "zh" ? a.locationZh : a.locationEn;
      var seatsText = a.seatsLeft > 0
        ? t("剩余席位", "Seats Left") + ": " + a.seatsLeft + "/" + a.capacity
        : t("席位已满", "Full") + " (" + a.capacity + ")";

      return ""
        + "<article class=\"activity-card\" data-id=\"" + a.id + "\">"
        + "<div class=\"card-top\">"
        + "<span class=\"badge\">" + typeText(a.type) + "</span>"
        + "<span class=\"badge " + a.difficulty + "\">" + difficultyText(a.difficulty) + "</span>"
        + "<span class=\"badge\">" + statusText(a) + "</span>"
        + "</div>"
        + "<h3 class=\"card-title\">" + title + "</h3>"
        + "<p class=\"card-sub\">" + summary + "</p>"
        + "<div class=\"card-meta\">"
        + "<div>" + t("日期", "Date") + ": " + a.date + "</div>"
        + "<div>" + t("地点", "Location") + ": " + location + "</div>"
        + "<div>" + t("里程", "Distance") + ": " + a.distanceKm + " km</div>"
        + "<div>" + t("累计爬升", "Elevation Gain") + ": " + a.elevationGainM + " m</div>"
        + "</div>"
        + "<div class=\"card-meta\">"
        + "<div>" + seatsText + "</div>"
        + "<div>" + t("轨迹", "Route") + ": " + (a.gpxFile ? t("可查看", "Available") : t("整理中", "Pending")) + "</div>"
        + "</div>"
        + "<div class=\"card-actions\">"
        + "<button class=\"primary\" data-action=\"signup\" data-id=\"" + a.id + "\">" + t("报名", "Sign Up") + "</button>"
        + "<button data-action=\"focus\" data-id=\"" + a.id + "\">" + t("查看轨迹", "Focus Route") + "</button>"
        + (a.gpxFile
            ? "<a href=\"files/gpx/" + a.gpxFile + "\" download>" + t("下载 GPX", "Download GPX") + "</a>"
            : "<a href=\"#\" aria-disabled=\"true\">" + t("轨迹整理中", "Route Pending") + "</a>")
        + "</div>"
        + "</article>";
    }).join("");

    bindCardEvents();
  }

  function bindCardEvents() {
    var wrap = ui.cardsWrap;
    wrap.querySelectorAll("button[data-action='focus']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        focusActivity(btn.getAttribute("data-id"));
      });
    });

    wrap.querySelectorAll("button[data-action='signup']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSignup(btn.getAttribute("data-id"));
      });
    });
  }

  function initMap() {
    state.map = L.map("activityMap", { worldCopyJump: false }).setView([45.4215, -75.6972], 9);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    state.markersLayer = L.layerGroup().addTo(state.map);

    // Leaflet Elevation works best as a map control area. We keep one instance and clear data when switching routes.
    state.elevationControl = L.control.elevation({
      detached: true,
      elevationDiv: "elevationChart",
      theme: "steelblue-theme",
      height: 150,
      width: 520,
      margins: { top: 10, right: 20, bottom: 30, left: 45 },
      distanceMarkers: false,
      summary: false,
      followMarker: false
    }).addTo(state.map);

    mapReady = true;
  }

  function clearRouteLayers() {
    Object.keys(state.routeLayers).forEach(function (k) {
      state.map.removeLayer(state.routeLayers[k]);
    });
    state.routeLayers = {};
    state.markersLayer.clearLayers();
    if (state.elevationControl && state.elevationControl.clear) {
      state.elevationControl.clear();
    }
  }

  function refreshMapLayers() {
    if (!mapReady) {
      return;
    }

    clearRouteLayers();
    var bounds = [];

    state.filtered.forEach(function (a) {
      if (!a.gpxFile) {
        return;
      }
      var style = difficultyStyles[a.difficulty] || difficultyStyles.moderate;
      var gpx = new L.GPX("files/gpx/" + a.gpxFile, {
        async: true,
        marker_options: {
          startIconUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-icon-start.png",
          endIconUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-icon-end.png",
          shadowUrl: "https://unpkg.com/leaflet-gpx@2.1.2/pin-shadow.png"
        },
        polyline_options: [style]
      });

      gpx.on("loaded", function (evt) {
        var layer = evt.target;
        state.routeLayers[a.id] = layer;

        var center = layer.getBounds().getCenter();
        L.marker(center, {
          title: state.lang === "zh" ? a.titleZh : a.titleEn
        })
          .bindPopup((state.lang === "zh" ? a.titleZh : a.titleEn) + "<br/>" + difficultyText(a.difficulty))
          .addTo(state.markersLayer);

        bounds.push(layer.getBounds());
        if (bounds.length === 1) {
          state.map.fitBounds(layer.getBounds().pad(0.2));
        }

        if (state.activeId === a.id) {
          highlightRoute(a.id, true);
          updateElevationWithLayer(layer);
        }
      });

      gpx.addTo(state.map);
    });
  }

  function updateElevationWithLayer(layer) {
    if (!state.elevationControl || !layer || !layer.toGeoJSON) {
      return;
    }

    if (state.elevationControl.clear) {
      state.elevationControl.clear();
    }

    var geo = layer.toGeoJSON();
    if (!geo) {
      return;
    }

    state.elevationControl.addData(geo);
  }

  function highlightRoute(activityId, keepMap) {
    Object.keys(state.routeLayers).forEach(function (id) {
      var layer = state.routeLayers[id];
      var activity = state.activities.find(function (a) { return a.id === id; });
      if (!activity || !layer.setStyle) {
        return;
      }
      var baseStyle = difficultyStyles[activity.difficulty] || difficultyStyles.moderate;
      layer.setStyle(baseStyle);
    });

    var target = state.routeLayers[activityId];
    if (!target || !target.setStyle) {
      showToast(t("该活动暂无 GPX 轨迹。", "No GPX route for this activity."));
      return;
    }

    target.setStyle({ color: "#5b1d12", weight: 7, opacity: 1 });
    if (!keepMap) {
      state.map.fitBounds(target.getBounds().pad(0.25));
    }

    updateElevationWithLayer(target);

    state.activeId = activityId;
    document.querySelectorAll(".activity-card").forEach(function (card) {
      card.classList.toggle("highlight", card.getAttribute("data-id") === activityId);
    });
  }

  function focusActivity(activityId) {
    highlightRoute(activityId, false);
  }

  function openSignup(activityId) {
    if (ui.globalWaiverAck && !ui.globalWaiverAck.checked) {
      showToast(t("请先阅读并勾选同意（可点击查看完整版免责声明）。", "Please review and acknowledge the notice (full disclaimer link available)."));
      var disclaimer = document.getElementById("legalDisclaimer");
      if (disclaimer) {
        disclaimer.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    var activity = state.activities.find(function (a) { return a.id === activityId; });
    if (!activity) {
      return;
    }

    ui.signupActivityId.value = activity.id;
    ui.signupTitle.textContent = t("报名：", "Signup: ") + (state.lang === "zh" ? activity.titleZh : activity.titleEn);

    if (typeof ui.signupDialog.showModal === "function") {
      ui.signupDialog.showModal();
    } else {
      ui.signupDialog.setAttribute("open", "open");
    }
  }

  function closeSignup() {
    if (typeof ui.signupDialog.close === "function") {
      ui.signupDialog.close();
    } else {
      ui.signupDialog.removeAttribute("open");
    }
    ui.signupForm.reset();
  }

  function validateSignup(formData) {
    if (!formData.get("name").trim()) {
      return t("请填写姓名。", "Please enter your name.");
    }
    if (!formData.get("contact").trim()) {
      return t("请填写联系方式。", "Please enter your contact.");
    }
    if (!formData.get("waiverAck")) {
      return t("请先同意完整版免责声明条款。", "Please agree to the full disclaimer terms.");
    }
    return "";
  }

  function showToast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add("show");
    window.setTimeout(function () {
      ui.toast.classList.remove("show");
    }, 2200);
  }

  function bindFilterEvents() {
    ui.applyBtn.addEventListener("click", applyFilters);

    ui.resetBtn.addEventListener("click", function () {
      ui.typeFilter.value = "all";
      ui.timeFilter.value = "all";
      ui.monthFilter.value = "all";
      ui.seatFilter.value = "all";
      applyFilters();
    });
  }

  function bindSignupEvents() {
    ui.closeSignupBtn.addEventListener("click", closeSignup);
    ui.cancelSignupBtn.addEventListener("click", closeSignup);

    ui.signupForm.addEventListener("submit", function (evt) {
      evt.preventDefault();
      var formData = new FormData(ui.signupForm);
      var err = validateSignup(formData);
      if (err) {
        showToast(err);
        return;
      }

      // Frontend placeholder: keep payload available for future API integration.
      var payload = {
        activityId: formData.get("activityId"),
        name: formData.get("name"),
        contact: formData.get("contact"),
        note: formData.get("note")
      };
      console.log("Signup payload", payload);

      showToast(t("报名信息已记录（演示版）。", "Signup recorded (demo mode)."));
      closeSignup();
    });
  }

  function applyInitialFiltersFromQuery() {
    var query = getQueryState();
    ui.typeFilter.value = query.type;
    ui.timeFilter.value = query.time;
    ui.monthFilter.value = query.month;
    ui.seatFilter.value = query.seats;
    state.lang = query.lang === "en" ? "en" : "zh";
    ui.langBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === state.lang);
    });
  }

  function hydrateMonthSelect() {
    var months = {};
    state.activities.forEach(function (a) {
      months[a.month] = true;
    });

    var sorted = Object.keys(months).sort();
    sorted.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      ui.monthFilter.appendChild(opt);
    });
  }

  function start() {
    applyInitialFiltersFromQuery();
    initLanguage(state.lang);
    bindFilterEvents();
    bindSignupEvents();
    initMap();

    loadActivities()
      .then(function () {
        hydrateMonthSelect();
        applyInitialFiltersFromQuery();
        applyFilters();
      })
      .catch(function (err) {
        console.error(err);
        ui.cardsWrap.innerHTML = "<div class=\"panel\" style=\"padding:16px;\">" + t("活动数据加载失败，请稍后重试。", "Failed to load activity data.") + "</div>";
      });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
