(() => {
  const KEY = "fate-of-the-steppe-settings-v1";
  const defaults = {musicVolume:70,sfxVolume:80,voiceVolume:85,muteAll:false,displayMode:"windowed",resolution:"auto",reducedMotion:false,language:"ru",textSpeed:3,fontSize:2,skipReadOnly:true,autoForward:false};
  let settings = {...defaults};
  try { settings = {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}; } catch (_) {}
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const speedNames = ["Очень медленно","Медленно","Средняя","Быстро","Очень быстро"];
  const fontNames = ["Маленький","Обычный","Крупный"];
  let toastTimer;

  function toast(message) {
    const node = $("#toast"); node.textContent = message; node.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove("show"),2300);
  }
  function showDialog(title,text) {
    $("#dialog-title").textContent = title; $("#dialog-text").textContent = text; $("#dialog").hidden = false;
  }
  function closeDialog() { $("#dialog").hidden = true; }
  function openSettings() {
    $("#main-screen").hidden = true; $("#settings-screen").hidden = false;
    document.title = "Настройки — Степная судьба";
  }
  function closeSettings() {
    $("#settings-screen").hidden = true; $("#main-screen").hidden = false;
    document.title = "Степная судьба · Дала тағдыры · Fate of the Steppe";
  }

  all("[data-action]").forEach(button => button.addEventListener("click",() => {
    switch(button.dataset.action) {
      case "settings": openSettings(); break;
      case "new": showDialog("Новая игра","Игровая сцена пока создаётся. На следующем этапе здесь начнётся история."); break;
      case "continue": showDialog("Продолжить","Сохранений пока нет. Продолжение появится после реализации первой игровой сцены."); break;
      case "load": showDialog("Загрузить","Слоты сохранений будут добавлены вместе с системой сохранения прохождения."); break;
      case "exit": showDialog("Выход","В браузерном предпросмотре вкладка не закрывается программно. В настольной версии эта кнопка будет завершать игру."); break;
    }
  }));
  $("#close-settings").addEventListener("click",closeSettings);
  $("#dialog-ok").addEventListener("click",closeDialog);
  $("#close-dialog").addEventListener("click",closeDialog);
  $("#dialog").addEventListener("click",e => { if(e.target === $("#dialog")) closeDialog(); });

  all("[data-tab]").forEach(button => button.addEventListener("click",() => {
    all("[data-tab]").forEach(tab => {
      const active = tab === button; tab.classList.toggle("active",active); tab.setAttribute("aria-selected",String(active));
    });
    all(".tab-content").forEach(panel => {
      const active = panel.id === "tab-"+button.dataset.tab; panel.hidden = !active; panel.classList.toggle("active",active);
    });
  }));

  function paintOutputs() {
    $("#music-value").value = settings.musicVolume+"%";
    $("#sfx-value").value = settings.sfxVolume+"%";
    $("#voice-value").value = settings.voiceVolume+"%";
    $("#speed-value").value = speedNames[settings.textSpeed-1];
    $("#font-value").value = fontNames[settings.fontSize-1];
  }
  function applySettings() {
    all("[data-setting]").forEach(control => {
      const key=control.dataset.setting; if(!(key in settings)) return;
      if(control.type==="checkbox") control.checked=Boolean(settings[key]); else control.value=settings[key];
    });
    paintOutputs();
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  }
  function collectSettings() {
    all("[data-setting]").forEach(control => {
      const key=control.dataset.setting;
      settings[key] = control.type==="checkbox" ? control.checked : control.type==="range" ? Number(control.value) : control.value;
    });
  }
  function saveSettings() {
    collectSettings();
    try { localStorage.setItem(KEY,JSON.stringify(settings)); $("#save-status").textContent="Сохранено на этом устройстве"; }
    catch (_) { $("#save-status").textContent="Не удалось сохранить настройки в этом браузере"; }
    paintOutputs();
    if(settings.displayMode==="fullscreen" && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch?.(() => $("#save-status").textContent="Браузер не разрешил полный экран");
    } else if(settings.displayMode==="windowed" && document.fullscreenElement) document.exitFullscreen?.();
  }
  all("[data-setting]").forEach(control => control.addEventListener("input",() => {
    if(control.type==="range") { settings[control.dataset.setting]=Number(control.value); paintOutputs(); }
  }));
  $("#save-settings").addEventListener("click",saveSettings);
  $("#reset-settings").addEventListener("click",() => { settings={...defaults}; applySettings(); saveSettings(); $("#save-status").textContent="Возвращены настройки по умолчанию"; });
  $("#language").addEventListener("change",() => {
    if($("#language").value!=="ru") { $("#save-status").textContent="Перевод будет добавлен позже"; $("#language").value="ru"; }
  });
  document.addEventListener("keydown",e => {
    if(e.key==="Escape") { if(!$("#dialog").hidden) closeDialog(); else if(!$("#settings-screen").hidden) closeSettings(); }
    if(e.key==="F5" || ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="r")) { e.preventDefault(); toast("Перезагрузка отключена в прототипе."); }
  });
  applySettings();
})();