// Clean text arrays for automated scientific matching and data-fetching
const ukCities = [
  "Aberdeen",
  "Bath",
  "Belfast",
  "Birmingham",
  "Brighton",
  "Bristol",
  "Cambridge",
  "Canterbury",
  "Cardiff",
  "Chelmsford",
  "Colchester",
  "Coventry",
  "Derby",
  "Doncaster",
  "Dundee",
  "Durham",
  "Edinburgh",
  "Ely",
  "Exeter",
  "Glasgow",
  "Gloucester",
  "Hereford",
  "Inverness",
  "Kingston upon Thames",
  "Lancaster",
  "Leeds",
  "Lincoln",
  "Liverpool",
  "London",
  "Manchester",
  "Newcastle upon Tyne",
  "Norwich",
  "Nottingham",
  "Oxford",
  "Plymouth",
  "Portsmouth",
  "Preston",
  "Ripon",
  "Salford",
  "Salisbury",
  "Sheffield",
  "Southampton",
  "Stirling",
  "Stoke-on-Trent",
  "Sunderland",
  "Swansea",
  "Truro",
  "Wakefield",
  "Winchester",
  "Wolverhampton",
  "York"
];

const chinaCities = [
  "Beijing",
  "Changchun",
  "Changsha",
  "Chaozhou",
  "Chengdu",
  "Chongqing",
  "Dalian",
  "Dongguan",
  "Foshan",
  "Fuzhou",
  "Guangzhou",
  "Guiyang",
  "Hangzhou",
  "Harbin",
  "Hefei",
  "Huai'an",
  "Huizhou",
  "Huzhou",
  "Jiaxing",
  "Jieyang",
  "Jinan",
  "Jinhua",
  "Kunming",
  "Nanjing",
  "Nantong",
  "Ningbo",
  "Qingdao",
  "Shanghai",
  "Shantou",
  "Shaoguan",
  "Shaoxing",
  "Shenyang",
  "Shenzhen",
  "Suzhou",
  "Taizhou",
  "Tianjin",
  "Urumqi",
  "Weihai",
  "Wenzhou",
  "Wuhan",
  "Wuxi",
  "Xi'an",
  "Xiamen",
  "Yantai",
  "Yangzhou",
  "Zhanjiang",
  "Zhengzhou",
  "Zhenjiang",
  "Zhoushan",
  "Zhuhai"
];
// --- DYNAMIC TERMINAL LOGGER & SAFE CONTROL MECHANICS ---


const selector = document.getElementById('city-selector');
const matchSelector = document.getElementById('match-selector');
const terminal = document.getElementById('terminal-log');

function printLog(message, type = 'normal') {
  if (!terminal) return;
  const entry = document.createElement('div');
  entry.className = "log-entry log-" + type;
  const timestamp = new Date().toLocaleTimeString();
  entry.innerText = "[" + timestamp + "] " + message;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function initializeDropdown() {
  printLog("Initializing dropdown interface...", "info");
  const ukGroup = document.createElement('optgroup');
  ukGroup.label = "United Kingdom Ecoregions";
  ukCities.forEach(city => {
    let opt = document.createElement('option');
    opt.value = city;
    opt.dataset.region = "UK";
    opt.textContent = city;
    ukGroup.appendChild(opt);
  });

  const chinaGroup = document.createElement('optgroup');
  chinaGroup.label = "China Ecoregions";
  chinaCities.forEach(city => {
    let opt = document.createElement('option');
    opt.value = city;
    opt.dataset.region = "China";
    opt.textContent = city;
    chinaGroup.appendChild(opt);
  });

  selector.appendChild(ukGroup);
  selector.appendChild(chinaGroup);
  printLog("Dropdown list successfully populated.", "success");
}

function updateBoxStatus(id, text, isError = false) {
  const el = document.getElementById(id);
  if (isError) {
    el.innerHTML = '<div style="padding:10px; color:#ef476f; font-size:0.75rem; text-align:center;">⚠️ ' + text + '</div>';
  } else {
    el.innerHTML = '<div style="padding:10px; color:var(--muted); font-size:0.75rem; text-align:center;">⏳ ' + text + '</div>';
  }
}

async function getWikipediaCoords(cityName, region) {
  try {
    var strictQuery = cityName;
    
    var searchUrl = "https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=" + 
                    encodeURIComponent(strictQuery) + 
                    "&gpslimit=1&prop=coordinates&format=json&origin=*";
    
    printLog("Transmitting search query: " + strictQuery, "info");

    var response = await fetch(searchUrl, {
      method: "GET",
      headers: { "Api-User-Agent": "EcoregionPaletteSimulator/1.0" }
    });
    
    if (!response.ok) return null;
    var data = await response.json();
    
    if (!data.query || !data.query.pages) {
      printLog("Wiki Error: No pages found for " + strictQuery, "error");
      return null;
    }
    
    var pageIds = Object.keys(data.query.pages);
    var firstPageId = pageIds[0];
    var pageData = data.query.pages[firstPageId];
    
    printLog("Target Found: " + pageData.title, "success");

    if (pageData.coordinates && pageData.coordinates[0]) {
      return {
        lat: pageData.coordinates[0].lat,
        lon: pageData.coordinates[0].lon
      };
    } else {
      printLog("Data Error: " + pageData.title + " has no coordinate markers.", "error");
      return null;
    }
  } catch (e) {
    printLog("Network Exception: Request snapped. Reason: " + e.message, "error");
    return null;
  }
}


// ==========================================
// PART 3: VECTOR MATH, PALETTES & TEXT BUILDERS
// ==========================================

async function processEcoregion(cityName) {
  if (!cityName || typeof cityName !== 'string') return;
  
  const selectedOption = selector.options[selector.selectedIndex];
  const currentRegion = selectedOption ? selectedOption.dataset.region : "UK";

  printLog("Starting vector execution loop for city: " + cityName + " (" + currentRegion + ")", "info");
  
  updateBoxStatus('src-flora', "Searching " + cityName + " flora...");
  updateBoxStatus('src-soil', "Analyzing " + cityName + " stratum...");
  updateBoxStatus('match-flora', 'Computing vector...');
  updateBoxStatus('match-soil', 'Computing vector...');
  
  matchSelector.innerHTML = "<option>📡 Calculating nearest vector...</option>";

  try {
    const srcCoords = await getWikipediaCoords(cityName, currentRegion);
    if (!srcCoords) {
      const errMsg = "Coordinate map missing";
      updateBoxStatus('src-flora', errMsg, true);
      updateBoxStatus('src-soil', errMsg, true);
      matchSelector.innerHTML = "<option>⚠️ Location matrix offline</option>";
      throw new Error("Source location unmappable.");
    }
    
    printLog("Source locked successfully! Latitude: " + srcCoords.lat + ", Longitude: " + srcCoords.lon, "success");

    const isUK = currentRegion === "UK";
    const opposingPool = isUK ? chinaCities : ukCities;
    const opposingRegion = isUK ? "China" : "UK";

    printLog("Querying background coordinates for opposing pool (" + opposingPool.length + " candidate cities)...", "info");

    let resolvedCandidates = [];
    for (let i = 0; i < opposingPool.length; i++) {
      const candidate = opposingPool[i];
      const coords = await getWikipediaCoords(candidate, opposingRegion);
      resolvedCandidates.push({ name: candidate, coords: coords });
    }

    printLog("Background pool coordinate resolution completed. Evaluating vectors...", "info");

    let bestMatchCity = null;
    let closestDistance = Infinity;
    let bestMatchCoords = null;
    let functionalMatches = 0;

    for (let j = 0; j < resolvedCandidates.length; j++) {
      const item = resolvedCandidates[j];
      if (item.coords) {
        functionalMatches++;
        const distance = Math.sqrt(
          Math.pow(srcCoords.lat - item.coords.lat, 2) + 
          Math.pow(srcCoords.lon - item.coords.lon, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          bestMatchCity = item.name;
          bestMatchCoords = item.coords;
        }
      }
    }

    printLog("Vector tracking completed. Successfully collected data points for " + functionalMatches + "/" + opposingPool.length + " candidates.", "info");

    if (!bestMatchCity) {
      throw new Error("Nearest-neighbor calculation failure.");
    }

    printLog("Match calculated: " + bestMatchCity + " is your nearest ecological twin!", "success");
    
    matchSelector.innerHTML = "<option>Partner Match: " + bestMatchCity + ", " + opposingRegion + "</option>";

    generateAutomatedPalettes(srcCoords, 'src-flora', 'src-soil');
    generateAutomatedPalettes(bestMatchCoords, 'match-flora', 'match-soil');
    
    writeEcologicalTexts(srcCoords, bestMatchCoords, cityName, bestMatchCity, currentRegion, opposingRegion);

  } catch (err) {
    printLog("Loop broken: " + err.message, "error");
  }
}

function generateAutomatedPalettes(coords, floraContainerId, soilContainerId) {
  const latitudeShift = Math.abs(coords.lat);
  const leafHue = Math.floor(100 + (latitudeShift * 1.5)) % 160; 
  
  const floraPalette = [
    "hsl(" + leafHue + ", 45%, 20%)",  
    "hsl(" + (leafHue + 15) + ", 40%, 35%)", 
    "hsl(" + (leafHue - 10) + ", 50%, 55%)"  
  ];

  const isTropicalZone = coords.lat < 32; 
  const soilPalette = isTropicalZone 
    ? ["#5e2919", "#8c3d26", "#d46a43"] 
    : ["#3b312a", "#5c4c42", "#a69580"]; 

  document.getElementById(floraContainerId).innerHTML = floraPalette.map(color => '<div class="bar" style="background:' + color + '"></div>').join('');
  document.getElementById(soilContainerId).innerHTML = soilPalette.map(color => '<div class="bar" style="background:' + color + '"></div>').join('');
}

function writeEcologicalTexts(srcCoords, matchCoords, srcName, matchName, srcReg, matchReg) {
  function getFloraText(coords, region) {
    const lat = Math.abs(coords.lat);
    if (region === "UK") {
      return lat > 55 
        ? "Dominant Flora: <strong>Boreal Pinewood & Heathland</strong> (Scots Pine, Heather, Bilberry). Adapted to cold, damp growing boundaries."
        : "Dominant Flora: <strong>Temperate Deciduous Oakwood</strong> (English Oak, European Beech, Bluebell). Flourishes in stable oceanic zones.";
    } else {
      return lat < 30
        ? "Dominant Flora: <strong>Sub subtropical Broadleaf Evergreen Forest</strong> (Camellia, Castanopsis, native Bamboo). Thrives under monsoonal humidity."
        : "Dominant Flora: <strong>Mixed Temperate Canopy</strong> (Korean Pine, East Asian Deciduous Oaks). Tolerates wide continental winter shifts.";
    }
    // Calculate the raw geographical variance score
  const latDiff = Math.abs(srcCoords.lat - matchCoords.lat).toFixed(2);
  const lonDiff = Math.abs(srcCoords.lon - matchCoords.lon).toFixed(2);
  
  // FIX: Inject the written mathematical reason into our new HTML text box
  document.getElementById('match-justification-text').innerHTML = 
    "Vector variance delta: <strong>Δ" + latDiff + "° Lat</strong> / <strong>Δ" + lonDiff + "° Lon</strong>. This candidate yields the absolute lowest spatial Euclidean distance threshold within your opposing ecoregion data pool.";
  }

  function getSoilText(coords) {
    const lat = Math.abs(coords.lat);
    return lat < 32 
      ? "Soil Order: <strong>Ultisol (Vibrant Red Clay)</strong>. Deeply weathered earth enriched by iron and aluminum oxides due to prolonged thermal heat vectors."
      : "Soil Order: <strong>Inceptisol / Podzol (Muted Silt Loam)</strong>. Rich organic humus layers sitting atop distinct ash-grey minerals leached by heavy precipitation pathways.";
  }

  document.getElementById('src-flora-text').innerHTML = getFloraText(srcCoords, srcReg);
  document.getElementById('match-flora-text').innerHTML = getFloraText(matchCoords, matchReg);
  document.getElementById('src-soil-text').innerHTML = getSoilText(srcCoords);
  document.getElementById('match-soil-text').innerHTML = getSoilText(matchCoords);

  printLog("Scientific justification matching " + srcName + " with " + matchName + " compiled.", "info");
}

// --- BOOT SEQUENCE RUNNERS ---
initializeDropdown();

if (selector && selector.value) { 
  processEcoregion(selector.value); 
}

selector.onchange = (e) => processEcoregion(e.target.value);

