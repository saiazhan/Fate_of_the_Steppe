(() => {
  const KEY = "fate-of-the-steppe-settings-v1";
  const defaults = {musicVolume:70,sfxVolume:80,voiceVolume:85,muteAll:false,displayMode:"windowed",resolution:"auto",reducedMotion:false,language:"ru",textSpeed:3,fontSize:2,skipReadOnly:true,autoForward:false};
  let settings = {...defaults};
  try { settings = {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}; } catch (_) {}
  const $ = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
  const speedNames=["Очень медленно","Медленно","Средняя","Быстро","Очень быстро"], fontNames=["Маленький","Обычный","Крупный"];
  const tracks={main:$("#music-main"),settings:$("#music-settings"),load:$("#music-load")};
  let currentTrack=null, audioUnlocked=false, toastTimer, selectedSlot=1;
  const mobileQuery=window.matchMedia("(max-width:760px), (pointer:coarse)");
  function toast(message){const node=$("#toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2300);}
  function showDialog(title,text){$("#dialog-title").textContent=title;$("#dialog-text").textContent=text;$("#dialog").hidden=false;}
  function closeDialog(){$("#dialog").hidden=true;}
  function screen(id){["main-screen","new-game-screen","settings-screen","load-screen"].forEach(key=>$("#"+key).hidden=key!==id);}
  function playTrack(name){
    const next=tracks[name]; if(!next)return;
    Object.entries(tracks).forEach(([key,audio])=>{if(key!==name){audio.pause();audio.currentTime=0;}});
    currentTrack=name; next.volume=(settings.muteAll?0:settings.musicVolume/100);
    if(audioUnlocked){const p=next.play();if(p&&p.catch)p.catch(()=>{});}
  }
  function unlockAudio(){
    if(audioUnlocked)return; audioUnlocked=true;
    if(currentTrack&&tracks[currentTrack]){const p=tracks[currentTrack].play();if(p&&p.catch)p.catch(()=>{});}
  }
  document.addEventListener("pointerdown",unlockAudio,{once:true});
  document.addEventListener("keydown",unlockAudio,{once:true});
  function goMain(){screen("main-screen");playTrack("main");document.title="Степная судьба · Дала тағдыры · Fate of the Steppe";}
  function openSettings(){screen("settings-screen");playTrack("settings");document.title="Настройки — Степная судьба";}
  function openLoad(){screen("load-screen");playTrack("load");document.title="Загрузка — Степная судьба";updateSlotSelection();}
  function startNewGame(){screen("new-game-screen");Object.values(tracks).forEach(a=>a.pause());currentTrack=null;document.title="Новая игра — Степная судьба";}
  all("[data-action]").forEach(button=>button.addEventListener("click",()=>{
    unlockAudio();
    switch(button.dataset.action){
      case "settings":openSettings();break;
      case "load":openLoad();break;
      case "new":startNewGame();break;
      case "continue":showDialog("Продолжить","Сохранений пока нет. Когда появится первая игровая сцена, здесь будет продолжение с последнего места.");break;
      case "exit":showDialog("Выход","В браузерном предпросмотре вкладку нельзя закрыть программно. В настольной версии эта кнопка будет завершать игру.");break;
    }
  }));
  all("[data-back]").forEach(b=>b.addEventListener("click",goMain));
  $("#close-settings").addEventListener("click",goMain);$("#close-load").addEventListener("click",goMain);
  $("#dialog-ok").addEventListener("click",closeDialog);$("#close-dialog").addEventListener("click",closeDialog);
  $("#dialog").addEventListener("click",e=>{if(e.target===$("#dialog"))closeDialog();});
  all("[data-tab]").forEach(button=>button.addEventListener("click",()=>{
    all("[data-tab]").forEach(tab=>{const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));});
    all(".tab-content").forEach(panel=>{const active=panel.id==="tab-"+button.dataset.tab;panel.hidden=!active;panel.classList.toggle("active",active);});
  }));
  function paintOutputs(){
    $("#music-value").value=settings.musicVolume+"%";$("#sfx-value").value=settings.sfxVolume+"%";$("#voice-value").value=settings.voiceVolume+"%";
    $("#speed-value").value=speedNames[settings.textSpeed-1]||speedNames[2];$("#font-value").value=fontNames[settings.fontSize-1]||fontNames[1];
  }
  function applySettings(){
    all("[data-setting]").forEach(c=>{const k=c.dataset.setting;if(!(k in settings))return;if(c.type==="checkbox")c.checked=Boolean(settings[k]);else c.value=settings[k];});
    if(mobileQuery.matches)$("#display-mode").value="windowed";
    paintOutputs();document.documentElement.dataset.reducedMotion=settings.reducedMotion?"true":"false";updateMusicVolume();
  }
  function collectSettings(){all("[data-setting]").forEach(c=>{const k=c.dataset.setting;settings[k]=c.type==="checkbox"?c.checked:c.type==="range"?Number(c.value):c.value;});if(mobileQuery.matches)settings.displayMode="windowed";}
  function updateMusicVolume(){Object.values(tracks).forEach(a=>a.volume=settings.muteAll?0:settings.musicVolume/100);}
  function saveSettings(){
    collectSettings();
    try{localStorage.setItem(KEY,JSON.stringify(settings));$("#save-status").textContent="Сохранено на этом устройстве";}catch(_){$("#save-status").textContent="Не удалось сохранить настройки в этом браузере";}
    paintOutputs();updateMusicVolume();
    if(!mobileQuery.matches&&settings.displayMode==="fullscreen"&&!document.fullscreenElement){const p=document.documentElement.requestFullscreen?.();if(p&&p.catch)p.catch(()=>$("#save-status").textContent="Браузер не разрешил полный экран");}
    else if(document.fullscreenElement&&settings.displayMode==="windowed")document.exitFullscreen?.();
  }
  all("[data-setting]").forEach(c=>c.addEventListener("input",()=>{
    if(c.type==="range"){settings[c.dataset.setting]=Number(c.value);paintOutputs();}
    if(c.dataset.setting==="musicVolume"||c.dataset.setting==="muteAll") {settings[c.dataset.setting]=c.type==="checkbox"?c.checked:Number(c.value);updateMusicVolume();}
  }));
  $("#save-settings").addEventListener("click",saveSettings);
  $("#reset-settings").addEventListener("click",()=>{settings={...defaults};applySettings();saveSettings();$("#save-status").textContent="Возвращены настройки по умолчанию";});
  $("#language").addEventListener("change",()=>{if($("#language").value!=="ru"){toast("Перевод будет добавлен позже");$("#language").value="ru";settings.language="ru";}});
  function updateSlotSelection(){all(".save-slot").forEach(slot=>slot.classList.toggle("selected",Number(slot.dataset.slot)===selectedSlot));}
  all(".save-slot").forEach(slot=>slot.addEventListener("click",()=>{selectedSlot=Number(slot.dataset.slot);updateSlotSelection();$("#load-status").textContent="Выбран слот "+String(selectedSlot).padStart(2,"0")+" · сохранение пока отсутствует";}));
  $("#load-selected").addEventListener("click",()=>{$("#load-status").textContent="Этот слот пока пуст. Система сохранений появится вместе с игровыми сценами.";});
  $("#delete-selected").addEventListener("click",()=>{$("#load-status").textContent="В выбранном слоте пока нечего удалять.";});
  mobileQuery.addEventListener?.("change",()=>applySettings());
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){if(!$("#dialog").hidden)closeDialog();else if(!$("#settings-screen").hidden||!$("#load-screen").hidden||!$("#new-game-screen").hidden)goMain();}
    if(e.key==="F5"||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="r")){e.preventDefault();toast("Перезагрузка отключена в прототипе.");}
  });
  applySettings();playTrack("main");
})();