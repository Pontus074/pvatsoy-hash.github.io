async function loadData() {
  const place = elPlace.value.trim().toLowerCase();
  if (!place) {
    elStatus.textContent = "Skriv in en ort.";
    return;
  }

  elStatus.textContent = "Söker stationer...";
  elResult.innerHTML = "";

  // fasta koordinater för demo
  let coord;
  if (place === "alingsås") {
    coord = { lat: 57.933, lon: 12.533 };
  } else if (place === "nossebro") {
    coord = { lat: 58.183, lon: 12.717 };
  } else {
    elStatus.textContent = "Demo-data finns bara för Alingsås och Nossebro.";
    return;
  }

  // fortsätt med resten av koden som tidigare, filtrera demoStations med coord
  const maxDist = 30;
  const nearby = demoStations.map(s => ({
    ...s,
    dist: distanceKm(coord.lat, coord.lon, s.lat, s.lon)
  })).filter(s => s.dist <= maxDist);

  if (nearby.length === 0) {
    elStatus.textContent = `Inga stationer hittades inom ${maxDist} km.`;
    return;
  }

  const prices = nearby.map(s => s.price);
  const median = calcMedian(prices);

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
}
