(() => {
  const STORAGE_KEY = "fate-of-the-steppe-settings-v1";
  const defaults = {
    musicVolume: 70, sfxVolume: 80, voiceVolume: 85, muteAll: false,
    displayMode: "windowed", resolution: "auto", reducedMotion: false,
    language: "ru", textSpeed: 3, fontSize: 2, skipReadOnly: true, autoForward: false
  };
  let settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    settings = { ...defaults, ...saved };
  } catch (_) {}

  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const speedNames = ["Очень медленно", "Медленно", "Средняя", "Быстро", "Очень быстро"];
  const fontNames = ["Маленький", "Обычный", "Крупный"];

  function paintValues() {
    $("#music-value").value = settings.musicVolume + "%";
    $("#sfx-value").value = settings.sfxVolume + "%";
    $("#voice-value").value = settings.voiceVolume + "%";
    $("#speed-value").value = speedNames[settings.textSpeed - 1];
    $("#font-value").value = fontNames[settings.fontSize - 1];
  }
  function applySettings() {
    all("[data-setting]").forEach(control => {
      const key = control.dataset.setting;
      if (!(key in settings)) return;
      if (control.type === "checkbox") control.checked = Boolean(settings[key]);
      else control.value = settings[key];
    });
    paintValues();
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  }
  function collectSettings() {
    all("[data-setting]").forEach(control => {
      const key = control.dataset.setting;
      if (control.type === "checkbox") settings[key] = control.checked;
      else if (control.type === "range") settings[key] = Number(control.value);
      else settings[key] = control.value;
    });
  }
  function saveSettings() {
    collectSettings();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      $("#save-status").textContent = "Сохранено на этом устройстве";
    } catch (_) {
      $("#save-status").textContent = "Не удалось сохранить настройки в этом браузере";
    }
    paintValues();
    if (settings.displayMode === "fullscreen" && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch?.(() => {
        $("#save-status").textContent = "Браузер не разрешил включить полный экран";
      });
    } else if (settings.displayMode === "windowed" && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }

  all("[data-tab]").forEach(button => button.addEventListener("click", () => {
    all("[data-tab]").forEach(tab => {
      const active = tab === button;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    all(".tab-content").forEach(panel => {
      const active = panel.id === "tab-" + button.dataset.tab;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
  }));

  all("[data-setting]").forEach(control => control.addEventListener("input", () => {
    if (control.type === "range") {
      const key = control.dataset.setting;
      settings[key] = Number(control.value);
      paintValues();
    }
  }));
  $("#save-settings").addEventListener("click", saveSettings);
  $("#reset-settings").addEventListener("click", () => {
    settings = { ...defaults };
    applySettings();
    saveSettings();
    $("#save-status").textContent = "Возвращены настройки по умолчанию";
  });
  $("#close-settings").addEventListener("click", () => {
    $("#save-status").textContent = "Это демонстрационный экран настроек";
  });

  // Смена языка пока не переключает весь текст интерфейса: переводы подключим отдельным этапом.
  $("#language").addEventListener("change", () => {
    if ($("#language").value !== "ru") {
      $("#save-status").textContent = "Перевод на этот язык будет добавлен позже";
      $("#language").value = "ru";
    }
  });
  applySettings();
})();