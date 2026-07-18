(function () {
  "use strict";

  var state = { lang: "zh" };
  var langBtns = document.querySelectorAll(".lang-btn");

  function t(zh, en) {
    return state.lang === "zh" ? zh : en;
  }

  function render() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.title = t("渥太华华人徒步群 | 完整版免责声明", "Ottawa OCC | Full Disclaimer");
    document.getElementById("title").textContent = t("完整版免责声明与风险告知", "Full Disclaimer And Risk Notice");
    document.getElementById("lead").textContent = t(
      "本页面为渥太华华人徒步群活动使用的完整法律与风险告知文本。",
      "This page provides the full legal disclaimer and risk notice used for Ottawa Chinese Outdoor Club events."
    );

    document.getElementById("c1").textContent = t(
      "组织性质：本俱乐部为公益性非营利组织，由志愿者组织活动，不以盈利为目的。",
      "Organization status: The club is a public-benefit non-profit organization operated by volunteers and not for profit."
    );
    document.getElementById("c2").textContent = t(
      "风险知悉：你理解徒步、划船、骑行等户外活动具有固有风险，包括但不限于跌倒、碰撞、失温、中暑、设备故障、交通与水域风险，以及可能导致严重伤害或死亡的突发情况。",
      "Risk acknowledgement: You understand that walking, paddling, cycling, and related outdoor activities involve inherent risks, including falls, collisions, hypothermia, heat illness, equipment failures, road/water hazards, and incidents that may cause serious injury or death."
    );
    document.getElementById("c3").textContent = t(
      "自我评估与准备：你确认将根据自身健康状况、技能水平与天气路况自行决定是否参加，并自行准备合适装备、补给和个人保险。",
      "Self-assessment and preparation: You agree to decide participation based on your own health, skill level, weather, and route conditions, and to carry suitable equipment, supplies, and personal insurance."
    );
    document.getElementById("c4").textContent = t(
      "自愿承担风险：在法律允许的最大范围内，你自愿承担参与活动相关的已知与未知风险。",
      "Assumption of risk: To the fullest extent permitted by law, you voluntarily assume known and unknown risks related to participation."
    );
    document.getElementById("c5").textContent = t(
      "责任豁免与权利放弃：在法律允许的最大范围内，你同意就普通过失或可预见风险，不向俱乐部、组织者、领队、志愿者及合作方提出索赔、仲裁、诉讼或其他法律请求。",
      "Release and waiver: To the fullest extent permitted by law, you agree not to bring claims, arbitration, lawsuits, or other legal actions against the club, organizers, leaders, volunteers, or partners for ordinary negligence or foreseeable risks."
    );
    document.getElementById("c6").textContent = t(
      "安全指引：你同意遵守领队及安全协助人员的现场指引。若你拒绝遵守，组织者可要求你停止参与并离开队伍。",
      "Safety compliance: You agree to follow instructions from trip leaders and safety assistants. Refusal may result in removal from participation."
    );
    document.getElementById("c7").textContent = t(
      "紧急情况：在紧急情况下，组织者可基于合理判断联系急救或采取必要协助措施，相关费用由参与人自行承担或通过其保险处理。",
      "Emergency response: In emergencies, organizers may reasonably contact emergency services or provide necessary assistance, with related costs borne by the participant or their insurance."
    );
    document.getElementById("c8").textContent = t(
      "法律适用：本条款受安大略省法律及适用的加拿大法律管辖；若任一条款被认定无效，其余条款继续有效。",
      "Governing law: These terms are governed by Ontario law and applicable Canadian law; if any clause is invalid, the remaining clauses remain effective."
    );

    document.getElementById("notice").textContent = t(
      "重要说明：本页面为运营模板，不构成法律意见。建议由安大略省持牌律师审阅后再作为长期正式条款使用。",
      "Important note: This page is an operational template and not legal advice. Have an Ontario licensed lawyer review it before long-term formal use."
    );
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.getAttribute("data-lang") === "en" ? "en" : "zh";
      langBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      render();
    });
  });

  render();
})();
