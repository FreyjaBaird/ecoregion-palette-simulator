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
// --- AUTOMATED SCIENTIFIC PIPELINE LOGIC ---

const selector = document.getElementById('city-selector');

// 1. Populates the HTML dropdown menu with both UK and China city names
function initializeDropdown() {
  // Create grouping headers for a professional visual layout
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
}

// 2. The core coordinate-lookup and matching loop
async function processEcoregion(targetSelection) {
  const matchHeading = document.getElementById('match-title');
  matchHeading.innerText = "Analyzing geographic vectors...";

  try {
    // Step A: Fetch Coordinates for the chosen source city from Wikipedia
    const srcCoords = await getWikipediaCoords(targetSelection);
    if (!srcCoords) throw new Error("Location matrix offline");

    // Step B: Run the Nearest-Neighbor vector logic to find the closest match
    // If user picks a UK city, we find the closest China city, and vice versa!
    const isUKSelection = targetSelection.endsWith(', UK');
    const opposingPool = isUKSelection ? chinaCities : ukCities;
    const opposingSuffix = isUKSelection ? ', China' : ', UK';

    let bestMatchCity = opposingPool[0];
    let closestDistance = Infinity;

    // We look up opposing coords to run the mathematical spatial distance formula
    for (let candidate of opposingPool) {
      const candidateFull = `${candidate}${opposingSuffix}`;
      const candCoords = await getWikipediaCoords(candidateFull);
      
      if (candCoords) {
        // Spatial Euclidean distance formula running live across vectors
        const distance = Math.sqrt(
          Math.pow(srcCoords.lat - candCoords.lat, 2) + 
          Math.pow(srcCoords.lon - candCoords.lon, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          bestMatchCity = candidateFull;
        }
      }
    }

    matchHeading.innerText = `Closest Vector Match: ${bestMatchCity.split(',')[0]}`;

    // Step C: Construct the dynamic scientific palettes for both cities on the fly
    generateAutomatedPalettes(srcCoords, 'src-flora', 'src-soil');
    
    const matchedCoords = await getWikipediaCoords(bestMatchCity);
    if (matchedCoords) {
      generateAutomatedPalettes(matchedCoords, 'match-flora', 'match-soil');
    }

  } catch (err) {
    matchHeading.innerText = `Error: ${err.message}`;
  }
}

// 3. Helper: Connects to Wikipedia API to extract exact Lat/Long
async function getWikipediaCoords(cityName) {
  try {
    const url = `https://wikipedia.org{encodeURIComponent(cityName)}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].coordinates ? pages[pageId].coordinates[0] : null;
  } catch {
    return null;
  }
}

// 4. Helper: Uses coordinate grids to mathematically construct unweighted color bars
function generateAutomatedPalettes(coords, floraContainerId, soilContainerId) {
  // Generate a distinct flora hue mathematically using the latitude vector
  // High latitudes (North) lean into deep, dark forest pines; low latitudes swing to bright subtropical greens
  const latitudeShift = Math.abs(coords.lat);
  const leafHue = Math.floor(100 + (latitudeShift * 1.5)) % 160; 
  
  const floraPalette = [
    `hsl(${leafHue}, 45%, 20%)`,  // Dark canopy threshold
    `hsl(${leafHue + 15}, 40%, 35%)`, // Mid-story vegetation leaf
    `hsl(${leafHue - 10}, 50%, 55%)`  // Fresh ground undergrowth brush
  ];

  // Construct a soil layer matrix depending on geographic warmth vectors
  const isTropicalZone = coords.lat < 32; 
  const soilPalette = isTropicalZone 
    ? ["#5e2919", "#8c3d26", "#d46a43"] // Vibrant Iron-oxidized Red Clay (Ultisols)
    : ["#3b312a", "#5c4c42", "#a69580"]; // Leached Dark Organic Silt Loam (Inceptisols)

  // Inject the layout-stretching flex items directly into your CSS panels
  document.getElementById(floraContainerId).innerHTML = floraPalette.map(color => `<div class="bar" style="background:${color}"></div>`).join('');
  document.getElementById(soilContainerId).innerHTML = soilPalette.map(color => `<div class="bar" style="background:${color}"></div>`).join('');
}

// --- BOOT SEQUENCE ---
initializeDropdown();
selector.onchange = (e) => processEcoregion(e.target.value);
processEcoregion(selector.value); // Trigger calculation for Aberdeen instantly on start
