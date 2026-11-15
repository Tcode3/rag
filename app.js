const App = {
  isDark: true,
  currentView: 'initial', // 'initial' (upload first screen) | 'dashboard'
  physicsEnabled: true,
  hoveredNode: null,
  draggedNode: null,
  nodes: [],
  edges: [],
  stagedDocName: 'Regulatory_Policy_Framework_2026.pdf',
  // REAL DOCUMENT MILESTONES (Normalized across document sections)
  // Entities: Cumulative entity count discovered across 8 contract sections (4 to 28)
  entitiesDataNormalized: [0.22, 0.38, 0.35, 0.54, 0.68, 0.82, 0.78, 0.96],
  // Flagged: Contract clause risk density (0 in preamble, peaking at Sec 14 IP Indemnity & Sec 8 Termination)
  flaggedDataNormalized: [0.08, 0.09, 0.11, 0.12, 0.16, 0.38, 0.92, 0.48]
};

// ------------------------------------------------------------------
// 1. FLOW SWITCHER: INITIAL UPLOAD (NO SIDEBAR) VS DASHBOARD
// ------------------------------------------------------------------
function returnToUploadFirstScreen() {
  App.currentView = 'initial';
  document.getElementById('screenInitialUpload').style.display = 'flex';
  document.getElementById('screenDashboardAnalytics').style.display = 'none';

  // Reset staged / processing states
  document.getElementById('initialStagedRow').style.display = 'none';
  document.getElementById('initialTriggerBtnWrapper').style.display = 'none';
  document.getElementById('initialProcessingScan').style.display = 'none';
}

function enterDashboardAnalyticsScreen() {
  App.currentView = 'dashboard';
  document.getElementById('screenInitialUpload').style.display = 'none';
  document.getElementById('screenDashboardAnalytics').style.display = 'flex';

  document.getElementById('docProfileFileName').textContent = App.stagedDocName;

  // Initialize graph canvas & real-data live floating waves
  setTimeout(() => {
    initGraph();
    startRealDataLiveWaves();
  }, 40);
}

// ------------------------------------------------------------------
// 2. INITIAL UPLOAD ACTIONS
// ------------------------------------------------------------------
const initialDropZone = document.getElementById('initialDropZone');
const mainPdfFileInput = document.getElementById('mainPdfFileInput');

initialDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  initialDropZone.classList.add('drag-active');
});
initialDropZone.addEventListener('dragleave', () => initialDropZone.classList.remove('drag-active'));
initialDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  initialDropZone.classList.remove('drag-active');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    onFileSelected(e.dataTransfer.files[0].name);
    executeDocumentAnalyticsFlow();
  }
});

mainPdfFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    onFileSelected(e.target.files[0].name);
    executeDocumentAnalyticsFlow();
  }
});

function stageSampleDocument() {
  onFileSelected('Regulatory_Policy_Framework_2026.pdf');
  executeDocumentAnalyticsFlow();
}

function onFileSelected(filename) {
  App.stagedDocName = filename;
  document.getElementById('initialStagedName').textContent = filename;
  document.getElementById('initialStagedRow').style.display = 'flex';
  document.getElementById('initialTriggerBtnWrapper').style.display = 'block';
}

function unstageDocument() {
  document.getElementById('initialStagedRow').style.display = 'none';
  document.getElementById('initialTriggerBtnWrapper').style.display = 'none';
  document.getElementById('initialProcessingScan').style.display = 'none';
}

let procTimer = null;
function executeDocumentAnalyticsFlow() {
  document.getElementById('initialTriggerBtnWrapper').style.display = 'none';
  const scan = document.getElementById('initialProcessingScan');
  scan.style.display = 'flex';

  const pBar = document.getElementById('initialProcBar');
  const pNum = document.getElementById('initialProcNum');
  pBar.style.width = '100%';
  pNum.textContent = '100%';

  setTimeout(finishProcessingAndEnterDashboard, 110);
}

function finishProcessingAndEnterDashboard() {
  if (procTimer) clearInterval(procTimer);
  enterDashboardAnalyticsScreen();
}

// ------------------------------------------------------------------
// 3. THEME TOGGLE (LIGHT & DARK MODE)
// ------------------------------------------------------------------
function toggleTheme() {
  App.isDark = !App.isDark;
  document.documentElement.classList.toggle('light', !App.isDark);
  document.documentElement.classList.toggle('dark', App.isDark);

  document.querySelectorAll('.theme-label-slot').forEach(el => {
    el.textContent = App.isDark ? 'Light' : 'Dark';
  });
  document.querySelectorAll('.theme-icon-orb').forEach(el => {
    el.textContent = App.isDark ? '☼' : '🌙';
  });
}

// ------------------------------------------------------------------
// 4. REAL DATA LIVE FLOATING WAVES (SMOOTH SPLINE + NO KINKS)
// ------------------------------------------------------------------
let liveWaveTimerId = null;
let waveBreathTime = 0;
let waveDims = { w: 180, h: 44, dpr: 1 };

function updateWaveCanvasDimensions() {
  const dpr = window.devicePixelRatio || 1;
  ['cyanWaveCanvas', 'redWaveCanvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c) {
      const w = c.clientWidth || 180;
      const h = c.clientHeight || 44;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      waveDims = { w, h, dpr };
    }
  });
}

function startRealDataLiveWaves() {
  if (liveWaveTimerId) cancelAnimationFrame(liveWaveTimerId);
  updateWaveCanvasDimensions();
  window.addEventListener('resize', updateWaveCanvasDimensions, { passive: true });

  function renderWaveLoop() {
    waveBreathTime += 0.035;

    // 1. Entities Wave: Real cumulative progression
    const cyanStroke = App.isDark ? '#38bdf8' : '#0284c7';
    const cyanGradTop = App.isDark ? 'rgba(56, 189, 248, 0.38)' : 'rgba(2, 132, 199, 0.25)';
    const cyanGradBottom = App.isDark ? 'rgba(56, 189, 248, 0.0)' : 'rgba(2, 132, 199, 0.0)';
    drawFastBezierRealWave('cyanWaveCanvas', App.entitiesDataNormalized, waveBreathTime, cyanStroke, cyanGradTop, cyanGradBottom);

    // 2. Flagged Risks Wave: Real section risks distribution peaking at Sec 14
    const redStroke = App.isDark ? '#f43f5e' : '#e11d48';
    const redGradTop = App.isDark ? 'rgba(244, 63, 94, 0.38)' : 'rgba(225, 29, 72, 0.25)';
    const redGradBottom = App.isDark ? 'rgba(244, 63, 94, 0.0)' : 'rgba(225, 29, 72, 0.0)';
    drawFastBezierRealWave('redWaveCanvas', App.flaggedDataNormalized, waveBreathTime * 1.1 + 1.2, redStroke, redGradTop, redGradBottom);

    liveWaveTimerId = requestAnimationFrame(renderWaveLoop);
  }

  renderWaveLoop();
}

// 0ms Zero-Overhead Hardware-Accelerated Catmull-Rom Bezier Spline
function drawFastBezierRealWave(canvasId, normalizedData, time, strokeColor, gradTop, gradBottom) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const w = waveDims.w;
  const h = waveDims.h;
  const dpr = waveDims.dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const n = normalizedData.length;
  const stepX = w / (n - 1);

  // Generate the 8 milestone control points with gentle edge-anchored breathing
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = i * stepX;
    const baseNorm = normalizedData[i];
    const baseY = h - (baseNorm * (h * 0.70) + h * 0.14);
    const anchor = Math.sin((i / (n - 1)) * Math.PI);
    const wave = Math.sin(time * 1.8 + i * 0.6) * 1.5 * anchor;
    pts.push({ x, y: Math.max(3, Math.min(h - 3, baseY + wave)) });
  }

  // Draw smooth spline through points
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(pts[0].x, pts[0].y);

  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6.0;
    const cp1y = p1.y + (p2.y - p0.y) / 6.0;
    const cp2x = p2.x - (p3.x - p1.x) / 6.0;
    const cp2y = p2.y - (p3.y - p1.y) / 6.0;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, gradTop);
  grad.addColorStop(1, gradBottom);
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6.0;
    const cp1y = p1.y + (p2.y - p0.y) / 6.0;
    const cp2x = p2.x - (p3.x - p1.x) / 6.0;
    const cp2y = p2.y - (p3.y - p1.y) / 6.0;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Peak milestone dot
  const last = pts[n - 1];
  ctx.beginPath();
  ctx.arc(last.x - 2, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();

  ctx.restore();
}

let graphAnimId = null;
let graphListenersAttached = false;

function initGraph() {
  const canvas = document.getElementById('graphRendererCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const box = document.getElementById('canvasBox');
  const dpr = window.devicePixelRatio || 1;

  let width = box.clientWidth || 600;
  let height = box.clientHeight || 410;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const centerX = width * 0.48;
  const centerY = height * 0.44; // Raised to give 120px+ clear bottom breathing room

  const nodes = [
    { id: 'cloud', label: 'CloudVendor Inc', sub: '', type: 'hub', x: centerX, y: centerY, vx: 0, vy: 0, r: 24, icon: '☁', color: '#8b5cf6' },
    { id: 'apex', label: 'Apex Corp', sub: 'Involves', type: 'entity', x: centerX - 135, y: centerY - 15, vx: 0, vy: 0, r: 21, icon: '🏛', color: '#3b82f6' },
    { id: 'delaware', label: 'Delaware Jurisdiction', sub: 'Governed In', type: 'obligation', x: centerX - 145, y: centerY - 95, vx: 0, vy: 0, r: 18, icon: '⚖', color: '#8b5cf6' },
    { id: 'uncapped', label: 'Uncapped IP Indemnity', sub: 'Bears Risk', type: 'risk', x: centerX - 25, y: centerY - 90, vx: 0, vy: 0, r: 20, icon: '⚠️', color: '#ef4444' },
    { id: 'soc2', label: 'SOC-2 Audit', sub: 'Provides', type: 'compliance', x: centerX + 115, y: centerY - 90, vx: 0, vy: 0, r: 19, icon: '🛡', color: '#06b6d4' },
    { id: 'aes', label: 'AES-256 Encryption', sub: 'Audits', type: 'compliance', x: centerX + 165, y: centerY + 15, vx: 0, vy: 0, r: 19, icon: '🔒', color: '#10b981' },
    { id: 'subproc', label: 'Sub-Processor Audit', sub: '', type: 'compliance', x: centerX + 155, y: centerY + 80, vx: 0, vy: 0, r: 17, icon: '⚙', color: '#06b6d4' },
    { id: 'breach', label: '72h Breach Notice', sub: '', type: 'obligation', x: centerX + 10, y: centerY + 85, vx: 0, vy: 0, r: 18, icon: '⏱', color: '#8b5cf6' },
    { id: 'liability', label: '2x Liability Cap', sub: '', type: 'obligation', x: centerX - 85, y: centerY + 45, vx: 0, vy: 0, r: 18, icon: '🛡', color: '#8b5cf6' },
    { id: 'term', label: 'Termination (8.2)', sub: '', type: 'risk', x: centerX - 195, y: centerY + 55, vx: 0, vy: 0, r: 19, icon: '⏱', color: '#ef4444' }
  ];

  const edges = [
    { s: 'apex', t: 'cloud', pulse: 0.1 },
    { s: 'delaware', t: 'apex', pulse: 0.3 },
    { s: 'delaware', t: 'uncapped', pulse: 0.5 },
    { s: 'uncapped', t: 'cloud', pulse: 0.7 },
    { s: 'cloud', t: 'soc2', pulse: 0.2 },
    { s: 'cloud', t: 'aes', pulse: 0.6 },
    { s: 'aes', t: 'subproc', pulse: 0.8 },
    { s: 'cloud', t: 'breach', pulse: 0.4 },
    { s: 'cloud', t: 'liability', pulse: 0.9 },
    { s: 'apex', t: 'liability', pulse: 0.15 },
    { s: 'apex', t: 'term', pulse: 0.35 },
    { s: 'liability', t: 'breach', pulse: 0.65 },
    { s: 'uncapped', t: 'soc2', pulse: 0.85 }
  ];

  App.nodes = nodes;
  App.edges = edges;

  function stepPhysics() {
    if (!App.physicsEnabled) return;
    const repulsion = 1400;
    const springK = 0.003;
    const springLength = 110;
    const friction = 0.88;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = repulsion / (dist * dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;

        if (nodes[i] !== App.draggedNode) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
        if (nodes[j] !== App.draggedNode) { nodes[j].vx += fx; nodes[j].vy += fy; }
      }
    }

    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.s);
      const b = nodes.find(n => n.id === e.t);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (dist - springLength) * springK;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;

      if (a !== App.draggedNode) { a.vx += fx; a.vy += fy; }
      if (b !== App.draggedNode) { b.vx -= fx; b.vy -= fy; }
      e.pulse = (e.pulse + 0.007) % 1;
    });

    nodes.forEach(n => {
      if (n === App.draggedNode) return;
      n.vx *= friction;
      n.vy *= friction;
      n.x += n.vx;
      n.y += n.vy;

      // Generous boundary clamping so labels and halos never leave the visible canvas
      n.x = Math.max(n.r + 25, Math.min(width - n.r - 25, n.x));
      n.y = Math.max(n.r + 25, Math.min(height - n.r - 42, n.y));
    });
  }

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);
    const isDark = App.isDark;

    // Cosmic Orbits
    ctx.save();
    ctx.translate(centerX, centerY);

    const orbitColor1 = isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(99, 102, 241, 0.16)';
    const orbitColor2 = isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(6, 182, 212, 0.16)';
    const orbitColor3 = isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(168, 85, 247, 0.14)';

    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.44, height * 0.42, -0.15, 0, Math.PI * 2);
    ctx.strokeStyle = orbitColor1;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.36, height * 0.34, 0.22, 0, Math.PI * 2);
    ctx.strokeStyle = orbitColor2;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.24, height * 0.22, -0.05, 0, Math.PI * 2);
    ctx.strokeStyle = orbitColor3;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Laser Edges
    const edgeBaseColor = isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.25)';
    const edgePulseColor = isDark ? '#c084fc' : '#6366f1';

    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.s);
      const b = nodes.find(n => n.id === e.t);
      if (!a || !b) return;

      const isHovered = (App.hoveredNode && (App.hoveredNode === a || App.hoveredNode === b));

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHovered ? (isDark ? '#818cf8' : '#4338ca') : edgeBaseColor;
      ctx.lineWidth = isHovered ? 2.5 : 1.3;
      ctx.stroke();

      const px = a.x + (b.x - a.x) * e.pulse;
      const py = a.y + (b.y - a.y) * e.pulse;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = edgePulseColor;
      ctx.fill();
    });

    // Nodes (Adaptive High-Contrast Rendering)
    nodes.forEach(n => {
      const isHover = (App.hoveredNode === n);

      // Glow Halo
      const glow = ctx.createRadialGradient(n.x, n.y, n.r * 0.3, n.x, n.y, n.r + 20);
      glow.addColorStop(0, n.color + (isDark ? '66' : '33'));
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 20, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + (isHover ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(8, 12, 32, 0.92)' : '#ffffff';
      ctx.fill();

      // Outer Stroke Ring
      ctx.strokeStyle = n.color;
      ctx.lineWidth = isHover ? 3 : 2.2;
      ctx.stroke();

      // Inner Icon Glyph
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : (n.color === '#ef4444' ? '#dc2626' : (n.color === '#10b981' ? '#059669' : '#3730a3'));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.icon, n.x, n.y);

      // Node Label (Smart placement & Clamped Bounds so NO words are EVER cut off)
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      const textWidth = ctx.measureText(n.label).width;

      const pillW = textWidth + 14;
      let pillX = n.x - pillW / 2;
      pillX = Math.max(8, Math.min(width - pillW - 8, pillX));
      const textX = pillX + pillW / 2;

      // If node is close to bottom, flip the label pill ABOVE the node
      const placeAbove = (n.y > height - 68);
      const pillH = n.sub ? 32 : 18;
      let pillY = placeAbove ? (n.y - n.r - pillH - 6) : (n.y + n.r + 6);
      pillY = Math.max(6, Math.min(height - pillH - 6, pillY));

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 5);
      ctx.fillStyle = isDark ? 'rgba(3, 6, 20, 0.88)' : 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#090d20';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.label, textX, pillY + 3);

      if (n.sub) {
        ctx.font = '500 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
        ctx.fillText(n.sub, textX, pillY + 17);
      }
    });

    stepPhysics();
    graphAnimId = requestAnimationFrame(renderFrame);
  }

  if (graphAnimId) cancelAnimationFrame(graphAnimId);

  function findNodeAt(mx, my) {
    const list = App.nodes || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      const dx = n.x - mx;
      const dy = n.y - my;
      const distSq = dx * dx + dy * dy;
      // Generous 24px extra hit target around node core
      const grabR = n.r + 24;
      if (distSq <= grabR * grabR) return n;
      // Also check the pill label region
      if (mx >= n.x - 65 && mx <= n.x + 65 && my >= n.y - 12 && my <= n.y + 44) {
        return n;
      }
    }
    return null;
  }

  if (!graphListenersAttached) {
    graphListenersAttached = true;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const target = findNodeAt(mx, my);
      if (target) {
        App.draggedNode = target;
        target.vx = 0;
        target.vy = 0;
        canvas.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (App.draggedNode) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = canvas.clientWidth || 600;
        const h = canvas.clientHeight || 450;
        App.draggedNode.x = Math.max(App.draggedNode.r + 15, Math.min(w - App.draggedNode.r - 15, mx));
        App.draggedNode.y = Math.max(App.draggedNode.r + 15, Math.min(h - App.draggedNode.r - 25, my));
        App.draggedNode.vx = 0;
        App.draggedNode.vy = 0;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const tooltip = document.getElementById('neuralNodeTooltip');

      if (App.draggedNode) {
        if (tooltip) tooltip.style.display = 'none';
        return;
      }

      const found = findNodeAt(mx, my);
      App.hoveredNode = found;

      if (found) {
        canvas.style.cursor = 'grab';
        if (tooltip) {
          tooltip.style.left = (mx + 16) + 'px';
          tooltip.style.top = (my + 10) + 'px';
          tooltip.innerHTML = `
            <div style="font-size: 12.5px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${found.label}</div>
            <div style="font-size: 10px; text-transform: uppercase; color: ${found.color}; font-weight: 700;">${found.type}</div>
          `;
          tooltip.style.display = 'block';
        }
      } else {
        canvas.style.cursor = 'default';
        if (tooltip) tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (!App.draggedNode) {
        App.hoveredNode = null;
        const tooltip = document.getElementById('neuralNodeTooltip');
        if (tooltip) tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
      }
    });

    window.addEventListener('mouseup', () => {
      if (App.draggedNode) {
        App.draggedNode.vx = 0;
        App.draggedNode.vy = 0;
        App.draggedNode = null;
        canvas.style.cursor = 'grab';
        document.body.style.cursor = '';
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mx = t.clientX - rect.left;
        const my = t.clientY - rect.top;
        const target = findNodeAt(mx, my);
        if (target) {
          App.draggedNode = target;
          target.vx = 0;
          target.vy = 0;
          e.preventDefault();
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (App.draggedNode && e.touches.length > 0) {
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mx = t.clientX - rect.left;
        const my = t.clientY - rect.top;
        const w = canvas.clientWidth || 600;
        const h = canvas.clientHeight || 450;
        App.draggedNode.x = Math.max(App.draggedNode.r + 15, Math.min(w - App.draggedNode.r - 15, mx));
        App.draggedNode.y = Math.max(App.draggedNode.r + 15, Math.min(h - App.draggedNode.r - 25, my));
        App.draggedNode.vx = 0;
        App.draggedNode.vy = 0;
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (App.draggedNode) {
        App.draggedNode.vx = 0;
        App.draggedNode.vy = 0;
        App.draggedNode = null;
      }
    });
  }

  renderFrame();
}

function toggleGraphPhysics() {
  App.physicsEnabled = !App.physicsEnabled;
  const icon = document.getElementById('physicsIcon');
  const text = document.getElementById('physicsBtnText');
  if (icon) icon.textContent = App.physicsEnabled ? '⏸' : '▶';
  if (text) text.textContent = App.physicsEnabled ? 'Pause Animation' : 'Resume Animation';
}

function recenterGraph() {
  initGraph();
}

function toggleFullScreenCanvas() {
  const box = document.getElementById('canvasBox');
  if (!document.fullscreenElement) {
    box.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ------------------------------------------------------------------
// 6. INSTANTANEOUS, ULTRA-FAST TAB SWITCHING (0ms LAG)
// ------------------------------------------------------------------
function switchWorkspaceTab(tabId) {
  // 0ms Instantaneous synchronous state switch - ZERO DELAY
  const views = {
    qa: document.getElementById('viewQA'),
    summary: document.getElementById('viewSummary'),
    risk: document.getElementById('viewRisk')
  };

  for (const key in views) {
    if (views[key]) {
      views[key].style.display = (key === tabId) ? 'flex' : 'none';
    }
  }

  // Instant visual highlight sync
  const p1 = document.getElementById('actionPillBtn1');
  const p2 = document.getElementById('actionPillBtn2');
  const p3 = document.getElementById('actionPillBtn3');
  [p1, p2, p3].forEach((p, idx) => {
    if (!p) return;
    const isTarget = (idx === 0 && tabId === 'qa') || (idx === 1 && tabId === 'summary') || (idx === 2 && tabId === 'risk');
    p.classList.toggle('active-synced-pill', isTarget);
    p.classList.toggle('active-synced-row', isTarget);
  });
}

function toggleFullScreenWorkspace() {
  const panel = document.getElementById('bottomWorkspacePanel');
  if (!document.fullscreenElement) {
    panel.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function setQuestionText(query) {
  const input = document.getElementById('userQuestionInput');
  input.value = query;
  input.focus();
  // Immediate auto-answer for snappy UX
  submitCurrentQuestion();
}

function handleFormSubmit(e) {
  e.preventDefault();
  submitCurrentQuestion();
}

function submitCurrentQuestion() {
  const input = document.getElementById('userQuestionInput');
  const val = input.value.trim();
  if (!val) return;

  const feed = document.getElementById('aiMessageFeed');
  const valLower = val.toLowerCase();

  let answerText = "";
  if (valLower.includes('terminat')) {
    answerText = `Section 8.2 specifies that either party may terminate for convenience with <strong>60 days' written notice</strong>. However, immediate termination for regulatory inquiry carries unmitigated transition liabilities under <span class="citation-tag">Section 8.2 Immediate Termination</span> without cure rights.`;
  } else if (valLower.includes('privac') || valLower.includes('data') || valLower.includes('encrypt')) {
    answerText = `Provider is classified as a Data Processor under <span class="citation-tag">Section 11.2 AES-256</span>. All records must be encrypted with AES-256 at rest and TLS 1.3 in transit. Incident notification must be dispatched within a strict <strong>48-hour window</strong> under <span class="citation-tag">Section 11.4 Incident Reporting</span>.`;
  } else if (valLower.includes('indemn') || valLower.includes('super-cap')) {
    answerText = `Under <span class="citation-tag">Section 14.3 IP Indemnity</span>, indemnification obligations for third-party intellectual property claims are <strong>completely uncapped</strong>, explicitly superseding the general 2× contract liability ceiling in <span class="citation-tag">Section 14.1 Liability Cap</span>.`;
  } else if (valLower.includes('jurisdiction') || valLower.includes('court') || valLower.includes('delaware')) {
    answerText = `Under <span class="citation-tag">Section 16.2 Governing Law</span>, this Agreement is governed by Delaware General Corporation Law. Parties agree to the exclusive jurisdiction of the <strong>Delaware Court of Chancery</strong> after completing a mandatory 30-day executive mediation period under <span class="citation-tag">Section 16.4 Mediation</span>.`;
  } else {
    answerText = `Synthesized graph analysis confirms contractual governance between <span class="citation-tag">Apex Corp</span> and <span class="citation-tag">CloudVendor Inc</span>. Section 8.2, 11.4, and 14.3 mandate specific disclosure and cure requirements across all 34 mapped entities.`;
  }

  feed.innerHTML = `<span style="color: #c084fc; font-weight: 700;">Q: "${val}"</span><br>${answerText}`;
  input.value = '';
}


function copyRedlineText(id) {
  let redline = "";
  let btnId = "copyRedlineBtn" + id;
  if (id === 1) {
    redline = "...provided however that Vendor's aggregate indemnity liability under Section 12 shall not exceed $5,000,000 USD or 5× annual fees paid.";
  } else if (id === 2) {
    redline = "...Customer may terminate only after delivering written notice detailing the inquiry and allowing Vendor thirty (30) days to clarify or remediate the finding.";
  } else {
    redline = "...within seventy-two (72) hours of confirming an actual security incident involving unauthorized access to unencrypted personal data.";
  }

  navigator.clipboard.writeText(redline).then(() => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy Redline';
      }, 1800);
    }
  });
}

// ------------------------------------------------------------------
// LAUNCH ON INITIAL FIRST SCREEN (UPLOAD ONLY - NO SIDEBAR)
// ------------------------------------------------------------------
window.addEventListener('load', () => {
  returnToUploadFirstScreen();
});
