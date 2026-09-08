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

// Specialized custom logger function that writes text directly onto your screen!
function printLog(message, type = 'normal') {
  if (!terminal) return;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  entry.innerText = `[${timestamp}] ${message}`;
  
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight; // Auto-scrolls downwards to stay live
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
    el.innerHTML = `<div style="padding:10px; color:#ef476f; font-size:0.75rem; text-align:center;">⚠️ ${text}</div>`;
  } else {
    el.innerHTML = `<div style="padding:10px; color:var(--muted); font-size:0.75rem; text-align:center;">⏳ ${text}</div>`;
  }
}

async function processEcoregion(cityName) {
  if (!cityName || typeof cityName !== 'string') return;
  
  const selectedOption = selector.options[selector.selectedIndex];
  const currentRegion = selectedOption ? selectedOption.dataset.region : "UK";

  printLog(`Starting vector execution loop for city: "${cityName}" (${currentRegion})`, "info");
  
  updateBoxStatus('src-flora', `Searching ${cityName} flora...`);
  updateBoxStatus('src-soil', `Analyzing ${cityName} stratum...`);
  updateBoxStatus('match-flora', 'Computing vector...');
  updateBoxStatus('match-soil', 'Computing vector...');
  
  matchSelector.innerHTML = `<option>📡 Calculating nearest vector...</option>`;

  try {
    // Step A: Fetch coordinates for source city
    printLog(`Connecting to Wikipedia for geolocation data -> "${cityName}"...`);
    const srcCoords = await getWikipediaCoords(cityName, currentRegion);
    
    if (!srcCoords) {
      const errMsg = "Coordinate map missing";
      updateBoxStatus('src-flora', errMsg, true);
      updateBoxStatus('src-soil', errMsg, true);
      matchSelector.innerHTML = `<option>⚠️ Location matrix offline</option>`;
      printLog(`Wikipedia failed to provide a spatial match for "${cityName}". Connection refused or misspelled.`, "error");
      throw new Error("Source location unmappable.");
    }
    
    printLog(`Source locked successfully! Latitude: ${srcCoords.lat}, Longitude: ${srcCoords.lon}`, "success");

    const isUK = currentRegion === "UK";
    const opposingPool = isUK ? chinaCities : ukCities;
    const opposingRegion = isUK ? "China" : "UK";

    printLog(`Querying background coordinates for opposing pool (${opposingPool.length} candidate cities)...`, "info");

    // Symmetrical, safety throttled sequence loop to prevent connection flooding
    let resolvedCandidates = [];
    let processedCount = 0;

    for (let candidate of opposingPool) {
      processedCount++;
      if (processedCount % 10 === 0) {
        printLog(`Background progress status: Checked ${processedCount}/${opposingPool.length} vectors...`);
      }
      
      const coords = await getWikipediaCoords(candidate, opposingRegion);
      resolvedCandidates.push({ name: candidate, coords });
    }

    printLog("Background pool coordinate resolution completed. Evaluating vectors...", "info");

    let bestMatchCity = null;
    let closestDistance = Infinity;
    let bestMatchCoords = null;
    let functionalMatches = 0;

    // Step C: Run spatial vector calculation formulas
    for (let item of resolvedCandidates) {
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

    printLog(`Vector tracking completed. Successfully collected coordinate points for ${functionalMatches}/${opposingPool.length} candidates.`, "info");

    if (!bestMatchCity) {
      const failMsg = "Candidate loop failed";
      updateBoxStatus('match-flora', failMsg, true);
      updateBoxStatus('match-soil', failMsg, true);
      matchSelector.innerHTML = `<option>⚠️ Vector calculation dropped</option>`;
      printLog("Fatal: The engine could not assemble vectors because all background API calls failed.", "error");
      throw new Error("Nearest-neighbor calculation failure.");
    }

    printLog(`Match calculated: "${bestMatchCity}" is your nearest ecological twin!`, "success");
    matchSelector.innerHTML = `<option>Partner Match: ${bestMatchCity}, ${opposingRegion}</option>`;

    // Step D: Successfully paint color grids onto panels
    generateAutomatedPalettes(srcCoords, 'src-flora', 'src-soil');
    generateAutomatedPalettes(bestMatchCoords, 'match-flora', 'match-soil');
    printLog("Aesthetic color spectrum generated from coordinate matrices successfully.", "success");

  } catch (err) {
    printLog(`Loop broken: ${err.message}`, "error");
  }
}

async function getWikipediaCoords(cityName, region) {
  try {
    const fullSearchQuery = region === "UK" ? `${cityName} United Kingdom` : `${cityName} China`;
    const searchUrl = `https://wikipedia.org${encodeURIComponent(fullSearchQuery)}&format=json&origin=*`;
    
    // Vocal Log: What is the code sending right now?
    printLog(`📡 TRANSMITTING SEARCH TO WIKI: Querying string "${fullSearchQuery}"`, "info");
    printLog(`🔗 URL SENT: ${searchUrl}`);

    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: { "Api-User-Agent": "EcoregionPaletteSimulator/1.0" }
    });
    
    if (!searchResponse.ok) {
      printLog(`❌ HTTP SERVER ERROR: Wikipedia returned a bad response status code: ${searchResponse.status}`, "error");
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      printLog(`⚠️ WIKI SEARCH VACANT: Zero search results found for query: "${fullSearchQuery}"`, "error");
      return null;
    }
    
    const matchedTitle = searchData.query.search.title;
    printLog(`✅ WIKI MATCH STRIKE: Search found page match: "${matchedTitle}"`, "success");
    
    const coordsUrl = `https://wikipedia.org{encodeURIComponent(matchedTitle)}&format=json&origin=*`;
    printLog(`📡 TRANSMITTING COORD REQUEST: Querying dimensions for page: "${matchedTitle}"`, "info");

    const coordsResponse = await fetch(coordsUrl, {
      method: "GET",
      headers: { "Api-User-Agent": "EcoregionPaletteSimulator/1.0" }
    });
    
    const coordsData = await coordsResponse.json();
    const pages = coordsData.query.pages;
    const pageId = Object.keys(pages);
    
    if (pages[pageId] && pages[pageId].coordinates) {
      return pages[pageId].coordinates;
    } else {
      printLog(`⚠️ DIMENSIONS MISSING: Found page "${matchedTitle}" but it contains no geological coordinates in its Wikipedia metadata box.`, "error");
      return null;
    }
  } catch (e) {
    printLog(`❌ BROWSER CAUGHT EXCEPTION: Network request completely snapped. Reason: ${e.message}`, "error");
    return null;
  }
}

function generateAutomatedPalettes(coords, floraContainerId, soilContainerId) {
  const latitudeShift = Math.abs(coords.lat);
  const leafHue = Math.floor(100 + (latitudeShift * 1.5)) % 160; 
  
  const floraPalette = [
    `hsl(${leafHue}, 45%, 20%)`,  
    `hsl(${leafHue + 15}, 40%, 35%)`, 
    `hsl(${leafHue - 10}, 50%, 55%)`  
  ];

  const isTropicalZone = coords.lat < 32; 
  const soilPalette = isTropicalZone 
    ? ["#5e2919", "#8c3d26", "#d46a43"] 
    : ["#3b312a", "#5c4c42", "#a69580"]; 

  document.getElementById(floraContainerId).innerHTML = floraPalette.map(color => `<div class="bar" style="background:${color}"></div>`).join('');
  document.getElementById(soilContainerId).innerHTML = soilPalette.map(color => `<div class="bar" style="background:${color}"></div>`).join('');
}

// --- INITIALISE RUNNERS ---
initializeDropdown();

// Safe initialization step pulling cleanly from the primary dropdown input text context
if (selector && selector.value) {
  processEcoregion(selector.value);
}

selector.onchange = (e) => processEcoregion(e.target.value);
