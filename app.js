// ====== KONFIGURATION ======
const API_ENDPOINT = "https://henrikhjelm.se/api/index2.php";  // exempel-endpoint
// Om API kräver specifika parametrar, anpassa nedan
const LOW_THRESHOLD_PERCENT = 3;  // pris som är minst 3 % lägre än median → "LÅGT"

// hjälpfunktion för att omvandla ort till koordinater (geokodning) — enkel version via OpenStreetMap Nominatim
async function geocode(place) {
  // om redan är lat,lon
  const parts = place.split(',');
  if(parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
  }
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const resp = await fetch(url);
  const arr = await resp.json();
  if(arr.length > 0) {
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
  }
  throw new Error("Kunde inte hitta plats: " + place);
}

// haversine-formel för att beräkna avstånd i km
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI/180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const elPlace = document.getElementById('place');
const elRefresh = document.getElementById('refresh');
const elStatus = document.getElementById('status');
const elResult = document.getElementById('result');

elRefresh.addEventListener('click', loadData);

async function loadData(){
  const place = elPlace.value.trim();
  if(!place) {
    elStatus.textContent = "Skriv in en ort eller lat,lon.";
    return;
  }
  elStatus.textContent = "Hämtar data...";
  elResult.innerHTML = "";

  try {
    const coord = await geocode(place);
    // fetch data från bensinpris-API
    const url = new URL(API_ENDPOINT);
    // eventuell parameter för att få med koordinater, t.ex. url.searchParams.set('lat', coord.lat)
    const resp = await fetch(url.toString());
    if(!resp.ok) throw new Error("API‐fel: " + resp.status);
    const data = await resp.json();

    const stations = data.stations || [];
    if(stations.length === 0) {
      elStatus.textContent = "Inga bensinstationer hittades i datakällan.";
      return;
    }

    // beräkna avstånd och filtrera inom ett maxavstånd (t.ex. 30 km)
    const maxDist = 30; // km
    const nearby = stations.map(s => {
      return {
        ...s,
        dist: distanceKm(coord.lat, coord.lon, s.lat, s.lon)
      };
    }).filter(s => s.dist <= maxDist);

    if(nearby.length === 0) {
      elStatus.textContent = `Inga stationer hittades inom ${maxDist} km.`;
      return;
    }

    // beräkna medianpris bland nearby
    const prices = nearby.map(s => Number(s.price)).filter(n => !isNaN(n));
    const median = calcMedian(prices);

    // sortera på pris
    nearby.sort((a,b) => Number(a.price) - Number(b.price));

    nearby.forEach(s => {
      const p = Number(s.price);
      const diffPct = (median - p) / median * 100;
      const isLow = diffPct >= LOW_THRESHOLD_PERCENT;

      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div>
          <strong>${s.name}</strong><br/>
          <small>${s.region || ''} • ca ${s.dist.toFixed(1)} km bort • uppdaterat: ${s.updated || ''}</small>
        </div>
        <div style="text-align:right">
          <div>${p.toFixed(2)} kr/l</div>
          <div class="badge ${isLow ? 'low' : 'normal'}">${isLow ? 'LÅGT' : 'Normal'}</div>
        </div>
      `;
      elResult.appendChild(div);
    });

    elStatus.textContent = `Visar ${nearby.length} stationer inom ${maxDist} km. Medianpris: ${median.toFixed(2)} kr/l.`;
  } catch(err) {
    console.error(err);
    elStatus.textContent = "Fel: " + err.message;
  }
}

function calcMedian(arr) {
  const a = arr.slice().sort((x,y)=>x-y);
  const mid = Math.floor(a.length/2);
  return (a.length % 2) ? a[mid] : (a[mid-1]+a[mid]) / 2;
}
