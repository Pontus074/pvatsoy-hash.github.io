// ====== KONFIGURATION ======
// Byt API_ENDPOINT och API_KEY om du vill använda riktig källa.
// Om du inte har en källa körs demo-data (fungerar direkt i Pages).
const API_ENDPOINT = ""; // ex "https://din-api.example.com/prices"
const API_KEY = "";      // om API kräver nyckel

// Hur mycket billigare än referens som räknas som "lågt" (i procent)
const LOW_THRESHOLD_PERCENT = 3; // t.ex. 3% lägre än referens -> "LÅGT"

const elRegion = document.getElementById('region');
const elFuel = document.getElementById('fuelType');
const elRefresh = document.getElementById('refresh');
const elStatus = document.getElementById('status');
const elResult = document.getElementById('result');

elRefresh.addEventListener('click', loadData);
window.addEventListener('load', loadData);

async function loadData(){
  setStatus('Hämtar prisdata…');

  try{
    const region = elRegion.value;
    const fuelType = elFuel.value;

    let data;
    if(API_ENDPOINT){
      // Riktigt API: inför eventuella query-parametrar (region, fuel)
      const url = new URL(API_ENDPOINT);
      if(region && region !== 'all') url.searchParams.set('region', region);
      url.searchParams.set('fuel', fuelType);

      const headers = API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {};
      const res = await fetch(url.toString(), { headers });
      if(!res.ok) throw new Error('API svarade med fel: ' + res.status);
      data = await res.json();
    } else {
      // Demo-data (körs utan API-nyckel)
      data = demoData(fuelType, region);
      await new Promise(r => setTimeout(r, 400)); // små fördröjning för UX
    }

    renderResults(data, fuelType, region);
    setStatus('Klar — visning uppdaterad.');
  }catch(err){
    console.error(err);
    setStatus('Fel vid hämtning: ' + (err.message || err));
    elResult.innerHTML = '';
  }
}

function setStatus(text){ elStatus.textContent = text; }

function renderResults(data, fuelType, region){
  // Förväntad data-format (flexibelt):
  // { stations: [ { name, price, updated, lat, lon, region }, ... ] }
  const stations = data.stations || data || [];
  if(!stations.length){
    elResult.innerHTML = '<div class="card">Inga priser hittades för valda filter.</div>';
    return;
  }

  // Filtrera (om region används)
  const filtered = stations.filter(s => {
    if(region && region !== 'all') return (s.region || '').toLowerCase().includes(region.toLowerCase());
    return true;
  });

  // Räkna ut referens: median (robust mot outliers)
  const prices = filtered.map(s => Number(s.price)).filter(n => !isNaN(n));
  if(!prices.length){
    elResult.innerHTML = '<div class="card">Inga giltiga prisvärden.</div>';
    return;
  }

  const median = calcMedian(prices);

  // Rendera listan — och markera vilka som är "låga"
  elResult.innerHTML = '';
  filtered.sort((a,b) => Number(a.price) - Number(b.price));
  filtered.forEach(s => {
    const p = Number(s.price);
    const diffPercent = ((median - p) / median) * 100;
    const isLow = diffPercent >= LOW_THRESHOLD_PERCENT;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(s.name || 'Station')}</strong><br/>
        <small>${s.region || ''} • uppdaterat: ${s.updated || 'okänt'}</small>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700">${p.toFixed(2)} kr/l</div>
        <div class="badge ${isLow ? 'low' : 'normal'}">${isLow ? 'LÅGT' : 'Normalt'}</div>
      </div>
    `;
    elResult.appendChild(card);
  });

  // Visa en kort sammanfattning
  const summary = document.createElement('div');
  summary.className = 'card';
  summary.innerHTML = `<div>Medianpris: <strong>${median.toFixed(2)} kr/l</strong> · Visar ${filtered.length} stationer · Tröskel för "LÅGT": ${LOW_THRESHOLD_PERCENT}%</div>`;
  elResult.prepend(summary);
}

function calcMedian(arr){
  const a = arr.slice().sort((x,y)=>x-y);
  const mid = Math.floor(a.length/2);
  return a.length % 2 ? a[mid] : (a[mid-1]+a[mid])/2;
}

// En liten säker escape för station-namn
function escapeHtml(str){
  return (str+'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
}

// Demo-data (körs när du inte konfigurerat ett API)
function demoData(fuelType, region){
  return {
    stations: [
      { name: "Preem Västra", price: 16.49, updated:"2025-10-03 12:10", region:"göteborg" },
      { name: "Circle K Central", price: 16.79, updated:"2025-10-03 11:05", region:"stockholm" },
      { name: "OKQ8 Norr", price: 16.39, updated:"2025-10-03 10:20", region:"göteborg" },
      { name: "St1 Öst", price: 16.95, updated:"2025-10-03 09:55", region:"stockholm" },
      { name: "Ingo Söder", price: 16.09, updated:"2025-10-03 08:30", region:"göteborg" }
    ]
  };
}

