(function () {
  "use strict";

  var state = { lang: "zh" };
  var langBtns = document.querySelectorAll(".lang-btn");

  function t(zh, en) {
    return state.lang === "zh" ? zh : en;
  }

  function setText(id, zh, en) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = t(zh, en);
    }
  }

  function render() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.title = t("渥太华华人徒步群 | FAQ", "Ottawa OCC | FAQ");

    setText("faqTitle", "常见问题 FAQ", "Frequently Asked Questions");
    setText(
      "faqIntro",
      "以下问题覆盖新成员最常咨询的事项。若仍有疑问，可通过主页管理员二维码联系沟通。",
      "These answers cover the most common questions from new members. If you still need help, contact an admin via the QR codes on the home page."
    );

    setText("faqQ1", "如何判断自己适合哪类活动？", "How do I choose the right activity level?");
    setText(
      "faqA1",
      "建议先看活动页的难度、里程和爬升。新手可优先选择“简单”并控制在 8-12 公里以内，再逐步提升强度。",
      "Start with the activity difficulty, distance, and elevation gain. Beginners should prioritize Easy routes and keep distance around 8-12 km before progressing."
    );

    setText("faqQ2", "报名后多久会收到集合信息？", "How soon do I receive meetup details after signup?");
    setText(
      "faqA2",
      "通常在活动前 24-48 小时由领队统一发布集合时间、停车点和注意事项，请留意群内通知。",
      "Leaders typically share meetup time, parking, and notes 24-48 hours before the event. Please watch group announcements."
    );

    setText("faqQ3", "下雨或天气突变时活动会取消吗？", "Will an event be canceled due to rain or weather changes?");
    setText(
      "faqA3",
      "视天气级别决定：小雨可能照常并调整节奏，雷暴或高风险天气通常取消或改线，安全优先。",
      "It depends on risk level: light rain may proceed with adjustments, while thunderstorms or high-risk conditions usually trigger cancellation or rerouting."
    );

    setText("faqQ4", "需要准备哪些基础装备？", "What basic gear should I prepare?");
    setText(
      "faqA4",
      "建议准备防滑徒步鞋、分层衣物、饮水、简易补给、充电手机和基础应急用品。水上活动需按要求穿戴救生装备。",
      "Bring non-slip hiking shoes, layered clothing, water, simple snacks, a charged phone, and basic emergency items. For water activities, wear required flotation gear."
    );

    setText("faqQ5", "可以带朋友一起参加吗？", "Can I bring friends to activities?");
    setText(
      "faqA5",
      "欢迎邀请符合入群条件的朋友，建议先完成入群审核并了解免责声明后再报名活动。",
      "Friends are welcome if they meet entry requirements. Please complete joining review and read the disclaimer before signing up."
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
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.getAttribute("data-lang") === "en" ? "en" : "zh";
      langBtns.forEach(function (item) { item.classList.remove("active"); });
      btn.classList.add("active");
      render();
    });
  });

  render();
})();
