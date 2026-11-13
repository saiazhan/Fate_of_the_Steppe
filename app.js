(() => {
  const KEY = "fate-of-the-steppe-settings-v1";
  const defaults = {musicVolume:70,sfxVolume:80,voiceVolume:85,muteAll:false,displayMode:"windowed",resolution:"auto",reducedMotion:false,language:"ru",textSpeed:3,fontSize:2,skipReadOnly:true,autoForward:false};
  let settings = {...defaults};
  try { settings = {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}; } catch (_) {}
  const $ = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
  const speedKeys=["very_slow","slow","medium","fast","very_fast"], fontKeys=["small","normal","large"];
  const tracks={main:$("#music-main"),settings:$("#music-settings"),load:$("#music-load"),other:$("#music-other"),gallery:$("#music-gallery"),"music-room":$("#music-room"),achievements:$("#music-achievements"),about:$("#music-about")};
  const selectedMusic=$("#music-selected");
  const hoverSound=$("#ui-hover-sound");
  let menuTranslations={};
  const t=key=>menuTranslations[settings.language]?.[key]??menuTranslations.ru?.[key]??key;
  let currentTrack=null, audioUnlocked=false, toastTimer, selectedSlot=1, galleryPage=0, musicItems=[];
  const mobileQuery=window.matchMedia("(max-width:760px), (pointer:coarse)");
  const screenIds=["main-screen","new-game-screen","settings-screen","load-screen","other-screen","gallery-screen","music-room-screen","achievements-screen","about-screen"];
  function toast(message){const node=$("#toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2300);}
  function showDialog(title,text){$("#dialog-title").textContent=title;$("#dialog-text").textContent=text;$("#dialog").hidden=false;}
  function closeDialog(){$("#dialog").hidden=true;}
  function screen(id){screenIds.forEach(key=>{const node=$("#"+key);if(node)node.hidden=key!==id;});}
  function stopAllAudio(){Object.values(tracks).forEach(a=>{a.pause();a.currentTime=0;});selectedMusic.pause();selectedMusic.currentTime=0;currentTrack=null;}
  function playTrack(name){
    const next=tracks[name]; if(!next)return;
    stopAllAudio();currentTrack=name;next.volume=(settings.muteAll?0:settings.musicVolume/100);
    if(audioUnlocked){const p=next.play();if(p&&p.catch)p.catch(()=>{});}
  }
  function unlockAudio(){
    if(audioUnlocked)return;audioUnlocked=true;
    if(currentTrack&&tracks[currentTrack]){const p=tracks[currentTrack].play();if(p&&p.catch)p.catch(()=>{});}
  }
  document.addEventListener("pointerdown",unlockAudio,{once:true});
  function playHoverSound(){
    if(!audioUnlocked||settings.muteAll||settings.sfxVolume<=0)return;
    const sound=hoverSound.cloneNode();sound.removeAttribute("id");sound.volume=settings.sfxVolume/100;
    sound.addEventListener("ended",()=>sound.remove(),{once:true});
    const playback=sound.play();if(playback&&playback.catch)playback.catch(()=>sound.remove());
  }
  document.addEventListener("pointerover",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen"&&event.pointerType!=="touch")return;
    const button=event.target.closest("#main-screen button, #other-screen button");if(!button)return;
    if(event.relatedTarget&&button.contains(event.relatedTarget))return;
    playHoverSound();
  });
  document.addEventListener("keydown",unlockAudio,{once:true});
  function goMain(){stopAllAudio();screen("main-screen");playTrack("main");document.title="Степная судьба · Дала тағдыры · Fate of the Steppe";}
  function openSettings(){screen("settings-screen");playTrack("settings");document.title=t("settings")+" — "+t("game_title");}
  function openLoad(){screen("load-screen");playTrack("load");document.title=t("load")+" — "+t("game_title");updateSlotSelection();}
  function openOther(){screen("other-screen");playTrack("other");document.title=t("other")+" — "+t("game_title");}
  function openGallery(){screen("gallery-screen");playTrack("gallery");renderGallery();document.title=t("gallery")+" — "+t("game_title");}
  function openMusicRoom(){screen("music-room-screen");playTrack("music-room");loadMusicLibrary();document.title=t("music_room")+" — "+t("game_title");}
  function openAchievements(){screen("achievements-screen");playTrack("achievements");document.title=t("achievements")+" — "+t("game_title");}
  function openAbout(){screen("about-screen");playTrack("about");document.title=t("about")+" — "+t("game_title");}
  function startNewGame(){stopAllAudio();screen("new-game-screen");document.title=t("new_game")+" — "+t("game_title");}
  all("[data-action]").forEach(button=>button.addEventListener("click",()=>{
    unlockAudio();
    switch(button.dataset.action){
      case "settings":openSettings();break;case "load":openLoad();break;case "new":startNewGame();break;
      case "other":openOther();break;case "gallery":openGallery();break;case "music-room":openMusicRoom();break;
      case "achievements":openAchievements();break;case "about":openAbout();break;
      case "continue":showDialog(t("continue"),t("continue_empty"));break;
      case "exit":showDialog(t("exit"),t("exit_preview"));break;
    }
  }));
  all("[data-back]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.back==="other")openOther();else goMain();}));
  $("#close-settings").addEventListener("click",goMain);$("#close-load").addEventListener("click",goMain);
  $("#dialog-ok").addEventListener("click",closeDialog);$("#close-dialog").addEventListener("click",closeDialog);
  $("#dialog").addEventListener("click",e=>{if(e.target===$("#dialog"))closeDialog();});
  all("[data-tab]").forEach(button=>button.addEventListener("click",()=>{
    all("[data-tab]").forEach(tab=>{const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));});
    all(".tab-content").forEach(panel=>{const active=panel.id==="tab-"+button.dataset.tab;panel.hidden=!active;panel.classList.toggle("active",active);});
  }));
  function paintOutputs(){
    $("#music-value").value=settings.musicVolume+"%";$("#sfx-value").value=settings.sfxVolume+"%";$("#voice-value").value=settings.voiceVolume+"%";
    $("#speed-value").value=t(speedKeys[settings.textSpeed-1]||"medium");$("#font-value").value=t(fontKeys[settings.fontSize-1]||"normal");
  }
  function applySettings(){
    all("[data-setting]").forEach(c=>{const k=c.dataset.setting;if(!(k in settings))return;if(c.type==="checkbox")c.checked=Boolean(settings[k]);else c.value=settings[k];});
    if(mobileQuery.matches)$("#display-mode").value="windowed";
    paintOutputs();document.documentElement.dataset.reducedMotion=settings.reducedMotion?"true":"false";updateMusicVolume();
  }
  function collectSettings(){all("[data-setting]").forEach(c=>{const k=c.dataset.setting;settings[k]=c.type==="checkbox"?c.checked:c.type==="range"?Number(c.value):c.value;});if(mobileQuery.matches)settings.displayMode="windowed";}
  function updateMusicVolume(){Object.values(tracks).forEach(a=>a.volume=settings.muteAll?0:settings.musicVolume/100);selectedMusic.volume=settings.muteAll?0:settings.musicVolume/100;}
  function saveSettings(){
    collectSettings();try{localStorage.setItem(KEY,JSON.stringify(settings));$("#save-status").textContent="Сохранено на этом устройстве";}catch(_){$("#save-status").textContent="Не удалось сохранить настройки в этом браузере";}
    paintOutputs();updateMusicVolume();
    if(!mobileQuery.matches&&settings.displayMode==="fullscreen"&&!document.fullscreenElement){const p=document.documentElement.requestFullscreen?.();if(p&&p.catch)p.catch(()=>$("#save-status").textContent="Браузер не разрешил полный экран");}
    else if(document.fullscreenElement&&settings.displayMode==="windowed")document.exitFullscreen?.();
  }
  all("[data-setting]").forEach(c=>c.addEventListener("input",()=>{
    if(c.type==="range"){settings[c.dataset.setting]=Number(c.value);paintOutputs();}
    if(c.dataset.setting==="musicVolume"||c.dataset.setting==="muteAll"){settings[c.dataset.setting]=c.type==="checkbox"?c.checked:Number(c.value);updateMusicVolume();}
  }));
  $("#save-settings").addEventListener("click",saveSettings);
  $("#reset-settings").addEventListener("click",()=>{settings={...defaults};applySettings();saveSettings();$("#save-status").textContent="Возвращены настройки по умолчанию";});
  async function loadMenuTranslations(){
    try{
      const response=await fetch("locales/menu.json",{cache:"no-store"});
      if(!response.ok)throw new Error("HTTP "+response.status);
      menuTranslations=await response.json();
      applyMenuTranslations(settings.language);
    }catch(_){console.warn("Не удалось загрузить locales/menu.json; используется русский интерфейс.");}
  }
  function applyMenuTranslations(language){
    const dictionary=menuTranslations[language]||menuTranslations.ru;
    if(!dictionary)return;
    document.documentElement.lang=language==="kk"?"kk":language==="en"?"en":"ru";
    all("[data-i18n]").forEach(node=>{
      const value=dictionary[node.dataset.i18n];
      if(typeof value==="string")node.textContent=value;
    });
    all("[data-i18n-aria]").forEach(node=>{
      const value=dictionary[node.dataset.i18nAria];
      if(typeof value==="string")node.setAttribute("aria-label",value);
    });
    const textMap=menuTranslations[language]?.ui_text||menuTranslations.ru?.ui_text||{};
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const raw=node.nodeValue,trim=raw.trim();const source=Object.keys(menuTranslations.ru?.ui_text||{}).find(key=>["ru","kk","en"].some(code=>menuTranslations[code]?.ui_text?.[key]===trim))||trim;const translated=textMap[source];if(typeof translated==="string"){const start=raw.indexOf(trim);node.nodeValue=raw.slice(0,start)+translated+raw.slice(start+trim.length);}}
    const ariaMap=menuTranslations[language]?.ui_aria||{};all("[aria-label]").forEach(el=>{const current=el.getAttribute("aria-label");const source=Object.keys(menuTranslations.ru?.ui_aria||{}).find(key=>["ru","kk","en"].some(code=>menuTranslations[code]?.ui_aria?.[key]===current))||current;const v=ariaMap[source];if(v)el.setAttribute("aria-label",v);});
    paintOutputs();
  }
  $("#language").addEventListener("change",()=>{
    settings.language=$("#language").value;
    applyMenuTranslations(settings.language);
    try{localStorage.setItem(KEY,JSON.stringify(settings));}catch(_){}
  });
  function updateSlotSelection(){all(".save-slot").forEach(slot=>slot.classList.toggle("selected",Number(slot.dataset.slot)===selectedSlot));}
  all(".save-slot").forEach(slot=>slot.addEventListener("click",()=>{selectedSlot=Number(slot.dataset.slot);updateSlotSelection();$("#load-status").textContent=t("selected_slot").replace("{n}",String(selectedSlot).padStart(2,"0"));}));
  $("#load-selected").addEventListener("click",()=>{$("#load-status").textContent=t("slot_empty");});
  $("#delete-selected").addEventListener("click",()=>{$("#load-status").textContent=t("nothing_delete");});
  const galleryItems=Array.from({length:12},(_,i)=>({number:i+1,title:"Закрытое воспоминание"}));
  function renderGallery(){
    const pages=Math.ceil(galleryItems.length/6),start=galleryPage*6;
    $("#gallery-album").innerHTML=galleryItems.slice(start,start+6).map(item=>'<div class="gallery-card"><span class="gallery-lock">✧</span><span>'+item.title+'</span><small>Иллюстрация '+String(item.number).padStart(2,"0")+'</small></div>').join("");
    $("#gallery-page-label").textContent=t("page").replace("{n}",galleryPage+1).replace("{total}",pages);
    $("#gallery-prev").disabled=galleryPage===0;$("#gallery-next").disabled=galleryPage>=pages-1;
  }
  $("#gallery-prev").addEventListener("click",()=>{if(galleryPage>0){galleryPage--;renderGallery();}});
  $("#gallery-next").addEventListener("click",()=>{if(galleryPage<Math.ceil(galleryItems.length/6)-1){galleryPage++;renderGallery();}});
  async function loadMusicLibrary(){
    const list=$("#music-list");list.innerHTML='<p class="hint">Загрузка списка композиций…</p>';
    try{
      const response=await fetch("sounds/main_menu/music_library.json",{cache:"no-store"});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const data=await response.json();musicItems=Array.isArray(data.tracks)?data.tracks:[];
      renderMusicList();
    }catch(_){
      list.innerHTML='<p class="hint">Не удалось прочитать sounds/main_menu/music_library.json. В сборке игры файл будет загружаться локально; при открытии index.html напрямую браузер может ограничивать чтение JSON.</p>';
    }
  }
  function renderMusicList(){
    const list=$("#music-list");
    if(!musicItems.length){list.innerHTML='<p class="hint">Пока здесь нет композиций. Добавь их в sounds/main_menu/music_library.json.</p>';return;}
    list.innerHTML="";
    for(let cycle=0;cycle<3;cycle++) musicItems.forEach((item,index)=>{
      const button=document.createElement("button");button.type="button";button.className="music-track";button.dataset.index=String(index);button.dataset.cycle=String(cycle);
      const info=document.createElement("span");const title=document.createElement("strong");title.textContent=item.title||t("no_title");const description=document.createElement("small");description.textContent=item.description||item.artist||t("track");info.append(title,description);
      const state=document.createElement("span");state.className="music-track-state";state.textContent="ВЫБРАТЬ";button.append(info,state);
      button.addEventListener("click",()=>playMusicItem(index));list.append(button);
    });
    const middle=list.children.length/3;
    requestAnimationFrame(()=>{const firstMiddle=list.children[middle];if(firstMiddle)list.scrollTop=firstMiddle.offsetTop-list.offsetTop-(list.clientHeight-firstMiddle.offsetHeight)/2;});
    list.onscroll=()=>{
      const third=list.scrollHeight/3;
      if(list.scrollTop<third*.35)list.scrollTop+=third;
      else if(list.scrollTop>third*1.65)list.scrollTop-=third;
    };
  }
  function playMusicItem(index){
    const item=musicItems[index];if(!item||!item.src){toast(t("track_missing"));return;}
    stopAllAudio();currentTrack="selected";selectedMusic.src=item.src;selectedMusic.loop=item.loop!==false;selectedMusic.volume=settings.muteAll?0:settings.musicVolume/100;
    $("#music-now-title").textContent=item.title||"Без названия";$("#music-now-description").textContent=[item.artist,item.description].filter(Boolean).join(" · ")||t("soundtrack");
    all(".music-track").forEach(button=>{const active=Number(button.dataset.index)===index;button.classList.toggle("active",active);button.querySelector(".music-track-state").textContent=active?"ИГРАЕТ":"ВЫБРАТЬ";});
    if(audioUnlocked){const p=selectedMusic.play();if(p&&p.catch)p.catch(()=>toast(t("track_error")));}
  }
  $("#music-stop").addEventListener("click",()=>{selectedMusic.pause();selectedMusic.currentTime=0;all(".music-track").forEach(b=>{b.classList.remove("active");b.querySelector(".music-track-state").textContent="СЛУШАТЬ";});$("#music-now-title").textContent=t("no_track_selected");$("#music-now-description").textContent=t("choose_from_list");});
  mobileQuery.addEventListener?.("change",()=>applySettings());
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){if(!$("#dialog").hidden)closeDialog();else if(!$("#main-screen").hidden)return;else if(!$("#new-game-screen").hidden||!$("#settings-screen").hidden||!$("#load-screen").hidden)goMain();else openOther();}
    if(e.key==="F5"||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="r")){e.preventDefault();toast(t("reload_disabled"));}
  });
  applySettings();loadMenuTranslations();playTrack("main");
})();