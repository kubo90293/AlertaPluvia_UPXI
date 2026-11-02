// --- LÓGICA DE GERENCIAMENTO DE TEMA (CLARO / ESCURO) ---
let currentThemeSetting = 'light'; // 'light', 'dark', 'auto'

function setAppTheme(theme) {
  currentThemeSetting = theme;
  const htmlEl = document.documentElement;

  let isDark = false;
  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'auto') {
    const hour = new Date().getHours();
    isDark = (hour >= 18 || hour < 6);
  }

  if (isDark) {
    htmlEl.classList.add('dark');
  } else {
    htmlEl.classList.remove('dark');
  }

  updateThemeUIButtons(theme);
}

function updateThemeUIButtons(activeTheme) {
  const btnLight = document.getElementById('btnThemeLight');
  const btnAuto = document.getElementById('btnThemeAuto');
  const btnDark = document.getElementById('btnThemeDark');

  const activeClasses = 'bg-blue-500 text-white shadow-md border-blue-400';
  const inactiveClasses = 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60';

  [btnLight, btnAuto, btnDark].forEach(btn => {
    if (btn) btn.className = `rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${inactiveClasses}`;
  });

  if (activeTheme === 'light' && btnLight) btnLight.className = `rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${activeClasses}`;
  if (activeTheme === 'auto' && btnAuto) btnAuto.className = `rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${activeClasses}`;
  if (activeTheme === 'dark' && btnDark) btnDark.className = `rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${activeClasses}`;
}

// Inicializa o Tema Padrão
setAppTheme('light');

// --- LÓGICA DE NAVEGAÇÃO DE ABAS ---
function switchTab(tabId, el = null) {
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById('view-' + tabId).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.remove('active');
    const icon = nav.querySelector('i');
    if (icon) icon.className = icon.className.replace('ph-fill', 'ph');
  });

  if (el) {
    el.classList.add('active');
    const activeIcon = el.querySelector('i');
    if (activeIcon) activeIcon.className = activeIcon.className.replace('ph', 'ph-fill');
  } else {
    const targetNav = document.querySelector(`.nav-item[data-target="view-${tabId}"]`);
    if (targetNav) {
      targetNav.classList.add('active');
      const icon = targetNav.querySelector('i');
      if (icon) icon.className = icon.className.replace('ph', 'ph-fill');
    }
  }
}

// Toggle Switch de Notificações/Localização
function toggleSwitch(id) {
  const btn = document.getElementById(id);
  const circle = btn.querySelector('div');
  const isChecked = btn.classList.contains('bg-blue-500');

  if (isChecked) {
    btn.classList.remove('bg-blue-500');
    btn.classList.add('bg-slate-300', 'dark:bg-slate-700');
    circle.classList.remove('translate-x-5');
    circle.classList.add('translate-x-0');
  } else {
    btn.classList.remove('bg-slate-300', 'dark:bg-slate-700');
    btn.classList.add('bg-blue-500');
    circle.classList.remove('translate-x-0');
    circle.classList.add('translate-x-5');
  }
}

// --- INTEGRACAO FIREBASE EM TEMPO REAL ---
const firebaseConfig = {
  databaseURL: "https://alertapluvial-default-rtdb.firebaseio.com/"
};

try {
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const bueiroRef = database.ref('bueiro');

  bueiroRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      atualizarInterface(data);
    }
  });
} catch(e) {
  console.log("Aguardando conexao com Firebase...", e);
}

function atualizarInterface(data) {
  const pct = parseFloat(data.porcentagem_preenchimento || 0).toFixed(1);
  const dist = parseFloat(data.distancia_cm || 0).toFixed(1);
  const status = data.status || "NORMAL";

  // Elementos Início
  const homeCard = document.getElementById('homeStatusCard');
  const homeIconBg = document.getElementById('homeStatusIconBg');
  const homeIcon = document.getElementById('homeStatusIcon');
  const homeTitle = document.getElementById('homeStatusTitle');
  const homeDesc = document.getElementById('homeStatusDesc');
  const homeWaterLevel = document.getElementById('homeWaterLevel');
  const homeWaterDist = document.getElementById('homeWaterDist');

  // Elementos Alertas
  const alertColorReal = document.getElementById('alertColorReal');
  const alertIconBgReal = document.getElementById('alertIconBgReal');
  const alertIconReal = document.getElementById('alertIconReal');
  const alertStatusTextReal = document.getElementById('alertStatusTextReal');
  const alertLevelReal = document.getElementById('alertLevelReal');

  // Elementos Mapa
  const mapPinReal = document.getElementById('mapPinReal');

  // Atualiza textos
  if (homeWaterLevel) homeWaterLevel.innerText = `${pct}%`;
  if (homeWaterDist) homeWaterDist.innerText = `${dist} cm`;
  if (alertLevelReal) alertLevelReal.innerText = pct;

  // Estado do Nível da Água
  if (status === "EMERGENCIA" || pct >= 80) {
    // --- SITUAÇÃO CRÍTICA (VERMELHO) ---
    if (homeCard) homeCard.className = "status-critical rounded-3xl p-5 mb-5 shadow-sm transition-all duration-500";
    if (homeIcon) homeIcon.className = "ph-fill ph-warning-octagon text-2xl text-red-600 dark:text-red-400";
    if (homeTitle) homeTitle.innerText = "Situação crítica";
    if (homeDesc) homeDesc.innerText = "Há um ponto com risco elevado de alagamento na sua região.";

    if (alertColorReal) alertColorReal.className = "absolute left-0 top-0 bottom-0 w-2 bg-red-500";
    if (alertIconBgReal) alertIconBgReal.className = "w-11 h-11 rounded-full bg-red-100 dark:bg-red-950/80 flex items-center justify-center text-red-500 text-2xl shrink-0 ml-1";
    if (alertIconReal) alertIconReal.className = "ph-fill ph-warning-octagon";
    if (alertStatusTextReal) {
      alertStatusTextReal.className = "text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5";
      alertStatusTextReal.innerText = "Situação crítica";
    }

    if (mapPinReal) {
      mapPinReal.className = "w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-600 dark:text-red-400 shadow-md z-10 animate-bounce";
      mapPinReal.innerHTML = '<i class="ph-fill ph-warning-octagon text-lg"></i>';
    }

  } else if (status === "ATENCAO" || pct >= 50) {
    // --- SITUAÇÃO DE ATENÇÃO (AMARELO) ---
    if (homeCard) homeCard.className = "status-attention rounded-3xl p-5 mb-5 shadow-sm transition-all duration-500";
    if (homeIcon) homeIcon.className = "ph-fill ph-warning-circle text-2xl text-amber-600 dark:text-amber-400";
    if (homeTitle) homeTitle.innerText = "Situação de atenção";
    if (homeDesc) homeDesc.innerText = "Foi identificado um ponto com risco de alagamento na sua região.";

    if (alertColorReal) alertColorReal.className = "absolute left-0 top-0 bottom-0 w-2 bg-amber-500";
    if (alertIconBgReal) alertIconBgReal.className = "w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-500 text-2xl shrink-0 ml-1";
    if (alertIconReal) alertIconReal.className = "ph-fill ph-warning-circle";
    if (alertStatusTextReal) {
      alertStatusTextReal.className = "text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5";
      alertStatusTextReal.innerText = "Situação de atenção";
    }

    if (mapPinReal) {
      mapPinReal.className = "w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md z-10";
      mapPinReal.innerHTML = '<i class="ph-fill ph-warning-circle text-lg"></i>';
    }

  } else {
    // --- SITUAÇÃO NORMAL (VERDE) ---
    if (homeCard) homeCard.className = "status-normal rounded-3xl p-5 mb-5 shadow-sm transition-all duration-500";
    if (homeIcon) homeIcon.className = "ph-fill ph-check-circle text-2xl text-emerald-600 dark:text-emerald-400";
    if (homeTitle) homeTitle.innerText = "Situação normal";
    if (homeDesc) homeDesc.innerText = "Não há riscos de alagamento próximos à sua região.";

    if (alertColorReal) alertColorReal.className = "absolute left-0 top-0 bottom-0 w-2 bg-emerald-500";
    if (alertIconBgReal) alertIconBgReal.className = "w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-500 text-2xl shrink-0 ml-1";
    if (alertIconReal) alertIconReal.className = "ph-fill ph-check-circle";
    if (alertStatusTextReal) {
      alertStatusTextReal.className = "text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5";
      alertStatusTextReal.innerText = "Situação normal";
    }

    if (mapPinReal) {
      mapPinReal.className = "w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md z-10";
      mapPinReal.innerHTML = '<i class="ph-fill ph-check-circle text-lg"></i>';
    }
  }
}