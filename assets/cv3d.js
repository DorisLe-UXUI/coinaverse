/* ═══════════════════════════════════════════════════════════════════════════
   COINAVERSE — CV3D · shared real-3D runtime for the app shell (three r128)

   What this does
   ──────────────
   • Turns the flat 2D screens of coinaverse_v34.html into real WebGL scenes:
       home  → the 2D galaxy-map video + island hotspots become a live 3D galaxy:
               the CredTech core in the centre, the 6 realm planets orbiting it,
               the player's hero hovering at their home world. Tap a planet to
               fly there (camera + hero), then the hub opens.
       hub   → the looping realm video behind the hub content becomes a 3D
               backdrop: the realm planet with its 8 district satellites.
   • One three.js instance for the whole app. FICO Racer / Money Catcher call
     CV3D.ensureThree() and reuse it (self-hosted first, CDN fallback), so the
     Capacitor build no longer depends on a CDN for 3D.
   • Every scene is torn down (RAF cancelled, GPU resources disposed, WebGL
     context released) on every goTo(), so scenes never leak across screens.
   • No WebGL → nothing changes: the existing 2D screens render exactly as before.
     Kill switch for QA: localStorage.cv3d_off = '1'  or  ?flat=1 in the URL.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CV3D = window.CV3D = window.CV3D || {};
  var LIB_LOCAL = 'assets/games3d/lib/three.min.js';
  var LIB_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  /* ───────────────────────── capability / prefs ───────────────────────── */
  function detectWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  function killSwitch() {
    try {
      if (/[?&]flat=1/.test(location.search)) return true;
      return localStorage.getItem('cv3d_off') === '1';
    } catch (e) { return false; }
  }
  CV3D.supported = detectWebGL();
  CV3D.enabled = CV3D.supported && !killSwitch();
  CV3D.reducedMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  CV3D.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  CV3D.setEnabled = function (on) {
    CV3D.enabled = !!on && CV3D.supported;
    try { localStorage.setItem('cv3d_off', on ? '0' : '1'); } catch (e) {}
  };

  /* ───────────────────────── three.js loader ──────────────────────────── */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { res(); };
      s.onerror = function () { s.remove(); rej(new Error('load fail ' + src)); };
      document.head.appendChild(s);
    });
  }
  var _threeP = null;
  CV3D.ensureThree = function () {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (_threeP) return _threeP;
    _threeP = loadScript(LIB_LOCAL)
      .catch(function () { return loadScript(LIB_CDN); })
      .then(function () { if (!window.THREE) throw new Error('THREE missing'); return window.THREE; });
    _threeP.catch(function () { _threeP = null; });
    return _threeP;
  };

  /* ───────────────────────── scene registry ───────────────────────────── */
  var active = [];          // live scene handles
  var mountToken = 0;       // invalidates async mounts after a screen change
  var hidden = false;

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    active.forEach(function (h) { if (h.setPaused) h.setPaused(hidden); });
  });

  CV3D.teardownAll = function () {
    mountToken++;
    var list = active; active = [];
    list.forEach(function (h) { try { h.dispose(); } catch (e) { console.warn('[CV3D] dispose', e); } });
    CV3D.home = null;
  };

  /* Common per-scene runner: renderer + RAF + resize + dispose. */
  function makeRunner(THREE, canvas, opts) {
    opts = opts || {};
    var pr = Math.min(window.devicePixelRatio || 1, CV3D.isMobile ? 1.25 : 1.75);
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !CV3D.isMobile, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
    var run = { renderer: renderer, scene: scene, camera: camera, paused: false, dead: false, t: 0, listeners: [] };
    var raf = 0, last = performance.now();
    run.on = function (el, ev, fn, o) { el.addEventListener(ev, fn, o); run.listeners.push([el, ev, fn, o]); };

    function size() {
      var host = canvas.parentElement || document.body;
      var w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (opts.onResize) opts.onResize(w, h, w / h, camera);
      camera.updateProjectionMatrix();
    }
    run.size = size;
    size();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { if (!run.dead) size(); }); ro.observe(canvas.parentElement || document.body); }
    else { run.on(window, 'resize', size); }

    function frame(now) {
      if (run.dead) return;
      raf = requestAnimationFrame(frame);
      if (run.paused || hidden) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now; run.t += dt; run.frames = (run.frames || 0) + 1;
      if (opts.update) opts.update(dt, run.t);
      renderer.render(scene, camera);
    }
    run.start = function () { last = performance.now(); raf = requestAnimationFrame(frame); };
    run.setPaused = function (p) { run.paused = !!p; };
    run.dispose = function () {
      run.dead = true;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      run.listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      if (opts.onDispose) { try { opts.onDispose(); } catch (e) {} }
      disposeScene(scene);
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) {}
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); run.paused = true; }, false);
    return run;
  }

  // Generated textures are shared/cached and never disposed; per-scene geometry & materials are.
  var texCache = {};
  function disposeScene(scene) {
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      var m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach(function (mm) {
        if (mm.map && !mm.map.__cv3dShared) mm.map.dispose();
        mm.dispose();
      });
    });
  }

  /* ───────────────────────── texture helpers ──────────────────────────── */
  function canvasTex(THREE, key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.__cv3dShared = true; t.encoding = THREE.sRGBEncoding;
    texCache[key] = t; return t;
  }
  function softDot(THREE) {
    return canvasTex(THREE, 'dot', 64, 64, function (g, w, h) {
      var r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
  }
  function glowTex(THREE, hex) {
    var css = '#' + ('000000' + hex.toString(16)).slice(-6);
    return canvasTex(THREE, 'glow' + hex, 256, 256, function (g, w, h) {
      var r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, css); r.addColorStop(0.22, css + 'aa'); r.addColorStop(0.55, css + '33'); r.addColorStop(1, css + '00');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
  }
  function ringTex(THREE, hex) {
    var css = '#' + ('000000' + hex.toString(16)).slice(-6);
    return canvasTex(THREE, 'ring' + hex, 512, 512, function (g, w, h) {
      var cx = w / 2, cy = h / 2;
      var r = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
      // 0..0.33 = planet hole, 0.36..0.96 = banded ring
      r.addColorStop(0.00, 'rgba(0,0,0,0)'); r.addColorStop(0.34, 'rgba(0,0,0,0)');
      r.addColorStop(0.37, css + 'cc'); r.addColorStop(0.45, css + '55'); r.addColorStop(0.52, css + 'dd');
      r.addColorStop(0.60, 'rgba(255,255,255,.35)'); r.addColorStop(0.68, css + '66'); r.addColorStop(0.80, css + 'bb');
      r.addColorStop(0.90, css + '33'); r.addColorStop(1.00, css + '00');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
  }
  // CredTech core: dark navy sphere with gold/cyan energy veins
  function coreTex(THREE) {
    return canvasTex(THREE, 'core', 1024, 512, function (g, w, h) {
      var base = g.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#0b1a3a'); base.addColorStop(0.5, '#132a5c'); base.addColorStop(1, '#0a1230');
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      var rnd = mulberry(7);
      for (var i = 0; i < 70; i++) {                       // circuit veins
        g.strokeStyle = i % 3 === 0 ? 'rgba(251,191,36,.75)' : 'rgba(0,229,255,.55)';
        g.lineWidth = 1 + rnd() * 2.2;
        g.shadowColor = g.strokeStyle; g.shadowBlur = 8;
        var x = rnd() * w, y = rnd() * h;
        g.beginPath(); g.moveTo(x, y);
        for (var k = 0; k < 4; k++) { if (rnd() < 0.5) x += (rnd() - 0.5) * 220; else y += (rnd() - 0.5) * 120; g.lineTo(x, y); }
        g.stroke();
      }
      g.shadowBlur = 0;
      for (var j = 0; j < 160; j++) {                      // nodes
        g.fillStyle = j % 2 ? 'rgba(255,225,140,.9)' : 'rgba(120,240,255,.85)';
        g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.2 + rnd() * 2.4, 0, 7); g.fill();
      }
      var glow = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5);
      glow.addColorStop(0, 'rgba(251,191,36,.45)'); glow.addColorStop(1, 'rgba(251,191,36,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
    });
  }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var imgLoader = null;
  function loadTex(THREE, url) {
    if (texCache[url]) return texCache[url];
    imgLoader = imgLoader || new THREE.TextureLoader();
    var t = imgLoader.load(url);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.__cv3dShared = true;
    texCache[url] = t; return t;
  }

  /* Atmosphere / rim-light shell: additive fresnel in the realm colour. */
  function fresnelMat(THREE, hex, power, intensity) {
    return new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(hex) }, p: { value: power }, k: { value: intensity } },
      vertexShader: [
        'varying float vRim;',
        'void main(){',
        '  vec3 n = normalize(normalMatrix * normal);',
        '  vec4 mv = modelViewMatrix * vec4(position,1.0);',
        '  vec3 v = normalize(-mv.xyz);',
        '  vRim = 1.0 - max(dot(n, v), 0.0);',
        '  gl_Position = projectionMatrix * mv;',
        '}'].join('\n'),
      fragmentShader: [
        'uniform vec3 c; uniform float p; uniform float k; varying float vRim;',
        'void main(){ float r = pow(vRim, p) * k; gl_FragColor = vec4(c * r, r); }'].join('\n'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide
    });
  }

  function glowSprite(THREE, hex, scale, opacity) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE, hex), transparent: true, opacity: opacity == null ? 0.55 : opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(scale, scale, 1); return s;
  }

  function starField(THREE, count, rMin, rMax, size, tint) {
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    var palette = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [0.65, 0.9, 1], [0.8, 0.7, 1], [1, 0.88, 0.6]];
    var rnd = mulberry(count);
    for (var i = 0; i < count; i++) {
      var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = rMin + rnd() * (rMax - rMin), s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th);
      var c = palette[(rnd() * palette.length) | 0], b = 0.55 + rnd() * 0.45;
      col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size: size, map: softDot(THREE), transparent: true, opacity: tint == null ? 0.95 : tint, vertexColors: true, depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending });
    return new THREE.Points(geo, mat);
  }

  function nebula(THREE, scene, specs) {
    specs.forEach(function (n) {
      var s = glowSprite(THREE, n.c, n.s, n.o);
      s.position.set(n.x, n.y, n.z); scene.add(s);
    });
  }

  function retireVideos(root, sel) {
    root.querySelectorAll(sel).forEach(function (v) {
      try { v.pause(); v.removeAttribute('src'); Array.prototype.forEach.call(v.querySelectorAll('source'), function (s) { s.remove(); }); v.load(); } catch (e) {}
      v.remove();
    });
  }
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ───────────────────────── realm catalogue ──────────────────────────── */
  // Screen layout mirrors the old 2D island map (top-left Budgetron … left Debt Detox)
  // ang = orbit angle in the galactic plane (camera looks along -z from +z, so
  // negative sin → far → higher on screen), y = vertical offset off the plane.
  var REALMS = [
    { id: 'strategist', tex: 'assets/worlds/budgetron.jpeg',        color: 0x3B82F6, r: 1.05, orbit: 7.6, ang: -2.30, y:  1.10, deco: 'ring',  spd: 0.028 },
    { id: 'builder',    tex: 'assets/worlds/launch_lab.jpeg',       color: 0xA855F7, r: 1.00, orbit: 7.8, ang: -0.80, y:  1.30, deco: 'moons', spd: 0.024 },
    { id: 'risktaker',  tex: 'assets/worlds/bitstream_valley.jpeg', color: 0xEF4444, r: 0.95, orbit: 8.6, ang:  0.12, y: -0.10, deco: 'belt',  spd: 0.020 },
    { id: 'guardian',   tex: 'assets/worlds/savescape_orbit.jpeg',  color: 0x14B8A6, r: 1.15, orbit: 7.0, ang:  0.98, y: -0.90, deco: 'ring',  spd: 0.030 },
    { id: 'investor',   tex: 'assets/worlds/investopia.jpeg',       color: 0x10B981, r: 1.10, orbit: 7.2, ang:  2.18, y: -0.80, deco: 'moons', spd: 0.026 },
    { id: 'rebuilder',  tex: 'assets/worlds/debt_detox.jpeg',       color: 0xF59E0B, r: 0.95, orbit: 8.3, ang:  3.02, y:  0.20, deco: 'belt',  spd: 0.022 }
  ];
  var CORE = { id: 'credtech', color: 0xFBBF24, color2: 0x00E5FF, r: 1.55 };
  var HOTSPOT_CLS = { strategist: 'h-budgetron', builder: 'h-launch_lab', risktaker: 'h-bitstream', guardian: 'h-savescape', investor: 'h-investopia', rebuilder: 'h-debt_detox', credtech: 'h-credtech' };
  CV3D.REALMS = REALMS;

  function realmById(id) { for (var i = 0; i < REALMS.length; i++) if (REALMS[i].id === id) return REALMS[i]; return null; }

  /* Build one textured planet with atmosphere, glow and decoration. */
  function makePlanet(THREE, spec, segs) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ map: loadTex(THREE, spec.tex), roughness: 0.82, metalness: 0.08, emissive: new THREE.Color(spec.color), emissiveIntensity: 0.10 });
    var body = new THREE.Mesh(new THREE.SphereGeometry(spec.r, segs, Math.round(segs * 0.66)), mat);
    body.rotation.z = 0.25;
    g.add(body);
    var atmo = new THREE.Mesh(new THREE.SphereGeometry(spec.r * 1.09, segs, Math.round(segs * 0.66)), fresnelMat(THREE, spec.color, 2.6, 1.15));
    g.add(atmo);
    var glow = glowSprite(THREE, spec.color, spec.r * 5.2, 0.42); g.add(glow);
    var deco = new THREE.Group(); g.add(deco);
    if (spec.deco === 'ring') {
      var ring = new THREE.Mesh(new THREE.PlaneGeometry(spec.r * 5.4, spec.r * 5.4), new THREE.MeshBasicMaterial({ map: ringTex(THREE, spec.color), transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = Math.PI / 2 - 0.35; ring.rotation.y = 0.35; deco.add(ring);
    } else if (spec.deco === 'moons') {
      for (var i = 0; i < 2; i++) {
        var moon = new THREE.Mesh(new THREE.SphereGeometry(spec.r * (0.10 + i * 0.05), 14, 10), new THREE.MeshStandardMaterial({ color: 0xb8c2e6, roughness: 0.95, emissive: new THREE.Color(spec.color), emissiveIntensity: 0.18 }));
        moon.userData.orb = { r: spec.r * (1.9 + i * 0.7), a: i * 2.4, s: (i ? -0.55 : 0.8), tilt: 0.35 + i * 0.4 };
        deco.add(moon);
      }
    } else if (spec.deco === 'belt') {
      var n = 140, pos = new Float32Array(n * 3), rnd = mulberry(spec.color);
      for (var k = 0; k < n; k++) { var a = rnd() * Math.PI * 2, rr = spec.r * (1.55 + rnd() * 0.5); pos[k * 3] = Math.cos(a) * rr; pos[k * 3 + 1] = (rnd() - 0.5) * 0.18; pos[k * 3 + 2] = Math.sin(a) * rr; }
      var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var belt = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.16, color: spec.color, map: softDot(THREE), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
      belt.rotation.x = 0.5; belt.rotation.z = -0.3; deco.add(belt);
    }
    g.userData = { spec: spec, body: body, atmo: atmo, glow: glow, deco: deco, hover: 0 };
    body.userData.realm = spec.id; atmo.userData.realm = spec.id;
    return g;
  }

  function makeCore(THREE, segs) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.SphereGeometry(CORE.r, segs, Math.round(segs * 0.66)), new THREE.MeshStandardMaterial({ map: coreTex(THREE), roughness: 0.55, metalness: 0.35, emissive: new THREE.Color(0x2a49d8), emissiveIntensity: 0.28 }));
    g.add(body);
    var atmo = new THREE.Mesh(new THREE.SphereGeometry(CORE.r * 1.12, segs, Math.round(segs * 0.66)), fresnelMat(THREE, CORE.color, 2.2, 1.5)); g.add(atmo);
    var atmo2 = new THREE.Mesh(new THREE.SphereGeometry(CORE.r * 1.22, segs, Math.round(segs * 0.66)), fresnelMat(THREE, CORE.color2, 4.0, 0.9)); g.add(atmo2);
    g.add(glowSprite(THREE, CORE.color, CORE.r * 7.5, 0.5));
    g.add(glowSprite(THREE, CORE.color2, CORE.r * 11, 0.22));
    var rings = [];
    [[CORE.r * 1.85, 0.03, 0xFBBF24, 0.42, -0.2, 0.75], [CORE.r * 2.25, 0.022, 0x00E5FF, -0.55, 0.5, 0.55]].forEach(function (rs) {
      var t = new THREE.Mesh(new THREE.TorusGeometry(rs[0], rs[1], 8, 96), new THREE.MeshBasicMaterial({ color: rs[2], transparent: true, opacity: rs[5], blending: THREE.AdditiveBlending, depthWrite: false }));
      t.rotation.x = rs[3]; t.rotation.y = rs[4]; g.add(t); rings.push(t);
    });
    // energy sparks orbiting the core
    var n = 120, pos = new Float32Array(n * 3), rnd = mulberry(99);
    for (var k = 0; k < n; k++) { var a = rnd() * 6.283, rr = CORE.r * (1.6 + rnd() * 1.8), yy = (rnd() - 0.5) * 1.2; pos[k * 3] = Math.cos(a) * rr; pos[k * 3 + 1] = yy; pos[k * 3 + 2] = Math.sin(a) * rr; }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var sparks = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.22, color: 0xffe9a8, map: softDot(THREE), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(sparks);
    var light = new THREE.PointLight(0xffd27a, 1.6, 80, 1.4); g.add(light);
    body.userData.realm = 'credtech'; atmo.userData.realm = 'credtech';
    g.userData = { spec: CORE, body: body, atmo: atmo, rings: rings, sparks: sparks, hover: 0 };
    return g;
  }

  /* ═════════════════════════ HOME · 3D GALAXY MAP ═════════════════════════ */
  function mountHomeGalaxy(THREE) {
    var root = document.querySelector('.home-screen');
    if (!root || root.classList.contains('is3d')) return null;
    var st = window.state || {};
    var playerArch = st.archetype || 'guardian';

    var canvas = document.createElement('canvas');
    canvas.className = 'cv3d-canvas cv3d-home';
    canvas.setAttribute('aria-hidden', 'true');
    var bg = root.querySelector('.home-bg-image');
    if (bg && bg.nextSibling) root.insertBefore(canvas, bg.nextSibling); else root.insertBefore(canvas, root.firstChild);

    var segs = CV3D.isMobile ? 28 : 48;
    var galaxy = new THREE.Group();
    var planets = {}, pickables = [];
    var labels = {};
    var lookAt = new THREE.Vector3(0, 0.3, 0);
    var lay = { x: 1, z: 1 };                          // orbit ellipse factors (portrait squeezes x)
    var orbitLines = [];
    var camBase = new THREE.Vector3(0, 5.2, 15.5);
    var par = { x: 0, y: 0, tx: 0, ty: 0 };          // pointer parallax
    var yaw = { v: 0, vel: 0 };                        // drag spin
    var fly = null;                                   // active fly-to
    var hoverId = null;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    var tmpV = new THREE.Vector3();

    var run = makeRunner(THREE, canvas, {
      onResize: function (w, h, aspect, cam) {
        // Phones (portrait): squeeze x, stretch depth, look more top-down so planets stack vertically.
        var t = clamp((aspect - 0.55) / (1.6 - 0.55), 0, 1);
        var u = lerp(0.72, 0.9, t); galaxy.scale.set(u, u, u);
        lay.x = lerp(0.5, 0.98, t); lay.z = lerp(1.45, 1.0, t);
        orbitLines.forEach(function (l) { l.scale.set(lay.x, 1, lay.z); });
        if (galaxy.userData.dust) galaxy.userData.dust.scale.set(lay.x, 1, lay.z);
        camBase.set(0, lerp(13.5, 5.4, t), lerp(15.5, 15.5, t));
        cam.fov = lerp(58, 45, t);
        // desktop: the sidebar owns the left ~190px and cards own the bottom → frame the galaxy up-right
        // portrait: the PLAY NOW cluster owns the bottom third → lift the galaxy
        lookAt.set(lerp(0, -1.35, t), lerp(-3.4, -0.55, t), 0);
      },
      update: update,
      onDispose: function () {
        root.classList.remove('is3d');
        Object.keys(labels).forEach(function (k) { var el = labels[k]; if (el) { el.style.left = ''; el.style.top = ''; el.style.display = ''; el.classList.remove('hover'); } });
      }
    });
    if (!run) { canvas.remove(); return null; }
    var scene = run.scene, camera = run.camera;
    run.size();
    // WebGL is live → retire the 2D layer: background video + 7 hotspot portal videos (frees 8 video decoders)
    retireVideos(root, '.home-bg-video, .home-hotspot-vid');
    root.classList.add('is3d');
    var desc = root.querySelector('.home-hubcard-desc');
    if (desc) desc.textContent = 'Tap any planet to fly there and enter its hub. Drag to spin the galaxy.';

    // ── environment
    scene.add(starField(THREE, CV3D.isMobile ? 900 : 1600, 45, 120, CV3D.isMobile ? 1.2 : 1.35, 0.8));
    scene.add(starField(THREE, CV3D.isMobile ? 250 : 450, 25, 45, 0.8, 0.6));
    nebula(THREE, scene, [
      { c: 0x6d28d9, s: 70, o: 0.30, x: -30, y: 8, z: -60 }, { c: 0x0891b2, s: 60, o: 0.22, x: 26, y: -4, z: -70 },
      { c: 0xdb2777, s: 42, o: 0.14, x: 8, y: 14, z: -65 }, { c: 0xb45309, s: 46, o: 0.12, x: -6, y: -12, z: -55 },
      { c: 0x8b5cf6, s: 36, o: 0.18, x: 34, y: 12, z: -50 }
    ]);
    // galactic dust disc
    (function () {
      var n = CV3D.isMobile ? 900 : 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), rnd = mulberry(3);
      for (var i = 0; i < n; i++) {
        var a = rnd() * 6.283, r = 2.6 + Math.pow(rnd(), 0.7) * 12.5, arm = Math.sin(a * 2 + r * 0.55) * 0.35;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (rnd() - 0.5) * (0.25 + r * 0.05) + arm * 0.3; pos[i * 3 + 2] = Math.sin(a) * r;
        var c = rnd() < 0.6 ? [0.55, 0.36, 0.98] : rnd() < 0.5 ? [0.0, 0.9, 1.0] : [0.98, 0.75, 0.24];
        var b = 0.35 + rnd() * 0.65; col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.22, map: softDot(THREE), vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      dust.userData.spin = 0.012; dust.scale.set(lay.x, 1, lay.z); galaxy.add(dust); galaxy.userData.dust = dust;
    })();
    // orbit lines
    REALMS.forEach(function (sp) {
      var pts = [];
      for (var i = 0; i <= 128; i++) { var a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * sp.orbit, sp.y * 0.35, Math.sin(a) * sp.orbit)); }
      var line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: sp.color, transparent: true, opacity: 0.16 }));
      line.scale.set(lay.x, 1, lay.z); galaxy.add(line); orbitLines.push(line);
    });

    scene.add(new THREE.AmbientLight(0x8d96ff, 0.55));
    var key = new THREE.DirectionalLight(0xcfe9ff, 0.55); key.position.set(6, 9, 12); scene.add(key);

    // ── bodies
    var core = makeCore(THREE, segs); galaxy.add(core);
    planets.credtech = core; pickables.push(core.userData.body, core.userData.atmo);
    REALMS.forEach(function (sp) {
      var p = makePlanet(THREE, sp, segs);
      p.userData.ang = sp.ang;
      galaxy.add(p); planets[sp.id] = p; pickables.push(p.userData.body, p.userData.atmo);
    });
    scene.add(galaxy);

    // ── the player's hero, hovering at their home world
    var hero = null, heroPad = null, heroHome = planets[playerArch] || planets.guardian;
    (function () {
      var w = window.WORLDS && window.WORLDS[playerArch];
      var url = (typeof window.genderedHero === 'function') ? window.genderedHero(playerArch) : (w && (w.hero || w.character));
      if (!url) return;
      var pc = (realmById(playerArch) || { color: 0x14B8A6 }).color;
      var mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
      hero = new THREE.Sprite(mat); hero.scale.set(0.001, 0.001, 1); hero.visible = false;
      new THREE.TextureLoader().load(url, function (t) {
        t.encoding = THREE.sRGBEncoding; mat.map = t; mat.needsUpdate = true;
        var asp = t.image && t.image.height ? t.image.width / t.image.height : 0.8, hh = 2.5;
        hero.scale.set(hh * asp, hh, 1); hero.visible = true;
      });
      heroPad = new THREE.Group();
      var disc = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.05, 48), new THREE.MeshBasicMaterial({ color: pc, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; heroPad.add(disc);
      var pg = glowSprite(THREE, pc, 4.2, 0.5); heroPad.add(pg);
      heroPad.add(hero);
      hero.position.y = 1.35;
      galaxy.add(heroPad);
    })();
    function heroAnchor(planet, out) {
      var sp = planet.userData.spec;
      out.copy(planet.position); out.x += sp.r * 0.25; out.y -= sp.r * 0.35; out.z += sp.r + 1.25;
      return out;
    }

    // ── DOM labels: the old hotspot elements now follow their planets
    Object.keys(HOTSPOT_CLS).forEach(function (id) { labels[id] = root.querySelector('.home-hotspot.' + HOTSPOT_CLS[id]); });

    // ── input: parallax, drag-spin, hover, tap
    var down = null, moved = false;
    function setNdc(e) { var r = canvas.getBoundingClientRect(); ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1; }
    function pick(e) {
      setNdc(e); ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(pickables, false);
      return hits.length ? hits[0].object.userData.realm : null;
    }
    function setHover(id) {
      if (id === hoverId) return;
      if (hoverId && labels[hoverId]) labels[hoverId].classList.remove('hover');
      hoverId = id;
      if (hoverId && labels[hoverId]) labels[hoverId].classList.add('hover');
      canvas.style.cursor = hoverId ? 'pointer' : (down ? 'grabbing' : 'grab');
    }
    run.on(canvas, 'pointermove', function (e) {
      if (fly) return;
      var r = canvas.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (down) {
        var dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        yaw.vel = clamp((e.clientX - down.lx) * 0.006, -0.12, 0.12);
        down.lx = e.clientX;
        return;
      }
      if (e.pointerType !== 'touch') setHover(pick(e));
    });
    run.on(canvas, 'pointerdown', function (e) {
      if (fly) return;
      down = { x: e.clientX, y: e.clientY, lx: e.clientX }; moved = false; yaw.vel = 0;
      canvas.classList.add('dragging'); canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    function endDrag(e) {
      if (!down) return;
      var wasTap = !moved; down = null;
      canvas.classList.remove('dragging'); canvas.style.cursor = hoverId ? 'pointer' : 'grab';
      if (wasTap && !fly) { var id = pick(e); if (id) { setHover(id); window.walkToHub(id); } }
    }
    run.on(canvas, 'pointerup', endDrag);
    run.on(canvas, 'pointercancel', function () { down = null; canvas.classList.remove('dragging'); });
    run.on(canvas, 'pointerleave', function () { if (!down) { setHover(null); par.tx = 0; par.ty = 0; } });
    // labels are real DOM buttons (keyboard + screen-reader friendly) — hovering them highlights the planet
    Object.keys(labels).forEach(function (id) {
      var el = labels[id]; if (!el) return;
      run.on(el, 'pointerenter', function () { setHover(id); });
      run.on(el, 'pointerleave', function () { setHover(null); });
    });

    // ── fly-to (replaces the 2D walking hero)
    var handle = {
      flying: false,
      flyTo: function (id) {
        if (fly) return;
        var target = planets[id]; if (!target) { return false; }
        fly = { id: id, t: 0, t0: performance.now(), dur: 1.35, camFrom: camera.position.clone(), lookFrom: lookAt.clone(), heroFrom: heroPad ? heroPad.position.clone() : null, done: false };
        handle.flying = true; setHover(id);
        canvas.style.cursor = 'default';
        return true;
      },
      setPaused: run.setPaused,
      dispose: run.dispose,
      debug: function () { return { frames: run.frames, t: +run.t.toFixed(1), w: canvas.clientWidth, h: canvas.clientHeight, dpr: run.renderer.getPixelRatio(), fov: camera.fov, aspect: camera.aspect, cam: camera.position.toArray().map(function (v) { return +v.toFixed(2); }), look: lookAt.toArray(), scale: galaxy.scale.toArray(), par: [par.x, par.y], yaw: yaw.v }; }
    };

    // ── per-frame
    var camTarget = new THREE.Vector3(), worldPos = new THREE.Vector3(), anchor = new THREE.Vector3();
    var motion = CV3D.reducedMotion ? 0 : 1;
    function update(dt, t) {
      // parallax + drag spin
      par.x = lerp(par.x, par.tx, 1 - Math.pow(0.001, dt)); par.y = lerp(par.y, par.ty, 1 - Math.pow(0.001, dt));
      if (!down) yaw.vel *= Math.pow(0.08, dt);
      yaw.v += yaw.vel * (down ? 1 : 1) * 60 * dt * 0.016;
      galaxy.rotation.y = yaw.v;
      galaxy.userData.dust.rotation.y += dt * 0.012 * motion;

      // orbits & spins
      REALMS.forEach(function (sp) {
        var p = planets[sp.id], ud = p.userData;
        ud.ang += sp.spd * dt * motion * 0.35;
        p.position.set(Math.cos(ud.ang) * sp.orbit * lay.x, sp.y + Math.sin(t * 0.6 + sp.orbit) * 0.08 * motion, Math.sin(ud.ang) * sp.orbit * lay.z);
        ud.body.rotation.y += dt * 0.12 * motion;
        var hv = (hoverId === sp.id || (fly && fly.id === sp.id)) ? 1 : 0;
        ud.hover = lerp(ud.hover, hv, 1 - Math.pow(0.002, dt));
        var sc = 1 + ud.hover * 0.14; p.scale.set(sc, sc, sc);
        ud.atmo.material.uniforms.k.value = 1.15 + ud.hover * 1.1;
        ud.glow.material.opacity = 0.42 + ud.hover * 0.35;
        ud.deco.children.forEach(function (d) {
          if (d.userData.orb) { var o = d.userData.orb; o.a += o.s * dt * motion; d.position.set(Math.cos(o.a) * o.r, Math.sin(o.a) * o.r * Math.sin(o.tilt), Math.sin(o.a) * o.r * Math.cos(o.tilt)); }
          else if (d.isPoints) d.rotation.y += dt * 0.25 * motion;
          else if (d.isMesh) d.rotation.z += dt * 0.05 * motion;
        });
      });
      var cu = core.userData;
      cu.body.rotation.y += dt * 0.08 * motion;
      cu.rings.forEach(function (r, i) { r.rotation.z += dt * (0.25 + i * 0.12) * motion; });
      cu.sparks.rotation.y -= dt * 0.35 * motion;
      var chv = (hoverId === 'credtech' || (fly && fly.id === 'credtech')) ? 1 : 0;
      cu.hover = lerp(cu.hover, chv, 1 - Math.pow(0.002, dt));
      var csc = 1 + cu.hover * 0.1 + Math.sin(t * 1.4) * 0.012 * motion; core.scale.set(csc, csc, csc);
      cu.atmo.material.uniforms.k.value = 1.5 + cu.hover * 1.0;

      // hero hovers at its home planet (or flies)
      if (heroPad) {
        if (!fly || !fly.heroFrom) heroAnchor(heroHome, heroPad.position);
        heroPad.position.y += Math.sin(t * 1.8) * 0.06 * motion;
        heroPad.rotation.y += dt * 0.6 * motion;
      }

      // camera
      if (fly) {
        fly.t = (performance.now() - fly.t0) / 1000; var k = easeInOut(clamp(fly.t / fly.dur, 0, 1));
        var target = planets[fly.id]; target.getWorldPosition(worldPos);
        camTarget.copy(worldPos).sub(fly.camFrom).multiplyScalar(0.62).add(fly.camFrom);
        camTarget.y += 1.2;
        camera.position.lerpVectors(fly.camFrom, camTarget, k);
        lookAt.lerpVectors(fly.lookFrom, worldPos, k);
        camera.lookAt(lookAt);
        if (heroPad && fly.heroFrom) { heroAnchor(target, anchor); heroPad.position.lerpVectors(fly.heroFrom, anchor, k); }
        if (fly.t >= fly.dur && !fly.done) {
          fly.done = true;
          var id = fly.id;
          setTimeout(function () { if (window.state) state.viewingWorld = id; window.goTo('hub'); }, 60);
        }
      } else {
        camera.position.set(camBase.x + par.x * 0.9, camBase.y - par.y * 0.6, camBase.z);
        camera.lookAt(lookAt.x + par.x * 0.35, lookAt.y - par.y * 0.25, lookAt.z);
      }

      // DOM labels track their planets (below the sphere)
      var W = canvas.clientWidth, H = canvas.clientHeight, tanF = Math.tan(camera.fov * Math.PI / 360);
      Object.keys(labels).forEach(function (id) {
        var el = labels[id], p = planets[id]; if (!el || !p) return;
        p.getWorldPosition(worldPos);
        var dist = camera.position.distanceTo(worldPos);
        var rpx = (p.userData.spec.r * p.scale.x) / (dist * tanF) * (H / 2);
        tmpV.copy(worldPos).project(camera);
        if (tmpV.z > 1 || fly) { el.style.display = 'none'; return; }
        el.style.display = '';
        el.style.left = ((tmpV.x + 1) / 2 * W) + 'px';
        el.style.top = ((1 - tmpV.y) / 2 * H + rpx * 1.05 + 16) + 'px';
      });
    }

    // start in a slightly pulled-back pose and ease in
    run.start();
    CV3D.home = handle;
    return handle;
  }

  /* ═════════════════════════ HUB · 3D REALM BACKDROP ══════════════════════ */
  function mountHubBackdrop(THREE) {
    var root = document.querySelector('.h2screen');
    if (!root || root.querySelector('.cv3d-hub')) return null;
    var st = window.state || {};
    var token = st.viewingWorld || st.archetype || 'credtech';
    var spec = realmById(token);
    var hc = spec ? spec.color : CORE.color;

    var canvas = document.createElement('canvas');
    canvas.className = 'cv3d-canvas cv3d-hub'; canvas.setAttribute('aria-hidden', 'true');
    root.insertBefore(canvas, root.firstChild);

    var segs = CV3D.isMobile ? 32 : 56;
    var par = { x: 0, y: 0, tx: 0, ty: 0 };
    var planet, nodes = [], nodeRing;
    var pos3 = new THREE.Vector3(6.4, -5.4, -4);
    var run = makeRunner(THREE, canvas, {
      onResize: function (w, h, aspect, cam) {
        var t = clamp((aspect - 0.55) / (1.6 - 0.55), 0, 1);
        pos3.set(lerp(2.2, 6.4, t), lerp(-8.5, -5.4, t), -4);
        if (planet) planet.position.copy(pos3);
        if (nodeRing) nodeRing.position.copy(pos3);
        cam.fov = lerp(62, 50, t);
      },
      update: update
    });
    if (!run) { canvas.remove(); return null; }
    var scene = run.scene, camera = run.camera;
    camera.position.set(0, 0, 15);
    retireVideos(root, 'video.h2vbg');
    root.classList.add('is3d');

    scene.add(starField(THREE, CV3D.isMobile ? 600 : 1200, 40, 110, 1.7));
    nebula(THREE, scene, [
      { c: hc, s: 55, o: 0.22, x: 10, y: -8, z: -50 }, { c: 0x6d28d9, s: 60, o: 0.2, x: -22, y: 10, z: -60 }, { c: 0x0891b2, s: 40, o: 0.12, x: -8, y: -14, z: -45 }
    ]);
    scene.add(new THREE.AmbientLight(0x8d96ff, 0.5));
    var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(-8, 10, 8); scene.add(key);
    var rim = new THREE.PointLight(hc, 1.2, 60); rim.position.set(0, 4, 6); scene.add(rim);

    // realm planet — large, bottom-right, partly off-screen
    var R = 6.2;
    planet = new THREE.Group();
    var mat = spec
      ? new THREE.MeshStandardMaterial({ map: loadTex(THREE, spec.tex), roughness: 0.85, metalness: 0.05, emissive: new THREE.Color(hc), emissiveIntensity: 0.08 })
      : new THREE.MeshStandardMaterial({ map: coreTex(THREE), roughness: 0.5, metalness: 0.35, emissive: new THREE.Color(0x3b5cff), emissiveIntensity: 0.35 });
    var body = new THREE.Mesh(new THREE.SphereGeometry(R, segs, Math.round(segs * 0.66)), mat); body.rotation.z = 0.3; planet.add(body);
    planet.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, segs, Math.round(segs * 0.66)), fresnelMat(THREE, hc, 3.0, 1.35)));
    planet.add(glowSprite(THREE, hc, R * 4.2, 0.35));
    planet.position.copy(pos3); scene.add(planet);

    // district satellites on a tilted orbit
    var count = token === 'credtech' ? 7 : 8;
    nodeRing = new THREE.Group(); nodeRing.rotation.set(1.05, 0, -0.35); nodeRing.position.copy(pos3);
    var pts = []; for (var i = 0; i <= 160; i++) { var a = i / 160 * 6.283; pts.push(new THREE.Vector3(Math.cos(a) * R * 1.45, 0, Math.sin(a) * R * 1.45)); }
    nodeRing.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: hc, transparent: true, opacity: 0.35 })));
    for (var n = 0; n < count; n++) {
      var g = new THREE.Group();
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(hc), emissiveIntensity: 1.2, roughness: 0.4 }));
      g.add(m); g.add(glowSprite(THREE, hc, 2.2, 0.7));
      g.userData.a = n / count * 6.283; nodes.push(g); nodeRing.add(g);
    }
    scene.add(nodeRing);

    // drifting dust in the realm colour
    (function () {
      var n = CV3D.isMobile ? 300 : 700, pos = new Float32Array(n * 3), rnd = mulberry(token.length * 17);
      for (var i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 40; pos[i * 3 + 1] = (rnd() - 0.5) * 24; pos[i * 3 + 2] = -5 - rnd() * 25; }
      var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var dust = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.18, color: hc, map: softDot(THREE), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(dust); run.dust = dust;
    })();

    run.on(window, 'pointermove', function (e) { par.tx = (e.clientX / window.innerWidth - 0.5) * 2; par.ty = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
    var motion = CV3D.reducedMotion ? 0 : 1;
    function update(dt, t) {
      par.x = lerp(par.x, par.tx, 1 - Math.pow(0.01, dt)); par.y = lerp(par.y, par.ty, 1 - Math.pow(0.01, dt));
      body.rotation.y += dt * 0.035 * motion;
      nodeRing.rotation.y += dt * 0.09 * motion;
      nodes.forEach(function (g) { g.position.set(Math.cos(g.userData.a) * R * 1.45, 0, Math.sin(g.userData.a) * R * 1.45); g.children[0].scale.setScalar(1 + Math.sin(t * 2 + g.userData.a) * 0.18 * motion); });
      run.dust.rotation.z += dt * 0.01 * motion; run.dust.position.y = Math.sin(t * 0.2) * 0.4 * motion;
      camera.position.set(par.x * 0.5, -par.y * 0.35, 15);
      camera.lookAt(par.x * 0.15, -par.y * 0.1, 0);
    }
    run.start();
    return run;
  }

  /* ───────────────────────── screen hooks ─────────────────────────────── */
  var SCENES = { home: mountHomeGalaxy, central_hub: mountHomeGalaxy, hub: mountHubBackdrop };

  CV3D.onScreen = function (id) {
    if (!CV3D.enabled) return;
    var factory = SCENES[id]; if (!factory) return;
    var token = ++mountToken;
    CV3D.ensureThree().then(function (THREE) {
      if (token !== mountToken) return;                                 // screen changed while loading
      if (window.state && state.currentScreen !== id) return;
      try { var h = factory(THREE); if (h) active.push(h); }
      catch (e) { console.warn('[CV3D] mount failed, staying 2D:', e); }
    }).catch(function (e) { console.warn('[CV3D] three.js unavailable, staying 2D:', e && e.message); });
  };

  // goTo(): tear down the previous scene before the DOM is replaced, mount the next one after.
  (function wrapGoTo() {
    var prev = window.goTo;
    if (typeof prev !== 'function' || prev.__cv3d) return;
    var w = function (id, opts) {
      CV3D.teardownAll();
      var r = prev.apply(this, arguments);
      CV3D.onScreen(window.state ? state.currentScreen : id);
      return r;
    };
    w.__cv3d = true;
    window.goTo = w;
  })();

  // walkToHub(): on the 3D map the hero flies instead of walking the 2D road.
  (function wrapWalk() {
    var prev = window.walkToHub;
    window.walkToHub = function (hubId) {
      var h = CV3D.home;
      if (h && !h.flying && h.flyTo(hubId)) return;
      if (h && h.flying) return;                                          // already en route
      if (typeof prev === 'function') return prev.apply(this, arguments);
      if (window.state) state.viewingWorld = hubId; window.goTo('hub');
    };
  })();

  // If a supported screen is already on stage (boot ran before this file), mount now.
  if (window.state && state.currentScreen && SCENES[state.currentScreen]) CV3D.onScreen(state.currentScreen);
  // Warm the library in the background right after first paint so the first galaxy shows instantly.
  if (CV3D.enabled) setTimeout(function () { CV3D.ensureThree().catch(function () {}); }, 1200);
})();
