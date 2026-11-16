// --- LÓGICA DE GERENCIAMENTO DE TEMA (CLARO / ESCURO) ---
let currentThemeSetting = 'light'; // 'light', 'dark', 'auto'
let mapTileLayer = null;

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
  updateMapThemeTiles(isDark);
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

  // Corrige o tamanho do mapa Leaflet ao abrir a aba Mapa
  if (tabId === 'map' && realMap) {
    setTimeout(() => {
      realMap.invalidateSize();
    }, 150);
  }
}

// Pesquisa rápida vinda da tela Início
function searchFromHome() {
  const homeQuery = document.getElementById('homeSearchInput')?.value || '';
  switchTab('map');
  const mapInput = document.getElementById('mapSearchInput');
  if (mapInput) {
    mapInput.value = homeQuery;
    filterRealMap();
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

// ==========================================
// MAPA REAL COM LEAFLET.JS (SOROCABA)
// ==========================================
let realMap = null;
let userMarker = null;
let currentMapFilter = 'all';

// Pontos monitorados em Sorocaba
const bueirosData = [
  {
    id: 'bueiro01',
    name: 'Bueiro #01 (IoT Ao Vivo)',
    shortLabel: 'Bueiro #01',
    address: 'Praça Coronel Fernando Prestes - Centro',
    lat: -23.5015,
    lng: -47.4581,
    status: 'normal',
    level: '--%',
    isReal: true
  },
  {
    id: 'bueiro017',
    name: 'Bueiro #017',
    shortLabel: '#017',
    address: 'Av. Itavuvu, 456 - Jardim São Paulo',
    lat: -23.4792,
    lng: -47.4695,
    status: 'attention',
    level: '58%',
    isReal: false
  },
  {
    id: 'bueiro011',
    name: 'Bueiro #011',
    shortLabel: '#011',
    address: 'Av. Dom Aguirre (Altura Ponte Pinheiros)',
    lat: -23.4958,
    lng: -47.4488,
    status: 'critical',
    level: '82%',
    isReal: false
  },
  {
    id: 'bueiro004',
    name: 'Bueiro #004',
    shortLabel: '#004',
    address: 'Av. Afonso Vergueiro - Centro',
    lat: -23.5062,
    lng: -47.4642,
    status: 'normal',
    level: '18%',
    isReal: false
  }
];

const leafletMarkers = {};

function createCustomPinIcon(status, label) {
  let borderColor = '#10b981';
  let bgColor = '#ecfdf5';
  let textColor = '#059669';
  let iconClass = 'ph-fill ph-check-circle';
  let pulseHtml = '';

  if (status === 'critical') {
    borderColor = '#ef4444';
    bgColor = '#fef2f2';
    textColor = '#dc2626';
    iconClass = 'ph-fill ph-warning-octagon';
    pulseHtml = `<span style="position:absolute; inset:-6px; border-radius:9999px; background:rgba(239,68,68,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`;
  } else if (status === 'attention') {
    borderColor = '#f59e0b';
    bgColor = '#fffbeb';
    textColor = '#d97706';
    iconClass = 'ph-fill ph-warning-circle';
  }

  return L.divIcon({
    className: 'custom-waterbit-pin',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%);">
        <div style="position:relative; width:36px; height:36px; border-radius:9999px; background:${bgColor}; border:2.5px solid ${borderColor}; display:flex; align-items:center; justify-content:center; color:${textColor}; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          ${pulseHtml}
          <i class="${iconClass}" style="font-size:18px; position:relative; z-index:2;"></i>
        </div>
        <span style="margin-top:3px; background:rgba(15,23,42,0.88); color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:6px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
          ${label}
        </span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function initRealMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || typeof L === 'undefined') return;

  realMap = L.map('leafletMap', {
    center: [-23.4965, -47.4585],
    zoom: 14,
    zoomControl: true
  });

  const isDark = document.documentElement.classList.contains('dark');
  updateMapThemeTiles(isDark);

  // Adiciona os marcadores no mapa
  bueirosData.forEach(item => {
    const marker = L.marker([item.lat, item.lng], {
      icon: createCustomPinIcon(item.status, item.shortLabel)
    }).addTo(realMap);

    marker.on('click', () => {
      openMapPopup(item);
      realMap.flyTo([item.lat - 0.002, item.lng], 15, { duration: 0.6 });
    });

    leafletMarkers[item.id] = marker;
  });

  realMap.on('click', () => {
    closeMapPopup();
  });
}

function updateMapThemeTiles(isDark) {
  if (!realMap || typeof L === 'undefined') return;

  if (mapTileLayer) {
    realMap.removeLayer(mapTileLayer);
  }

  // OpenStreetMap oficial (100% gratuito e sem API key)
  mapTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(realMap);
}

function setMapFilter(status, btnEl) {
  currentMapFilter = status;

  document.querySelectorAll('.map-filter-btn').forEach(btn => {
    btn.classList.remove('bg-blue-500', 'text-white', 'font-semibold', 'shadow-md');
    btn.classList.add('glass-card', 'font-medium');
  });
  btnEl.classList.remove('glass-card', 'font-medium');
  btnEl.classList.add('bg-blue-500', 'text-white', 'font-semibold', 'shadow-md');

  filterRealMap();
}

function filterRealMap() {
  if (!realMap) return;
  const input = document.getElementById('mapSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const query = (input?.value || '').toLowerCase().trim();

  if (clearBtn) {
    clearBtn.style.display = query ? 'block' : 'none';
  }

  const visibleCoords = [];

  bueirosData.forEach(item => {
    const marker = leafletMarkers[item.id];
    if (!marker) return;

    const matchesStatus = (currentMapFilter === 'all' || item.status === currentMapFilter);
    const searchableText = `${item.name} ${item.address}`.toLowerCase();
    const matchesQuery = (!query || searchableText.includes(query));

    if (matchesStatus && matchesQuery) {
      if (!realMap.hasLayer(marker)) {
        marker.addTo(realMap);
      }
      visibleCoords.push([item.lat, item.lng]);
    } else {
      if (realMap.hasLayer(marker)) {
        realMap.removeLayer(marker);
      }
    }
  });

  if (visibleCoords.length === 1) {
    realMap.flyTo(visibleCoords[0], 15, { duration: 0.6 });
  } else if (visibleCoords.length > 1) {
    const bounds = L.latLngBounds(visibleCoords);
    realMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }
}

function clearMapSearch() {
  const input = document.getElementById('mapSearchInput');
  if (input) input.value = '';
  filterRealMap();
}

function resetMapView() {
  if (!realMap) return;
  closeMapPopup();
  realMap.flyTo([-23.4965, -47.4585], 14, { duration: 0.6 });
}

function locateUserOnMap() {
  if (!realMap) return;
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) {
        realMap.removeLayer(userMarker);
      }

      const userIcon = L.divIcon({
        className: 'user-gps-pin',
        html: `
          <div style="width:20px; height:20px; background:#3b82f6; border:3.5px solid #fff; border-radius:9999px; box-shadow:0 0 0 8px rgba(59,130,246,0.25); transform:translate(-50%,-50%);"></div>
        `,
        iconSize: [0, 0]
      });

      userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(realMap);
      realMap.flyTo([latitude, longitude], 16, { duration: 0.8 });
    },
    () => {
      realMap.flyTo([-23.5015, -47.4581], 15, { duration: 0.6 });
    }
  );
}

function focusBueiroOnMap(bueiroId) {
  const item = bueirosData.find(b => b.id === bueiroId);
  if (!item) return;

  switchTab('map');
  setTimeout(() => {
    if (realMap) {
      realMap.invalidateSize();
      realMap.flyTo([item.lat - 0.002, item.lng], 16, { duration: 0.7 });
      openMapPopup(item);
    }
  }, 200);
}

// --- POPUP DE DETALHES DO PINO NO MAPA ---
function openMapPopup(item) {
  const popup = document.getElementById('mapPinPopup');
  const badge = document.getElementById('popupBadge');
  const titleEl = document.getElementById('popupTitle');
  const addrEl = document.getElementById('popupAddress');
  const levelEl = document.getElementById('popupLevel');

  titleEl.innerText = item.name;
  addrEl.innerText = item.address;
  levelEl.innerText = item.level;

  if (item.status === 'critical') {
    badge.innerText = 'Crítico';
    badge.className = 'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300';
  } else if (item.status === 'attention') {
    badge.innerText = 'Atenção';
    badge.className = 'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300';
  } else {
    badge.innerText = 'Normal';
    badge.className = 'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300';
  }

  popup.classList.remove('hidden');
}

function closeMapPopup() {
  const popup = document.getElementById('mapPinPopup');
  if (popup) popup.classList.add('hidden');
}

// --- FILTROS INTERATIVOS DA ABA ALERTAS ---
let currentAlertFilter = 'all';

function setAlertFilter(status, btnEl) {
  currentAlertFilter = status;

  document.querySelectorAll('.alert-filter-btn').forEach(btn => {
    btn.classList.remove('bg-blue-500', 'text-white', 'font-semibold', 'shadow-md');
    btn.classList.add('glass-card', 'font-medium');
  });
  btnEl.classList.remove('glass-card', 'font-medium');
  btnEl.classList.add('bg-blue-500', 'text-white', 'font-semibold', 'shadow-md');

  applyAlertFilter();
}

function applyAlertFilter() {
  const cards = document.querySelectorAll('.alert-card-item');
  cards.forEach(card => {
    const cardStatus = card.getAttribute('data-status');
    if (currentAlertFilter === 'all' || cardStatus === currentAlertFilter) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Inicializa Tema e Mapa Real
setAppTheme('light');
initRealMap();

// --- INTEGRAÇÃO FIREBASE EM TEMPO REAL ---
const firebaseConfig = {
  databaseURL: "https://alertapluvial-default-rtdb.firebaseio.com/"
};

function iniciarFirebase() {
  if (typeof firebase === 'undefined') return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const bueiroRef = database.ref('bueiro');

    bueiroRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        atualizarInterface(data);
      }
    });
  } catch (e) {
    console.error("Erro ao conectar com Firebase:", e);
  }
}

iniciarFirebase();

function atualizarInterface(data) {
  const pct = parseFloat(data.porcentagem_preenchimento || 0).toFixed(1);
  const dist = parseFloat(data.distancia_cm || 0).toFixed(1);
  const status = data.status || "NORMAL";

  const bueiro01 = bueirosData.find(b => b.id === 'bueiro01');
  if (bueiro01) {
    bueiro01.level = `${pct}%`;
  }

  // Elementos Início
  const homeCard = document.getElementById('homeStatusCard');
  const homeIcon = document.getElementById('homeStatusIcon');
  const homeTitle = document.getElementById('homeStatusTitle');
  const homeDesc = document.getElementById('homeStatusDesc');
  const homeWaterLevel = document.getElementById('homeWaterLevel');
  const homeWaterDist = document.getElementById('homeWaterDist');

  // Elementos Alertas
  const alertCardReal = document.getElementById('alertCardReal');
  const alertColorReal = document.getElementById('alertColorReal');
  const alertIconBgReal = document.getElementById('alertIconBgReal');
  const alertIconReal = document.getElementById('alertIconReal');
  const alertStatusTextReal = document.getElementById('alertStatusTextReal');
  const alertLevelReal = document.getElementById('alertLevelReal');

  if (homeWaterLevel) homeWaterLevel.innerText = `${pct}%`;
  if (homeWaterDist) homeWaterDist.innerText = `${dist} cm`;
  if (alertLevelReal) alertLevelReal.innerText = pct;

  let newStatus = 'normal';

  if (status === "EMERGENCIA" || pct >= 80) {
    newStatus = 'critical';
    if (alertCardReal) alertCardReal.setAttribute('data-status', 'critical');

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

  } else if (status === "ATENCAO" || pct >= 50) {
    newStatus = 'attention';
    if (alertCardReal) alertCardReal.setAttribute('data-status', 'attention');

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

  } else {
    newStatus = 'normal';
    if (alertCardReal) alertCardReal.setAttribute('data-status', 'normal');

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
  }

  // Atualiza pino do Bueiro #01 no mapa real
  if (bueiro01 && leafletMarkers['bueiro01']) {
    bueiro01.status = newStatus;
    leafletMarkers['bueiro01'].setIcon(createCustomPinIcon(newStatus, bueiro01.shortLabel));
  }

  filterRealMap();
  applyAlertFilter();
}
