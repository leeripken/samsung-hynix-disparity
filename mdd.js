"use strict";
let mddChart = null;
let fullLabels = [];
let samsungSeries = [];
let hynixSeries = [];
let resetZoomBound = false;

function getZone(value, zoneType) {
  if (zoneType === "kosdaq") {
    if (value <= -20) return "경계";
    if (value <= -14) return "조정";
    if (value <= -9)  return "관심";
    return "정상";
  } else {
    if (value <= -15) return "경계";
    if (value <= -10) return "조정";
    if (value <= -5)  return "관심";
    return "정상";
  }
}

function zoneBadge(zone) {
  if (zone === "경계") return '<span style="background:#e8462a;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">경계</span>';
  if (zone === "조정") return '<span style="background:#f5a623;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">조정</span>';
  if (zone === "관심") return '<span style="background:#27ae60;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">관심</span>';
  return '<span style="background:#2980b9;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">정상</span>';
}




function formatWon(value) {
  if (value === undefined || value === null || value === "" || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("ko-KR") + "원";
}

function formatPercent(value) {
  if (value === undefined || value === null || value === "" || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(1) + "%";
}

function drawMonitorCanvas(samVal, hynVal) {
  const canvas = document.getElementById("monitor-canvas");
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.offsetWidth || 700;
  const H   = 100;
  canvas.width        = W * dpr;
  canvas.height       = H * dpr;
  canvas.style.width  = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const SCALE_MIN = 0, SCALE_MAX = -35;
  const toX = v => ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * W;
  const BAR_H = 26;
  const BAR_Y = Math.round((H - BAR_H) / 2);

  const zones = [
    { from:  0, to:  -5, color: "#2980b9", label: "정상" },
    { from: -5, to: -10, color: "#27ae60", label: "관심" },
    { from:-10, to: -15, color: "#f5a623", label: "조정" },
    { from:-15, to: -35, color: "#e8462a", label: "경계" }


  ];
  zones.forEach(z => {
    const x1 = toX(z.from), x2 = toX(z.to);
    ctx.fillStyle = z.color;
    ctx.fillRect(x1, BAR_Y, x2 - x1, BAR_H);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(z.label, (x1 + x2) / 2, BAR_Y + BAR_H / 2);
  });

  function drawBalloon(value, label, color, above) {
    const clamped = Math.max(Math.min(value, SCALE_MIN), SCALE_MAX);
    const cx = toX(clamped);
    const bw = 110, bh = 24, r = 5, tailH = 7;
    const bx = Math.max(bw / 2 + 4, Math.min(W - bw / 2 - 4, cx));
    ctx.beginPath();
    if (above) {
      const by = BAR_Y - tailH - bh - 2;
      ctx.moveTo(bx - bw/2 + r, by);
      ctx.lineTo(bx + bw/2 - r, by);
      ctx.arcTo(bx + bw/2, by, bx + bw/2, by + r, r);
      ctx.lineTo(bx + bw/2, by + bh - r);
      ctx.arcTo(bx + bw/2, by + bh, bx + bw/2 - r, by + bh, r);
      ctx.lineTo(cx + tailH, by + bh);
      ctx.lineTo(cx, by + bh + tailH);
      ctx.lineTo(cx - tailH, by + bh);
      ctx.lineTo(bx - bw/2 + r, by + bh);
      ctx.arcTo(bx - bw/2, by + bh, bx - bw/2, by + bh - r, r);
      ctx.lineTo(bx - bw/2, by + r);
      ctx.arcTo(bx - bw/2, by, bx - bw/2 + r, by, r);
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11.5px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label + "  " + value.toFixed(1) + "%", bx, by + bh / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - 4, BAR_Y - 1);
      ctx.lineTo(cx + 4, BAR_Y - 1);
      ctx.lineTo(cx, BAR_Y + 6);
      ctx.fill();
    } else {
      const by = BAR_Y + BAR_H + tailH + 2;
      ctx.moveTo(cx - tailH, by);
      ctx.lineTo(cx, by - tailH);
      ctx.lineTo(cx + tailH, by);
      ctx.lineTo(bx + bw/2 - r, by);
      ctx.arcTo(bx + bw/2, by, bx + bw/2, by + r, r);
      ctx.lineTo(bx + bw/2, by + bh - r);
      ctx.arcTo(bx + bw/2, by + bh, bx + bw/2 - r, by + bh, r);
      ctx.lineTo(bx - bw/2 + r, by + bh);
      ctx.arcTo(bx - bw/2, by + bh, bx - bw/2, by + bh - r, r);
      ctx.lineTo(bx - bw/2, by + r);
      ctx.arcTo(bx - bw/2, by, bx - bw/2 + r, by, r);
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11.5px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label + "  " + value.toFixed(1) + "%", bx, by + bh / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - 4, BAR_Y + BAR_H + 1);
      ctx.lineTo(cx + 4, BAR_Y + BAR_H + 1);
      ctx.lineTo(cx, BAR_Y + BAR_H - 5);
      ctx.fill();
    }
  }

  if (samVal !== null && !isNaN(samVal)) drawBalloon(samVal, "삼성전자",   "#0b57d0", true);
  if (hynVal !== null && !isNaN(hynVal)) drawBalloon(hynVal, "SK하이닉스", "#d946ef", false);
}

function renderCards(samStock, hynStock) {
  const cards = document.getElementById("mdd-cards");
  if (!cards) return;
  const render = (stock, color) => {
    const zone = stock.current_zone || getZone(stock.current_drawdown, stock.zone_type);
    return `
      <section class="card mdd-stock-card">
        <div class="mini-label" style="color:${color};">${stock.name ?? "-"}</div>
        <div class="mdd-big">${formatPercent(stock.current_drawdown)}</div>
        <div class="mdd-sub">${zoneBadge(zone)} <span>52주 사상최고가 대비</span></div>
        <div class="mdd-meta-row"><span>52주 사상최고가 대비 낙폭</span><strong>${formatPercent(stock.high_52w_drawdown)}</strong></div>
        <div class="mdd-meta-row"><span>52주 사상최고가</span><strong>${formatWon(stock.high_52w_price)}</strong></div>
        <div class="mdd-meta-row"><span>현재가</span><strong>${formatWon(stock.current_price)}</strong></div>
      </section>`;
  };
  cards.innerHTML = render(samStock, "#0b57d0") + render(hynStock, "#d946ef");
}

function renderHistory(samsung, hynix) {
  const tbody = document.getElementById("history-body");
  if (!tbody) return;
  const maxRows = Math.min(samsung.history.length, hynix.history.length);
  tbody.innerHTML = samsung.history.slice(0, maxRows).map((row, i) => {
    const hrow  = hynix.history[i];
    const sZone = row.zone  || getZone(row.drawdown,  samsung.zone_type);
    const hZone = hrow.zone || getZone(hrow.drawdown, hynix.zone_type);
    return `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:8px 4px;color:#555;">${row.date ?? "-"}</td>
        <td style="padding:8px 4px;text-align:right;font-weight:bold;">${formatPercent(row.drawdown)}</td>
        <td style="padding:8px 4px;text-align:center;">${zoneBadge(sZone)}</td>
        <td style="padding:8px 4px;text-align:right;font-weight:bold;">${formatPercent(hrow.drawdown)}</td>
        <td style="padding:8px 4px;text-align:center;">${zoneBadge(hZone)}</td>
      </tr>`;
  }).join("");
}

function renderChart(days) {
  const canvas = document.getElementById("mddChart");
  if (!canvas) return;
  if (mddChart) mddChart.destroy();
  const n = days || fullLabels.length;
  mddChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: fullLabels.slice(-n),
      datasets: [
        { label:"삼성전자",   data:samsungSeries.slice(-n), borderColor:"#0b57d0", backgroundColor:"rgba(11,87,208,0.08)",  tension:0.18, pointRadius:0, pointHoverRadius:4, pointHoverBackgroundColor:"#fff", pointHoverBorderColor:"#0b57d0", pointHoverBorderWidth:2, borderWidth:1.8 },
        { label:"SK하이닉스", data:hynixSeries.slice(-n),   borderColor:"#d946ef", backgroundColor:"rgba(217,70,239,0.08)", tension:0.18, pointRadius:0, pointHoverRadius:4, pointHoverBackgroundColor:"#fff", pointHoverBorderColor:"#d946ef", pointHoverBorderWidth:2, borderWidth:1.8 }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode:"index", intersect:false },
      plugins: {
        legend: { labels: { color:"#374151" } },
        annotation: { annotations: {
          line10: { type:"line", yMin:-10, yMax:-10, borderColor:"rgba(245,166,35,0.7)", borderWidth:1, borderDash:[6,4] },
          line15: { type:"line", yMin:-15, yMax:-15, borderColor:"rgba(232,70,42,0.7)",  borderWidth:1, borderDash:[6,4] }
        }},
        zoom: {
          zoom: { wheel:{enabled:true}, pinch:{enabled:true}, mode:"x" },
          pan:  { enabled:true, mode:"x" }
        }
      },
      scales: {
        y: {
          min:-40, max:5,
          ticks: { color:"#6b7280", callback: v => v + "%" },
          grid:  { color:"rgba(15,23,42,0.08)" },
          title: { display:true, text:"MDD (%)", color:"#374151" }
        },
        x: {
          ticks: { color:"#6b7280", maxTicksLimit:8 },
          grid:  { color:"rgba(15,23,42,0.05)" }
        }
      }
    }
  });
  if (!resetZoomBound) {
    canvas.addEventListener("dblclick", () => { if (mddChart) mddChart.resetZoom(); });
    resetZoomBound = true;
  }
}

function setMddPeriod(days, btn) {
  renderChart(days);
  document.querySelectorAll(".period-buttons button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

async function loadMdd() {
  const [samRes, hynRes] = await Promise.all([
    fetch("./data/samsung_mdd.json?v=" + Date.now()),
    fetch("./data/hynix_mdd.json?v=" + Date.now())
  ]);

  const samData = await samRes.json();
  const hynData = await hynRes.json();

  const updatedAt = document.getElementById("updated-at");
  if (updatedAt) {
    const lastDate =
      samData.chart?.labels?.slice(-1)[0] ??
      hynData.chart?.labels?.slice(-1)[0] ??
      "-";

    const versionText =
      samData.version_label ??
      samData.updated_at ??
      hynData.version_label ??
      hynData.updated_at ??
      "-";

    updatedAt.textContent = `기준일 ${lastDate} · 업데이트 ${versionText}`;
  }

  const samsung = {
    ...samData,
    history: samData.history ?? []
  };

  const hynix = {
    ...hynData,
    history: hynData.history ?? []
  };

  renderCards(samsung, hynix);

  fullLabels = samData.chart?.labels ?? [];
  samsungSeries = samData.chart?.values ?? [];
  hynixSeries = hynData.chart?.values ?? [];

  renderChart();
  renderHistory(samsung, hynix);

  drawMonitorCanvas(
    samsung.current_drawdown ?? null,
    hynix.current_drawdown ?? null
  );
}

loadMdd();