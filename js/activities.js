(function () {
  "use strict";

  var state = {
    lang: "zh",
    activities: [],
    filtered: [],
    map: null,
    routeLayers: {},
    loadingRoutes: {},
    markersLayer: null,
    activeId: null,
    pendingFocusId: null,
    elevationControl: null
  };

  var difficultyStyles = {
    easy: { color: "#3cae61", weight: 4, opacity: 0.9 },
    moderate: { color: "#d6962c", weight: 4, opacity: 0.9 },
    hard: { color: "#bb4b35", weight: 5, opacity: 0.95 }
  };

  var mapReady = false;

  var friendlyOrganizations = [
    { zh: "校联龙舟队", en: "Campus Dragon Boat Team" },
    { zh: "渥太华骑行俱乐部", en: "Ottawa Cycling Club" },
    { zh: "渥太华华人射击运动群", en: "Ottawa Chinese Shooting Sports Group" },
    { zh: "渥哈群", en: "Ottawa-Halifax Friends Group" },
    { zh: "渥太华鱼友会", en: "Ottawa Anglers Club" },
    { zh: "蒙特利尔徒步群", en: "Montreal Hiking Group" },
    { zh: "魁北克城徒步群", en: "Quebec City Hiking Group" },
    { zh: "乐水群", en: "Water Fun Community" }
  ];

  var ui = {
    cardsWrap: document.getElementById("activityCards"),
    stats: document.getElementById("resultStats"),
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
      lang: params.get("lang") || "zh"
    };
  }

  function syncQuery() {
    var params = new URLSearchParams();
    params.set("lang", state.lang);
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
        syncQuery();
      });
    });

    updateStaticText();
  }

  function updateStaticText() {
    function setTextIfExists(id, zh, en) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = t(zh, en);
      }
    }

    setTextIfExists("heroTitle", "渥太华华人徒步群 | 主页", "Ottawa Chinese Hiking Club | Home");
    setTextIfExists(
      "heroDesc",
      "像选购产品一样浏览活动：可按类型、月份、历史/未来筛选，查看轨迹、海拔和难度，再完成报名。",
      "Browse activities like products: filter by type, month, and timeline, then review route, elevation, and difficulty before signup."
    );
    setTextIfExists("chip1", "以走会友", "Walk, Connect, Belong");
    setTextIfExists("chip2", "道法自然", "Follow Nature");
    setTextIfExists("chip3", "放松身心", "Recharge Body and Mind");
    setTextIfExists("chip4", "返璞归真", "Return to Simplicity");

    document.querySelectorAll(".nav-links a[href='index.html'], .footer-links a[href='index.html']").forEach(function (el) {
      el.textContent = t("主页", "Home");
    });
    document.querySelectorAll(".nav-links a[href='history.html'], .footer-links a[href='history.html']").forEach(function (el) {
      el.textContent = t("历史活动", "History");
    });
    document.querySelectorAll(".nav-links a[href='disclaimer.html'], .footer-links a[href='disclaimer.html']").forEach(function (el) {
      el.textContent = t("免责声明", "Disclaimer");
    });
    document.querySelectorAll(".nav-links a[href='business.html'], .footer-links a[href='business.html']").forEach(function (el) {
      el.textContent = t("商业合作", "Business Partners");
    });

    setTextIfExists("clubTitle", "俱乐部介绍", "About The Club");
    setTextIfExists(
      "clubDesc1",
      "渥太华华人徒步群是一个面向华人社区的户外活动俱乐部，徒步群的活动并不局限于徒步。而是以徒步为主。同时也有划船、骑行等活动，强调安全、协作和长期体能建设。",
      "Ottawa Chinese Hiking Club serves the local Chinese community. While hiking is our core focus, we also organize paddling and cycling with an emphasis on safety, collaboration, and long-term fitness."
    );
    setTextIfExists(
      "clubDesc2",
      "我们通过领队分工、路线分级、出发前风险简报和活动后复盘来提升活动质量。欢迎不同经验水平成员参与，选择适合自己的活动强度。",
      "We improve event quality through leader roles, route grading, pre-trip risk briefings, and post-event reviews. Members of all experience levels are welcome to choose suitable intensity."
    );
    setTextIfExists(
      "clubBullet1",
      "组织结构：我群为松散组织，欢迎任何成员组织活动。 但是领队一定要谨慎评估风险，确保活动安全。",
      "Organization: We are a flexible community and welcome members to organize activities. Trip leaders must evaluate risk carefully and ensure activity safety."
    );
    setTextIfExists(
      "clubBullet2",
      "活动原则：尊重自然、团队互助、守时守约、自担风险。",
      "Principles: respect nature, support teammates, stay punctual, and take personal responsibility for risk."
    );
    setTextIfExists(
      "clubBullet3",
      "参与要求：具备基础自我照护能力，服从现场安全安排与天气调整。",
      "Requirement: basic self-care ability and compliance with on-site safety and weather adjustments."
    );

    setTextIfExists("joinTitle0", "谁可以加入?", "Who Can Join?");
    setTextIfExists("joinCondition", "需要满足以下条件：", "You should meet the following conditions:");
    setTextIfExists(
      "condition1",
      "渥太华及周边地区的使用中文的朋友，包括蒙特利尔和金士顿的华人",
      "Chinese-speaking friends in Ottawa and nearby areas, including Montreal and Kingston."
    );
    setTextIfExists("condition2", "有意愿参加群内的户外活动", "Willing to join outdoor activities in the group.");
    setTextIfExists("condition3", "遵守俱乐部规则和安全安排，尊重他人。", "Follow club rules and safety arrangements, and respect others.");

    setTextIfExists("joinTitle", "如何加入俱乐部", "How To Join The Club");
    var joinIntroEl = document.getElementById("joinIntro") || document.getElementById("joinIntro2");
    if (joinIntroEl) {
      joinIntroEl.textContent = t(
        "请注意：为了过滤广告和电诈，创造一个干净的群内环境。我们需要证明您在渥太华或者加拿大东部的证据（涉及隐私的部分可以打码）。网图、虚假定位都会导致您无法入群。",
        "To reduce spam and fraud and keep the group clean, we need proof that you are in Ottawa or Eastern Canada (private details can be blurred). Online images or fake location proof will lead to rejection."
      );
    }
    setTextIfExists("joinStep1",
      "阅读主页中的活动说明与免责声明，确认您能尊重他人并遵守基本的安全规则。",
      "Read the activity notes and disclaimer, and confirm you can respect others and follow basic safety rules."
    );
    setTextIfExists("joinStep2",
      "扫码添加任一管理员微信，备注“渥太华徒步群 + 姓名”。",
      "Scan either admin WeChat QR and add a note: \"Ottawa Outdoor Club + Your Name\"."
    );
    setTextIfExists("joinStep3",
      "通过简单审核后入群，按活动强度选择合适线路参与。",
      "After a short review, join the group and choose suitable routes based on activity intensity."
    );
    setTextIfExists("qrCaption1", "群主 赵宇彤", "Group Owner: Yutong Zhao");
    setTextIfExists("qrCaption2", "副群主 廖岩", "Deputy Group Owner: Liao Yan");

    setTextIfExists("disclaimerTitle", "免责声明与风险告知", "Legal Disclaimer And Risk Notice");
    setTextIfExists(
      "disclaimerLead",
      "本俱乐部为公益性非营利组织。户外活动存在固有风险，参与人需自行评估健康与技能条件，并自备必要装备与保险。",
      "The club is a public-benefit non-profit organization. Outdoor activities carry inherent risks, and participants must assess their own readiness and carry suitable equipment and insurance."
    );
    setTextIfExists(
      "disclaimerShort",
      "参与人同意自行承担活动风险，并同意详细责任条款以完整版免责声明为准。",
      "To the fullest extent permitted by law, participants assume activity risks and agree that detailed liability terms are governed by the full disclaimer."
    );
    setTextIfExists(
      "fullDisclaimerLink",
      "查看完整版免责声明",
      "Read Full Disclaimer"
    );
    setTextIfExists(
      "globalWaiverText",
      "我已阅读简短版，并同意完整版免责声明条款。",
      "I have read the short notice and agree to the full disclaimer terms."
    );
    setTextIfExists(
      "signupWaiverText",
      "我已阅读并同意完整版免责声明条款。",
      "I have read and agree to the full disclaimer terms."
    );

    setTextIfExists("featuredTitle", "近期未来活动", "Upcoming Featured Activities");
    setTextIfExists("mapTitle", "轨迹地图与海拔", "Route Map & Elevation");
    setTextIfExists("legendEasy", "简单", "Easy");
    setTextIfExists("legendModerate", "中等", "Moderate");
    setTextIfExists("legendHard", "困难", "Hard");

    setTextIfExists("teamTitle", "团队风采", "Meet The Team");
    setTextIfExists(
      "teamIntro",
      "以下是徒步群六位关键人物，维持群内的活动持续进行。",
      "Here are six key members who keep the club running and activities continuously moving."
    );

    setTextIfExists("member1Name", "赵宇彤", "Yutong Zhao");
    setTextIfExists("member1Role", "发起人 / 群主", "Founder / Group Owner");
    setTextIfExists(
      "member1Bio",
      "统筹全年活动计划与外部合作，负责跨季节路线策略和团队标准制定。",
      "Leads annual planning and external partnerships, and defines multi-season route strategy and team standards."
    );

    setTextIfExists("member2Name", "廖岩", "Liao Yan");
    setTextIfExists("member2Role", "副群主", "Deputy Group Owner");
    setTextIfExists(
      "member2Bio",
      "渥太华周边活动专家。",
      "Specialist in routes and activities around Ottawa."
    );

    setTextIfExists("member3Name", "安娜·任", "Anna Ren");
    setTextIfExists("member3Role", "精品徒步领队 | 龙舟队协调官", "Premium Hiking Lead | Dragon Boat Coordinator");
    setTextIfExists(
      "member3Bio",
      "负责一年一度的渥太华-卡尔顿区教育局私有徒步路线公众日的组织与协调。",
      "Organizes and coordinates the annual public open day for private hiking routes in the Ottawa-Carleton area school district."
    );

    setTextIfExists("member4Name", "斯蒂文·郭", "Steven Guo");
    setTextIfExists("member4Role", "高难度徒步领队", "Advanced Hiking Lead");
    setTextIfExists(
      "member4Bio",
      "",
      ""
    );

    setTextIfExists("member5Name", "王哥", "Wang Ge");
    setTextIfExists("member5Role", "狩猎专家", "Hunting Specialist");
    setTextIfExists(
      "member5Bio",
      "渥太华狩猎达人。",
      "Ottawa hunting expert."
    );

    setTextIfExists("member6Name", "张三", "Zhang San");
    setTextIfExists("member6Role", "法外狂徒", "Maverick");
    setTextIfExists(
      "member6Bio",
      "未来的组织者",
      "A future organizer."
    );

    setTextIfExists("friendlyOrgTitle", "友情组织", "Friendly Organizations");
    setTextIfExists(
      "friendlyOrgIntro",
      "感谢以下友情组织长期互动支持，我们保持开放协作，欢迎后续持续拓展。",
      "We appreciate the long-term support and collaboration from these partner communities. The list is open for future expansion."
    );
    setTextIfExists(
      "friendlyOrgNote",
      "扩展方式：在 js/activities.js 的 friendlyOrganizations 数组中新增一条即可自动展示。",
      "To extend: add one item to the friendlyOrganizations array in js/activities.js and it will render automatically."
    );

    renderFriendlyOrganizations();

  }

  function renderFriendlyOrganizations() {
    var wrap = document.getElementById("friendlyOrgList");
    if (!wrap) {
      return;
    }

    wrap.innerHTML = friendlyOrganizations.map(function (org) {
      var name = t(org.zh, org.en);
      return ""
        + "<article class=\"friendly-org-card\">"
        + "<h3>" + name + "</h3>"
        + "</article>";
    }).join("");
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

  function selectFeaturedFutureActivities() {
    var now = new Date();
    state.filtered = state.activities
      .filter(function (a) {
        var activityDate = new Date(a.date + "T00:00:00");
        return a.status === "future" && activityDate >= now;
      })
      .sort(function (a, b) {
        return new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00");
      })
      .slice(0, 3);

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
      ui.cardsWrap.innerHTML = "<div class=\"panel\" style=\"padding:16px;\">" + t("暂无未来活动，敬请关注后续发布。", "No upcoming activities at the moment.") + "</div>";
      ui.stats.textContent = t("当前展示：0 个未来活动", "Currently showing: 0 upcoming activities");
      return;
    }

    ui.stats.textContent = t("当前展示：", "Currently showing: ") + items.length + t(" 个未来活动（最多 3 个）", " upcoming activities (max 3)");

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

    state.filtered.forEach(function (a) {
      if (!a.gpxFile) {
        return;
      }
      loadRoute(a, false);
    });
  }

  function loadRoute(activity, centerWhenLoaded) {
    if (state.routeLayers[activity.id] || state.loadingRoutes[activity.id]) {
      return;
    }

    state.loadingRoutes[activity.id] = true;

    fetch("files/gpx/" + activity.gpxFile, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load GPX: " + res.status);
        }
        return res.text();
      })
      .then(function (xmlText) {
        var doc = new window.DOMParser().parseFromString(xmlText, "application/xml");
        var points = doc.getElementsByTagNameNS("*", "trkpt");
        if (!points || !points.length) {
          points = doc.getElementsByTagName("trkpt");
        }
        if (!points || !points.length) {
          throw new Error("No trkpt found in GPX");
        }

        var latlngs = [];
        for (var i = 0; i < points.length; i++) {
          var lat = parseFloat(points[i].getAttribute("lat"));
          var lon = parseFloat(points[i].getAttribute("lon"));
          if (!isNaN(lat) && !isNaN(lon)) {
            latlngs.push([lat, lon]);
          }
        }
        if (!latlngs.length) {
          throw new Error("No valid coordinates in GPX");
        }

        var style = difficultyStyles[activity.difficulty] || difficultyStyles.moderate;
        var layer = L.polyline(latlngs, style).addTo(state.map);
        state.routeLayers[activity.id] = layer;

        var bounds = layer.getBounds();
        if (bounds.isValid()) {
          L.marker(bounds.getCenter(), {
            title: state.lang === "zh" ? activity.titleZh : activity.titleEn
          })
            .bindPopup((state.lang === "zh" ? activity.titleZh : activity.titleEn) + "<br/>" + difficultyText(activity.difficulty))
            .addTo(state.markersLayer);

          if (centerWhenLoaded || state.pendingFocusId === activity.id) {
            highlightRoute(activity.id, false);
            state.pendingFocusId = null;
          } else if (state.activeId === activity.id) {
            highlightRoute(activity.id, true);
            updateElevationWithLayer(layer);
          }
        }
      })
      .catch(function (err) {
        console.error("GPX load failed", activity.id, err);
        showToast(t("轨迹加载失败，请检查 GPX 文件。", "Route loading failed. Please check the GPX file."));
      })
      .finally(function () {
        delete state.loadingRoutes[activity.id];
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
    state.activeId = activityId;

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
      var selected = state.activities.find(function (a) { return a.id === activityId; });
      if (selected && selected.gpxFile) {
        showToast(t("轨迹加载中，请稍候再试。", "Route is loading, please try again in a moment."));
      } else {
        showToast(t("该活动暂无 GPX 轨迹。", "No GPX route for this activity."));
      }
      return;
    }

    target.setStyle({ color: "#5b1d12", weight: 7, opacity: 1 });
    if (!keepMap) {
      state.map.fitBounds(target.getBounds().pad(0.25));
    }

    updateElevationWithLayer(target);

    document.querySelectorAll(".activity-card").forEach(function (card) {
      card.classList.toggle("highlight", card.getAttribute("data-id") === activityId);
    });
  }

  function focusActivity(activityId) {
    var activity = state.activities.find(function (item) { return item.id === activityId; });
    if (!activity || !activity.gpxFile) {
      showToast(t("该活动暂无 GPX 轨迹。", "No GPX route for this activity."));
      return;
    }

    state.pendingFocusId = activityId;
    if (state.routeLayers[activityId]) {
      highlightRoute(activityId, false);
      state.pendingFocusId = null;
      return;
    }

    loadRoute(activity, true);
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
    state.lang = query.lang === "en" ? "en" : "zh";
    ui.langBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === state.lang);
    });
  }

  function start() {
    applyInitialFiltersFromQuery();
    initLanguage(state.lang);
    bindSignupEvents();
    initMap();

    loadActivities()
      .then(function () {
        selectFeaturedFutureActivities();
      })
      .catch(function (err) {
        console.error(err);
        ui.cardsWrap.innerHTML = "<div class=\"panel\" style=\"padding:16px;\">" + t("活动数据加载失败，请稍后重试。", "Failed to load activity data.") + "</div>";
      });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
