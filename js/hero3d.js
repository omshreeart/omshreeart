// ===== HERO RIGHT SIDE - FULLY SELF-CONTAINED CANVAS ANIMATION =====
(function(){
  var cv = document.getElementById('heroCanvas');
  if(!cv) return;

  // Set actual pixel dimensions
  var DPR = 1; // keep simple
  var SIZE = 560;
  cv.setAttribute('width',  SIZE);
  cv.setAttribute('height', SIZE);
  cv.style.width  = SIZE + 'px';
  cv.style.height = SIZE + 'px';

  var ctx = cv.getContext('2d');
  ctx.scale(DPR, DPR);

  var cx = SIZE/2, cy = SIZE/2;
  var tick = 0;
  var hov  = -1;

  // Load logo
  var logo = new Image();
  logo.src = 'img/logo.png';
  var logoOk = false;
  logo.onload = function(){ logoOk = true; };

  // ---- Product chips ----
  var ITEMS = [
    { label:'Business Cards', price:'Rs.350+', color:'#818cf8', abbr:'BC' },
    { label:'Number Plate',   price:'Rs.800+', color:'#38bdf8', abbr:'NP' },
    { label:'Rubber Stamp',   price:'Rs.450+', color:'#34d399', abbr:'RS' },
    { label:'Flex Printing',  price:'Rs.900+', color:'#22d3ee', abbr:'FX' },
    { label:'Sticker Print',  price:'Rs.200+', color:'#fbbf24', abbr:'ST' },
    { label:'Banner Print',   price:'Rs.600+', color:'#86efac', abbr:'BN' },
    { label:'Sign Boards',    price:'Rs.2.5k+',color:'#fb923c', abbr:'SB' },
  ];

  // ---- Orbits: each orbit has a radius, rotation speed, and array of item indices ----
  var ORBITS = [
    { r:140, speed: 0.009, offset: 0,           items:[0,1] },
    { r:210, speed:-0.006, offset: Math.PI/2,   items:[2,3,4] },
    { r:270, speed: 0.004, offset: Math.PI/5,   items:[5,6] },
  ];

  // Angle state for each orbit
  ORBITS.forEach(function(o){ o.angle = o.offset; });

  // Track chip screen positions for hit-testing
  var chipPos = [];

  // ---- Particle system (background) ----
  var PTCOUNT = 120;
  var pts = [];
  for(var i=0;i<PTCOUNT;i++){
    pts.push({
      x: Math.random()*SIZE,
      y: Math.random()*SIZE,
      r: Math.random()*1.5+0.3,
      a: Math.random()*Math.PI*2,
      sp: (Math.random()*0.5+0.2)*(Math.random()<0.5?1:-1),
      op: Math.random()*0.5+0.1,
      orb: Math.random()*90+30,
      ox: Math.random()*SIZE,
      oy: Math.random()*SIZE,
    });
  }

  // ---- Floating hex-grid dots ----
  var HEXS = [];
  var hgap = 36;
  for(var hy=0; hy<SIZE; hy+=hgap){
    for(var hx=0; hx<SIZE; hx+=hgap){
      HEXS.push({ x: hx + (Math.floor(hy/hgap)%2)*hgap/2, y: hy, phase: Math.random()*Math.PI*2 });
    }
  }

  // ---- Helpers ----
  function hex2rgb(h){
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  function rgba(h, a){
    var c = hex2rgb(h);
    return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
  }
  function rrect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y, x+w,y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h, x+w-r,y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h, x,y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x,y, x+r,y, r);
    ctx.closePath();
  }

  // ---- Mouse events ----
  cv.addEventListener('mousemove', function(e){
    var rect = cv.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (SIZE/rect.width);
    var my = (e.clientY - rect.top)  * (SIZE/rect.height);
    hov = -1;
    chipPos.forEach(function(cp, idx){
      var dx=mx-cp.x, dy=my-cp.y;
      if(dx*dx+dy*dy < 58*58) hov = idx;
    });
    cv.style.cursor = hov >= 0 ? 'pointer' : 'default';
  });
  cv.addEventListener('mouseleave', function(){ hov = -1; cv.style.cursor='default'; });
  cv.addEventListener('click', function(){
    if(hov >= 0){
      var item = ITEMS[hov];
      window.open('https://wa.me/9779851154009?text=Hello%2C+I+want+to+order+' + encodeURIComponent(item.label), '_blank');
    }
  });

  // ======== MAIN DRAW LOOP ========
  function draw(){
    ctx.clearRect(0, 0, SIZE, SIZE);
    tick++;
    chipPos = [];

    // ---- 1. HEX-GRID background dots ----
    ctx.save();
    HEXS.forEach(function(h){
      var pulse = Math.sin(tick*0.018 + h.phase)*0.5+0.5;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 1.2, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,'+(0.04 + pulse*0.06)+')';
      ctx.fill();
    });
    ctx.restore();

    // ---- 2. Floating particles ----
    ctx.save();
    pts.forEach(function(p){
      p.a += p.sp * 0.01;
      var px = p.ox + Math.cos(p.a)*p.orb;
      var py = p.oy + Math.sin(p.a)*p.orb;
      // Wrap within canvas
      px = ((px % SIZE) + SIZE) % SIZE;
      py = ((py % SIZE) + SIZE) % SIZE;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,'+p.op+')';
      ctx.fill();
    });
    ctx.restore();

    // ---- 3. Radial glow behind orb ----
    var pulse = Math.sin(tick*0.04)*0.5+0.5;
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160+pulse*20);
    glow.addColorStop(0,   'rgba(176,34,56,0.18)');
    glow.addColorStop(0.5, 'rgba(176,34,56,0.07)');
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI*2);
    ctx.fill();

    // ---- 4. Orbit rings ----
    var ringStyles = [
      { dash:[6,10], color:'rgba(176,34,56,0.45)',  lw:1.5 },
      { dash:[4,8],  color:'rgba(212,168,83,0.25)', lw:1.2 },
      { dash:[3,12], color:'rgba(255,255,255,0.08)',lw:1 },
    ];
    ORBITS.forEach(function(orb, i){
      ctx.save();
      ctx.setLineDash(ringStyles[i].dash);
      ctx.strokeStyle = ringStyles[i].color;
      ctx.lineWidth   = ringStyles[i].lw;
      ctx.beginPath(); ctx.arc(cx, cy, orb.r, 0, Math.PI*2);
      ctx.stroke();
      // Spinning ring highlight dot
      var ha = tick * orb.speed * 2;
      var hx2 = cx + orb.r*Math.cos(ha);
      var hy2 = cy + orb.r*Math.sin(ha);
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(hx2, hy2, 3, 0, Math.PI*2);
      ctx.fillStyle = ringStyles[i].color.replace('0.45','0.9').replace('0.25','0.8').replace('0.08','0.5');
      ctx.fill();
      ctx.restore();
    });

    // ---- 5. Draw product chips on orbit paths ----
    var itemGlobalIdx = 0;
    ORBITS.forEach(function(orb){
      orb.angle += orb.speed;
      orb.items.forEach(function(itemIdx, j){
        var a   = orb.angle + (j / orb.items.length) * Math.PI * 2;
        var px  = cx + orb.r * Math.cos(a);
        var py  = cy + orb.r * Math.sin(a);
        var item = ITEMS[itemIdx];
        var isH = (hov === itemIdx);
        chipPos[itemIdx] = { x:px, y:py };

        // Connector line
        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py);
        ctx.strokeStyle = rgba(item.color, isH ? 0.25 : 0.1);
        ctx.lineWidth = isH ? 1.5 : 1;
        ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.restore();

        // Dot on ring
        ctx.save();
        if(isH){ ctx.shadowColor = item.color; ctx.shadowBlur = 16; }
        ctx.beginPath(); ctx.arc(px, py, isH?5:3.5, 0, Math.PI*2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.restore();

        // Chip pill
        var CW = isH ? 168 : 154;
        var CH = isH ? 58  : 52;
        var cx2 = px - CW/2;
        var cy2 = py - CH/2;

        ctx.save();
        // Shadow
        ctx.shadowColor = isH ? item.color : 'rgba(0,0,0,0.9)';
        ctx.shadowBlur  = isH ? 24 : 14;
        // Background
        rrect(ctx, cx2, cy2, CW, CH, 11);
        ctx.fillStyle = isH ? 'rgba(8,3,24,0.97)' : 'rgba(6,2,20,0.92)';
        ctx.fill();
        // Border
        rrect(ctx, cx2, cy2, CW, CH, 11);
        ctx.strokeStyle = isH ? item.color : 'rgba(255,255,255,0.16)';
        ctx.lineWidth   = isH ? 1.8 : 1;
        ctx.stroke();
        ctx.restore();

        // Left color badge
        ctx.save();
        ctx.beginPath(); ctx.arc(cx2+22, cy2+CH/2, 14, 0, Math.PI*2);
        ctx.fillStyle = rgba(item.color, 0.18);
        ctx.fill();
        ctx.strokeStyle = item.color; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = item.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(item.abbr, cx2+22, cy2+CH/2);
        ctx.restore();

        // Label
        ctx.save();
        ctx.font = 'bold ' + (isH?13:12) + 'px' "Space Grotesk",sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(item.label, cx2+42, cy2+CH/2-7);
        // Price
        ctx.font = 'bold 11px "Space Grotesk",sans-serif';
        ctx.fillStyle = item.color;
        ctx.fillText(item.price, cx2+42, cy2+CH/2+8);
        ctx.restore();

        itemGlobalIdx++;
      });
    });

    // ---- 6. Central orb ----
    var orbR = 82;
    // Outer pulse rings
    for(var ri=0; ri<3; ri++){
      var rr = orbR + 12 + ri*10 + pulse*(ri+1)*4;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(212,168,83,'+(0.25-ri*0.07)+')';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    // Main orb fill
    var og = ctx.createRadialGradient(cx-22, cy-18, 0, cx, cy, orbR);
    og.addColorStop(0, '#5a0a18');
    og.addColorStop(0.55,'#B02238');
    og.addColorStop(1, '#2a0007');
    ctx.save();
    ctx.shadowColor = '#B02238'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI*2);
    ctx.fillStyle = og; ctx.fill();
    // Gold border
    ctx.strokeStyle = 'rgba(212,168,83,'+(0.5+pulse*0.3)+')';
    ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // Logo clipped
    if(logoOk){
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, orbR-3, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(logo, cx-(orbR-3), cy-(orbR-3), (orbR-3)*2, (orbR-3)*2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#D4A853';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OSA', cx, cy);
      ctx.restore();
    }

    // ---- 7. Label under orb ----
    ctx.save();
    ctx.font = '700 10px "Space Grotesk",monospace';
    ctx.fillStyle = 'rgba(212,168,83,0.55)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('OM SHREE ART', cx, cy+orbR+18);
    ctx.restore();

    // ---- 8. Hover tooltip at bottom ----
    if(hov >= 0 && ITEMS[hov]){
      var msg = 'Tap to order on WhatsApp \u2192';
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      var tw = ctx.measureText(msg).width + 28;
      rrect(ctx, cx-tw/2, SIZE-38, tw, 26, 7);
      ctx.fillStyle = 'rgba(8,3,24,0.96)'; ctx.fill();
      rrect(ctx, cx-tw/2, SIZE-38, tw, 26, 7);
      ctx.strokeStyle = ITEMS[hov].color; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle = ITEMS[hov].color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(msg, cx, SIZE-25);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();


// ======================================================
// AUTO SHOWCASE SLIDESHOW
// ======================================================
(function(){
  var items = document.querySelectorAll('.sl-item');
  var feature = document.querySelector('.showcase-feature');
  if(!items.length || !feature) return;

  var DURATION = 3800; // ms per slide
  var current  = 0;
  var timer    = null;
  var barTimer = null;
  var paused   = false;

  var ICONS    = [];
  var NAMES    = [];
  var DESCS    = [];
  var PRICES   = [];
  var HREFS    = [];
  var COLORS   = [];
  var TAGS     = [];

  items.forEach(function(el, i){
    ICONS.push(el.dataset.icon   || '');
    NAMES.push(el.dataset.name   || '');
    DESCS.push(el.dataset.desc   || '');
    PRICES.push(el.dataset.price || '');
    HREFS.push(el.dataset.href   || '#');
    COLORS.push(el.dataset.color || '#B02238');
    TAGS.push(el.dataset.tag     || 'Printing');
  });

  var sfIcon  = feature.querySelector('.sf-icon');
  var sfName  = feature.querySelector('.sf-name');
  var sfDesc  = feature.querySelector('.sf-desc');
  var sfPrice = feature.querySelector('.sf-price');
  var sfTag   = feature.querySelector('.sf-tag-txt');
  var sfLink  = feature.querySelector('.sf-link');
  var sfBg    = feature.querySelector('.sf-bg');
  var barEl   = document.querySelector('.sl-bar');

  function activate(idx){
    current = (idx + items.length) % items.length;
    items.forEach(function(el){ el.classList.remove('active'); });
    items[current].classList.add('active');

    var col  = COLORS[current];
    // Update feature panel
    if(sfIcon)  sfIcon.textContent  = ICONS[current];
    if(sfName)  sfName.textContent  = NAMES[current];
    if(sfDesc)  sfDesc.textContent  = DESCS[current];
    if(sfPrice) sfPrice.textContent = PRICES[current];
    if(sfTag)   sfTag.textContent   = TAGS[current];
    if(sfLink)  sfLink.href         = HREFS[current];
    if(sfBg)    sfBg.style.background = 'linear-gradient(135deg,' + col.replace('1)','0.12)') + ',rgba(0,0,0,.8))';
    // Color the progress bar
    if(barEl)   barEl.style.background = col;
  }

  function startBar(){
    if(barEl){ barEl.style.transition='none'; barEl.style.width='0%'; }
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(barEl){ barEl.style.transition='width '+DURATION+'ms linear'; barEl.style.width='100%'; }
      });
    });
  }

  function next(){
    activate(current + 1);
    startBar();
  }

  function startAuto(){
    clearInterval(timer);
    timer = setInterval(function(){ if(!paused) next(); }, DURATION);
    startBar();
  }

  // Click on list items
  items.forEach(function(el, i){
    el.addEventListener('click', function(){
      activate(i);
      clearInterval(timer);
      startAuto();
    });
  });

  // Pause on hover
  if(feature){
    feature.addEventListener('mouseenter', function(){ paused=true; if(barEl) barEl.style.animationPlayState='paused'; });
    feature.addEventListener('mouseleave', function(){ paused=false; });
  }

  // Boot
  activate(0);
  startAuto();

})();
