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
// --- AUTOMATED ENGINE & SYMMETRICAL DISPLAY LOGIC ---

const selector = document.getElementById('city-selector');
const matchSelector = document.getElementById('match-selector');

function initializeDropdown() {
  console.log("🐛 DEBUG: Initialising dropdown selectors...");
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
}

// Helper to set individual box messages inside the color strips
function updateBoxStatus(id, text, isError = false) {
  const el = document.getElementById(id);
  if (isError) {
    el.innerHTML = `<div style="padding:10px; color:#ef476f; font-size:0.75rem; text-align:center;">⚠️ ${text}</div>`;
  } else {
    el.innerHTML = `<div style="padding:10px; color:var(--muted); font-size:0.75rem; text-align:center;">⏳ ${text}</div>`;
  }
}

async function processEcoregion(cityName) {
  const selectedOption = selector.options[selector.selectedIndex];
  const currentRegion = selectedOption.dataset.region;

  console.log(`\n🚀 MAIN: Processing selection -> "${cityName}" (${currentRegion})`);
  
  // Set all 4 layout blocks to active loading states independently
  updateBoxStatus('src-flora', `Searching ${cityName} flora...`);
  updateBoxStatus('src-soil', `Analyzing ${cityName} stratum...`);
  updateBoxStatus('match-flora', 'Computing vector...');
  updateBoxStatus('match-soil', 'Computing vector...');
  
  matchSelector.innerHTML = `<option>📡 Calculating nearest vector...</option>`;

  try {
    // Step A: Fetch Coordinates for the chosen source city
    const srcCoords = await getWikipediaCoords(cityName, currentRegion);
    if (!srcCoords) {
      const errMsg = "Coordinate map missing";
      updateBoxStatus('src-flora', errMsg, true);
      updateBoxStatus('src-soil', errMsg, true);
      matchSelector.innerHTML = `<option>⚠️ Location matrix offline</option>`;
      throw new Error(`Could not find coordinate data for "${cityName}"`);
    }
    console.log(`🐛 DEBUG: Source coordinates locked: Lat ${srcCoords.lat}, Lon ${srcCoords.lon}`);

    // Step B: Set up opposing pools based on region tags
    const isUK = currentRegion === "UK";
    const opposingPool = isUK ? chinaCities : ukCities;
    const opposingRegion = isUK ? "China" : "UK";

    // Process background coordinate calculations across the pool
    const coordinateRequests = opposingPool.map(candidate => 
      getWikipediaCoords(candidate, opposingRegion).then(coords => ({ name: candidate, coords }))
    );
    const resolvedCandidates = await Promise.all(coordinateRequests);

    let bestMatchCity = null;
    let closestDistance = Infinity;
    let bestMatchCoords = null;

    // Step C: Run Nearest-Neighbor logic over the gathered data
    for (let item of resolvedCandidates) {
      if (item.coords) {
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

    if (!bestMatchCity) {
      const failMsg = "Candidate loop failed";
      updateBoxStatus('match-flora', failMsg, true);
      updateBoxStatus('match-soil', failMsg, true);
      matchSelector.innerHTML = `<option>⚠️ Vector calculation dropped</option>`;
      throw new Error("Could not compute nearest-neighbor match.");
    }

    console.log(`🎯 MATCH FOUND: "${bestMatchCity}" is the closest match.`);
    
    // Inject the winner name smoothly into our new symmetrical dark-mode display dropdown!
    matchSelector.innerHTML = `<option>Partner Match: ${bestMatchCity}, ${opposingRegion}</option>`;

    // Step D: Trigger individual palette builders
    generateAutomatedPalettes(srcCoords, 'src-flora', 'src-soil');
    generateAutomatedPalettes(bestMatchCoords, 'match-flora', 'match-soil');

  } catch (err) {
    console.error("❌ MAIN CRITICAL EXCEPTION:", err.message);
  }
}

// Robust Wikipedia Coordinate Finder
async function getWikipediaCoords(cityName, region) {
  try {
    const url = `https://wikipedia.org{encodeURIComponent(cityName)}&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages);
    
    if (pages[pageId].coordinates) {
      return pages[pageId].coordinates;
    }
    
    // Backup search query structure if first pass comes up blank
    const fallbackTitle = region === "UK" ? `${cityName}, United Kingdom` : `${cityName}, China`;
    const fallbackUrl = `https://wikipedia.org{encodeURIComponent(fallbackTitle)}&format=json&origin=*`;
    const fbResponse = await fetch(fallbackUrl);
    const fbData = await fbResponse.json();
    const fbPages = fbData.query.pages;
    const fbPageId = Object.keys(fbPages);
    
    return fbPages[fbPageId].coordinates ? fbPages[fbPageId].coordinates : null;
  } catch (e) {
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

// --- INITIALISE ---
initializeDropdown();
selector.onchange = (e) => processEcoregion(e.target.value);
processEcoregion(selector.value);
