"use strict";

const crosshairLinePlugin = {
  id: "crosshairLine",
  afterDraw(chart) {
    const active = chart.getActiveElements();
    if (!active || !active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(148,163,184,0.55)";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }
};

if (window.Chart) {
  Chart.register(crosshairLinePlugin);
}
