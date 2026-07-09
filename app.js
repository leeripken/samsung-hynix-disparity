let chartInstance = null;
let allLabels = [];
let allValues = [];
let resetZoomBound = false;

function renderChart(days) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels.slice(-days),
      datasets: [{
        label: '50일 이격도',
        data: allValues.slice(-days),
        borderColor: '#0b57d0',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0b57d0',
        pointHoverBorderWidth: 2,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        annotation: {
          annotations: {
            line130: {
              type: 'line',
              yMin: 130, yMax: 130,
              borderColor: 'rgba(232,70,42,0.7)',
              borderWidth: 1,
              borderDash: [6, 4],
              label: { content: '130 과열', display: true, position: 'start', color: '#e8462a', backgroundColor: 'transparent', font: { size: 11 } }
            },
            line105: {
              type: 'line',
              yMin: 105, yMax: 105,
              borderColor: 'rgba(41,128,185,0.7)',
              borderWidth: 1,
              borderDash: [6, 4],
              label: { content: '105 과열해소', display: true, position: 'start', color: '#2980b9', backgroundColor: 'transparent', font: { size: 11 } }
            }
          }
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          }
        }
      },
      scales: {
        y: { ticks:{font:{ size: 8 } }, title: { display: true, text: '이격도 (%)' } },
        x: { ticks: { maxTicksLimit: 8, font:{ size: 8 } } }
      }
    }
  });

  if (!resetZoomBound) {
    document.getElementById('chart').addEventListener('dblclick', () => {
      chartInstance.resetZoom();
    });
    resetZoomBound = true;
  }
}

function setPeriod(days, btn) {
  renderChart(days);
  document.querySelectorAll('.period-buttons button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function drawMonitorPanel(value) {
  const canvas = document.getElementById('monitor');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = 70;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const zones = [
    { min: 70,  max: 105, color: '#2980b9', label: '과열해소' },
    { min: 105, max: 120, color: '#27ae60', label: '정상' },
    { min: 120, max: 130, color: '#f5a623', label: '과열경계' },
    { min: 130, max: 160, color: '#e8462a', label: '과열권' }
  ];

  const segW = W / 4;
  const barY = 25;
  const barH = 30;

  zones.forEach((z, i) => {
    ctx.fillStyle = z.color;
    ctx.fillRect(i * segW, barY, segW, barH);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(z.label, i * segW + segW / 2, barY + 19);
  });

  let zoneIndex = 0;
  let posInZone = 0;
  for (let i = 0; i < zones.length; i++) {
    if (value >= zones[i].min && value < zones[i].max) {
      zoneIndex = i;
      posInZone = (value - zones[i].min) / (zones[i].max - zones[i].min);
      break;
    }
    if (value >= zones[zones.length-1].max) {
      zoneIndex = zones.length - 1;
      posInZone = 1;
    }
  }

  const arrowX = zoneIndex * segW + posInZone * segW;
  const bW = 64, bH = 22, bR = 6;
  const bX = Math.min(Math.max(arrowX - bW / 2, 0), W - bW);
  const bY = 0;

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(bX, bY, bW, bH, bR);
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(bX, bY, bW, bH, bR);
  ctx.stroke();

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(arrowX - 5, bY + bH);
  ctx.lineTo(arrowX, bY + bH + 7);
  ctx.lineTo(arrowX + 5, bY + bH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = '#111';
  ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value.toFixed(1) + '%', bX + bW / 2, bY + 15);
}


async function loadSamsung() {
  const res = await fetch('./data/samsung.json?v=' + Date.now());
  const data = await res.json();

  const v = data.latest.disparity;
  document.getElementById('date').textContent = '기준: ' + data.latest.date;
  document.getElementById('close').textContent = '종가: ' + data.latest.close.toLocaleString() + '원';
  document.getElementById('ma50').textContent = '50일 이동평균: ' + data.latest.ma50.toLocaleString() + '원';
  document.getElementById('disparity').textContent = '이격도: ' + v + '%';
  document.getElementById('zone').textContent = '구간: ' + data.latest.zone;

  allLabels = data.chart.labels;
  allValues = data.chart.values;

  drawMonitorPanel(v);
    const tbody = document.getElementById('history-body');
  const recent = data.history.slice(-42).reverse();
  const zoneBadge = (zone) => {
    if (zone === '과열권') return '<span style="background:#e8462a;color:white;padding:2px 6px;border-radius:12px;font-size:10px;white-space:nowrap;">과열권</span>';
    if (zone === '과열 경계') return '<span style="background:#f5a623;color:white;padding:2px 6px;border-radius:12px;font-size:10px;white-space:nowrap;">과열 경계</span>';
    if (zone === '정상') return '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:12px;font-size:10px;white-space:nowrap;">정상</span>';
    if (zone === '과열 해소') return '<span style="background:#2980b9;color:white;padding:2px 6px;border-radius:12px;font-size:10px;white-space:nowrap;">과열 해소</span>';
    return zone;
  };
   tbody.innerHTML = recent.map((row, i) => {
    const prev = recent[i + 1];
    const closeColor = prev ? (row.close > prev.close ? '#e8462a' : row.close < prev.close ? '#2980b9' : '#111') : '#111';
    const ma50Color = prev ? (row.ma50 > prev.ma50 ? '#e8462a' : row.ma50 < prev.ma50 ? '#2980b9' : '#111') : '#111';
    return `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:8px 4px;color:#555;">${row.date}</td>
      <td style="padding:8px 4px;text-align:right;color:${closeColor};">${row.close.toLocaleString()}</td>
      <td style="padding:8px 4px;text-align:right;color:${ma50Color};">${row.ma50.toLocaleString()}</td>
      <td style="padding:8px 4px;text-align:right;font-weight:bold;">${row.disparity}%</td>
      <td style="padding:8px 4px;text-align:center;">${zoneBadge(row.zone)}</td>
    </tr>
  `}).join('');

  renderChart(252);
}

loadSamsung();