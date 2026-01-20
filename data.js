/*
  data.js
  - Демо-данные участников
  - Доступ к localStorage
  - Нормализация интересов
*/

(function () {
  "use strict";

  const STORAGE_KEY = "cc_members_v1";

  function uid() {
    return "m_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function normalizeText(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeInterestList(raw) {
    const text = normalizeText(raw);
    if (!text) return [];

    return text
      .split(",")
      .map((x) => normalizeText(x).toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }

  function titleCaseInterest(s) {
    const t = normalizeText(s);
    if (!t) return "";
    return t.slice(0, 1).toUpperCase() + t.slice(1);
  }

  const demoMembers = [
    {
      id: "demo_1",
      name: "Ирина",
      email: "irina.demo@example.com",
      city: "Москва",
      role: "Product Designer",
      interests: ["дизайн", "продукт", "карьера"],
      bio: "Ищу людей для обмена опытом и совместных разборов кейсов.",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "demo_2",
      name: "Максим",
      email: "maxim.demo@example.com",
      city: "Санкт‑Петербург",
      role: "Frontend Developer",
      interests: ["javascript", "react", "сообщества"],
      bio: "Люблю митапы и пет‑проекты. Ищу команду на маленький продукт.",
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
    },
    {
      id: "demo_3",
      name: "Ольга",
      email: "olga.demo@example.com",
      city: "Казань",
      role: "Маркетолог",
      interests: ["путешествия", "музыка", "английский"],
      bio: "Хочу практиковать английский и находить людей на совместные поездки.",
      createdAt: "2026-01-03T10:00:00.000Z",
      updatedAt: "2026-01-03T10:00:00.000Z",
    },
    {
      id: "demo_4",
      name: "Денис",
      email: "denis.demo@example.com",
      city: "Екатеринбург",
      role: "Analyst",
      interests: ["бег", "здоровье", "привычки"],
      bio: "Собираю небольшую группу на утренние пробежки и поддержку привычек.",
      createdAt: "2026-01-04T10:00:00.000Z",
      updatedAt: "2026-01-04T10:00:00.000Z",
    },
  ];

  function loadStoredMembers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (_err) {
      return [];
    }
  }

  function saveStoredMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }

  function upsertMember(member) {
    const members = loadStoredMembers();
    const idx = members.findIndex((m) => m.id === member.id);

    if (idx >= 0) {
      members[idx] = { ...members[idx], ...member, updatedAt: nowISO() };
    } else {
      members.unshift({ ...member, createdAt: nowISO(), updatedAt: nowISO() });
    }

    saveStoredMembers(members);
    return member;
  }

  function deleteMember(id) {
    const members = loadStoredMembers().filter((m) => m.id !== id);
    saveStoredMembers(members);
  }

  function getAllMembers() {
    const stored = loadStoredMembers();
    // Демо-данные + сохранённые. Если кто-то зарегистрировался с id demo_*, он всё равно попадёт в stored.
    return [...stored, ...demoMembers.filter((d) => !stored.some((s) => s.id === d.id))];
  }

  function findMemberById(id) {
    if (!id) return null;
    return getAllMembers().find((m) => m.id === id) || null;
  }

  function createMemberFromSignup(formData) {
    const name = normalizeText(formData.name);
    const email = normalizeText(formData.email).toLowerCase();
    const city = normalizeText(formData.city);
    const bio = normalizeText(formData.bio);
    const interests = normalizeInterestList(formData.interests);

    return {
      id: uid(),
      name,
      email,
      city,
      role: "",
      interests,
      bio,
    };
  }

  function seedDemoToStorage() {
    const existing = loadStoredMembers();
    const merged = [...existing];

    for (const d of demoMembers) {
      if (!merged.some((x) => x.id === d.id)) merged.push(d);
    }

    saveStoredMembers(merged);
  }

  window.CC_DATA = {
    STORAGE_KEY,

    demoMembers,
    uid,
    normalizeText,
    normalizeInterestList,
    titleCaseInterest,

    loadStoredMembers,
    saveStoredMembers,
    upsertMember,
    deleteMember,

    getAllMembers,
    findMemberById,

    createMemberFromSignup,
    seedDemoToStorage,
  };
})();
