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
// --- HIGHLY VOCAL AUTOMATED PIPELINE & VIBE-DEBUGGER ---

const selector = document.getElementById('city-selector');

function initializeDropdown() {
  console.log("🐛 DEBUG: Initialising dropdown selectors...");
  const ukGroup = document.createElement('optgroup');
  ukGroup.label = "United Kingdom Ecoregions";
  ukCities.forEach(city => {
    let opt = document.createElement('option');
    opt.value = `${city}, UK`;
    opt.textContent = city;
    ukGroup.appendChild(opt);
  });

  const chinaGroup = document.createElement('optgroup');
  chinaGroup.label = "China Ecoregions";
  chinaCities.forEach(city => {
    let opt = document.createElement('option');
    opt.value = `${city}, China`;
    opt.textContent = city;
    chinaGroup.appendChild(opt);
  });

  selector.appendChild(ukGroup);
  selector.appendChild(chinaGroup);
  console.log("🐛 DEBUG: Dropdown fully populated.");
}

async function processEcoregion(targetSelection) {
  const matchHeading = document.getElementById('match-title');
  console.log(`\n🚀 MAIN: Processing selection change -> "${targetSelection}"`);
  matchHeading.innerText = `📡 Fetching coordinates for ${targetSelection.split(',')[0]}...`;

  try {
    // Step A: Fetch Coordinates for the chosen source city
    const srcCoords = await getWikipediaCoords(targetSelection);
    if (!srcCoords) {
      throw new Error(`Wikipedia has no coordinate matrix for "${targetSelection}". It may be spelled slightly differently on their main page.`);
    }
    console.log(`🐛 DEBUG: Source city coordinates locked: Lat ${srcCoords.lat}, Lon ${srcCoords.lon}`);

    // Step B: Set up opposing pools
    const isUKSelection = targetSelection.endsWith(', UK');
    const opposingPool = isUKSelection ? chinaCities : ukCities;
    const opposingSuffix = isUKSelection ? ', China' : ', UK';

    matchHeading.innerText = `🧮 Gathering coordinates for all ${opposingPool.length} opposing cities simultaneously...`;
    console.log(`🐛 DEBUG: Querying ${opposingPool.length} records in parallel to prevent browser freezing.`);

    // Optimization: Request ALL 50 coordinates at the exact same time in parallel
    const coordinateRequests = opposingPool.map(candidate => 
      getWikipediaCoords(`${candidate}${opposingSuffix}`).then(coords => ({ name: candidate, coords }))
    );
    const resolvedCandidates = await Promise.all(coordinateRequests);

    matchHeading.innerText = "📐 Computing closest Euclidean vector distance...";
    
    let bestMatchCity = null;
    let closestDistance = Infinity;
    let successfulFetches = 0;

    // Step C: Run the Nearest-Neighbor vector logic
    for (let item of resolvedCandidates) {
      if (item.coords) {
        successfulFetches++;
        const distance = Math.sqrt(
          Math.pow(srcCoords.lat - item.coords.lat, 2) + 
          Math.pow(srcCoords.lon - item.coords.lon, 2)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          bestMatchCity = `${item.name}${opposingSuffix}`;
        }
      }
    }

    console.log(`🐛 DEBUG: Successfully calculated vectors for ${successfulFetches}/${opposingPool.length} opposing cities.`);

    if (!bestMatchCity) {
      throw new Error(`The algorithm failed because Wikipedia blocked all ${opposingPool.length} background candidate requests. Try reloading in a few seconds.`);
    }

    console.log(`🎯 MATCH FOUND: "${bestMatchCity}" is the closest ecological vector match.`);
    matchHeading.innerText = `Closest Vector Match: ${bestMatchCity.split(',')[0]}`;

    // Step D: Construct the dynamic scientific palettes for both cities on the fly
    generateAutomatedPalettes(srcCoords, 'src-flora', 'src-soil');
    
    // Find the coordinates of the winner from our pre-fetched list
    const winnerData = resolvedCandidates.find(x => `${x.name}${opposingSuffix}` === bestMatchCity);
    if (winnerData && winnerData.coords) {
      generateAutomatedPalettes(winnerData.coords, 'match-flora', 'match-soil');
    }

  } catch (err) {
    console.error("❌ CRITICAL ERROR CAPTURED:", err.message);
    // Display the highly descriptive error message right inside the dashboard panel!
    matchHeading.innerText = `⚠️ Fail: ${err.message}`;
    
    // Clear out palettes so old data doesn't sit lingering on screen during a failure
    document.getElementById('src-flora').innerHTML = '';
    document.getElementById('src-soil').innerHTML = '';
    document.getElementById('match-flora').innerHTML = '';
    document.getElementById('match-soil').innerHTML = '';
  }
}

async function getWikipediaCoords(cityName) {
  try {
    const url = `https://wikipedia.org{encodeURIComponent(cityName)}&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages);
    return pages[pageId].coordinates ? pages[pageId].coordinates : null;
  } catch (e) {
    console.warn(`⚠️ Warning: Failed fetch request for "${cityName}". Network throttled.`);
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

// --- BOOT SEQUENCE ---
initializeDropdown();
selector.onchange = (e) => processEcoregion(e.target.value);
processEcoregion(selector.value);

