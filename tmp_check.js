
// ====================================================
// DAVE: SPACE DIVER — PR1 v2
// ====================================================
// ✓ Fase 1-5: vertical/normal
// ✓ Fase 6: scroll horizontal estilo Super Mario Bros
//            com checkpoint funcional antes da arena
// ✓ Fase 7 (arena): boss fight com câmera fixa
// ✓ Boss: 4 padrões de movimento (patrol/dive/slam/teleport)
// ✓ HUD: vida do jogador + barra de vida do boss
// ✓ Projéteis, cura, checkpoint, trilha diferente
// ====================================================

const CV = document.getElementById('c')
const cx = CV.getContext('2d')
const W = 480, H = 270
CV.width = W; CV.height = H
const SCALE = Math.min(Math.floor(window.innerWidth/W), Math.floor((window.innerHeight-30)/H))
CV.style.width  = W*SCALE+'px'
CV.style.height = H*SCALE+'px'

const AC = new (window.AudioContext || window.webkitAudioContext)()
const logoImg = new Image()
logoImg.src = './davethespacelogo.png'

// ── MENU STARS ──
let menuStars = []
function initMenuStars() {
  menuStars = []
  for (let i=0;i<20;i++) menuStars.push({
    x:Math.random()*W, y:Math.random()*H,
    vx:Math.random()*0.5+0.2, vy:Math.random()*0.3-0.15,
    size:Math.random()*1+0.5, opacity:Math.random()*0.5+0.3
  })
}
initMenuStars()

// ── AUDIO ──
function beep(freq,type,dur,vol,freqEnd){
  if(AC.state==='suspended')AC.resume()
  const o=AC.createOscillator(),g=AC.createGain()
  o.connect(g);g.connect(AC.destination)
  o.type=type
  o.frequency.setValueAtTime(freq,AC.currentTime)
  if(freqEnd)o.frequency.linearRampToValueAtTime(freqEnd,AC.currentTime+dur)
  g.gain.setValueAtTime(vol,AC.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur)
  o.start();o.stop(AC.currentTime+dur)
}
const sfxJet      = ()=>beep(90+Math.random()*30,'sawtooth',0.08,0.12)
const sfxCollect  = ()=>{ beep(440,'sine',0.06,0.2); setTimeout(()=>beep(660,'sine',0.1,0.25),60); setTimeout(()=>beep(880,'sine',0.15,0.2),120) }
const sfxHurt     = ()=>{ beep(220,'square',0.05,0.3); beep(110,'sawtooth',0.3,0.2,50) }
const sfxDead     = ()=>{ for(let i=0;i<5;i++)setTimeout(()=>beep(200-i*30,'square',0.12,0.25),i*80) }
const sfxWin      = ()=>{ [440,550,660,880].forEach((n,i)=>setTimeout(()=>beep(n,'sine',0.2,0.3),i*100)) }
const sfxShoot    = ()=>beep(800,'square',0.06,0.15,1200)
const sfxBossShoot= ()=>beep(200,'sawtooth',0.12,0.2,80)
const sfxBossHit  = ()=>{ beep(440,'square',0.04,0.2); setTimeout(()=>beep(300,'square',0.08,0.15),40) }
const sfxBossDead = ()=>{ for(let i=0;i<8;i++)setTimeout(()=>beep(400-i*40,'sawtooth',0.15,0.3),i*60) }
const sfxCheckpoint=()=>{ beep(523,'sine',0.08,0.2); setTimeout(()=>beep(659,'sine',0.08,0.2),80); setTimeout(()=>beep(784,'sine',0.12,0.25),160) }
const sfxHeal     = ()=>{ beep(523,'sine',0.1,0.2); setTimeout(()=>beep(784,'sine',0.1,0.2),80); setTimeout(()=>beep(1047,'sine',0.15,0.3),160) }
const sfxLand     = ()=>beep(160,'square',0.04,0.12,80)
const sfxTeleport = ()=>{ beep(800,'sine',0.04,0.2,300); setTimeout(()=>beep(1200,'sine',0.06,0.3,200),60) }
const sfxSlam     = ()=>{ beep(80,'sawtooth',0.2,0.4,40); beep(200,'square',0.08,0.2,50) }

let menuAudioElem=null, gameAudioElem=null, bossAudioElem=null
function initAudioElements(){
  if(!menuAudioElem){menuAudioElem=document.getElementById('menuAudio');menuAudioElem.volume=0.25}
  if(!gameAudioElem){gameAudioElem=document.getElementById('gameAudio');gameAudioElem.volume=0.25}
  if(!bossAudioElem){bossAudioElem=document.getElementById('bossAudio');bossAudioElem.volume=0.25}
}
function startMusic(){ initAudioElements(); stopBossMusic(); stopMenuMusic(); gameAudioElem.currentTime=0; gameAudioElem.play().catch(()=>{}) }
function stopMusic(){ if(gameAudioElem){gameAudioElem.pause();gameAudioElem.currentTime=0} }
function startMenuMusic(){ initAudioElements(); stopBossMusic(); gameAudioElem.pause(); gameAudioElem.currentTime=0; menuAudioElem.currentTime=0; menuAudioElem.play().catch(()=>{}) }
function stopMenuMusic(){ if(menuAudioElem){menuAudioElem.pause();menuAudioElem.currentTime=0} }

function startBossMusic(){
  stopMusic(); stopMenuMusic(); initAudioElements();
  if(bossAudioElem){ bossAudioElem.currentTime=0; bossAudioElem.play().catch(()=>{}) }
}
function stopBossMusic(){ if(bossAudioElem){bossAudioElem.pause();bossAudioElem.currentTime=0} }

function startMenuJingle(){ const n=[330,0,392,0,494,0,523,0];let i=0;const p=()=>{if(i>=n.length)return;if(n[i]>0)beep(n[i],'sine',0.1,0.15);i++;if(i<n.length)setTimeout(p,80)};p() }

// ── INPUT ──
const keys={}
document.addEventListener('keydown',e=>{
  if(!keys[e.code])keys[e.code]={held:false,just:false}
  if(!keys[e.code].held)keys[e.code].just=true
  keys[e.code].held=true
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault()
})
document.addEventListener('keyup',e=>{ if(keys[e.code]){keys[e.code].held=false;keys[e.code].just=false} })
function clearJust(){ for(const k in keys)keys[k].just=false }
const pressed = c=>keys[c]&&keys[c].just
const held    = c=>keys[c]&&keys[c].held

function localToWorldMouse(evt){
  const rect=CV.getBoundingClientRect()
  const x=(evt.clientX-rect.left)*(CV.width/rect.width)
  const y=(evt.clientY-rect.top)*(CV.height/rect.height)
  mouseAim.x=Math.max(0,Math.min(W,x))
  mouseAim.y=Math.max(0,Math.min(H,y))
  mouseAim.worldX=mouseAim.x+camX
  mouseAim.worldY=mouseAim.y
  mouseAim.valid=true
}
CV.addEventListener('mousemove',localToWorldMouse)
CV.addEventListener('mouseleave',()=>{mouseAim.valid=false})
CV.addEventListener('mousedown',e=>{if(e.button===0&&state==='playing'){localToWorldMouse(e);shoot()}})
CV.addEventListener('contextmenu',e=>e.preventDefault())

// ── FÍSICA ──
const GRAV=0.045, JETFORCE=0.13, MAXSPEEDUP=-1.6, MAXSPEEDDOWN=3.2
const WALKSPEED=1.7, WALK_ACCEL=0.32, FRICTION=0.78
const SHOOT_AMMO_MAX=6, SHOOT_OVERHEAT_MAX=180

let charJetForce=JETFORCE, charWalkSpeed=WALKSPEED, charMaxSpeedUp=MAXSPEEDUP

// ── ESTADO ──
let state='character-select'
let currentPhase='phase1'   // 'phase1'=fases1-6, 'phase2'=boss
let selectedCharacter='dave'
let selectedLevel=1
let lives=3, score=0, frameN=0
let damageCD=0, jetCD=0, deathTimer=0
let particles=[]
let healItems=1, healCD=0
let shootCD=0
let shootAmmo=SHOOT_AMMO_MAX, shootOverheat=0
let healObjs=[]
let mouseAim={x:W/2,y:H/2,worldX:W/2,worldY:H,valid:false}

// ── CHECKPOINT ──
// checkpointSpawn: ponto exato onde o player vai reaparecer
let checkpointSpawn = null   // null = sem checkpoint, {x,y} = posição

// ── CÂMERA (scroll horizontal fase 6) ──
let camX=0   // deslocamento da câmera no mundo

// ── WORLD: fase 6 tem largura maior ──
let worldW = W  // será 1600 na fase 6

// ── ENTIDADES ──
const pl = { x:0, y:0, vx:0, vy:0, w:10, h:16, face:1, jetting:false, onGround:false }
let starObjs=[], movPlats=[], fixedPlats=[], spikeGroups=[]
let crate={ x:0,y:0,vx:0,vy:0,w:16,h:16 }
let checkpointObjs=[]  // array de checkpoints no mapa
let bullets=[], bossBullets=[]

// ── PORTAL ──
// Na fase 6 o portal fica no lado direito do nível longo
let portal={ x:432,y:99,w:18,h:38 }

// ── BOSS ──
const BOSS_MAX_HP=20
const BOSS_W=36, BOSS_H=36
let boss={
  x:0,y:0, w:BOSS_W, h:BOSS_H,
  hp:BOSS_MAX_HP, alive:false,
  vx:0, vy:0,
  hurtTimer:0,
  shootTimer:0, shootInterval:100,
  phase:1,
  // Padrões de ataque
  movePattern:'patrol',  // 'patrol' | 'dive' | 'slam' | 'teleport'
  patternTimer:0,        // timer do padrão atual
  patternCD:0,           // cooldown antes de trocar padrão
  diveTarget:{x:0,y:0},
  diving:false,
  slamWarning:false,
  slamTimer:0,
  shieldTimer:0,         // frames com escudo ativo (invulnerável)
  teleportFlash:0,
  groundY:0,             // Y do chão da arena
}

// ── CONFIGURAÇÃO DAS FASES 1-5 ──
const LEVELS = {
  1:{name:'FASE 1: INÍCIO',desc:'Aprenda o básico',
    movPlats:[
      {x:120,y:175,w:50,h:10,ox:120,range:70,axis:'x',spd:0.8,t:0},
      {x:250,y:148,w:48,h:10,oy:148,range:50,axis:'y',spd:0.7,t:1.6},
    ],
    fixedPlats:[
      {x:8,y:218,w:102,h:14},{x:175,y:200,w:75,h:14},{x:300,y:180,w:80,h:14},
      {x:22,y:148,w:68,h:12},{x:170,y:122,w:65,h:12},{x:300,y:100,w:90,h:12},{x:388,y:135,w:76,h:12},
    ],
    stars:[{x:80,y:198},{x:220,y:178},{x:160,y:115}]
  },
  2:{name:'FASE 2: DESAFIO',desc:'Mais obstáculos',
    movPlats:[
      {x:80,y:200,w:50,h:10,ox:80,range:60,axis:'x',spd:1.0,t:0},
      {x:220,y:170,w:45,h:10,oy:170,range:40,axis:'y',spd:0.9,t:0.8},
      {x:350,y:140,w:55,h:10,ox:350,range:80,axis:'x',spd:0.85,t:1.2},
    ],
    fixedPlats:[
      {x:8,y:225,w:60,h:12},{x:100,y:208,w:50,h:12},{x:180,y:195,w:55,h:12},
      {x:280,y:180,w:50,h:12},{x:360,y:165,w:60,h:12},{x:50,y:140,w:65,h:12},
      {x:200,y:110,w:70,h:12},{x:330,y:95,w:65,h:12},{x:150,y:75,w:60,h:12},
    ],
    stars:[{x:130,y:190},{x:240,y:160},{x:390,y:130},{x:260,y:100}]
  },
  3:{name:'FASE 3: EXPERT',desc:'Teste seus limites',
    movPlats:[
      {x:60,y:210,w:40,h:10,ox:60,range:50,axis:'x',spd:1.2,t:0},
      {x:200,y:180,w:35,h:10,oy:180,range:35,axis:'y',spd:1.1,t:0.4},
      {x:330,y:150,w:40,h:10,ox:330,range:60,axis:'x',spd:1.0,t:0.8},
      {x:150,y:120,w:35,h:10,oy:120,range:45,axis:'y',spd:0.95,t:1.2},
      {x:300,y:85,w:45,h:10,ox:300,range:70,axis:'x',spd:1.15,t:1.6},
    ],
    fixedPlats:[
      {x:8,y:230,w:50,h:10},{x:90,y:215,w:40,h:10},{x:160,y:200,w:45,h:10},
      {x:250,y:185,w:40,h:10},{x:340,y:165,w:45,h:10},{x:420,y:145,w:50,h:10},
      {x:50,y:130,w:55,h:10},{x:190,y:105,w:50,h:10},{x:310,y:115,w:40,h:10},
      {x:100,y:80,w:50,h:10},{x:270,y:60,w:55,h:10},
    ],
    stars:[{x:115,y:205},{x:210,y:175},{x:395,y:145},{x:180,y:105},{x:340,y:80}]
  },
  4:{name:'FASE 4: SPIKES',desc:'Esquive com jetpack',
    movPlats:[
      {x:150,y:210,w:50,h:10,ox:150,range:60,axis:'x',spd:0.7,t:0},
      {x:300,y:170,w:40,h:10,oy:170,range:55,axis:'y',spd:0.9,t:1.0},
    ],
    fixedPlats:[
      {x:8,y:235,w:60,h:12},{x:100,y:220,w:55,h:12},{x:390,y:235,w:80,h:12},{x:420,y:50,w:52,h:12},
    ],
    spikes:[
      {x:130,y:0,w:50,h:18,dir:'down'},{x:200,y:0,w:60,h:18,dir:'down'},
      {x:280,y:0,w:55,h:18,dir:'down'},{x:360,y:0,w:50,h:18,dir:'down'},
    ],
    stars:[{x:180,y:210},{x:330,y:160},{x:450,y:210},{x:240,y:80},{x:380,y:120},{x:100,y:90}]
  },
  5:{name:'FASE 5: SKY RUNNER',desc:'Corra pelo céu',
    movPlats:[
      {x:100,y:130,w:45,h:10,ox:100,range:70,axis:'x',spd:1.1,t:0},
      {x:280,y:95,w:40,h:10,oy:95,range:50,axis:'y',spd:0.85,t:0.5},
      {x:140,y:65,w:35,h:10,ox:140,range:80,axis:'x',spd:1.3,t:1.0},
      {x:350,y:40,w:50,h:10,oy:40,range:45,axis:'y',spd:1.0,t:1.5},
    ],
    fixedPlats:[
      {x:8,y:240,w:50,h:12},{x:200,y:150,w:50,h:12},{x:380,y:120,w:55,h:12},
      {x:80,y:70,w:45,h:12},{x:250,y:55,w:50,h:12},{x:430,y:50,w:42,h:12},
    ],
    stars:[{x:130,y:120},{x:220,y:120},{x:310,y:85},{x:160,y:55},{x:310,y:30},{x:400,y:60}]
  }
}

// ── FASE 6: NÍVEL LONGO COM SCROLL (estilo Mario) ──
// worldW = 1600. O jogador vai da esquerda para a direita.
// Checkpoint no meio do nível. Portal no fim.
const LEVEL6_W = 1600
const LEVEL6 = {
  name:'FASE 6: PASSAGEM',desc:'Scroll horizontal',
  worldW: LEVEL6_W,
  // Chão
  fixedPlats:[
    // ── SEÇÃO 1 (0-400): início suave ──
    {x:0,   y:242,w:160,h:28,col:'#1a2a4a'}, // plataforma inicial grande
    {x:200, y:242,w:80, h:28,col:'#1a2a4a'},
    {x:340, y:242,w:80, h:28,col:'#1a2a4a'},
    // plataformas altas seção 1
    {x:80,  y:190,w:60, h:12,col:'#1a3a2a'},
    {x:200, y:170,w:60, h:12,col:'#1a3a2a'},
    {x:310, y:150,w:50, h:12,col:'#1a3a2a'},
    // ── SEÇÃO 2 (400-800): obstáculos ──
    {x:460, y:242,w:100,h:28,col:'#1a2a4a'},
    {x:620, y:242,w:80, h:28,col:'#1a2a4a'},
    {x:760, y:242,w:100,h:28,col:'#1a2a4a'},
    // Plataformas flutuantes
    {x:430, y:195,w:70, h:12,col:'#1a3a2a'},
    {x:560, y:175,w:60, h:12,col:'#1a3a2a'},
    {x:680, y:155,w:55, h:12,col:'#1a3a2a'},
    {x:790, y:175,w:60, h:12,col:'#1a3a2a'},
    // Plataformas altas
    {x:480, y:140,w:50, h:12,col:'#1a4030'},
    {x:600, y:120,w:50, h:12,col:'#1a4030'},
    {x:720, y:105,w:55, h:12,col:'#1a4030'},
    // ── CHECKPOINT (x≈820) ──
    // área plana segura perto do checkpoint
    {x:820, y:242,w:120,h:28,col:'#1a2a4a'},
    {x:820, y:190,w:60, h:12,col:'#1a2a5a'},
    // ── SEÇÃO 3 (960-1200): mais difícil ──
    {x:980, y:242,w:80, h:28,col:'#1a2a4a'},
    {x:1120,y:242,w:80, h:28,col:'#1a2a4a'},
    {x:960, y:190,w:55, h:12,col:'#1a3a2a'},
    {x:1060,y:165,w:50, h:12,col:'#1a3a2a'},
    {x:1160,y:145,w:55, h:12,col:'#1a3a2a'},
    {x:1000,y:130,w:45, h:12,col:'#1a4030'},
    {x:1100,y:110,w:50, h:12,col:'#1a4030'},
    // ── SEÇÃO 4 (1250-1550): reta final ──
    {x:1260,y:242,w:80, h:28,col:'#1a2a4a'},
    {x:1390,y:242,w:80, h:28,col:'#1a2a4a'},
    {x:1280,y:185,w:60, h:12,col:'#1a3a2a'},
    {x:1360,y:160,w:55, h:12,col:'#1a3a2a'},
    {x:1440,y:185,w:60, h:12,col:'#1a3a2a'},
    // Plataforma final (próximo ao portal)
    {x:1530,y:242,w:70, h:28,col:'#1a2a4a'},
    {x:1520,y:150,w:60, h:12,col:'#1a4030'},
  ],
  movPlats:[
    // Seção 1
    {x:155,y:215,w:45,h:10,ox:155,range:45,axis:'x',spd:0.8,t:0},
    {x:290,y:200,w:40,h:10,oy:200,range:30,axis:'y',spd:0.7,t:1.0},
    // Seção 2
    {x:550,y:210,w:50,h:10,ox:550,range:60,axis:'x',spd:1.0,t:0.5},
    {x:670,y:195,w:45,h:10,oy:195,range:35,axis:'y',spd:0.9,t:1.2},
    {x:860,y:210,w:45,h:10,ox:860,range:50,axis:'x',spd:0.85,t:0.8},
    // Seção 3
    {x:1040,y:210,w:50,h:10,ox:1040,range:55,axis:'x',spd:1.1,t:0.3},
    {x:1190,y:200,w:40,h:10,oy:200,range:40,axis:'y',spd:1.0,t:1.5},
    // Seção 4
    {x:1320,y:210,w:50,h:10,ox:1320,range:60,axis:'x',spd:1.2,t:0.6},
  ],
  spikes:[
    // Buracos entre chãos (dano por queda já cobre isso)
    // Espinhos no teto seção 2
    {x:460, y:0,w:40,h:18,dir:'down'},
    {x:700, y:0,w:40,h:18,dir:'down'},
    // Espinhos no teto seção 3
    {x:1000,y:0,w:50,h:18,dir:'down'},
    {x:1200,y:0,w:40,h:18,dir:'down'},
  ],
  stars:[
    // Seção 1
    {x:100, y:170},{x:230, y:150},{x:320, y:130},
    // Seção 2
    {x:500, y:175},{x:620, y:155},{x:750, y:135},{x:810, y:105},
    // Seção 3
    {x:1010,y:170},{x:1120,y:145},{x:1150,y:90},
    // Seção 4
    {x:1300,y:165},{x:1400,y:140},{x:1460,y:165},
  ],
  heals:[{x:845,y:168}],
  // Checkpoint no meio do mundo
  checkpoints:[{x:840, y:218}],
  // Portal no fim
  portalPos:{x:1560, y:118, w:18, h:38},
}

// ── ARENA DO BOSS ──
const BOSS_ARENA_PLATS = [
  {x:0,   y:242,w:480,h:28,col:'#3a1a0a'},  // chão
  {x:20,  y:185,w:80, h:12,col:'#3a2a0a'},  // plataformas laterais
  {x:380, y:185,w:80, h:12,col:'#3a2a0a'},
  {x:160, y:158,w:70, h:10,col:'#3a2a0a'},  // plataformas centrais
  {x:250, y:158,w:70, h:10,col:'#3a2a0a'},
  {x:80,  y:118,w:60, h:10,col:'#3a2a0a'},  // altas
  {x:340, y:118,w:60, h:10,col:'#3a2a0a'},
  {x:200, y:90, w:80, h:10,col:'#3a2a0a'},  // topo-centro
]

const bgStarsArr=Array.from({length:150},()=>({x:Math.random()*1600,y:Math.random()*270,s:Math.random()*1.5+0.3,ph:Math.random()*Math.PI*2,sp:Math.random()*0.03+0.01}))
const nebulas1=Array.from({length:14},()=>({x:Math.random()*1600,y:Math.random()*270,rx:Math.random()*60+30,ry:Math.random()*35+20,col:Math.random()>0.5?[40,20,100]:[10,30,100],a:Math.random()*0.18+0.05}))
const nebulas2=Array.from({length:10},()=>({x:Math.random()*480,y:Math.random()*270,rx:Math.random()*60+30,ry:Math.random()*35+20,col:[120+Math.random()*40|0,Math.random()*30|0,Math.random()*20|0],a:Math.random()*0.22+0.06}))

// ── INIT ──
function initGame(){
  if(selectedCharacter==='cassidy'){
    charJetForce=JETFORCE*1.15; charWalkSpeed=WALKSPEED*1.12; charMaxSpeedUp=MAXSPEEDUP*1.1
  } else {
    charJetForce=JETFORCE; charWalkSpeed=WALKSPEED; charMaxSpeedUp=MAXSPEEDUP
  }
  lives=3; score=0; frameN=0; damageCD=0; jetCD=0; deathTimer=0
  healItems=1; healCD=0; shootCD=0; shootAmmo=SHOOT_AMMO_MAX; shootOverheat=0; bullets=[]; bossBullets=[]; particles=[]
  checkpointSpawn=null
  boss.alive=false
  currentPhase='phase1'
  if(selectedLevel===6){ loadLevel6() } else { loadNormalLevel() }
  state='playing'
  startMusic()
  if(AC.state==='suspended')AC.resume()
}

function loadNormalLevel(){
  const cfg=LEVELS[selectedLevel]||LEVELS[1]
  worldW=W
  camX=0
  movPlats=[...cfg.movPlats.map(p=>({...p,col:'#1a4030'}))]
  fixedPlats=[...cfg.fixedPlats.map(p=>({col:'#1a2a4a',...p}))]
  spikeGroups=[
    {x:-10,y:0,w:18,h:270,dir:'right',wall:true},
    {x:472,y:0,w:18,h:270,dir:'left',wall:true},
    ...(cfg.spikes||[]).map(s=>({...s}))
  ]
  starObjs=cfg.stars.map(s=>({x:s.x,y:s.y,got:false,angle:0}))
  healObjs=[]
  crate={x:210,y:184,vx:0,vy:0,w:16,h:16}
  pl.x=20;pl.y=195;pl.vx=0;pl.vy=0;pl.face=1;pl.jetting=false
  portal.x=432;portal.y=99;portal.w=18;portal.h=38
  checkpointObjs=[]
}

function loadLevel6(){
  const cfg=LEVEL6
  worldW=cfg.worldW
  camX=0
  movPlats=[...cfg.movPlats.map(p=>({...p,col:'#1a4030'}))]
  fixedPlats=[...cfg.fixedPlats.map(p=>({col:'#1a2a4a',...p}))]
  spikeGroups=[
    {x:-10,y:0,w:18,h:cfg.worldW+18,dir:'right',wall:true},
    {x:cfg.worldW,y:0,w:18,h:270,dir:'left',wall:true},
    ...(cfg.spikes||[]).map(s=>({...s}))
  ]
  starObjs=cfg.stars.map(s=>({x:s.x,y:s.y,got:false,angle:0}))
  portal={...cfg.portalPos}
  checkpointObjs=cfg.checkpoints.map(c=>({x:c.x,y:c.y,w:14,h:24,activated:false}))
  healObjs=(cfg.heals||[]).map(h=>({x:h.x,y:h.y,got:false}))
  pl.x=30;pl.y=210;pl.vx=0;pl.vy=0;pl.face=1;pl.jetting=false
  crate={x:210,y:220,vx:0,vy:0,w:16,h:16}
}

function initBossArena(){
  currentPhase='phase2'
  worldW=W; camX=0
  stopMusic(); startBossMusic()
  movPlats=[]
  fixedPlats=BOSS_ARENA_PLATS.map(p=>({...p}))
  spikeGroups=[
    {x:-10,y:0,w:18,h:270,dir:'right',wall:true},
    {x:472,y:0,w:18,h:270,dir:'left',wall:true}
  ]
  starObjs=[]; bullets=[]; bossBullets=[]
  checkpointObjs=[]
  healObjs=[
    {x:80, y:200, got:false},
    {x:240, y:110, got:false},
    {x:400, y:200, got:false}
  ]
  // Boss spawna no topo centro
  boss.x=W/2-BOSS_W/2; boss.y=18
  boss.hp=BOSS_MAX_HP; boss.alive=true
  boss.vx=1.2; boss.vy=0
  boss.shootTimer=80; boss.shootInterval=100
  boss.hurtTimer=0; boss.phase=1
  boss.movePattern='patrol'; boss.patternTimer=200; boss.patternCD=0
  boss.diving=false; boss.slamWarning=false; boss.slamTimer=0
  boss.shieldTimer=0; boss.teleportFlash=0
  boss.lastTeleportCD=0; boss.burstCharge=0
  boss.groundY=242-BOSS_H   // Y quando está no chão
  // Spawn no início da arena e salva como novo checkpoint
  pl.x=30; pl.y=215
  checkpointSpawn={x:30, y:215}
  pl.vx=0; pl.vy=0; pl.face=1; pl.jetting=false
  particles=[]; damageCD=0
  state='playing'
}

// ── COLISÕES ──
function aabb(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y }

function resolveY(obj,plat){
  if(!aabb(obj,plat))return false
  const oT=(obj.y+obj.h)-plat.y, oB=(plat.y+plat.h)-obj.y
  if(obj.vy>=0&&oT<oB){ obj.y=plat.y-obj.h; obj.vy=0; return true }
  if(obj.vy<0&&oB<oT){  obj.y=plat.y+plat.h; obj.vy=0; return true }
  return false
}
function resolveX(obj,plat){
  if(!aabb(obj,plat))return false
  const oL=(obj.x+obj.w)-plat.x, oR=(plat.x+plat.w)-obj.x
  if(obj.vx>0&&oL<oR){ obj.x=plat.x-obj.w; obj.vx=0; return true }
  if(obj.vx<0&&oR<oL){ obj.x=plat.x+plat.w; obj.vx=0; return true }
  return false
}
function allSolids(){ return currentPhase==='phase1'?[...fixedPlats,...movPlats,crate]:[...fixedPlats,...movPlats] }

function playerBox(){ return {x:pl.x+2,y:pl.y+2,w:pl.w-4,h:pl.h-2} }

function addParticles(x,y,col,n,spd){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=(Math.random()*1.5+0.5)*(spd||1)
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:30+Math.random()*25,ml:55,r:col[0],g:col[1],b:col[2]})
  }
}
function addJetTrail(){
  const ex=pl.x+(pl.face<0?pl.w-2:-2),ey=pl.y+pl.h-3
  particles.push({x:ex+(Math.random()-0.5)*4,y:ey+Math.random()*2,vx:(Math.random()-0.5)*0.8,vy:Math.random()*1.5+0.5,life:14+Math.random()*8,ml:22,r:255,g:120+Math.random()*80|0,b:20})
}

// ── DANO ──
function hurt(){
  if(damageCD>0)return
  lives--;damageCD=130;sfxHurt()
  addParticles(pl.x+pl.w/2,pl.y+pl.h/2,[255,80,60],18)
  if(lives<=0){
    sfxDead();stopBossMusic();stopMusic()
    addParticles(pl.x+pl.w/2,pl.y+pl.h/2,[255,150,50],30)
    deathTimer=80;state='dying'
  } else {
    respawnPlayer()
  }
}

function respawnPlayer(){
  if(checkpointSpawn){
    pl.x=checkpointSpawn.x; pl.y=checkpointSpawn.y
  } else {
    pl.x=30; pl.y=selectedLevel===6?210:195
  }
  pl.vx=0;pl.vy=0
}

function useHeal(){
  if(healItems<=0||lives>=3||healCD>0)return
  healItems--;lives=Math.min(3,lives+1);healCD=60
  sfxHeal();addParticles(pl.x+pl.w/2,pl.y+pl.h/2,[80,255,120],20,0.8)
}

function shoot(){
  if(shootCD>0||shootOverheat>0)return
  if(shootAmmo<=0){
    shootOverheat=SHOOT_OVERHEAT_MAX
    beep(180,'square',0.08,0.08,90)
    return
  }
  shootCD=18; shootAmmo--;
  if(shootAmmo===0) shootOverheat=SHOOT_OVERHEAT_MAX
  sfxShoot()
  const px=pl.x+pl.w/2, py=pl.y+pl.h/2
  let dx=pl.face, dy=0
  if(mouseAim.valid){
    const tx=mouseAim.worldX, ty=mouseAim.worldY
    const nx=tx-px, ny=ty-py
    const dist=Math.hypot(nx,ny)||1
    dx=nx/dist; dy=ny/dist
    pl.face = dx>=0?1:-1
  }
  bullets.push({x:px-3,y:py-1,vx:dx*6,vy:dy*6,life:75,w:6,h:3})
}

// ── CÂMERA ──
function updateCamera(){
  if(worldW<=W){ camX=0; return }
  // Segue o jogador mantendo-o no terço esquerdo-central da tela
  const targetCamX = pl.x - W*0.35
  camX += (targetCamX - camX) * 0.12
  camX = Math.max(0, Math.min(worldW - W, camX))
}

// ── UPDATE PLATAFORMAS MÓVEIS ──
function updateMovPlats(){
  for(const mp of movPlats){
    const ox=mp.x,oy=mp.y
    mp.t+=mp.spd*0.03
    if(mp.axis==='x') mp.x=mp.ox+Math.sin(mp.t)*mp.range/2
    else              mp.y=mp.oy+Math.sin(mp.t)*mp.range/2
    // Carrega player junto
    if(aabb(pl,mp)){
      const ot=(pl.y+pl.h)-mp.y,ob=(mp.y+mp.h)-pl.y
      if(ot<ob&&pl.vy>=-0.5){
        if(mp.axis==='x')pl.x+=mp.x-ox
        if(mp.axis==='y')pl.y+=mp.y-oy
      }
    }
    if(currentPhase==='phase1'&&aabb(crate,mp)){
      const ot=(crate.y+crate.h)-mp.y,ob=(mp.y+mp.h)-crate.y
      if(ot<ob){ if(mp.axis==='x')crate.x+=mp.x-ox; if(mp.axis==='y')crate.y+=mp.y-oy }
    }
  }
}

// ── UPDATE CRATE ──
function updateCrate(){
  crate.vy+=GRAV;crate.vy=Math.min(crate.vy,8);crate.vx*=0.85
  crate.x+=crate.vx;crate.y+=crate.vy
  const cs=[...fixedPlats,...movPlats]
  for(const p of cs)resolveY(crate,p)
  for(const p of cs)resolveX(crate,p)
  crate.x=Math.max(8,Math.min(worldW-crate.w-8,crate.x))
  if(crate.y>H){crate.y=270;crate.vy=0}
}

// ── UPDATE BOSS ──
function updateBoss(){
  if(!boss.alive)return
  const hpR=boss.hp/BOSS_MAX_HP
  // Transições de fase
  if(hpR<=0.65&&boss.phase===1){
    boss.phase=2; boss.shootInterval=75
    addParticles(boss.x+boss.w/2,boss.y+boss.h/2,[255,100,0],30,1.4)
    healObjs.push({x:120,y:200,got:false})
  }
  if(hpR<=0.3&&boss.phase===2){
    boss.phase=3; boss.shootInterval=45
    addParticles(boss.x+boss.w/2,boss.y+boss.h/2,[255,20,0],40,1.8)
    healObjs.push({x:360,y:200,got:false})
  }
  if(boss.hurtTimer>0)boss.hurtTimer--
  if(boss.teleportFlash>0)boss.teleportFlash--
  if(boss.patternCD>0)boss.patternCD--
  if(boss.lastTeleportCD>0)boss.lastTeleportCD--

  // ── PADRÃO: ESCUDO (boss invulnerável brevemente na fase 2+) ──
  if(boss.shieldTimer>0){ boss.shieldTimer--; return }

  // ── SELECIONA PRÓXIMO PADRÃO ──
  if(boss.patternCD===0&&boss.patternTimer<=0){
    boss.patternCD = boss.phase>=3?70:100
    boss.patternTimer=0
    // Escolhe padrão aleatório com pesos por fase
    const roll=Math.random()
    if(boss.phase===1){
      // Fase 1: só patrol e dive
      boss.movePattern = roll<0.55 ? 'patrol' : 'dive'
      boss.patternTimer = boss.movePattern==='patrol' ? 180 : 90
    } else if(boss.phase===2){
      // Fase 2: patrol, dive, slam, shield
      if(roll<0.35)       boss.movePattern='patrol'
      else if(roll<0.6)   boss.movePattern='dive'
      else if(roll<0.82)  boss.movePattern='slam'
      else                { boss.movePattern='shield'; boss.shieldTimer=55 }
      boss.patternTimer = 110
    } else {
      // Fase 3: mais ataque e teleport só como especial
      if(roll<0.22)       boss.movePattern='patrol'
      else if(roll<0.44)  boss.movePattern='dive'
      else if(roll<0.62)  boss.movePattern='slam'
      else if(roll<0.84)  boss.movePattern='burst'
      else if(boss.lastTeleportCD===0){ boss.movePattern='teleport'; boss.lastTeleportCD=240 }
      else                { boss.movePattern='shield'; boss.shieldTimer=40 }
      boss.patternTimer=90
    }
    // Prepara o padrão
    if(boss.movePattern==='dive'){
      // Alvo: um pouco na frente do jogador
      boss.diveTarget={x:pl.x+pl.w/2-boss.w/2, y:pl.y+pl.h/2}
      boss.diving=true
      boss.slamWarning=false
    }
    if(boss.movePattern==='slam'){
      boss.slamWarning=true; boss.slamTimer=60; boss.diving=false
    }
    if(boss.movePattern==='teleport'){
      sfxTeleport()
      boss.teleportFlash=24
      // Teleporta para o lado mais distante do player
      const leftTarget = 40
      const rightTarget = W - boss.w - 40
      boss.x = pl.x < W/2 ? rightTarget : leftTarget
      if(Math.abs(boss.x - pl.x) < 80) boss.x = boss.x===leftTarget ? rightTarget : leftTarget
      boss.y = 30
      boss.patternTimer=120
    }
    if(boss.movePattern==='burst'){
      boss.burstCharge=45
      boss.diving=false; boss.slamWarning=false
    }
    if(boss.movePattern==='patrol'){
      boss.diving=false; boss.slamWarning=false
    }
  }
  boss.patternTimer--

  // ── EXECUTA PADRÃO ──
  switch(boss.movePattern){
    case 'patrol':{
      const spd=boss.phase>=3?2.2:boss.phase===2?1.8:1.2
      boss.x+=boss.vx>0?spd:-spd
      if(boss.x<20)          {boss.x=20;boss.vx=1}
      if(boss.x>W-boss.w-20) {boss.x=W-boss.w-20;boss.vx=-1}
      // Gravidade suave no patrol
      boss.vy+=0.02; boss.y+=boss.vy
      if(boss.y<10){boss.y=10;boss.vy=0}
      if(boss.y>80){boss.y=80;boss.vy=-0.5}
      break
    }
    case 'dive':{
      if(boss.diving){
        const tx=boss.diveTarget.x,ty=boss.diveTarget.y
        const dx=tx-boss.x,dy=ty-boss.y
        const dist=Math.sqrt(dx*dx+dy*dy)||1
        const spd=boss.phase>=3?5.2:boss.phase===2?4.3:3.5
        boss.x+=dx/dist*spd; boss.y+=dy/dist*spd
        // Chegou perto → volta pro topo
        if(dist<10){
          boss.diving=false; boss.y=20
          boss.vy=-1.5
          boss.patternTimer=80
          boss.patternCD=40
        }
      } else {
        boss.y-=2; if(boss.y<18){boss.y=18;boss.patternTimer=0}
      }
      break
    }
    case 'slam':{
      if(boss.slamWarning){
        // Aviso piscando, depois mergulha reto para baixo
        boss.slamTimer--
        if(boss.slamTimer<=0){
          boss.slamWarning=false
          boss.vy=boss.phase>=3?12:9
        }
      } else {
        boss.vy+=0.4; boss.y+=boss.vy
        if(boss.y>=boss.groundY){
          boss.y=boss.groundY; boss.vy=0
          sfxSlam()
          // Onde tocou gera onda de impacto
          addParticles(boss.x+boss.w/2,boss.groundY+boss.h/2,[255,80,0],35,2.0)
          // Dano por onda de choque (3 tiles ao redor)
          if(damageCD===0&&Math.abs((pl.x+pl.w/2)-(boss.x+boss.w/2))<80&&pl.y+pl.h>=220){hurt()}
          boss.patternTimer=80; boss.movePattern='patrol'; boss.patternCD=50
        }
      }
      break
    }
    case 'burst':{
      boss.y=18
      if(boss.burstCharge>0){
        boss.burstCharge--
        if(boss.burstCharge<=0){
          sfxBossShoot()
          const bx=boss.x+boss.w/2, by=boss.y+boss.h
          const dx=(pl.x+pl.w/2)-bx, dy=(pl.y+pl.h/2)-by
          const dist=Math.sqrt(dx*dx+dy*dy)||1
          const base= boss.phase>=3?4.2: boss.phase===2?3.6:3.0
          const angles=[-0.5,-0.25,0,0.25,0.5]
          for(const a of angles){
            const vx=(dx/dist+Math.sin(a))*base
            const vy=(dy/dist+Math.cos(a)*0.2)*base
            bossBullets.push({x:bx-3,y:by,vx:vy?vx:base,vy:vy,life:120,w:7,h:7})
          }
          boss.movePattern='patrol'; boss.patternTimer=90; boss.patternCD=50
        }
      }
      break
    }
    case 'teleport':{
      // Após teleporte, dispara uma barragem mais previsível e volta a patrulhar
      const leftTarget = 40
      const rightTarget = W - boss.w - 40
      boss.x = pl.x < W/2 ? rightTarget : leftTarget
      if(Math.abs(boss.x - pl.x) < 80) boss.x = boss.x===leftTarget ? rightTarget : leftTarget
      boss.y = 30
      sfxTeleport()
      boss.teleportFlash=24
      const bx=boss.x+boss.w/2, by=boss.y+boss.h
      const spd=boss.phase>=3?3.2:boss.phase===2?2.6:2.0
      for(const ang of [-0.9,-0.45,0.45,0.9]){
        bossBullets.push({x:bx-3,y:by,vx:Math.sin(ang)*spd,vy:Math.cos(ang)*spd,life:120,w:7,h:7})
      }
      boss.movePattern='patrol'; boss.patternTimer=120
      break
    }
  }

  // ── TIROS AUTOMÁTICOS ──
  boss.shootTimer--
  if(boss.shootTimer<=0&&boss.movePattern!=='slam'&&!boss.slamWarning){
    boss.shootTimer=boss.shootInterval
    sfxBossShoot()
    const bx=boss.x+boss.w/2, by=boss.y+boss.h
    const dx=(pl.x+pl.w/2)-bx, dy=(pl.y+pl.h/2)-by
    const dist=Math.sqrt(dx*dx+dy*dy)||1
    const spd=boss.phase>=3?3.8:boss.phase===2?3.0:2.2
    // Tiro principal
    bossBullets.push({x:bx-3,y:by,vx:dx/dist*spd,vy:dy/dist*spd,life:140,w:7,h:7})
    if(boss.phase>=2){
      // Leque de 3
      bossBullets.push({x:bx-3,y:by,vx:dx/dist*spd-1.4,vy:dy/dist*spd,life:140,w:7,h:7})
      bossBullets.push({x:bx-3,y:by,vx:dx/dist*spd+1.4,vy:dy/dist*spd,life:140,w:7,h:7})
    }
    if(boss.phase>=3){
      // Extra reto para baixo
      bossBullets.push({x:bx-3,y:by,vx:0,vy:spd*1.1,life:140,w:7,h:7})
    }
  }
}

// ── UPDATE BULLETS ──
function updateBullets(){
  if(shootCD>0)shootCD--
  if(shootOverheat>0){
    shootOverheat--
    if(shootOverheat===0) shootAmmo=SHOOT_AMMO_MAX
  }
  for(const b of bullets){
    b.x+=b.vx; b.y+=b.vy; b.life--
    for(const p of allSolids()){if(aabb(b,p)){b.life=0;addParticles(b.x,b.y+1,[255,200,80],4,0.5);break}}
    if(boss.alive&&b.life>0&&boss.shieldTimer===0&&aabb(b,boss)){
      b.life=0; boss.hp--; boss.hurtTimer=14; sfxBossHit()
      addParticles(boss.x+boss.w/2,boss.y+boss.h/2,[255,120,20],12,1.0)
      if(boss.hp<=0){
        boss.alive=false; sfxBossDead(); stopBossMusic()
        addParticles(boss.x+boss.w/2,boss.y+boss.h/2,[255,200,50],80,2.5)
        score+=200; setTimeout(()=>{state='win';sfxWin()},900)
      }
    }
  }
  bullets=bullets.filter(b=>b.life>0)
}

function updateBossBullets(){
  for(const b of bossBullets){
    b.x+=b.vx;b.y+=b.vy;b.life--
    for(const p of fixedPlats){if(aabb(b,p)){b.life=0;break}}
    if(b.life>0&&aabb(playerBox(),b)){b.life=0;hurt()}
  }
  bossBullets=bossBullets.filter(b=>b.life>0)
}

// ── UPDATE PLAYER ──
function updatePlayer(){
  if(damageCD>0)damageCD--
  if(jetCD>0)jetCD--
  if(healCD>0)healCD--

  const jettingNow = held('Space')
  if(jettingNow){
    pl.vy-=charJetForce; pl.vy=Math.max(pl.vy,charMaxSpeedUp)
    pl.jetting=true; addJetTrail()
    if(jetCD===0){sfxJet();jetCD=10}
  } else {
    pl.jetting=false
  }
  pl.vy+=GRAV * (pl.jetting ? 0.35 : 1)
  pl.vy=Math.min(pl.vy,MAXSPEEDDOWN)

  // Movimento horizontal — mais responsivo na fase boss
  const friction = currentPhase==='phase2' ? 0.7 : FRICTION
  if(held('KeyA')||held('ArrowLeft'))       {pl.vx-=WALK_ACCEL;pl.face=-1}
  else if(held('KeyD')||held('ArrowRight')) {pl.vx+=WALK_ACCEL;pl.face=1}
  else                                       {pl.vx*=friction}
  pl.vx=Math.max(-charWalkSpeed,Math.min(charWalkSpeed,pl.vx))

  if(pressed('KeyF')||pressed('KeyJ'))shoot()
  if(pressed('KeyH'))useHeal()

  pl.x+=pl.vx; pl.y+=pl.vy

  // Crate
  if(currentPhase==='phase1'&&selectedLevel!==6){
    const ce={x:crate.x-1,y:crate.y-1,w:crate.w+2,h:crate.h+2}
    if(aabb(pl,ce)){
      const dist=(pl.x+pl.w/2)-(crate.x+crate.w/2)
      if(Math.abs(dist)>5&&pl.y+pl.h>crate.y+4)crate.vx=dist<0?0.2:-0.2
    }
  }

  // Colisões
  const solids=allSolids()
  for(const s of solids)resolveY(pl,s)
  for(const s of solids)resolveX(pl,s)
  for(const s of solids)if(aabb(pl,s))resolveY(pl,s)

  // Push-out fino
  let cL=false,cR=false,cT=false,cB=false,sq=0
  for(const s of solids){
    if(aabb(pl,s)){
      const oT=(pl.y+pl.h)-s.y,oB=(s.y+s.h)-pl.y,oL=(pl.x+pl.w)-s.x,oR=(s.x+s.w)-pl.x
      const mn=Math.min(oT,oB,oL,oR)
      if(oT===mn&&oT<8){pl.y=s.y-pl.h;cT=true;sq++}
      else if(oB===mn&&oB<8){pl.y=s.y+s.h;cB=true;sq++}
      else if(oL===mn){cL=true;sq++}
      else{cR=true;sq++}
    }
  }
  if(damageCD===0&&sq>=2&&((cL&&cR)||(cT&&cB))){hurt();return}

  // Espinhos
  if(damageCD===0){
    for(const sg of spikeGroups){
      const hb=sg.wall?{x:sg.x,y:sg.y,w:sg.w,h:sg.h}:{x:sg.x,y:sg.y,w:sg.w,h:sg.h+14}
      if(aabb(pl,hb)){hurt();return}
    }
  }

  // Limites do mundo
  pl.x=Math.max(8,Math.min(worldW-pl.w-8,pl.x))

  // Queda
  if(pl.y+pl.h>H+20){hurt();respawnPlayer();pl.vy=-1;return}

  // Boss: contato direto
  if(currentPhase==='phase2'&&boss.alive&&damageCD===0&&aabb(playerBox(),boss)){hurt();return}

  // FASE 1 normal: coletar, checkpoint, portal
  if(currentPhase==='phase1'){
    for(const s of starObjs){
      if(!s.got&&aabb(pl,{x:s.x-7,y:s.y-7,w:14,h:14})){
        s.got=true;score+=10;sfxCollect()
        addParticles(s.x,s.y,[255,240,60],18,1.4)
      }
    }
    for(const h of healObjs){
      if(!h.got&&aabb(pl,{x:h.x-7,y:h.y-7,w:14,h:14})){
        h.got=true;healItems++;sfxHeal()
        addParticles(h.x,h.y,[80,255,120],24,1.2)
      }
    }
    // Checkpoints (fase 6)
    for(const cp of checkpointObjs){
      if(!cp.activated&&aabb(pl,cp)){
        cp.activated=true
        checkpointSpawn={x:pl.x,y:pl.y}
        sfxCheckpoint()
        addParticles(cp.x+7,cp.y+12,[80,200,255],25,0.9)
      }
    }
    // Portal
    const sg=starObjs.filter(s=>s.got).length
    if(sg===starObjs.length&&aabb(pl,portal)){
      addParticles(pl.x+pl.w/2,pl.y+pl.h/2,[80,220,255],25,1.2)
      state='transition'
      setTimeout(()=>initBossArena(),600)
    }
  }
  if(currentPhase==='phase2'){
    for(const h of healObjs){
      if(!h.got&&aabb(pl,{x:h.x-7,y:h.y-7,w:14,h:14})){
        h.got=true; healItems++; sfxHeal()
        addParticles(h.x,h.y,[80,255,120],24,1.2)
      }
    }
  }
}

function updateParticles(){
  for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life--}
  particles=particles.filter(p=>p.life>0)
}

// ── GAME LOOP ──
function update(){
  frameN++
  if(state==='character-select'){
    stopMenuMusic()
    if(held('KeyA')||held('ArrowLeft'))selectedCharacter='dave'
    else if(held('KeyD')||held('ArrowRight'))selectedCharacter='cassidy'
    if(pressed('Space')||pressed('Enter'))state='menu'
    clearJust();return
  }
  if(state==='menu'){
    initAudioElements()
    if(menuAudioElem.paused)startMenuMusic()
    if(pressed('Space')||pressed('Enter')){startMenuJingle();stopMenuMusic();state='level-select'}
    if(pressed('KeyA')||pressed('ArrowLeft')||pressed('KeyD')||pressed('ArrowRight'))startMenuJingle()
    clearJust();return
  }
  if(state==='level-select'){
    if(pressed('KeyA')||pressed('ArrowLeft'))selectedLevel=Math.max(1,selectedLevel-1)
    if(pressed('KeyD')||pressed('ArrowRight'))selectedLevel=Math.min(6,selectedLevel+1)
    if(pressed('Space')||pressed('Enter')){initGame();if(AC.state==='suspended')AC.resume()}
    clearJust();return
  }
  if(state==='transition'){updateParticles();clearJust();return}
  if(state==='dying'){
    deathTimer--;updateParticles()
    if(deathTimer<=0)state='dead'
    if(pressed('Space')||pressed('Enter')){stopMusic();stopBossMusic();state='character-select';clearJust();return}
    clearJust();return
  }
  if(state==='dead'||state==='win'){
    updateParticles()
    if(pressed('Space')||pressed('Enter')){stopMusic();stopBossMusic();state='character-select'}
    clearJust();return
  }
  updateMovPlats()
  if(currentPhase==='phase1'&&selectedLevel!==6)updateCrate()
  updatePlayer()
  updateBullets()
  if(currentPhase==='phase2'){updateBoss();updateBossBullets()}
  updateParticles()
  for(const s of starObjs)s.angle+=0.04
  updateCamera()
  clearJust()
}

// ════════════════════════════════════════════════
// DRAW
// ════════════════════════════════════════════════

function drawNebulas(){
  const nbs=currentPhase==='phase2'?nebulas2:nebulas1
  cx.save()
  if(worldW>W)cx.translate(-camX,0)
  for(const n of nbs){
    const grd=cx.createRadialGradient(n.x,n.y,0,n.x,n.y,Math.max(n.rx,n.ry))
    grd.addColorStop(0,`rgba(${n.col[0]},${n.col[1]},${n.col[2]},${n.a})`)
    grd.addColorStop(1,`rgba(${n.col[0]},${n.col[1]},${n.col[2]},0)`)
    cx.save();cx.scale(1,n.ry/n.rx)
    cx.fillStyle=grd;cx.beginPath();cx.arc(n.x,n.y*(n.rx/n.ry),n.rx,0,Math.PI*2);cx.fill()
    cx.restore()
  }
  cx.restore()
}

function drawBgStars(){
  for(const s of bgStarsArr){
    // Parallax leve: estrelas movem mais devagar que o mundo
    const sx=worldW>W?((s.x - camX*0.3 + 1600) % 1600):s.x
    const bri=0.35+0.35*Math.sin(frameN*s.sp+s.ph)
    cx.fillStyle=`rgba(190,210,255,${bri})`
    cx.fillRect(sx|0,s.y|0,s.s|0||1,s.s|0||1)
  }
}

function drawTileBlock(x,y,w,h,base,acc,lit){
  // Converte para espaço de tela
  const sx=x-camX
  if(sx+w<0||sx>W)return
  cx.fillStyle=base||'#1a2a4a';cx.fillRect(sx,y,w,h)
  cx.fillStyle=lit||'#2d4580';cx.fillRect(sx,y,w,2);cx.fillRect(sx,y,2,h)
  cx.fillStyle='rgba(0,0,0,0.35)';cx.fillRect(sx,y+h-1,w,1);cx.fillRect(sx+w-1,y,1,h)
  cx.fillStyle=acc||'#243560'
  for(let px=sx+7;px<sx+w-2;px+=8)cx.fillRect(px,y+1,1,h-2)
  for(let py=y+7;py<y+h-2;py+=8)cx.fillRect(sx+1,py,w-2,1)
}

function drawMovingPlat(mp){
  const sx=mp.x-camX
  if(sx+mp.w<0||sx>W)return
  drawTileBlock(mp.x,mp.y|0,mp.w,mp.h,'#143325','#1e4d38','#2a6648')
  cx.fillStyle=`rgba(60,255,140,${0.15+0.1*Math.sin(frameN*0.08)})`
  cx.fillRect(sx|0,mp.y|0,mp.w,mp.h)
  cx.fillStyle='#3dff8a';cx.fillRect(sx|0,mp.y|0,mp.w,1)
}

function drawSpikes(sg){
  const sx=sg.x-camX
  if(sx+sg.w<-20||sx>W+20)return
  if(sg.wall){
    cx.fillStyle='#0d1828';cx.fillRect(sx,sg.y,sg.w,sg.h)
    const cnt=Math.floor(sg.h/10);cx.fillStyle='#c8ddf0'
    for(let i=0;i<cnt;i++){
      const ty=sg.y+i*10;cx.beginPath()
      if(sg.dir==='right'){cx.moveTo(sx,ty);cx.lineTo(sx+sg.w+7,ty+5);cx.lineTo(sx,ty+10)}
      else{cx.moveTo(sx+sg.w,ty);cx.lineTo(sx-7,ty+5);cx.lineTo(sx+sg.w,ty+10)}
      cx.closePath();cx.fill()
    }
  } else {
    cx.fillStyle='#0d1828';cx.fillRect(sx,sg.y,sg.w,sg.h)
    const cnt=Math.floor(sg.w/9);cx.fillStyle='#c8ddf0'
    for(let i=0;i<cnt;i++){
      const tx=sx+i*9;cx.beginPath()
      if(sg.dir==='down'){cx.moveTo(tx,sg.y+sg.h);cx.lineTo(tx+4.5,sg.y+sg.h+10);cx.lineTo(tx+9,sg.y+sg.h)}
      else{cx.moveTo(tx,sg.y);cx.lineTo(tx+4.5,sg.y-10);cx.lineTo(tx+9,sg.y)}
      cx.closePath();cx.fill()
    }
    cx.fillStyle='#c8ddf0';cx.fillRect(sx,sg.dir==='down'?sg.y+sg.h-1:sg.y,sg.w,1)
  }
}

function drawCrate(){
  const sx=crate.x-camX
  cx.fillStyle='#6b4423';cx.fillRect(sx|0,crate.y|0,crate.w,crate.h)
  cx.fillStyle='#8b5e35';cx.fillRect(sx|0,crate.y|0,crate.w,2);cx.fillRect(sx|0,crate.y|0,2,crate.h)
  cx.fillStyle='#a07040';cx.fillRect((sx+5)|0,(crate.y+3)|0,6,6)
  cx.fillStyle='rgba(0,0,0,0.3)';cx.fillRect((sx+crate.w-2)|0,crate.y|0,2,crate.h)
}

function drawStar(s){
  if(s.got)return
  const sx=s.x-camX
  if(sx<-20||sx>W+20)return
  const pulse=Math.sin(frameN*0.1+s.x)*1.5
  cx.save();cx.translate(sx|0,s.y|0);cx.rotate(s.angle)
  cx.shadowColor='#ffee44';cx.shadowBlur=6
  const r=7+pulse*0.3,ir=3
  cx.fillStyle='#ffee44';cx.beginPath()
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2-Math.PI/2,rad=i%2===0?r:ir
    if(i===0)cx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad)
    else cx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)
  }
  cx.closePath();cx.fill();cx.shadowBlur=0;cx.restore()
}

function drawHealItems(){
  for(const h of healObjs){
    if(h.got)continue
    const sx=h.x-camX
    if(sx<-20||sx>W+20)continue
    const pulse=1+Math.sin(frameN*0.15+h.x)*0.3
    cx.save();cx.translate(sx|0,h.y|0)
    cx.fillStyle='rgba(80,255,140,0.9)'
    cx.beginPath();cx.arc(0,0,5*pulse,0,Math.PI*2);cx.fill()
    cx.fillStyle='#ffffff';cx.fillRect(-1, -4, 2, 8)
    cx.fillRect(-4, -1, 8, 2)
    cx.restore()
  }
}

function drawCrosshair(){
  if(!mouseAim.valid||state!=='playing')return
  const x=mouseAim.x|0, y=mouseAim.y|0
  cx.strokeStyle='rgba(255,255,255,0.85)'
  cx.lineWidth=1
  cx.beginPath();cx.arc(x,y,12,0,Math.PI*2);cx.stroke()
  cx.beginPath();cx.moveTo(x-8,y);cx.lineTo(x+8,y);cx.moveTo(x,y-8);cx.lineTo(x,y+8);cx.stroke()
  cx.fillStyle='rgba(255,255,255,0.4)'
  cx.fillRect(x-1,y-1,2,2)
}

function drawPortal(){
  const sg=starObjs.filter(s=>s.got).length
  const active=sg===starObjs.length
  const sx=portal.x-camX
  const p2=Math.sin(frameN*0.07)
  cx.fillStyle=active?'#00ff88':'#888'
  cx.shadowColor=active?'#00ff88':'#888';cx.shadowBlur=active?8:2
  cx.fillRect(sx,portal.y,portal.w,portal.h)
  cx.strokeStyle=active?`rgba(0,255,100,${0.6+p2*0.4})`:`rgba(100,100,100,${0.3+p2*0.1})`
  cx.lineWidth=1;cx.strokeRect(sx+0.5,portal.y+0.5,portal.w-1,portal.h-1)
  for(let i=0;i<3;i++){
    const py=portal.y+4+i*12+(active?Math.sin(frameN*0.1+i)*2:0)
    cx.fillRect(sx+4,py|0,portal.w-8,2)
  }
  cx.shadowBlur=0;cx.font='5px monospace';cx.textAlign='center'
  cx.fillText(active?'EXIT':'LOCK',sx+portal.w/2,portal.y-4)
}

// ── CHECKPOINTS ──
function drawCheckpoints(){
  for(const cp of checkpointObjs){
    const sx=cp.x-camX
    if(sx<-30||sx>W+30)continue
    const glow=cp.activated?0.8+0.2*Math.sin(frameN*0.1):0.4
    // Poste
    cx.fillStyle=cp.activated?'#00ccff':'#556677'
    cx.fillRect(sx+6,cp.y+10,2,14)
    // Bandeira
    cx.fillStyle=cp.activated?`rgba(0,220,255,${glow})`:'#334455'
    cx.beginPath();cx.moveTo(sx+8,cp.y+10);cx.lineTo(sx+18,cp.y+15);cx.lineTo(sx+8,cp.y+20);cx.closePath();cx.fill()
    if(cp.activated){
      cx.shadowColor='#00ccff';cx.shadowBlur=10
      cx.fillStyle='rgba(0,180,255,0.15)';cx.fillRect(sx-2,cp.y+4,18,22);cx.shadowBlur=0
    }
    cx.font='4px monospace';cx.textAlign='center';cx.fillStyle=cp.activated?'#00ccff':'#556677'
    cx.fillText('CHECK',sx+7,cp.y+3)
  }
}

// ── BOSS ──
function drawBoss(){
  if(!boss.alive)return
  if(boss.teleportFlash>0&&Math.floor(boss.teleportFlash/3)%2===0)return // pisca no teleporte
  const bx=boss.x|0, by=boss.y|0
  const ishurt=boss.hurtTimer>0
  const isShield=boss.shieldTimer>0
  // Aviso de slam
  if(boss.slamWarning){
    const warnA=0.4+0.4*Math.sin(frameN*0.5)
    cx.fillStyle=`rgba(255,50,0,${warnA})`
    cx.fillRect(bx-4,by-4,boss.w+8,boss.h+8)
    // Linha vermelha no chão (mira)
    cx.strokeStyle=`rgba(255,0,0,${warnA})`
    cx.lineWidth=2;cx.setLineDash([4,3])
    cx.beginPath();cx.moveTo(bx+boss.w/2,by+boss.h);cx.lineTo(bx+boss.w/2,boss.groundY+boss.h);cx.stroke()
    cx.setLineDash([])
  }
  // Escudo
  if(isShield){
    const sa=0.5+0.3*Math.sin(frameN*0.2)
    cx.strokeStyle=`rgba(100,200,255,${sa})`
    cx.lineWidth=3;cx.beginPath();cx.arc(bx+boss.w/2,by+boss.h/2,boss.w*0.75,0,Math.PI*2);cx.stroke()
    cx.lineWidth=1
  }
  // Corpo
  const bodyCol=ishurt?'#ffffff':isShield?'#88aaff':boss.phase===3?'#ff1100':boss.phase===2?'#ff6600':'#cc2244'
  cx.fillStyle=bodyCol;cx.fillRect(bx+4,by+10,boss.w-8,boss.h-10)
  // Cabeça
  cx.fillStyle=ishurt?'#ffaaaa':isShield?'#aaccff':'#aa1133'
  cx.fillRect(bx+8,by+2,boss.w-16,12)
  // Olhos
  cx.fillStyle='#ff4400'
  cx.fillRect(bx+10,by+5,5,5);cx.fillRect(bx+boss.w-15,by+5,5,5)
  cx.fillStyle='#ffffff';cx.fillRect(bx+12,by+7,2,2);cx.fillRect(bx+boss.w-13,by+7,2,2)
  // Núcleo pulsante
  const hpR=boss.hp/BOSS_MAX_HP
  const cf=0.5+Math.sin(frameN*0.18)*0.3+(1-hpR)*0.4
  cx.fillStyle=`rgba(255,${60+hpR*120|0},20,${cf})`
  cx.beginPath();cx.arc(bx+boss.w/2,by+boss.h/2+4,8,0,Math.PI*2);cx.fill()
  // Antenas
  cx.fillStyle=ishurt?'#fff':'#ff4422'
  cx.fillRect(bx+5,by-6,3,9);cx.fillRect(bx+boss.w-8,by-6,3,9)
  // Asas
  const wf=Math.sin(frameN*0.28)*5
  cx.fillStyle=isShield?'rgba(80,160,255,0.6)':'rgba(200,40,80,0.6)'
  cx.beginPath();cx.moveTo(bx,by+12);cx.lineTo(bx-14,by+12+wf);cx.lineTo(bx-4,by+24);cx.closePath();cx.fill()
  cx.beginPath();cx.moveTo(bx+boss.w,by+12);cx.lineTo(bx+boss.w+14,by+12+wf);cx.lineTo(bx+boss.w+4,by+24);cx.closePath();cx.fill()
  cx.shadowColor=boss.phase>=2?'rgba(255,20,60,0.9)':'rgba(255,20,60,0.5)'
  cx.shadowBlur=boss.phase>=3?18:boss.phase===2?12:6
  cx.fillStyle='rgba(0,0,0,0)';cx.fillRect(bx,by,boss.w,boss.h);cx.shadowBlur=0
}

function drawBullets(){
  for(const b of bullets){
    const sx=b.x-camX
    cx.fillStyle='#88ffff';cx.shadowColor='#88ffff';cx.shadowBlur=4
    cx.fillRect(sx|0,b.y|0,b.w,b.h)
    cx.fillStyle='rgba(100,220,255,0.35)';cx.fillRect((sx-b.vx*2)|0,b.y|0,b.w,b.h)
    cx.shadowBlur=0
  }
}

function drawBossBullets(){
  for(const b of bossBullets){
    const pulse=0.7+0.3*Math.sin(frameN*0.3+b.x)
    cx.fillStyle=`rgba(255,80,20,${pulse})`
    cx.shadowColor='#ff5010';cx.shadowBlur=6
    cx.beginPath();cx.arc((b.x+3)|0,(b.y+3)|0,4,0,Math.PI*2);cx.fill()
    cx.shadowBlur=0
  }
}

// ── PLAYER: pixel art ──
const DAVE_BODY=[[0,0,2,2,2,2,0,0],[0,2,2,3,3,2,2,0],[0,2,3,4,4,3,2,0],[0,2,2,2,2,2,2,0],[0,0,2,2,2,2,0,0]]
const DAVE_HEAD=[[0,1,1,1,1,1,0],[1,1,5,5,1,1,1],[1,1,5,6,1,1,1],[0,1,1,1,1,1,0]]
const DAVE_HELMET=[[0,7,7,7,7,7,0],[7,7,7,7,7,7,7]]
const DAVE_LEGS=[[0,1,0,1,0],[0,1,0,1,0],[0,8,0,8,0]]
const CASSIDY_BODY=[[0,0,2,2,2,2,0,0],[0,2,2,4,4,2,2,0],[0,2,4,4,4,4,2,0],[0,2,2,4,4,2,2,0],[0,0,2,2,2,2,0,0]]
const CASSIDY_HEAD=[[0,1,1,1,1,1,0],[1,1,5,6,5,1,1],[1,1,5,1,5,1,1],[0,1,1,1,1,1,0]]
const CASSIDY_HELMET=[[0,7,7,7,7,7,0],[7,7,7,7,7,7,7]]
const CASSIDY_LEGS=[[1,0,1,0,1],[1,0,1,0,1],[8,0,8,0,8]]
const PLR_PAL={1:'#f5c88a',2:'#e07830',3:'#f5a040',4:'#ffe0a0',5:'#ffffff',6:'#1a2060',7:'#b05818',8:'#2a1a08'}
const PLR_PAL_C={1:'#e0a8d8',2:'#c070a0',3:'#d08cb8',4:'#f0d0f0',5:'#ffffff',6:'#2a1060',7:'#a05888',8:'#3a1a38'}
const PLR_HURT={1:'#ff9090',2:'#ff5050',3:'#ff7070',4:'#ffb0b0',5:'#ffffff',6:'#440000',7:'#ff3030',8:'#330000'}
const PLR_C_HURT={1:'#ff90c0',2:'#ff5090',3:'#ff70b0',4:'#ffb0d0',5:'#ffffff',6:'#440020',7:'#ff3070',8:'#330018'}
function drawPx(data,x,y,pal,sc){
  for(let r=0;r<data.length;r++)for(let c=0;c<data[r].length;c++){
    const v=data[r][c];if(!v)continue
    cx.fillStyle=pal[v];cx.fillRect((x+c*sc)|0,(y+r*sc)|0,sc,sc)
  }
}

function drawPlayer(){
  if(state==='dying')return
  const vis=damageCD===0||Math.floor(damageCD/6)%2===0
  if(!vis)return
  const sc=selectedCharacter==='cassidy'
  const body=sc?CASSIDY_BODY:DAVE_BODY,head=sc?CASSIDY_HEAD:DAVE_HEAD
  const helm=sc?CASSIDY_HELMET:DAVE_HELMET,legs=sc?CASSIDY_LEGS:DAVE_LEGS
  const pal=sc?(damageCD>0?PLR_C_HURT:PLR_PAL_C):(damageCD>0?PLR_HURT:PLR_PAL)
  const sx=(pl.x+pl.w/2-camX)|0
  cx.save();cx.translate(sx,pl.y|0)
  if(pl.face<0)cx.scale(-1,1)
  const ox=-5
  drawPx(helm,ox-1,-1,pal,1);drawPx(head,ox,2,pal,1);drawPx(body,ox-1,6,pal,1)
  cx.fillStyle='#5a7088';cx.fillRect(ox-5,7,4,6)
  cx.fillStyle='#3a5068';cx.fillRect(ox-6,8,3,5)
  if(pl.jetting){
    const f=frameN%4<2
    cx.fillStyle=f?'#ff8800':'#ffcc00';cx.fillRect(ox-5,13,3,4)
    cx.fillStyle='#ffffff';cx.fillRect(ox-4,14,2,2)
  }
  drawPx(legs,ox,11,pal,1)
  cx.restore()
}

function drawParticles(){
  for(const p of particles){
    const a=p.life/p.ml
    cx.globalAlpha=a*0.9
    cx.fillStyle=`rgb(${p.r},${p.g},${p.b})`
    const sx=p.x-camX
    cx.fillRect((sx-1.5)|0,(p.y-1.5)|0,3,3)
  }
  cx.globalAlpha=1
}

// ── HUD ──
function drawHUD(){
  cx.font='7px monospace';cx.textAlign='left'
  // Vidas
  cx.fillStyle='rgba(4,6,20,0.8)';cx.fillRect(4,4,54,13)
  for(let i=0;i<3;i++){cx.fillStyle=i<lives?'#ee3333':'#2a1525';cx.fillText('♥',8+i*16,14)}
  // Cura
  cx.fillStyle='rgba(4,6,20,0.8)';cx.fillRect(4,20,60,13)
  cx.fillStyle=healItems>0?'#44ff88':'#1a3a1a'
  cx.fillText(`[H]♥ x${healItems}`,8,30)
  cx.fillStyle='rgba(4,6,20,0.8)';cx.fillRect(4,36,96,13)
  cx.fillStyle=shootOverheat>0?'#ff6666':'#88ccff'
  cx.font='6px monospace';cx.fillText(shootOverheat>0?`SOBRECARGA ${Math.ceil(shootOverheat/60)}s`:`TIROS ${shootAmmo}/${SHOOT_AMMO_MAX}`,8,46)
  cx.font='7px monospace';
  // Centro
  cx.fillStyle='rgba(4,6,20,0.75)';cx.fillRect(W/2-45,4,90,13)
  cx.textAlign='center'
  if(currentPhase==='phase1'){
    const sg=starObjs.filter(s=>s.got).length
    cx.fillStyle=sg===starObjs.length?'#00ff88':'#ffee44'
    cx.fillText(`★ ${sg}/${starObjs.length}  +${score}`,W/2,14)
  } else {
    cx.fillStyle='#ff4444';cx.fillText(`BOSS  ${score}pts`,W/2,14)
  }
  // Barra boss
  if(currentPhase==='phase2'&&boss.alive){
    const bw=200,bh=10,bx=(W-bw)/2,by=H-20
    cx.fillStyle='rgba(4,6,20,0.85)';cx.fillRect(bx-4,by-15,bw+8,bh+20)
    cx.font='6px monospace';cx.textAlign='center';cx.fillStyle='#ff4444'
    const pname=['','NORMAL','ENRAIVECIDO!','FRENESI!!!']
    cx.fillText(`BOSS  [${pname[boss.phase]}]`,W/2,by-5)
    cx.fillStyle='#1a0a0a';cx.fillRect(bx,by,bw,bh)
    const hpR=boss.hp/BOSS_MAX_HP
    const bc=boss.shieldTimer>0?'#88aaff':boss.phase===3?'#ff1100':boss.phase===2?'#ff6600':'#cc2244'
    cx.fillStyle=bc;cx.fillRect(bx,by,(bw*hpR)|0,bh)
    const sh=Math.sin(frameN*0.15)*0.15+0.15
    cx.fillStyle=`rgba(255,150,100,${sh})`;cx.fillRect(bx,by,(bw*hpR)|0,bh/2)
    cx.strokeStyle='#660000';cx.lineWidth=1;cx.strokeRect(bx,by,bw,bh)
    cx.fillStyle='#ffaaaa';cx.font='5px monospace';cx.textAlign='center'
    cx.fillText(`${boss.hp} / ${BOSS_MAX_HP}`,W/2,by+bh+6)
    if(boss.shieldTimer>0){cx.fillStyle='#88aaff';cx.fillText('ESCUDO ATIVO!',W/2-80,by+bh/2+2)}
  }
  // Score
  cx.fillStyle='rgba(4,6,20,0.75)';cx.fillRect(W-64,4,60,13)
  cx.fillStyle='#88aaff';cx.textAlign='right';cx.fillText(`PTS ${score}`,W-6,14)
  // Dica fase 1
  if(currentPhase==='phase1'){
    const sg=starObjs.filter(s=>s.got).length
    if(sg<starObjs.length){
      cx.fillStyle='rgba(200,100,50,0.8)';cx.fillRect(W/2-85,H-20,170,16)
      cx.fillStyle='#ffaa44';cx.font='6px monospace';cx.textAlign='center'
      cx.fillText(`Colete ${starObjs.length-sg} estrela(s) p/ sair!`,W/2,H-10)
    }
  }
  // Controles fase boss
  if(currentPhase==='phase2'){
    cx.fillStyle='rgba(4,6,20,0.6)';cx.fillRect(4,H-18,142,14)
    cx.fillStyle='#6688aa';cx.font='5px monospace';cx.textAlign='left'
    cx.fillText('F=ATIRAR  H=CURAR  SPACE=JETPACK',8,H-8)
  }
  // Barra de scroll (fase 6)
  if(currentPhase==='phase1'&&worldW>W){
    const prog=pl.x/worldW
    const bw=100
    cx.fillStyle='rgba(4,6,20,0.6)';cx.fillRect(W/2-bw/2,H-12,bw,6)
    cx.fillStyle='#00ccff';cx.fillRect(W/2-bw/2,H-12,(bw*prog)|0,6)
    // Marca do checkpoint
    for(const cp of checkpointObjs){
      const cx2=W/2-bw/2+(bw*cp.x/worldW)|0
      cx.fillStyle=cp.activated?'#00ccff':'#335566';cx.fillRect(cx2,H-14,2,10)
    }
    cx.fillStyle='#00ff88';cx.fillRect(W/2-bw/2+(bw*portal.x/worldW)|0,H-14,2,10)
  }
  cx.textAlign='left';cx.font='7px monospace'
}

function drawOverlay(title,tc,s1,s2,gc){
  cx.fillStyle='rgba(4,6,22,0.88)';cx.fillRect(0,0,W,H)
  cx.save();cx.font='bold 22px monospace';cx.textAlign='center'
  cx.fillStyle=tc;cx.shadowColor=gc;cx.shadowBlur=16
  cx.fillText(title,W/2,100);cx.shadowBlur=0
  cx.font='8px monospace';cx.fillStyle='#aaccee'
  cx.fillText(s1,W/2,125);cx.fillText(s2,W/2,138)
  const blink=Math.floor(frameN/22)%2
  cx.fillStyle=blink?'#ffffff':'#445566';cx.fillText('[ SPACE ] MENU',W/2,165)
  cx.restore()
}

function drawTransition(){
  cx.fillStyle='rgba(255,80,20,0.5)';cx.fillRect(0,0,W,H)
  cx.save();cx.font='bold 18px monospace';cx.textAlign='center'
  cx.fillStyle='#ffffff';cx.shadowColor='#ff4400';cx.shadowBlur=16
  cx.fillText('FASE CONCLUÍDA!',W/2,108);cx.shadowBlur=0
  cx.font='8px monospace';cx.fillStyle='#ffccaa'
  cx.fillText('ADENTRANDO A ARENA DO BOSS...',W/2,128)
  cx.restore()
}

function drawArenaBackground(){
  cx.fillStyle='rgba(60,10,5,0.35)';cx.fillRect(0,0,W,H)
  cx.strokeStyle='rgba(80,15,8,0.25)';cx.lineWidth=1
  for(let x=0;x<W;x+=40){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke()}
  for(let y=0;y<H;y+=40){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke()}
}

function drawMenuScreen(){
  cx.fillStyle='rgba(4,6,22,0.85)';cx.fillRect(0,0,W,H)
  for(const star of menuStars){
    star.x+=star.vx;star.y+=star.vy
    if(star.x>W+5)star.x=-5
    if(star.y<-5||star.y>H+5){star.y=Math.random()*H;star.x=-5}
    cx.fillStyle=`rgba(255,255,200,${star.opacity})`;cx.fillRect(star.x,star.y,star.size,star.size)
  }
  cx.save();cx.textAlign='center'
  const bob=Math.sin(frameN*0.03)*4,rot=Math.sin(frameN*0.02)*4*Math.PI/180
  if(logoImg.complete&&logoImg.width>0){
    cx.save();cx.translate(W/2,20+bob+60);cx.rotate(rot);cx.drawImage(logoImg,-120,-60,240,120);cx.restore()
  } else {
    cx.font='bold 20px monospace';cx.fillStyle='#00eeff';cx.shadowColor='#00eeff';cx.shadowBlur=12
    cx.fillText('DAVE SPACE DIVER',W/2,70+bob);cx.shadowBlur=0
  }
  const blink=Math.floor(frameN/22)%2
  cx.fillStyle=blink?'#ffffff':'#556688';cx.shadowColor=blink?'#aaddff':'transparent';cx.shadowBlur=blink?6:0
  cx.font='8px monospace';cx.fillText('[ SPACE ] PARA JOGAR',W/2,145);cx.shadowBlur=0
  cx.fillStyle='#445566';cx.font='6px monospace'
  cx.fillText('A/D=MOVER  SPACE=JETPACK  F=ATIRAR  H=CURAR',W/2,165)
  cx.fillText('FASES 1-5 NORMAIS  |  FASE 6 = SCROLL + BOSS',W/2,177)
  cx.restore()
}

function drawLevelSelect(){
  cx.fillStyle='rgba(4,6,22,0.88)';cx.fillRect(0,0,W,H)
  cx.save();cx.font='bold 18px monospace';cx.textAlign='center'
  cx.fillStyle='#00ff88';cx.shadowColor='#00ff88';cx.shadowBlur=12
  cx.fillText('ESCOLHA A FASE',W/2,32);cx.shadowBlur=0
  const configs=[
    {col:{bgA:'#1a3a2a',bgI:'#0a1a0a',borA:'#00ff88',borI:'#004422',tx:'#88ff88',st:'#88dd88'}},
    {col:{bgA:'#3a2a1a',bgI:'#1a1a0a',borA:'#ffff00',borI:'#666600',tx:'#ffff88',st:'#ffdd88'}},
    {col:{bgA:'#3a1a2a',bgI:'#1a0a0a',borA:'#ff0088',borI:'#660033',tx:'#ff88cc',st:'#ff88bb'}},
    {col:{bgA:'#2a3a1a',bgI:'#1a1a0a',borA:'#ffff00',borI:'#666600',tx:'#ffff88',st:'#ffdd88'}},
    {col:{bgA:'#1a2a3a',bgI:'#0a1a1a',borA:'#00ffff',borI:'#004466',tx:'#88ffff',st:'#88dddd'}},
    {col:{bgA:'#2a1a3a',bgI:'#180a28',borA:'#ff44ff',borI:'#660066',tx:'#ff88ff',st:'#ff66ff'}},
  ]
  for(let i=1;i<=6;i++){
    const c=configs[i-1].col
    const x=15+(i-1)*75, y=60, cs=65
    const sel=selectedLevel===i
    cx.fillStyle=sel?c.bgA:c.bgI;cx.fillRect(x,y,cs,cs)
    cx.strokeStyle=sel?c.borA:c.borI;cx.lineWidth=2;cx.strokeRect(x,y,cs,cs)
    cx.fillStyle=c.tx;cx.font='bold 9px monospace';cx.textAlign='center'
    cx.fillText(`FASE ${i}`,x+cs/2,y+14)
    const ld=i===6?LEVEL6:(LEVELS[i]||LEVELS[1])
    cx.font='5px monospace';cx.fillStyle=c.st
    const words=ld.desc.split(' ');let line=0
    for(const w of words){if(line<2){cx.fillText(w,x+cs/2,y+23+line*8);line++}}
    if(i===6){
      cx.fillStyle='#ff88ff';cx.font='5px monospace'
      cx.fillText('↔ SCROLL',x+cs/2,y+55)
      cx.fillText('+ BOSS',x+cs/2,y+62)
    } else {
      cx.font='bold 6px monospace';cx.fillStyle=c.st
      cx.fillText('★'.repeat(Math.min(4,i))+'☆'.repeat(4-Math.min(4,i)),x+cs/2,y+56)
    }
  }
  const blink=Math.floor(frameN/22)%2
  cx.fillStyle=blink?'#ffffff':'#445566';cx.font='6px monospace';cx.textAlign='center'
  cx.fillText('A/D p/ selecionar  ·  SPACE p/ começar',W/2,152)
  cx.fillStyle='#ffaa44';cx.font='bold 6px monospace'
  cx.fillText('FASE 6: NÍVEL LONGO COM SCROLL → ARENA DO BOSS',W/2,166)
  cx.restore()
}

function drawCharacterSelect(){
  cx.fillStyle='rgba(4,6,22,0.88)';cx.fillRect(0,0,W,H)
  cx.save();cx.font='bold 18px monospace';cx.textAlign='center'
  cx.fillStyle='#00eeff';cx.shadowColor='#00eeff';cx.shadowBlur=12
  cx.fillText('ESCOLHA SEU ASTRONAUTA',W/2,50);cx.shadowBlur=0
  const daveBg=selectedCharacter==='dave'?'#1a4a60':'#0a2a40'
  cx.fillStyle=daveBg;cx.fillRect(20,80,200,150)
  cx.strokeStyle=selectedCharacter==='dave'?'#00ff88':'#004466';cx.lineWidth=2;cx.strokeRect(20,80,200,150)
  cx.fillStyle='#ffdd88';cx.font='bold 14px monospace';cx.textAlign='center';cx.fillText('DAVE',120,100)
  cx.save();cx.translate(120,130);cx.scale(2,2)
  drawPx(DAVE_HELMET,-3,-1,PLR_PAL,1);drawPx(DAVE_HEAD,-2,2,PLR_PAL,1)
  drawPx(DAVE_BODY,-3,6,PLR_PAL,1);drawPx(DAVE_LEGS,-2,11,PLR_PAL,1)
  cx.restore()
  cx.fillStyle='#88aacc';cx.font='7px monospace';cx.textAlign='center'
  cx.fillText('Velocidade média',120,195);cx.fillText('Jetpack normal',120,205)
  cx.fillStyle=selectedCharacter==='cassidy'?'#4a1a6a':'#2a0a4a'
  cx.fillRect(260,80,200,150)
  cx.strokeStyle=selectedCharacter==='cassidy'?'#ff00ff':'#660088';cx.lineWidth=2;cx.strokeRect(260,80,200,150)
  cx.fillStyle='#ffaaff';cx.font='bold 14px monospace';cx.textAlign='center';cx.fillText('CASSIDY',360,100)
  cx.save();cx.translate(360,130);cx.scale(2,2)
  drawPx(CASSIDY_HELMET,-3,-1,PLR_PAL_C,1);drawPx(CASSIDY_HEAD,-2,2,PLR_PAL_C,1)
  drawPx(CASSIDY_BODY,-3,6,PLR_PAL_C,1);drawPx(CASSIDY_LEGS,-2,11,PLR_PAL_C,1)
  cx.restore()
  cx.fillStyle='#dd88ff';cx.font='7px monospace';cx.textAlign='center'
  cx.fillText('Velocidade alta',360,195);cx.fillText('Jetpack reforçado',360,205)
  const blink=Math.floor(frameN/22)%2
  cx.fillStyle=blink?'#ffffff':'#445566';cx.font='8px monospace';cx.textAlign='center'
  cx.fillText('A/D selecionar  ·  [ SPACE ] começar',W/2,260)
  cx.restore()
}

// ── DRAW PRINCIPAL ──
function draw(){
  const isArena=currentPhase==='phase2'
  cx.fillStyle=isArena?'#120303':'#07091f';cx.fillRect(0,0,W,H)
  drawBgStars()
  drawNebulas()
  if(state==='character-select'){drawCharacterSelect();return}
  if(state==='menu'){drawMenuScreen();return}
  if(state==='level-select'){drawLevelSelect();return}
  if(state==='transition'){drawTransition();drawParticles();return}
  if(isArena)drawArenaBackground()
  for(const sg of spikeGroups)drawSpikes(sg)
  for(const fp of fixedPlats)drawTileBlock(fp.x,fp.y,fp.w,fp.h,fp.col||'#1a2a4a','#243560','#2d4580')
  for(const mp of movPlats)drawMovingPlat(mp)
  if(currentPhase==='phase1'){
    if(selectedLevel!==6)drawCrate()
    for(const s of starObjs)drawStar(s)
    drawHealItems()
    drawPortal()
    drawCheckpoints()
  }
  drawBoss()
  drawBossBullets()
  drawBullets()
  drawParticles()
  drawPlayer()
  if(damageCD>0&&damageCD<130){
    cx.fillStyle=`rgba(255,40,40,${(damageCD/130)*0.35})`;cx.fillRect(0,0,W,H)
  }
  cx.font='7px monospace';cx.textAlign='left'
  drawHUD()
  drawCrosshair()
  if(state==='dead'){
    const msg=currentPhase==='phase2'?'BOSS DERROTOU VOCÊ...':'GAME OVER!'
    drawOverlay('GAME OVER','#ff4444',`PONTUAÇÃO: ${score} pts`,msg,'#ff2222')
  }
  if(state==='win'){
    drawOverlay('YOU WIN!','#ffee44',`PONTUAÇÃO FINAL: ${score} pts`,'BOSS DERROTADO! PARABÉNS!','#ffdd00')
  }
}

let lastTime=0
function loop(ts){
  const dt=ts-lastTime;lastTime=ts
  if(dt<500){update();draw()}
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
