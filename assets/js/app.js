/*
  app.js
  - Регистрация
  - Быстрый поиск на главной
  - Поиск на search.html
  - Профиль на profile.html
*/

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  function setYear() {
    const el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getPageName() {
    const p = location.pathname.split("/").pop() || "";
    return p.toLowerCase();
  }

  function getQueryParam(key) {
    const url = new URL(location.href);
    return url.searchParams.get(key);
  }

  function toTagHtml(interest) {
    const label = CC_DATA.titleCaseInterest(interest);
    return `<button class="tag" type="button" data-interest="${escapeHtml(interest)}">${escapeHtml(label)}</button>`;
  }

  function memberCardHtml(member, { withTags = true } = {}) {
    const city = CC_DATA.normalizeText(member.city);
    const role = CC_DATA.normalizeText(member.role);

    const meta = [role, city].filter(Boolean).join(" • ") || "Без деталей";
    const interests = Array.isArray(member.interests) ? member.interests : [];

    const tagsHtml = withTags
      ? `<div class="tags">${interests.map((x) => toTagHtml(x)).join("")}</div>`
      : "";

    const profileHref = `profile.html?id=${encodeURIComponent(member.id)}`;

    return `
      <article class="member-card">
        <div class="member-title">
          <div>
            <strong>${escapeHtml(member.name || "Без имени")}</strong>
            <div class="muted">${escapeHtml(meta)}</div>
          </div>
          <a class="nav-link" href="${profileHref}">Профиль</a>
        </div>
        <p class="muted">${escapeHtml(member.bio || "")}</p>
        ${tagsHtml}
      </article>
    `;
  }

  function filterMembers({ interest, city }) {
    const i = CC_DATA.normalizeText(interest).toLowerCase();
    const c = CC_DATA.normalizeText(city).toLowerCase();

    const all = CC_DATA.getAllMembers();

    return all.filter((m) => {
      const interests = Array.isArray(m.interests) ? m.interests : [];
      const cityOk = !c || CC_DATA.normalizeText(m.city).toLowerCase().includes(c);
      const interestOk =
        !i ||
        interests.some((x) => String(x).toLowerCase().includes(i)) ||
        CC_DATA.normalizeText(m.bio).toLowerCase().includes(i) ||
        CC_DATA.normalizeText(m.role).toLowerCase().includes(i);

      return cityOk && interestOk;
    });
  }

  function bindTagClick(container, onClick) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-interest]");
      if (!btn) return;
      onClick(btn.getAttribute("data-interest") || "");
    });
  }

  function showQuickSearchResults(interest) {
    const root = $("#quickSearchResults");
    if (!root) return;

    const i = CC_DATA.normalizeText(interest);
    if (!i) {
      root.innerHTML = `<p class="muted">Введите интерес, чтобы увидеть результаты.</p>`;
      return;
    }

    const list = filterMembers({ interest: i, city: "" }).slice(0, 5);

    if (list.length === 0) {
      root.innerHTML = `<p class="muted">Никого не нашли по “${escapeHtml(i)}”. Попробуйте другое слово.</p>`;
      return;
    }

    root.innerHTML = `
      <div class="muted">Найдено: ${list.length}. Показаны первые 5.</div>
      <div class="cards">${list.map((m) => memberCardHtml(m)).join("")}</div>
    `;

    const cards = root.querySelector(".cards");
    if (cards) {
      bindTagClick(cards, (tag) => {
        const input = $("#quickSearchInput");
        if (input) input.value = tag;
        showQuickSearchResults(tag);
      });
    }
  }

  function initIndexPage() {
    const form = $("#signupForm");
    const msg = $("#signupMessage");

    const quickSearchForm = $("#quickSearchForm");
    const quickSearchInput = $("#quickSearchInput");

    if (quickSearchForm && quickSearchInput) {
      quickSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showQuickSearchResults(quickSearchInput.value);
      });
    }

    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const payload = {
        name: fd.get("name"),
        email: fd.get("email"),
        city: fd.get("city"),
        interests: fd.get("interests"),
        bio: fd.get("bio"),
      };

      const name = CC_DATA.normalizeText(payload.name);
      const email = CC_DATA.normalizeText(payload.email);
      const interests = CC_DATA.normalizeInterestList(payload.interests);

      if (!name || name.length < 2) {
        if (msg) msg.textContent = "Пожалуйста, укажите имя (минимум 2 символа).";
        return;
      }

      if (!email || !email.includes("@")) {
        if (msg) msg.textContent = "Пожалуйста, укажите корректный email.";
        return;
      }

      if (interests.length === 0) {
        if (msg) msg.textContent = "Добавьте хотя бы один интерес (через запятую).";
        return;
      }

      const member = CC_DATA.createMemberFromSignup(payload);
      CC_DATA.upsertMember(member);

      if (msg) msg.textContent = "Готово! Открываем профиль...";

      const url = new URL("profile.html", location.href);
      url.searchParams.set("id", member.id);
      location.href = url.toString();
    });
  }

  function initSearchPage() {
    const form = $("#searchForm");
    const inputInterest = $("#searchInterest");
    const inputCity = $("#searchCity");

    const meta = $("#searchMeta");
    const results = $("#searchResults");

    const btnClear = $("#clearSearch");
    const btnSeed = $("#seedDemo");

    if (!results || !meta) return;

    function render() {
      const interest = inputInterest ? inputInterest.value : "";
      const city = inputCity ? inputCity.value : "";

      const filtered = filterMembers({ interest, city });

      meta.textContent = `Найдено: ${filtered.length}`;
      results.innerHTML = filtered.map((m) => memberCardHtml(m)).join("") || `<p class="muted">Нет результатов.</p>`;

      bindTagClick(results, (tag) => {
        if (inputInterest) inputInterest.value = tag;
        render();
      });
    }

    if (btnSeed) {
      btnSeed.addEventListener("click", () => {
        CC_DATA.seedDemoToStorage();
        render();
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (inputInterest) inputInterest.value = "";
        if (inputCity) inputCity.value = "";
        render();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        render();
      });
    }

    // Предзаполнение из query параметров (удобно для шаринга)
    const qInterest = getQueryParam("interest");
    const qCity = getQueryParam("city");

    if (inputInterest && qInterest) inputInterest.value = qInterest;
    if (inputCity && qCity) inputCity.value = qCity;

    render();
  }

  function profileHtml(member) {
    const name = CC_DATA.normalizeText(member.name) || "Без имени";
    const email = CC_DATA.normalizeText(member.email);
    const city = CC_DATA.normalizeText(member.city);
    const role = CC_DATA.normalizeText(member.role);
    const bio = CC_DATA.normalizeText(member.bio);
    const interests = Array.isArray(member.interests) ? member.interests : [];

    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x.slice(0, 1).toUpperCase())
      .join("") || "CC";

    const meta = [role, city].filter(Boolean).join(" • ") || "Без деталей";

    return `
      <div class="profile-head">
        <div class="row">
          <div class="avatar" aria-hidden="true">${escapeHtml(initials)}</div>
          <div>
            <h3 style="margin: 0;">${escapeHtml(name)}</h3>
            <div class="muted">${escapeHtml(meta)}</div>
          </div>
        </div>
        <div class="muted">${email ? escapeHtml(email) : ""}</div>
      </div>

      <div>
        <div class="muted">О себе</div>
        <p>${escapeHtml(bio || "Пока пусто — добавьте пару строк о себе.")}</p>
      </div>

      <div>
        <div class="muted">Интересы</div>
        <div class="tags">${interests.map((x) => toTagHtml(x)).join("") || `<span class="muted">Не указаны</span>`}</div>
      </div>
    `;
  }

  function initProfilePage() {
    const card = $("#profileCard");
    const form = $("#profileForm");
    const msg = $("#profileMessage");

    const btnLoadExample = $("#loadExample");
    const btnDelete = $("#deleteProfile");

    if (!card || !form) return;

    function loadMemberForPage() {
      const id = getQueryParam("id");
      if (id) {
        return CC_DATA.findMemberById(id);
      }

      // Если id не передали — показываем демо-профиль.
      return CC_DATA.findMemberById("demo_1") || CC_DATA.getAllMembers()[0] || null;
    }

    function fillForm(member) {
      form.elements.name.value = member.name || "";
      form.elements.city.value = member.city || "";
      form.elements.role.value = member.role || "";
      form.elements.email.value = member.email || "";
      form.elements.interests.value = (member.interests || []).join(", ");
      form.elements.bio.value = member.bio || "";
    }

    function render(member) {
      card.innerHTML = profileHtml(member);
      bindTagClick(card, (tag) => {
        const url = new URL("search.html", location.href);
        url.searchParams.set("interest", tag);
        location.href = url.toString();
      });
    }

    let current = loadMemberForPage();

    if (!current) {
      card.innerHTML = `<p class="muted">Не удалось загрузить профиль.</p>`;
      return;
    }

    fillForm(current);
    render(current);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = CC_DATA.normalizeText(form.elements.name.value);
      const email = CC_DATA.normalizeText(form.elements.email.value);
      const interests = CC_DATA.normalizeInterestList(form.elements.interests.value);

      if (!name || name.length < 2) {
        if (msg) msg.textContent = "Имя должно быть минимум 2 символа.";
        return;
      }

      if (!email || !email.includes("@")) {
        if (msg) msg.textContent = "Укажите корректный email.";
        return;
      }

      if (interests.length === 0) {
        if (msg) msg.textContent = "Добавьте хотя бы один интерес (через запятую).";
        return;
      }

      const updated = {
        ...current,
        name,
        email,
        city: CC_DATA.normalizeText(form.elements.city.value),
        role: CC_DATA.normalizeText(form.elements.role.value),
        interests,
        bio: CC_DATA.normalizeText(form.elements.bio.value),
      };

      CC_DATA.upsertMember(updated);
      current = updated;
      render(current);
      if (msg) msg.textContent = "Сохранено.";

      // Обновим URL с id, если он отсутствовал.
      const url = new URL(location.href);
      url.searchParams.set("id", current.id);
      history.replaceState(null, "", url.toString());
    });

    if (btnLoadExample) {
      btnLoadExample.addEventListener("click", () => {
        const example = CC_DATA.findMemberById("demo_2") || CC_DATA.getAllMembers()[0];
        if (!example) return;
        current = { ...example };
        fillForm(current);
        render(current);
        if (msg) msg.textContent = "Загружен пример.";

        const url = new URL(location.href);
        url.searchParams.set("id", current.id);
        history.replaceState(null, "", url.toString());
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener("click", () => {
        if (!current?.id) return;
        CC_DATA.deleteMember(current.id);
        if (msg) msg.textContent = "Удалено из браузера. Откройте поиск или зарегистрируйтесь снова.";

        const fallback = CC_DATA.findMemberById("demo_1") || CC_DATA.getAllMembers()[0] || null;
        if (fallback) {
          current = fallback;
          fillForm(current);
          render(current);

          const url = new URL(location.href);
          url.searchParams.set("id", current.id);
          history.replaceState(null, "", url.toString());
        }
      });
    }
  }

  function init() {
    setYear();

    const page = getPageName();

    if (page === "" || page === "index.html") initIndexPage();
    if (page === "search.html") initSearchPage();
    if (page === "profile.html") initProfilePage();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
