/* Kolahak 3D: a small dependency-free WebGL renderer for knitted, cotton, straw and twill kids' hats.
   Hat3D.create(canvas, opts) -> viewer { setModel, setColors, setView, resetView, zoomBy, render, snapshot, destroy } */
(function (global) {
  'use strict';
  var TAU = Math.PI * 2;

  /* ---------- small math ---------- */
  function persp(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(e, c, up) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function mul(a, b) { var o = new Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rot3(rx, ry, rz) { // returns function applying Rz*Ry*Rx
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    return function (v) {
      var x = v[0], y = v[1] * cx - v[2] * sx, z = v[1] * sx + v[2] * cx;
      var x2 = x * cy + z * sy, z2 = -x * sy + z * cy; x = x2; z = z2;
      return [x * cz - y * sz, x * sz + y * cz, z];
    };
  }
  function vnoise(x, y, z) { // cheap smooth 3D value noise for geometry lumps
    function h(i, j, k) { var n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); }
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    function l(a, b, t) { return a + (b - a) * t; }
    return l(l(l(h(ix, iy, iz), h(ix + 1, iy, iz), fx), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy),
      l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  }

  /* ---------- geometry: every part is a (u,v) grid ---------- */
  function grid(nu, nv, closedU, sample, sign) {
    var W = nu + 1, H = nv + 1, cnt = W * H;
    var P = new Float32Array(cnt * 3), N = new Float32Array(cnt * 3), T = new Float32Array(cnt * 3), B = new Float32Array(cnt * 3), UV = new Float32Array(cnt * 2), AX = new Float32Array(cnt * 3);
    for (var iv = 0; iv < H; iv++) for (var iu = 0; iu < W; iu++) {
      var k = iv * W + iu, s = sample(iu, iv);
      P[k * 3] = s.p[0]; P[k * 3 + 1] = s.p[1]; P[k * 3 + 2] = s.p[2];
      UV[k * 2] = s.uv[0]; UV[k * 2 + 1] = s.uv[1];
      AX[k * 3] = s.aux[0]; AX[k * 3 + 1] = s.aux[1]; AX[k * 3 + 2] = s.aux[2];
    }
    function at(iu, iv, c) { return P[(iv * W + iu) * 3 + c]; }
    var bad = [];
    for (iv = 0; iv < H; iv++) for (iu = 0; iu < W; iu++) {
      var u0 = iu - 1, u1 = iu + 1;
      if (closedU) { if (u0 < 0) u0 = nu - 1; if (u1 > nu) u1 = 1; } else { u0 = Math.max(0, u0); u1 = Math.min(nu, u1); }
      var v0 = Math.max(0, iv - 1), v1 = Math.min(nv, iv + 1);
      var tx = at(u1, iv, 0) - at(u0, iv, 0), ty = at(u1, iv, 1) - at(u0, iv, 1), tz = at(u1, iv, 2) - at(u0, iv, 2);
      var bx = at(iu, v1, 0) - at(iu, v0, 0), by = at(iu, v1, 1) - at(iu, v0, 1), bz = at(iu, v1, 2) - at(iu, v0, 2);
      var nx = (by * tz - bz * ty) * sign, ny = (bz * tx - bx * tz) * sign, nz = (bx * ty - by * tx) * sign;
      var nl = Math.hypot(nx, ny, nz), tl = Math.hypot(tx, ty, tz) || 1, bl = Math.hypot(bx, by, bz) || 1;
      k = iv * W + iu;
      T[k * 3] = tx / tl; T[k * 3 + 1] = ty / tl; T[k * 3 + 2] = tz / tl;
      B[k * 3] = bx / bl; B[k * 3 + 1] = by / bl; B[k * 3 + 2] = bz / bl;
      if (nl < 1e-9 || tl < 1e-7) { bad.push(k); continue; }
      N[k * 3] = nx / nl; N[k * 3 + 1] = ny / nl; N[k * 3 + 2] = nz / nl;
    }
    bad.forEach(function (k) { // poles: borrow the neighbouring row's normal average
      var iv = Math.floor(k / W), nb = iv === 0 ? 1 : iv - 1, sx = 0, sy = 0, sz = 0;
      for (var iu = 0; iu < nu; iu++) { var q = nb * W + iu; sx += N[q * 3]; sy += N[q * 3 + 1]; sz += N[q * 3 + 2]; }
      var l = Math.hypot(sx, sy, sz) || 1; N[k * 3] = sx / l; N[k * 3 + 1] = sy / l; N[k * 3 + 2] = sz / l;
      if (Math.hypot(T[k * 3], T[k * 3 + 1], T[k * 3 + 2]) < 0.5) { T[k * 3] = 1; T[k * 3 + 1] = 0; T[k * 3 + 2] = 0; }
    });
    var I = new Uint32Array(nu * nv * 6), o = 0;
    for (iv = 0; iv < nv; iv++) for (iu = 0; iu < nu; iu++) {
      var a = iv * W + iu, b = a + 1, c = a + W, d = c + 1;
      if (sign > 0) { I[o++] = a; I[o++] = c; I[o++] = b; I[o++] = b; I[o++] = c; I[o++] = d; }
      else { I[o++] = a; I[o++] = b; I[o++] = c; I[o++] = b; I[o++] = d; I[o++] = c; }
    }
    return { P: P, N: N, T: T, B: B, UV: UV, AX: AX, I: I };
  }

  /* profile helpers: lists of [r, y, seg] */
  function Profile() { this.pts = []; }
  Profile.prototype.add = function (r, y, seg) { var l = this.pts[this.pts.length - 1]; if (!l || Math.hypot(l[0] - r, l[1] - y) > 1e-5) this.pts.push([r, y, seg]); return this; };
  Profile.prototype.line = function (r0, y0, r1, y1, seg, n) { for (var i = 0; i <= n; i++) { var t = i / n; this.add(lerp(r0, r1, t), lerp(y0, y1, t), seg); } return this; };
  Profile.prototype.curve = function (fn, n, seg) { for (var i = 0; i <= n; i++) { var p = fn(i / n); this.add(p[0], p[1], seg); } return this; };
  Profile.prototype.arc = function (cr, cy, rad, a0, a1, seg, n) { for (var i = 0; i <= n; i++) { var a = lerp(a0, a1, i / n); this.add(cr + Math.cos(a) * rad, cy + Math.sin(a) * rad, seg); } return this; };

  function lathe(prof, nu, warp) {
    var pts = prof.pts, n = pts.length, s = [0];
    for (var i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var tot = s[n - 1];
    return grid(nu, n - 1, true, function (iu, iv) {
      var th = iu / nu * TAU, p = pts[iv], dy = warp ? warp(th, p) : 0;
      return { p: [p[0] * Math.cos(th), p[1] + dy, p[0] * Math.sin(th)], uv: [iu / nu, s[iv] / tot], aux: [p[2], p[0], s[iv]] };
    }, 1);
  }

  function ellipsoid(c, rx, ry, rz, rot, nu, nv, seg, lump) {
    var R = rot || function (v) { return v; };
    return grid(nu, nv, true, function (iu, iv) {
      var th = iu / nu * TAU, ph = iv / nv * Math.PI;
      var d = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      var k = 1;
      if (lump) k = 1 + lump * (vnoise(d[0] * 3.1 + 7, d[1] * 3.1, d[2] * 3.1) - 0.5) + lump * 0.5 * (vnoise(d[0] * 7 + 1, d[1] * 7 + 2, d[2] * 7) - 0.5);
      var v = R([d[0] * rx * k, d[1] * ry * k, d[2] * rz * k]);
      return { p: [c[0] + v[0], c[1] + v[1], c[2] + v[2]], uv: [iu / nu, iv / nv], aux: [seg, rx, ph * ry] };
    }, -1);
  }

  /* curved cap visor, front = +z */
  function visor(R, y0, span, reach, nu, nv) {
    var g = grid(nu, nv, false, function (iu, iv) {
      var a = iu / nu * 2 - 1, b = iv / nv;
      var phi = a * span, ix = R * Math.sin(phi), iz = R * Math.cos(phi);
      var psi = a * Math.PI / 2, ox = R * Math.sin(span) * 1.01 * Math.sin(psi), oz = R * Math.cos(span) + reach * Math.cos(psi);
      var x = lerp(ix, ox, b), z = lerp(iz, oz, b), dd = b * Math.hypot(ox - ix, oz - iz), y = y0 - 0.012 - dd * (0.07 + 0.16 * a * a);
      return { p: [x, y, z], uv: [iu / nu, b], aux: [6, a, b] };
    }, 1);
    // orient normals upward
    var sy = 0; for (var i = 1; i < g.N.length; i += 3) sy += g.N[i];
    if (sy < 0) { for (i = 0; i < g.N.length; i++) g.N[i] = -g.N[i]; for (i = 0; i < g.I.length; i += 3) { var t = g.I[i + 1]; g.I[i + 1] = g.I[i + 2]; g.I[i + 2] = t; } }
    return g;
  }

  /* ---------- hat models ---------- */
  // seg ids: 0 rib cuff, 1 body/crown, 2 brim top, 3 brim under, 4 inner, 5 ribbon band, 6 visor, 7 button, 8 pompom, 9 ear, 10 inner ear, 11 bow
  function beanieProfile(o) {
    var R = 1, ch = o.cuff, ct = o.cuffOut, H = o.height, p = new Profile();
    p.line(R - 0.005, 0, R - 0.005, 0.0001, 0, 1)
      .arc(R + ct - 0.04, 0.045, 0.04, -Math.PI / 2 - 0.6, 0, 0, 6)
      .line(R + ct, 0.05, R + ct, ch - 0.035, 0, 24)
      .arc(R + ct - 0.035, ch - 0.035, 0.035, 0, Math.PI / 2 + 0.25, 0, 7);
    var y0 = ch + 0.012, Hb = H - y0;
    p.curve(function (t) {
      var tt = 1 - Math.pow(1 - t, 1.6); // denser near the crown
      var y = y0 + tt * Hb, q = (y - y0) / Hb;
      var r = R * Math.pow(Math.max(0, 1 - Math.pow(q, o.exp)), 1 / o.exp) * (1 + o.bulge * Math.sin(q * Math.PI));
      return [r, y];
    }, 150, 1);
    return p;
  }

  var MODELS = {
    beanie: function () {
      var H = 1.48, parts = [{ g: lathe(beanieProfile({ cuff: 0.44, cuffOut: 0.07, height: H, exp: 2.3, bulge: 0.035 }), 200), kind: 'knit', col: 'main' }];
      parts.push({ g: ellipsoid([0, H + 0.22, 0], 0.39, 0.37, 0.39, null, 72, 48, 8, 0.12), kind: 'fur', col: 'second' });
      return { parts: parts, height: H + 0.6, radius: 1.1 };
    },
    striped: function () {
      var H = 1.46, parts = [{ g: lathe(beanieProfile({ cuff: 0.42, cuffOut: 0.07, height: H, exp: 2.3, bulge: 0.03 }), 200), kind: 'knit', col: 'main', pattern: 1 }];
      parts.push({ g: ellipsoid([0, H + 0.2, 0], 0.36, 0.34, 0.36, null, 72, 48, 8, 0.12), kind: 'fur', col: 'second' });
      return { parts: parts, height: H + 0.55, radius: 1.1 };
    },
    fisherman: function () {
      var H = 1.22;
      return { parts: [{ g: lathe(beanieProfile({ cuff: 0.5, cuffOut: 0.07, height: H, exp: 2.45, bulge: 0.0 }), 200), kind: 'knit', col: 'main', rib: true }], height: H, radius: 1.1 };
    },
    bear: function () {
      var H = 1.34, parts = [{ g: lathe(beanieProfile({ cuff: 0.38, cuffOut: 0.07, height: H, exp: 2.5, bulge: 0.03 }), 200), kind: 'knit', col: 'main' }];
      [-1, 1].forEach(function (sd) {
        var R = rot3(0, 0, -sd * 0.55);
        parts.push({ g: ellipsoid([sd * 0.6, 1.17, 0.02], 0.3, 0.28, 0.13, R, 48, 32, 9, 0.04), kind: 'fur', col: 'main' });
        parts.push({ g: ellipsoid([sd * 0.585, 1.16, 0.12], 0.17, 0.16, 0.05, R, 40, 24, 10, 0.02), kind: 'fur', col: 'second' });
      });
      return { parts: parts, height: H + 0.1, radius: 1.15 };
    },
    bucket: function () {
      var p = new Profile(), th = 0.032;
      function brim(x) { return [1.0 + 0.6 * x, 0.25 - 0.27 * Math.pow(x, 1.25)]; }
      p.line(0, 0.985, 0.74, 0.98, 4, 14).arc(0.74, 0.95, 0.03, Math.PI / 2, 0.15, 4, 4)
        .line(0.772, 0.95, 0.968, 0.25, 4, 30)
        .curve(function (t) { var q = brim(t); return [q[0] - 0.01 * (1 - t), q[1] - th]; }, 40, 3);
      var e = brim(1);
      p.arc(e[0], e[1] - th / 2, th / 2, -Math.PI / 2, Math.PI / 2, 3, 8)
        .curve(function (t) { return brim(1 - t); }, 40, 2)
        .line(1.0, 0.25, 0.81, 0.955, 1, 32).arc(0.775, 0.955, 0.035, 0, Math.PI / 2, 1, 6)
        .curve(function (t) { var r = lerp(0.775, 0, t); return [r, 0.99 + 0.035 * (1 - Math.pow(r / 0.775, 2))]; }, 18, 1);
      return { parts: [{ g: lathe(p, 200), kind: 'cotton', col: 'main', pattern: 'dotsOpt' }], height: 1.05, radius: 1.6, frame: 1.1 };
    },
    sunhat: function () {
      var p = new Profile(), th = 0.03;
      function brim(x) { return [0.98 + 1.02 * x, 0.32 - 0.25 * Math.pow(x, 1.5)]; }
      function crown(t) { var y = 0.32 + t * 0.7; var q = t; return [0.93 * Math.pow(Math.max(0, 1 - Math.pow(q, 2.8)), 1 / 2.8), y]; }
      p.curve(function (t) { var c = crown(1 - t); return [c[0] - 0.025, c[1] - 0.02]; }, 40, 4)
        .curve(function (t) { var q = brim(t); return [q[0] - 0.01, q[1] - th]; }, 50, 3);
      var e = brim(1);
      p.arc(e[0], e[1] - th / 2, th / 2, -Math.PI / 2, Math.PI / 2, 3, 8)
        .curve(function (t) { return brim(1 - t); }, 50, 2)
        .line(0.98, 0.32, 0.975, 0.33, 5, 1).line(0.975, 0.33, 0.965, 0.5, 5, 10).line(0.95, 0.505, 0.93 * Math.pow(1 - Math.pow(0.27, 2.8), 1 / 2.8), 0.51, 1, 2)
        .curve(function (t) { return crown(0.27 + 0.73 * t); }, 60, 1);
      var warp = function (thv, pt) { if (pt[2] !== 2 && pt[2] !== 3) return 0; var x = Math.max(0, (pt[0] - 1.0) / 1.0); return 0.055 * Math.sin(thv * 3 + 0.6) * x * x; };
      var parts = [{ g: lathe(p, 220, warp), kind: 'straw', col: 'main' }];
      var bx = -0.985, R1 = rot3(0, 0, 0.5), R2 = rot3(0, 0, -0.5);
      parts.push({ g: ellipsoid([bx - 0.02, 0.44, 0.17], 0.03, 0.12, 0.09, rot3(0.5, 0, 0), 24, 16, 11), kind: 'ribbon', col: 'second' });
      parts.push({ g: ellipsoid([bx - 0.02, 0.44, -0.17], 0.03, 0.12, 0.09, rot3(-0.5, 0, 0), 24, 16, 11), kind: 'ribbon', col: 'second' });
      parts.push({ g: ellipsoid([bx - 0.03, 0.42, 0], 0.035, 0.07, 0.06, null, 20, 14, 11), kind: 'ribbon', col: 'second' });
      parts.push({ g: ellipsoid([bx - 0.01, 0.3, 0.07], 0.02, 0.16, 0.045, rot3(0.25, 0, 0), 20, 14, 11), kind: 'ribbon', col: 'second' });
      parts.push({ g: ellipsoid([bx - 0.01, 0.3, -0.07], 0.02, 0.16, 0.045, rot3(-0.25, 0, 0), 20, 14, 11), kind: 'ribbon', col: 'second' });
      void R1; void R2;
      return { parts: parts, height: 1.02, radius: 2.0, frame: 1.04 };
    },
    cap: function () {
      var p = new Profile(), H = 1.06;
      p.line(0.995, 0.06, 1.0, 0.075, 1, 2).curve(function (t) { var tt = 1 - Math.pow(1 - t, 1.5); var y = 0.075 + tt * (H - 0.075), q = (y - 0.075) / (H - 0.075); return [Math.pow(Math.max(0, 1 - Math.pow(q, 2.05)), 1 / 2.05) * (1 + 0.025 * Math.sin(q * Math.PI)), y]; }, 150, 1);
      var parts = [{ g: lathe(p, 240), kind: 'twill', col: 'main', cap: true }];
      parts.push({ g: visor(1.0, 0.085, 1.22, 1.38, 90, 40), kind: 'twill', col: 'main', under: 'second' });
      parts.push({ g: ellipsoid([0, H + 0.012, 0], 0.085, 0.035, 0.085, null, 28, 14, 7), kind: 'twill', col: 'main' });
      return { parts: parts, height: H, radius: 1.3, frame: 1.14 };
    }
  };

  /* ---------- shaders ---------- */
  var VS = [
    'attribute vec3 aP; attribute vec3 aN; attribute vec3 aT; attribute vec3 aB; attribute vec2 aUV; attribute vec3 aX;',
    'uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel;',
    'varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec2 vUV; varying vec3 vX; varying vec3 vO; varying vec3 vVP;',
    'void main(){ mat3 m = mat3(uView * uModel); vN = m * aN; vT = m * aT; vB = m * aB; vUV = aUV; vX = aX; vO = aP;',
    ' vec4 vp = uView * uModel * vec4(aP, 1.0); vVP = vp.xyz; gl_Position = uProj * vp; }'
  ].join('\n');

  var FS = [
    'precision highp float;',
    'varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec2 vUV; varying vec3 vX; varying vec3 vO; varying vec3 vVP;',
    'uniform int uKind; uniform int uPattern; uniform float uRib; uniform float uCap; uniform float uUnder;',
    'uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uEnv; uniform float uExposure;',
    'float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),',
    '  mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z); }',
    'float leg(vec2 q, vec2 c, vec2 d){ vec2 a = q - c; vec2 pr = vec2(-d.y, d.x); float e = pow(dot(a,d)/0.6, 2.0) + pow(dot(a,pr)/0.27, 2.0);',
    ' float h = sqrt(max(0.0, 1.0 - e)); return h * (0.86 + 0.14 * sin(dot(a,d) * 34.0 + dot(a,pr) * 10.0)); }',
    'float knitH(vec2 st){ vec2 f = fract(st); float h = 0.0;',
    ' for (int k = -1; k <= 1; k++){ vec2 q = f - vec2(0.5, 0.5 + float(k));',
    '  h = max(h, leg(q, vec2(-0.22, 0.0), normalize(vec2(-0.45, 1.0))));',
    '  h = max(h, leg(q, vec2(0.22, 0.0), normalize(vec2(0.45, 1.0)))); }',
    ' return h; }',
    'float ribH(vec2 st){ float x = fract(st.x); float col = smoothstep(0.0, 0.18, x) * smoothstep(0.62, 0.44, x);',
    ' float k = knitH(vec2(st.x * 2.0, st.y)); return col * (0.55 + 0.45 * k) + (1.0 - col) * 0.12 * (0.5 + 0.5 * sin(st.y * 6.283)); }',
    'float strawH(vec2 p){ float w = 0.055; float ring = fract(p.y / w); float row = floor(p.y / w);',
    ' float ch = fract(p.x / (w * 0.9) + abs(ring - 0.5) * 1.3 + row * 0.37); float strand = 1.0 - abs(ch - 0.5) * 2.0;',
    ' float edge = smoothstep(0.0, 0.14, ring) * smoothstep(1.0, 0.86, ring); return edge * (0.35 + 0.65 * smoothstep(0.05, 0.6, strand)); }',
    'float weaveH(vec2 p){ return 0.5 + 0.5 * sin(p.x) * sin(p.y); }',
    'float twillH(vec2 p){ return 0.5 + 0.5 * sin((p.x + p.y) * 1.0); }',
    'float seamDist(){ float th = vUV.x * 6.28318 - 1.5708; float k = th / 1.0472; float d = abs(fract(k + 0.5) - 0.5) * 1.0472 * vX.y; return d; }',
    'float H(vec2 uv, vec3 o, vec3 x){',
    ' if (uKind == 0) { if (x.x < 0.5 || uRib > 0.5) return ribH(vec2(uv.x * 72.0, x.z / 0.034)); return knitH(vec2(uv.x * 140.0, x.z / 0.036)); }',
    ' if (uKind == 1) { return noise(o * 46.0) * 0.6 + noise(o * 110.0) * 0.4; }',
    ' if (uKind == 2) { return 0.5 + 0.32 * noise(o * 70.0) + 0.18 * noise(o * 190.0); }',
    ' if (uKind == 3) { return strawH(vec2(uv.x * 6.28318 * max(x.y, 0.05), x.z)); }',
    ' if (uKind == 4) { return 0.5 + 0.3 * noise(o * 80.0) + 0.2 * noise(vec3((o.x + o.y) * 160.0, o.z * 50.0, o.y * 20.0)); }',
    ' if (uKind == 5) { return 0.5 + 0.5 * sin(x.z * 900.0); }',
    ' return 0.5; }',
    'vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }',
    'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }',
    'void main(){',
    ' vec3 N = normalize(vN); vec3 T = normalize(vT); vec3 B = normalize(vB);',
    ' bool inside = !gl_FrontFacing; if (inside) N = -N;',
    ' float e = 0.0016; vec2 uv = vUV; vec3 x = vX;',
    ' float h0 = H(uv, vO, x);',
    ' float bumpAmt = uKind == 0 ? 0.9 : uKind == 1 ? 0.7 : uKind == 3 ? 0.8 : uKind == 2 ? 0.05 : uKind == 4 ? 0.05 : 0.2;',
    ' float hu, hv;',
    ' if (uKind == 1 || uKind == 2 || uKind == 4) { hu = H(uv, vO + T * 0.004, x) - h0; hv = H(uv, vO + B * 0.004, x) - h0; }',
    ' else { hu = H(uv + vec2(e * 0.25, 0.0), vO, x) - h0; vec3 x2 = x; x2.z += 0.0012; hv = H(uv, vO, x2) - h0; }',
    ' if (!inside) N = normalize(N - bumpAmt * (hu * T + hv * B) * 2.2);',
    ' vec3 base = uC1; float cav = 1.0;',
    ' if (uKind == 0) { cav = mix(0.62, 1.0, h0); if (uPattern == 1 && x.x > 0.5) { float band = mod(floor(x.z / 0.21), 2.0); base = mix(uC1, uC2, band); } base *= 0.95 + 0.07 * noise(vec3(uv.x * 140.0, x.z * 9.0, 3.0)); }',
    ' if (uKind == 1) { cav = mix(0.7, 1.05, h0); base *= 0.92 + 0.12 * noise(vO * 30.0); }',
    ' if (uKind == 2) { cav = mix(0.94, 1.02, h0);',
    '  if (uPattern == 2 && x.x > 0.5 && x.x < 2.5) { float sp = 0.17; vec2 q = (x.x > 1.5 || vO.y > 0.955) ? vO.xz / sp : vec2(uv.x * 6.28318 * 0.91, vO.y) / sp;',
    '   q.x += 0.5 * mod(floor(q.y), 2.0); vec2 l = (fract(q) - 0.5) * sp; float dd = smoothstep(0.042, 0.036, length(l)); base = mix(base, uC2, dd); }',
    '  if (x.x > 1.5 && x.x < 3.5) { float rr = x.y - 1.0; float ln = abs(fract(rr / 0.075 + 0.5) - 0.5); float dash = step(0.45, fract(uv.x * 6.28318 * x.y / 0.03)); float st = smoothstep(0.07, 0.02, ln) * dash * step(0.04, rr); base = mix(base, base * 0.8, st); } }',
    ' if (uKind == 3) { float row = floor(x.z / 0.055); base *= 0.86 + 0.2 * hash(vec3(row, 1.0, 2.0)); cav = mix(0.66, 1.05, h0); base *= 0.93 + 0.1 * noise(vec3(uv.x * 400.0 * max(x.y,0.1), x.z * 60.0, 1.0)); }',
    ' if (uKind == 3 && x.x > 4.5 && x.x < 5.5) { base = uC2; cav = mix(0.85, 1.0, 0.5 + 0.5 * sin(x.z * 900.0)); }',
    ' if (uKind == 4) { cav = mix(0.94, 1.02, h0);',
    '  if (uCap > 0.5 && x.x > 0.5 && x.x < 1.5) { float sd = seamDist(); float groove = smoothstep(0.012, 0.0, sd); cav *= 1.0 - 0.45 * groove;',
    '   float stl = smoothstep(0.006, 0.0, abs(sd - 0.028)) * step(0.5, fract(x.z / 0.026)); base = mix(base, base * 0.7, stl);',
    '   float th = vUV.x * 6.28318 - 1.5708 + 0.5236; float k = th / 1.0472; float ed = length(vec2((fract(k) - 0.5) * 1.0472 * x.y, vO.y - 0.86)); float ring = smoothstep(0.032, 0.026, ed) * smoothstep(0.012, 0.018, ed); float hole = smoothstep(0.014, 0.01, ed); base = mix(base, base * 0.6, ring); base = mix(base, vec3(0.08), hole);',
    '   float band = smoothstep(0.0, 0.004, abs(vO.y - 0.16) - 0.004); base = mix(base * 0.78, base, band); }',
    '  if (x.x > 5.5 && x.x < 6.5) { float ln = 0.0; for (int i = 1; i <= 6; i++) { ln = max(ln, smoothstep(0.01, 0.0, abs(x.z - (1.0 - float(i) * 0.075)))); } float dash = step(0.4, fract(x.y * 38.0)); base = mix(base, base * 0.72, ln * dash);',
    '   if (inside) base = uC2; } }',
    ' if (uKind == 5) { cav = mix(0.88, 1.0, h0); }',
    ' vec3 alb = lin(base) * cav; if (inside && uKind != 4) alb *= 0.5; if (inside && uKind == 4 && !(x.x > 5.5 && x.x < 6.5)) alb *= 0.55;',
    ' vec3 V = normalize(-vVP);',
    ' vec3 L1 = normalize(vec3(-0.45, 0.75, 0.55)); vec3 L2 = normalize(vec3(0.85, 0.15, 0.45)); vec3 L3 = normalize(vec3(0.25, 0.55, -0.85));',
    ' float w = uKind == 1 ? 0.6 : 0.35;',
    ' float d1 = max(0.0, (dot(N, L1) + w) / (1.0 + w)); float d2 = max(0.0, (dot(N, L2) + w) / (1.0 + w)); float d3 = max(0.0, dot(N, L3));',
    ' vec3 env = lin(uEnv); vec3 amb = mix(env * 0.5 + vec3(0.03), vec3(0.6, 0.62, 0.68), N.y * 0.5 + 0.5) * 0.3;',
    ' vec3 col = alb * (vec3(1.0, 0.96, 0.9) * 1.4 * d1 + vec3(0.75, 0.82, 1.0) * 0.5 * d2 + amb + env * 0.18 * max(0.0, -N.y));',
    ' float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
    ' float sheen = uKind == 0 ? 0.2 : uKind == 1 ? 0.42 : uKind == 3 ? 0.08 : 0.1;',
    ' col += (alb * 0.55 + 0.05) * fr * sheen * (0.6 + 0.6 * d3) + alb * d3 * 0.45;',
    ' vec3 Hh = normalize(L1 + V); float shin = uKind == 5 ? 40.0 : uKind == 3 ? 18.0 : 10.0; float sa = uKind == 5 ? 0.35 : uKind == 3 ? 0.12 : uKind == 4 ? 0.06 : 0.04;',
    ' col += vec3(1.0, 0.97, 0.92) * pow(max(dot(N, Hh), 0.0), shin) * sa;',
    ' col = aces(col * uExposure); gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0); }'
  ].join('\n');

  var SVS = 'attribute vec2 aQ; uniform mat4 uProj; uniform mat4 uView; uniform float uR; uniform float uY; varying vec2 vQ; void main(){ vQ = aQ; gl_Position = uProj * uView * vec4(aQ.x * uR, uY, aQ.y * uR, 1.0); }';
  var SFS = 'precision mediump float; varying vec2 vQ; uniform float uA; uniform vec3 uSC; void main(){ float d = length(vQ); float a = uA * exp(-d * d * 4.2) * (1.0 - smoothstep(0.85, 1.0, d)); gl_FragColor = vec4(uSC * a, a); }';

  var KIND = { knit: 0, fur: 1, cotton: 2, straw: 3, twill: 4, ribbon: 5 };

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  var geoCache = {};
  function geometry(name) { if (!geoCache[name]) geoCache[name] = MODELS[name](); return geoCache[name]; }

  function supported() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || (c.getContext('webgl') && c.getContext('webgl').getExtension('OES_element_index_uint'))); } catch (e) { return false; }
  }

  function create(canvas, opts) {
    opts = opts || {};
    var ctxOpts = { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve };
    var gl = canvas.getContext('webgl2', ctxOpts), isGL2 = !!gl;
    if (!gl) { gl = canvas.getContext('webgl', ctxOpts); if (!gl || !gl.getExtension('OES_element_index_uint')) throw new Error('WebGL unavailable'); }
    var prog = program(gl, VS, FS), sprog = program(gl, SVS, SFS);
    var loc = {}, sloc = {};
    ['aP', 'aN', 'aT', 'aB', 'aUV', 'aX'].forEach(function (n) { loc[n] = gl.getAttribLocation(prog, n); });
    ['uProj', 'uView', 'uModel', 'uKind', 'uPattern', 'uRib', 'uCap', 'uUnder', 'uC1', 'uC2', 'uC3', 'uEnv', 'uExposure'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
    sloc.aQ = gl.getAttribLocation(sprog, 'aQ');
    ['uProj', 'uView', 'uR', 'uY', 'uA', 'uSC'].forEach(function (n) { sloc[n] = gl.getUniformLocation(sprog, n); });
    var quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    var st = {
      model: null, geo: null, gpu: [], colors: { main: '#e8a7a2', second: '#f4e9dc', third: '#333333', env: '#fde7e4' },
      yaw: opts.yaw != null ? opts.yaw : -0.55, pitch: opts.pitch != null ? opts.pitch : 0.32, dist: 1, zoom: 1,
      vyaw: 0, vpitch: 0, auto: opts.autoRotate !== false, lastInteract: 0, raf: 0, dirty: true, visible: true, destroyed: false,
      pattern: 0, exposure: opts.exposure || 0.92
    };
    var home = { yaw: st.yaw, pitch: st.pitch };

    function upload(name) {
      st.gpu.forEach(function (g) { Object.keys(g.buf).forEach(function (k) { gl.deleteBuffer(g.buf[k]); }); });
      st.gpu = [];
      st.geo = geometry(name); st.model = name;
      st.geo.parts.forEach(function (part) {
        var g = part.g, buf = {};
        [['aP', g.P, 3], ['aN', g.N, 3], ['aT', g.T, 3], ['aB', g.B, 3], ['aUV', g.UV, 2], ['aX', g.AX, 3]].forEach(function (a) {
          buf[a[0]] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf[a[0]]); gl.bufferData(gl.ARRAY_BUFFER, a[1], gl.STATIC_DRAW); buf[a[0]].size = a[2];
        });
        buf.idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.I, gl.STATIC_DRAW);
        st.gpu.push({ buf: buf, count: g.I.length, part: part });
      });
      st.dirty = true;
    }

    function size() {
      var dpr = Math.min(opts.dpr || window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (opts.fixedSize) { w = canvas.width; h = canvas.height; }
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; st.dirty = true; }
    }

    function camera() {
      var g = st.geo, aspect = canvas.width / canvas.height, fov = 0.52;
      var rad = Math.max(g.radius * 1.08, g.height * 0.66), d = rad / Math.sin(fov / 2) * (aspect < 1 ? 1 / Math.max(aspect, 0.55) : 1) * (opts.frame || g.frame || 1.32) / st.zoom;
      var ty = g.height * 0.47 - 0.02;
      var eye = [Math.sin(st.yaw) * Math.cos(st.pitch) * d, ty + Math.sin(st.pitch) * d, Math.cos(st.yaw) * Math.cos(st.pitch) * d];
      return { proj: persp(fov, aspect, 0.1, 60), view: lookAt(eye, [0, ty, 0], [0, 1, 0]) };
    }

    function render() {
      if (st.destroyed || !st.geo) return;
      size();
      var cam = camera(), c = st.colors;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // contact shadow
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(sprog);
      gl.uniformMatrix4fv(sloc.uProj, false, cam.proj); gl.uniformMatrix4fv(sloc.uView, false, cam.view);
      gl.uniform1f(sloc.uR, st.geo.radius * 1.25); gl.uniform1f(sloc.uY, st.model === 'sunhat' || st.model === 'bucket' ? -0.12 : -0.04); gl.uniform1f(sloc.uA, opts.shadow != null ? opts.shadow : 0.42);
      var e = hex(c.env); gl.uniform3f(sloc.uSC, e[0] * 0.25, e[1] * 0.2, e[2] * 0.3);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(sloc.aQ); gl.vertexAttribPointer(sloc.aQ, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(sloc.aQ);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.useProgram(prog);
      gl.uniformMatrix4fv(loc.uProj, false, cam.proj); gl.uniformMatrix4fv(loc.uView, false, cam.view);
      gl.uniformMatrix4fv(loc.uModel, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      gl.uniform3fv(loc.uEnv, hex(c.env)); gl.uniform1f(loc.uExposure, st.exposure);
      st.gpu.forEach(function (g) {
        var part = g.part, main = hex(c[part.col] || c.main);
        gl.uniform1i(loc.uKind, KIND[part.kind]);
        var pat = part.pattern === 1 ? 1 : (part.pattern === 'dotsOpt' && st.pattern === 2 ? 2 : 0);
        gl.uniform1i(loc.uPattern, pat);
        gl.uniform1f(loc.uRib, part.rib ? 1 : 0); gl.uniform1f(loc.uCap, part.cap ? 1 : 0); gl.uniform1f(loc.uUnder, part.under ? 1 : 0);
        gl.uniform3fv(loc.uC1, main); gl.uniform3fv(loc.uC2, hex(part.under ? (c[part.under] || c.second) : c.second)); gl.uniform3fv(loc.uC3, hex(c.third || '#333333'));
        ['aP', 'aN', 'aT', 'aB', 'aUV', 'aX'].forEach(function (n) {
          if (loc[n] < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, g.buf[n]); gl.enableVertexAttribArray(loc[n]); gl.vertexAttribPointer(loc[n], g.buf[n].size, gl.FLOAT, false, 0, 0);
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.buf.idx); gl.drawElements(gl.TRIANGLES, g.count, gl.UNSIGNED_INT, 0);
      });
      st.dirty = false;
    }

    var lastT = 0, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loop(t) {
      st.raf = 0;
      if (st.destroyed) return;
      var dt = Math.min(50, t - (lastT || t)); lastT = t;
      var idle = t - st.lastInteract > 2200;
      if (Math.abs(st.vyaw) > 0.00005 || Math.abs(st.vpitch) > 0.00005) { st.yaw += st.vyaw * dt; st.pitch = clampP(st.pitch + st.vpitch * dt); st.vyaw *= Math.pow(0.92, dt / 16); st.vpitch *= Math.pow(0.9, dt / 16); st.dirty = true; }
      else if (st.auto && idle && !reduce) { st.yaw += 0.00028 * dt; st.dirty = true; }
      if (st.dirty && st.visible) render();
      if (st.visible) st.raf = requestAnimationFrame(loop);
    }
    function kick() { if (!st.raf && !st.destroyed && !opts.manual) st.raf = requestAnimationFrame(loop); }
    function clampP(p) { return Math.max(-0.15, Math.min(1.0, p)); }

    /* interaction */
    var pts = new Map(), pinch0 = 0, zoom0 = 1, lastX = 0, lastY = 0, lastMoveT = 0, moved = false;
    function onDown(e) {
      if (!opts.interactive && opts.interactive !== undefined) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (pts.size === 2 && opts.zoom) { var a = Array.from(pts.values()); pinch0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); zoom0 = st.zoom; }
      lastX = e.clientX; lastY = e.clientY; lastMoveT = performance.now(); st.vyaw = st.vpitch = 0; st.lastInteract = performance.now(); moved = false;
      canvas.classList.add('is-grabbing');
    }
    function onMove(e) {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var now = performance.now();
      if (pts.size === 2 && opts.zoom) { var a = Array.from(pts.values()); var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if (pinch0) setZoom(zoom0 * d / pinch0); return; }
      var dx = e.clientX - lastX, dy = e.clientY - lastY, dtm = Math.max(8, now - lastMoveT);
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      st.yaw -= dx * 0.009; st.pitch = clampP(st.pitch + dy * 0.006);
      st.vyaw = -dx * 0.009 / dtm; st.vpitch = dy * 0.006 / dtm * 0.5;
      lastX = e.clientX; lastY = e.clientY; lastMoveT = now; st.lastInteract = now; st.dirty = true; kick();
    }
    function onUp(e) {
      pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0;
      if (performance.now() - lastMoveT > 80) { st.vyaw = st.vpitch = 0; }
      st.lastInteract = performance.now(); canvas.classList.remove('is-grabbing'); kick();
      if (moved && opts.onSpin) opts.onSpin();
    }
    function setZoom(z) { st.zoom = Math.max(0.8, Math.min(2.4, z)); st.dirty = true; st.lastInteract = performance.now(); kick(); if (opts.onZoom) opts.onZoom(st.zoom); }
    function onWheel(e) { if (!opts.zoom) return; e.preventDefault(); setZoom(st.zoom * Math.exp(-e.deltaY * 0.0015)); }
    function onKey(e) {
      var k = e.key, step = 0.18;
      if (k === 'ArrowLeft') st.yaw += step; else if (k === 'ArrowRight') st.yaw -= step; else if (k === 'ArrowUp') st.pitch = clampP(st.pitch + 0.1); else if (k === 'ArrowDown') st.pitch = clampP(st.pitch - 0.1);
      else if ((k === '+' || k === '=') && opts.zoom) setZoom(st.zoom * 1.15); else if (k === '-' && opts.zoom) setZoom(st.zoom / 1.15); else return;
      e.preventDefault(); st.lastInteract = performance.now(); st.dirty = true; kick();
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('dblclick', function () { api.resetView(); });

    var io = null;
    if (window.IntersectionObserver && !opts.manual) { io = new IntersectionObserver(function (en) { st.visible = en[0].isIntersecting && !document.hidden; if (st.visible) { st.dirty = true; kick(); } }, { rootMargin: '80px' }); io.observe(canvas); }
    function onVis() { st.visible = !document.hidden; if (st.visible) { st.dirty = true; kick(); } }
    document.addEventListener('visibilitychange', onVis);
    var ro = null; if (window.ResizeObserver && !opts.fixedSize) { ro = new ResizeObserver(function () { st.dirty = true; kick(); }); ro.observe(canvas); }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (opts.onLost) opts.onLost(); });

    var api = {
      gl2: isGL2,
      setModel: function (name) { if (MODELS[name] && name !== st.model) upload(name); kick(); return api; },
      setColors: function (c, pattern) { Object.keys(c).forEach(function (k) { if (c[k]) st.colors[k] = c[k]; }); st.pattern = pattern || 0; st.dirty = true; kick(); return api; },
      setView: function (yaw, pitch, zoom) { if (yaw != null) st.yaw = yaw; if (pitch != null) st.pitch = clampP(pitch); if (zoom != null) st.zoom = zoom; st.vyaw = st.vpitch = 0; st.dirty = true; kick(); return api; },
      resetView: function () { st.yaw = home.yaw; st.pitch = home.pitch; st.zoom = 1; st.vyaw = st.vpitch = 0; st.dirty = true; st.lastInteract = performance.now(); kick(); if (opts.onZoom) opts.onZoom(1); return api; },
      zoomBy: function (f) { setZoom(st.zoom * f); return api; },
      setAuto: function (on) { st.auto = !!on; st.lastInteract = 0; kick(); return api; },
      get auto() { return st.auto; },
      getView: function () { return { yaw: st.yaw, pitch: st.pitch, zoom: st.zoom, model: st.model }; },
      nudge: function (v) { st.vyaw = v; st.lastInteract = performance.now(); kick(); },
      render: function () { st.dirty = true; render(); return api; },
      snapshot: function (type, q) { render(); return canvas.toDataURL(type || 'image/png', q); },
      destroy: function () {
        st.destroyed = true; if (st.raf) cancelAnimationFrame(st.raf);
        if (io) io.disconnect(); if (ro) ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
        st.gpu.forEach(function (g) { Object.keys(g.buf).forEach(function (k) { gl.deleteBuffer(g.buf[k]); }); });
        var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      }
    };
    upload(opts.model || 'beanie');
    if (opts.colors) api.setColors(opts.colors, opts.pattern);
    render(); kick();
    return api;
  }

  global.Hat3D = { create: create, supported: supported, models: Object.keys(MODELS) };
})(window);
