(function(){
  'use strict';

  const PLAYLIST = [
    { title: 'Break Stuff — Slipknot',             src: 'playlist/Break Stuff - Slipknot.webm' },
    { title: 'Down with the Sickness — Disturbed',  src: 'playlist/Down with the Sickness - Disturbed.webm' },
    { title: 'Duality — Slipknot',                  src: 'playlist/Duality - Slipknot.webm' },
    { title: 'Faint — Linkin Park',                 src: 'playlist/Faint - Linkin Park.webm' },
    { title: 'In the End — Linkin Park',             src: 'playlist/In the End - Linkin Park.webm' },
    { title: 'One Step Closer — Linkin Park',        src: 'playlist/One Step Closer - Linkin Park.webm' },
    { title: 'The Instinct — Killer Instinct',       src: 'playlist/The Instinct - Killer Instinct.webm' },
  ];

  const player = document.getElementById('ost-player');
  if (!PLAYLIST.length || !player) return;
  player.style.display = '';

  function shuffle(arr) {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  const SS_KEY='bdlp-ost-order', SS_ALIVE='bdlp-ost-alive', LS_KEY='bdlp-ost';
  let order;
  try { order=JSON.parse(sessionStorage.getItem(SS_KEY)); } catch{}
  if(!order||order.length!==PLAYLIST.length){
    const [first,...rest]=PLAYLIST;
    order=[first,...shuffle(rest)];
    try{ sessionStorage.setItem(SS_KEY,JSON.stringify(order)); }catch{}
  }

  const audio=new Audio();
  audio.preload='metadata';
  const MAX_VOL=0.10;
  let idx=0, playing=false;

  function fmt(s){ const m=Math.floor(s/60),sec=Math.floor(s%60); return `${m}:${String(sec).padStart(2,'0')}`; }
  function saveState(){ try{ localStorage.setItem(LS_KEY,JSON.stringify({idx,time:audio.currentTime,playing,vol:parseInt(volSlider.value)})); }catch{} }

  function setBtn(isPlaying){
    const b=document.getElementById('ost-playpause');
    b.textContent=isPlaying?'⏸':'▶'; b.classList.toggle('active',isPlaying);
  }

  function updateBar(){
    const pct=audio.duration?(audio.currentTime/audio.duration)*100:0;
    document.getElementById('ost-bar-fill').style.width=pct+'%';
    document.getElementById('ost-time').textContent=audio.duration
      ?`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`:'0:00 / 0:00';
    saveState();
  }

  function loadTrack(i, seekTo){
    idx=((i%order.length)+order.length)%order.length;
    audio.src=order[idx].src;
    document.getElementById('ost-track-name').textContent=order[idx].title;
    audio.load();
    if(seekTo){ audio.addEventListener('loadedmetadata',()=>{ audio.currentTime=seekTo; },{once:true}); }
  }

  // Restaurar estado — solo si es navegación interna (sessionStorage alive), no apertura nueva
  const isInternalNav = !!sessionStorage.getItem(SS_ALIVE);
  let savedTime=0, savedVol=100;
  try{
    const s=JSON.parse(localStorage.getItem(LS_KEY)||'{}');
    if(isInternalNav && typeof s.idx==='number') idx=s.idx;
    if(isInternalNav) savedTime=s.time||0;
    if(typeof s.vol==='number') savedVol=s.vol;
  }catch{}

  const volSlider=document.getElementById('ost-vol');
  audio.volume=Math.max(0,Math.min(1,(savedVol/100)*MAX_VOL));
  volSlider.value=savedVol;
  loadTrack(idx, savedTime);

  // Autoplay — fallback en primera interacción si el browser lo bloquea
  function tryPlay(){
    audio.play().then(()=>{ playing=true; setBtn(true); }).catch(()=>{});
  }
  tryPlay();
  function onFirstInteraction(){
    if(playing) return;
    tryPlay();
    ['click','keydown','scroll','touchstart'].forEach(e=>document.removeEventListener(e,onFirstInteraction));
  }
  ['click','keydown','scroll','touchstart'].forEach(e=>document.addEventListener(e,onFirstInteraction,{once:true}));

  // Controles
  document.getElementById('ost-playpause').addEventListener('click',()=>{
    if(playing){ audio.pause(); playing=false; }
    else{ audio.play().catch(()=>{}); playing=true; }
    setBtn(playing);
  });

  document.getElementById('ost-stop').addEventListener('click',()=>{
    audio.pause(); audio.currentTime=0; playing=false; setBtn(false); updateBar();
  });

  document.getElementById('ost-prev').addEventListener('click',()=>{
    loadTrack(idx-1,0); if(playing) audio.play().catch(()=>{});
  });

  document.getElementById('ost-next').addEventListener('click',()=>{
    loadTrack(idx+1,0); if(playing) audio.play().catch(()=>{});
  });

  document.getElementById('ost-bar').addEventListener('click',(e)=>{
    if(!audio.duration) return;
    const r=e.currentTarget.getBoundingClientRect();
    audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration;
    updateBar();
  });

  volSlider.addEventListener('input',()=>{
    audio.volume=Math.max(0,Math.min(1,(volSlider.value/100)*MAX_VOL));
  });

  audio.addEventListener('timeupdate', updateBar);
  audio.addEventListener('ended',()=>{ loadTrack(idx+1,0); audio.play().catch(()=>{}); });

  window.addEventListener('beforeunload', ()=>{ saveState(); try{ sessionStorage.setItem(SS_ALIVE,'1'); }catch{} });
})();
