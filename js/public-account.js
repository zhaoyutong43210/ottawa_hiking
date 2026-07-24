(function () {
  "use strict";

  var state = {
    lang: "zh",
    articles: []
  };

  var ui = {
    langBtns: document.querySelectorAll(".lang-btn"),
    heroTitle: document.getElementById("heroTitle"),
    heroDesc: document.getElementById("heroDesc"),
    channelTitle: document.getElementById("channelTitle"),
    channelDesc: document.getElementById("channelDesc"),
    channelHint: document.getElementById("channelHint"),
    articleTitle: document.getElementById("articleTitle"),
    articleDesc: document.getElementById("articleDesc"),
    articleGrid: document.getElementById("articleGrid")
  };

  function t(zh, en) {
    return state.lang === "zh" ? zh : en;
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadArticles() {
    return fetch("files/public-account-articles.json", { cache: "no-store" })
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error("Failed to load article list");
        }
        return resp.json();
      })
      .then(function (list) {
        state.articles = Array.isArray(list) ? list : [];
      });
  }

  function renderArticles() {
    if (!state.articles.length) {
      ui.articleGrid.innerHTML = "<p class=\"article-empty\">" + escapeHtml(t("文章列表加载失败或为空。", "Article list is empty or failed to load.")) + "</p>";
      return;
    }

    ui.articleGrid.innerHTML = state.articles.map(function (item) {
      var title = state.lang === "zh" ? item.titleZh : item.titleEn;
      var summary = state.lang === "zh" ? item.summaryZh : item.summaryEn;
      var articleUrl = item.url || "#";
      var linkLabel = t("阅读原文", "Read Article");
      return ""
        + "<article class=\"article-card\">"
        + "<p class=\"article-meta\">" + escapeHtml(item.date) + "</p>"
        + "<h3>" + escapeHtml(title) + "</h3>"
        + "<p>" + escapeHtml(summary) + "</p>"
        + "<a class=\"article-link\" href=\"" + escapeHtml(articleUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHtml(linkLabel) + "</a>"
        + "</article>";
    }).join("");
  }

  function render() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.title = t("渥太华华人徒步群 | 公众号", "Ottawa OCC | Public Account");

    ui.heroTitle.textContent = t("微信公众号：加拿大的心跳", "WeChat Public Account: Heartbeat of Canada");
    ui.heroDesc.textContent = t(
      "这里记录在加拿大的生活观察、户外体验和社群故事。欢迎关注，和我们一起看见日常里的心跳。",
      "This channel shares stories about life in Canada, outdoor moments, and community experiences. Follow along to capture the pulse of everyday life."
    );

    ui.channelTitle.textContent = t("关注渠道", "Follow Channel");
    ui.channelDesc.textContent = t(
      "点击二维码可查看大图，使用微信扫码关注公众号“加拿大的心跳”。",
      "Click the QR code to open a larger image, then scan in WeChat to follow Heartbeat of Canada."
    );
    ui.channelHint.textContent = t(
      "如果你是第一次来到本站，建议先阅读下方精选文章，再结合活动页面了解我们的社群文化。",
      "If this is your first time here, start with the featured articles below, then check activities to understand our community culture."
    );

    ui.articleTitle.textContent = t("精选文章目录", "Featured Article List");
    ui.articleDesc.textContent = t(
      "以下为公众号近期重点内容，方便新朋友快速了解主题方向。",
      "Recent highlights from the account to help new readers understand the main themes quickly."
    );

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
    document.querySelectorAll(".nav-links a[href='public-account.html'], .footer-links a[href='public-account.html']").forEach(function (el) {
      el.textContent = t("公众号", "Public Account");
    });
    document.querySelectorAll(".nav-links a[href='faq.html'], .footer-links a[href='faq.html']").forEach(function (el) {
      el.textContent = "FAQ";
    });

    renderArticles();
  }

  ui.langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.getAttribute("data-lang") === "en" ? "en" : "zh";
      ui.langBtns.forEach(function (item) { item.classList.remove("active"); });
      btn.classList.add("active");
      render();
    });
  });

  loadArticles()
    .then(render)
    .catch(function (err) {
      console.error(err);
      render();
    });
})();
