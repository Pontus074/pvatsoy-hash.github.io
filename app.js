// ====== KONFIGURATION ======
const LOW_THRESHOLD_PERCENT = 3;  // pris som är minst 3 % lägre än median → "LÅGT"

// geokodning: översätt ort till koordinater (via OpenStreetMap Nominatim)
async function geocode(place) {
  const parts = place.split(',');
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
  }
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const resp = await fetch(url);
  const arr = await resp.json();
  if (arr.length > 0) {
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
  }
  throw new Error("Kunde inte hitta plats: " + place);
}

// haversine-formel för att beräkna avstånd i km
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// koppling till HTML
const elPlace = document.getElementById('place');
const elRefresh = document.getElementById('refresh');
const elStatus = document.getElementById('status');
const elResult = document.getElementById('result');

elRefresh.addEventListener('click', loadData);

// demo-data för Alingsås och Nossebro
const demoStations = [
  { name: "Circle K Alingsås", price: 16.79, lat: 57.933, lon: 12.533, updated: "2025-10-06 08:30", region: "Alingsås" },
  { name: "Ingo Alingsås", price: 16.39, lat: 57.933, lon: 12.523, updated: "2025-10-06 08:10", region: "Alingsås" },
  { name: "Preem Nossebro", price: 16.19, lat: 58.183, lon: 12.717, updated: "2025-10-06 07:50", region: "Nossebro" },
  { name: "OKQ8 Nossebro", price: 16.59, lat: 58.182, lon: 12.718, updated: "2025-10-06 07:40", region: "Nossebro" }
];

async function loadData() {
  const place = elPlace.value.trim();
  if (!place) {
    elStatus.textContent = "Skriv in en ort eller lat,lon.";
    return;
  }
  elStatus.textContent = "Söker stationer...";
  elResult.innerHTML = "";

  try {
    const coord = await geocode(place);

    // filtrera demo-stationer inom 30 km
    const maxDist = 30;
    const nearby = demoStations.map(s => ({
      ...s,
      dist: distanceKm(coord.lat, coord.lon, s.lat, s.lon)
    })).filter(s => s.dist <= maxDist);

    if (nearby.length === 0) {
      elStatus.textContent = `Inga stationer hittades inom ${maxDist} km.`;
      return;
    }

    // medianpris
    const prices = nearby.map(s => s.price);
    const median = calcMedian(prices);

    // sortera och visa
    nearby.sort((a, b) => a.price - b.price);
    nearby.forEach(s => {
      const diffPct = (median - s.price) / median * 100;
      const isLow = diffPct >= LOW_THRESHOLD_PERCENT;

      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div>
          <strong>${s.name}</strong><br/>
          <small>${s.region} • ca ${s.dist.toFixed(1)} km bort • uppdaterat: ${s.updated}</small>
        </div>
        <div style="text-align:right">
          <div>${s.price.toFixed(2)} kr/l</div>
          <div class="badge ${isLow ? 'low' : 'normal'}">${isLow ? 'LÅGT' : 'Normal'}</div>
        </div>
      `;
      elResult.appendChild(div);
    });

    elStatus.textContent = `Visar ${nearby.length} stationer inom ${maxDist} km. Medianpris: ${median.toFixed(2)} kr/l.`;
  } catch (err) {
    console.error(err);
    elStatus.textContent = "Fel: " + err.message;
  }
}

function calcMedian(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
