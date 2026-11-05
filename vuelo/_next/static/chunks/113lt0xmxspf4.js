(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,83421,e=>{"use strict";let t=`
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scene;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.; float a = .5;
  for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= .5; }
  return v;
}
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1.); return length(pa-ba*h); }
vec3 skyGrad(float y, vec3 top, vec3 mid, vec3 hor){
  return mix(mix(hor, mid, smoothstep(0., .35, y)), top, smoothstep(.25, 1., y));
}
float ellipse(vec2 p, vec2 c, vec2 r){ return length((p-c)/r); }

// ───── Dron en silueta (vista frontal) ─────
vec3 drone(vec3 col, vec2 p, vec2 c, float sz, float t, vec3 rim){
  vec2 q = (p-c)/sz;
  float ang = sin(t*.8)*.05; float cs = cos(ang), sn = sin(ang);
  q = vec2(cs*q.x - sn*q.y, sn*q.x + cs*q.y);
  if (abs(q.x) > 1.5 || abs(q.y) > 1.0) return col;
  float body = ellipse(q, vec2(0.), vec2(.30,.14));
  float d = body - 1.;
  d = min(d, sdSeg(q, vec2(-.22,.02), vec2(-.86,.17)) - .028);
  d = min(d, sdSeg(q, vec2(.22,.02), vec2(.86,.17)) - .028);
  d = min(d, sdSeg(q, vec2(-.22,-.02), vec2(-.68,-.13)) - .028);
  d = min(d, sdSeg(q, vec2(.22,-.02), vec2(.68,-.13)) - .028);
  d = min(d, ellipse(q, vec2(0.,-.15), vec2(.10,.09)) - 1.);
  float m = 1. - smoothstep(0., .02, d);
  vec3 dc = mix(vec3(.025,.03,.04), rim, smoothstep(-.05, .16, q.y)*.55);
  col = mix(col, dc, m);
  // rotores borrosos
  float spin = .5 + .5*sin(t*60.);
  float r1 = 1. - smoothstep(.0, .18, ellipse(q, vec2(-.86,.22), vec2(.30,.05)) - 1.);
  float r2 = 1. - smoothstep(.0, .18, ellipse(q, vec2(.86,.22), vec2(.30,.05)) - 1.);
  float r3 = 1. - smoothstep(.0, .18, ellipse(q, vec2(-.68,-.09), vec2(.26,.045)) - 1.);
  float r4 = 1. - smoothstep(.0, .18, ellipse(q, vec2(.68,-.09), vec2(.26,.045)) - 1.);
  col = mix(col, vec3(.02,.025,.035), (r1+r2+r3+r4)*(.22 + .08*spin));
  // luces de navegaci\xf3n
  float gl = length(q - vec2(-.86,.17));
  float rl = length(q - vec2(.86,.17));
  col += vec3(.1,1.,.35) * (.004/(gl*gl+.0012)) * .9;
  col += vec3(1.,.15,.1) * (.004/(rl*rl+.0012)) * .8;
  return col;
}

// ───── 0 \xb7 Costa al atardecer, vista a\xe9rea, atravesando nubes ─────
vec3 sCoast(vec2 uv, float a, float t, float l){
  float hz = .50 - .08*l;
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  vec3 col;
  float sunY = hz + .03;
  float d = length((p - vec2(.04, sunY))*vec2(1., 1.5));
  if (uv.y > hz){
    float y = (uv.y-hz)/(1.-hz);
    col = skyGrad(y, vec3(.07,.13,.30), vec3(.72,.42,.40), vec3(1.,.74,.46));
    col += vec3(1.,.70,.36)*(.42/(1.+d*d*55.)) + vec3(1.,.93,.75)*smoothstep(.04,.018,d)*1.2;
    float c = fbm(vec2(p.x*1.4 + t*.012, y*5.5)*vec2(1.,2.4));
    c = smoothstep(.48,.85,c)*(1.-y*.9);
    col = mix(col, vec3(1.,.66,.5)*(.8+.4*exp(-d*3.)), c*.55);
  } else {
    float y = hz - uv.y;
    float depth = 1./(y+.03);
    col = mix(vec3(.62,.42,.38), vec3(.03,.08,.16), smoothstep(0., .30, y));
    float w = noise(vec2(p.x*depth*1.1 + t*.12, depth*2.6 - t*.4));
    float w2 = noise(vec2(p.x*depth*3.0 - t*.2, depth*7. - t*.9));
    float glint = pow(w*w2, 2.6) * 5.5;
    float column = exp(-abs(p.x-.04)*(5. + y*14.));
    col += vec3(1.,.74,.42)*glint*column*1.6;
    col += vec3(1.,.62,.35)*.35*column*exp(-y*3.);
    // costa a la derecha
    float ridge = hz - .015 + .035*fbm(vec2(p.x*3.2, 1.)) - max(0., p.x-.1)*.55;
    float coast = smoothstep(.004, -.002, uv.y - ridge) * smoothstep(.02, .22, p.x);
    vec3 land = mix(vec3(.05,.05,.09), vec3(.14,.10,.12), noise(p*30.));
    float lights = step(.965, hash(floor(vec2(p.x*260., uv.y*260.)))) * (.6 + .4*sin(t*2.+p.x*40.));
    land += vec3(1.,.8,.5)*lights*.5;
    col = mix(col, land, coast);
  }
  // banco de nubes en primer plano que se atraviesa con el scroll
  float sc = 1. + l*3.2;
  float cl = fbm(vec2(p.x*1.1/sc + t*.02, (uv.y-.05)*1.8/sc + 3.) + vec2(2.,0.));
  float cov = smoothstep(.36 - l*.5, .78, cl) * smoothstep(.62, .0, uv.y + .0 - l*.3) ;
  cov = max(cov, smoothstep(.55, 1., l));
  col = mix(col, vec3(1.,.82,.7)*(.9-.25*uv.y), clamp(cov,0.,1.)*.92);
  return col;
}

// ───── 1 \xb7 Hangar con el dron en tierra y la pista al atardecer al fondo ─────
vec3 outside(vec3 rd, float t){
  float y = rd.y;
  vec3 c = skyGrad(clamp(y*2.3+.12, 0., 1.), vec3(.50,.58,.78), vec3(1.,.70,.42), vec3(1.,.86,.58));
  float d = length(vec2(rd.x*1.2, y-.01)*3.);
  c += vec3(1.,.82,.5)*1.3/(1.+d*d*26.);
  if (y < .0) c = mix(vec3(.05,.045,.05), vec3(.95,.55,.24), exp(-abs(rd.x)*5.)*exp(y*14.));
  return c;
}
vec3 sHangar(vec2 uv, float a, float t, float l){
  vec2 p = vec2((uv.x-.5)*a, uv.y-.5);
  vec3 ro = vec3(0., -.35, -3. + l*2.6);
  vec3 rd = normalize(vec3(p, 1.0));
  float rx = abs(rd.x) < 1e-4 ? 1e-4 : rd.x;
  float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
  float tx = rx > 0. ? (3.2-ro.x)/rx : (-3.2-ro.x)/rx;
  float ty = ry > 0. ? (1.4-ro.y)/ry : (-1.-ro.y)/ry;
  float tz = (9.-ro.z)/rd.z;
  float tt = min(min(tx,ty),tz);
  vec3 h = ro + rd*tt;
  vec3 col;
  float openW = 2.0;
  if (tt == tz){
    bool op = abs(h.x) < openW && h.y > -1. && h.y < 1.0;
    if (op){ col = outside(normalize(vec3(h.x*.35, (h.y+.15)*.35, 1.)), t); }
    else {
      col = vec3(.08,.09,.13);
      float edge = smoothstep(.25, .0, max(abs(abs(h.x)-openW), abs(h.y-.0)-1.0)) ;
      col += vec3(.9,.55,.25)*.18*smoothstep(.45,.0,abs(h.x)-openW)*step(abs(h.y),1.0)*.8;
    }
  } else if (tt == ty && rd.y < 0.){
    // suelo pulido: refleja la abertura
    vec3 rr = vec3(rd.x, -rd.y, rd.z);
    float tz2 = (9.-h.z)/rr.z;
    vec3 hh = h + rr*tz2;
    float inside = step(abs(hh.x), openW) * step(-1., hh.y) * step(hh.y, 1.0);
    vec3 refl = inside > .5 ? outside(normalize(vec3(hh.x*.35,(hh.y+.15)*.35,1.)), t) : vec3(.05,.06,.09);
    float rough = .5 + .5*noise(h.xz*3.);
    float fres = pow(1.-abs(rd.y), 3.) * .85 + .15;
    col = vec3(.075,.085,.12) + refl*fres*(.55 + .25*rough);
    col += vec3(.95,.55,.25)*.22*exp(-abs(h.x)*.9)*smoothstep(1., 9., h.z)*.9;
  } else if (tt == ty){
    col = vec3(.11,.095,.09);
    float s = 0.;
    for (int i = 0; i < 3; i++){ float xs = -1.9 + float(i)*1.9; s += smoothstep(.07, .0, abs(h.x-xs)); }
    s += smoothstep(.05, .0, abs(fract(h.z*.5)-.5)-.45) * .25;
    col += vec3(1.,.9,.72)*s*1.6;
    col += vec3(.9,.5,.2)*.25*smoothstep(3., 9., h.z);
  } else {
    col = mix(vec3(.08,.10,.15), vec3(.62,.36,.2), smoothstep(3., 9., h.z)*.55);
    col *= .8 + .2*noise(vec2(h.z*2., h.y*4.));
    col += vec3(.9,.6,.3)*.06;
  }
  col = mix(col, vec3(.55,.55,.62)*.5, smoothstep(14., 40., tt) * .0);
  // dron en el suelo
  vec3 dr = vec3(0., -.88, 5.4) - ro;
  vec2 dp = dr.xy/dr.z;
  float dsz = .62/dr.z;
  vec2 shp = (p - (dp + vec2(0.,-dsz*.18))) / vec2(dsz*1.3, dsz*.22);
  col *= 1. - .55*smoothstep(1., .0, length(shp));
  col = drone(col, p, dp + vec2(0., dsz*.12), dsz, t, vec3(1.,.62,.3));
  return col;
}

// ───── 2 \xb7 Fondo del dron en 3D: azul noche con polvo dorado ─────
vec3 sVoid(vec2 uv, float a, float t, float l){
  vec2 p = vec2((uv.x-.5)*a, uv.y-.45);
  float r = length(p);
  vec3 col = mix(vec3(.11,.11,.115), vec3(.012,.012,.014), smoothstep(.0, .95, r));
  col += vec3(.9)*.045*exp(-r*3.);
  float n = fbm(p*2.4 + vec2(t*.02, -t*.015));
  col += vec3(.5)*.07*n;
  vec2 g = uv*vec2(a,1.)*26.;
  vec2 id = floor(g);
  float h = hash(id);
  vec2 f = fract(g)-.5 + vec2(sin(t*.3+h*30.), cos(t*.25+h*20.))*.2;
  float dust = step(.84, h) * smoothstep(.09, .0, length(f)) * (.4+.6*sin(t*1.2+h*40.));
  col += vec3(1.)*dust*.28;
  return col;
}

// ───── Cielo + dron (planos de servicio) ─────
float haze(float y){ return exp(-y*4.); }

vec3 sSunsetDrone(vec2 uv, float a, float t, float l){ // 3 \xb7 Formaci\xf3n
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  float hz = .30;
  vec3 col;
  float d = length((p - vec2(-.25, hz+.04))*vec2(1.,1.3));
  if (uv.y > hz){
    float y = (uv.y-hz)/(1.-hz);
    col = skyGrad(y, vec3(.10,.17,.36), vec3(.80,.45,.36), vec3(1.,.72,.38));
    col += vec3(1.,.7,.35)*.55/(1.+d*d*30.) + vec3(1.,.95,.8)*smoothstep(.05,.03,d);
    float c = fbm(vec2(p.x*1.5 + t*.03, y*4.)*vec2(1.,2.));
    col = mix(col, vec3(1.,.62,.45), smoothstep(.5,.85,c)*.5*(1.-y));
  } else {
    float y = hz-uv.y;
    col = mix(vec3(.30,.20,.15), vec3(.04,.05,.07), smoothstep(0.,.25,y));
    float ridge = .035*fbm(vec2(p.x*4., 2.));
    col = mix(col, vec3(.035,.04,.05), smoothstep(.0,.02,y-ridge+.0)*.6);
    // dos figuras de pie
    for (int i = 0; i < 2; i++){
      float x0 = -.62 + float(i)*.10;
      float body = sdSeg(p, vec2(x0, hz-.02), vec2(x0, hz+.085)) - .018;
      float head = length(p - vec2(x0, hz+.115)) - .018;
      col = mix(col, vec3(.02,.025,.03), 1.-smoothstep(0.,.004,min(body,head)));
    }
  }
  vec2 dp = vec2(.30 + .02*sin(t*.6), .64 + .015*sin(t*.9) + l*.04);
  col = drone(col, p, dp, .15*clamp(a,.6,1.), t, vec3(1.,.7,.4));
  return col;
}

vec3 sDusk(vec2 uv, float a, float t, float l){ // 4 \xb7 Eventos
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  float y = uv.y;
  vec3 col = skyGrad(y, vec3(.07,.07,.20), vec3(.45,.22,.42), vec3(1.,.58,.38));
  float h1 = .27 + .07*fbm(vec2(p.x*2.2+3., 1.));
  float h2 = .20 + .06*fbm(vec2(p.x*3.1+9., 4.));
  col = mix(col, vec3(.10,.07,.13), smoothstep(.004,-.004, uv.y-h1));
  col = mix(col, vec3(.045,.035,.07), smoothstep(.004,-.004, uv.y-h2));
  // guirnaldas
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    float yy = .40 - fk*.07 + .03*cos((p.x*(2.2+fk*.4)+fk)*3.1416);
    float line = smoothstep(.0016,.0, abs(uv.y-yy));
    col += vec3(1.,.78,.4)*line*.10;
    float n = 24.+fk*6.;
    float dx = (fract(p.x*n+fk*.37)-.5)/n;
    float dy = uv.y - yy + .006;
    float dd = length(vec2(dx, dy));
    float tw = .7+.3*sin(t*2.+fk*3.+floor(p.x*n)*1.7);
    col += vec3(1.,.8,.45)*(smoothstep(.0045,.0, dd) + .00018/(dd*dd+.00018)*.35)*tw;
  }
  // luces del recinto
  vec2 g = vec2(p.x*34., uv.y*34.);
  vec2 id = floor(g);
  float hh = hash(id);
  vec2 f = fract(g)-.5;
  float on = step(.86, hh) * step(uv.y, h1+.02) * step(h2-.05, uv.y);
  col += vec3(1.,.75,.4)*on*smoothstep(.22,.0,length(f))*(.5+.5*sin(t*1.5+hh*30.))*.8;
  vec2 dp = vec2(-.18 + .03*sin(t*.5), .66 + .012*sin(t*.8));
  col = drone(col, p, dp, .12*clamp(a,.6,1.), t, vec3(1.,.6,.5));
  return col;
}

vec3 sSea(vec2 uv, float a, float t, float l){ // 5 \xb7 Audiovisual (mar)
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  float hz = .40;
  vec3 col;
  if (uv.y > hz){
    float y = (uv.y-hz)/(1.-hz);
    col = skyGrad(y, vec3(.18,.42,.86), vec3(.50,.72,.96), vec3(.86,.93,1.));
    float c = fbm(vec2(p.x*1.6 + t*.025, y*3.)*vec2(1.,2.));
    col = mix(col, vec3(1.), smoothstep(.52,.85,c)*.7*(1.-y*.8));
  } else {
    float y = hz-uv.y;
    float depth = 1./(y+.04);
    col = mix(vec3(.30,.50,.72), vec3(.0,.10,.28), smoothstep(0.,.35,y));
    float w = noise(vec2(p.x*depth*.9 + t*.1, depth*2.4 - t*.3));
    float w2 = noise(vec2(p.x*depth*2.6 - t*.15, depth*6. - t*.7));
    col += vec3(.7,.85,1.)*pow(w*w2, 3.)*5.5;
    col = mix(col, vec3(.75,.85,.96), exp(-y*30.)*.7);
  }
  vec2 dp = vec2(.0 + .03*sin(t*.4), .56 + .02*sin(t*1.1));
  col = drone(col, p, dp, .22*clamp(a,.6,1.), t, vec3(.9,.95,1.));
  return col;
}

float tower(vec2 p, float x0, float base, float hgt, float w){
  float s = hgt;
  float d = 1e3;
  vec2 a = vec2(x0 - w, base), b = vec2(x0 + w, base);
  vec2 c = vec2(x0 - w*.25, base+s), e = vec2(x0 + w*.25, base+s);
  d = min(d, sdSeg(p, a, c)); d = min(d, sdSeg(p, b, e));
  for (int i = 0; i < 6; i++){
    float fi = float(i)/6., fj = float(i+1)/6.;
    vec2 l0 = mix(a, c, fi), r0 = mix(b, e, fi), l1 = mix(a, c, fj), r1 = mix(b, e, fj);
    d = min(d, sdSeg(p, l0, r1)); d = min(d, sdSeg(p, r0, l1));
    d = min(d, sdSeg(p, l1, r1));
  }
  // crucetas
  d = min(d, sdSeg(p, vec2(x0-w*1.4, base+s*.86), vec2(x0+w*1.4, base+s*.86)));
  d = min(d, sdSeg(p, vec2(x0-w*1.1, base+s*.70), vec2(x0+w*1.1, base+s*.70)));
  return d;
}
vec3 sInspect(vec2 uv, float a, float t, float l){ // 6 \xb7 Inspecci\xf3n
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  vec3 col = skyGrad(uv.y, vec3(.42,.52,.64), vec3(.80,.80,.80), vec3(.97,.90,.80));
  float c = fbm(vec2(p.x*1.2 + t*.02, uv.y*3.));
  col = mix(col, vec3(1.), smoothstep(.45,.8,c)*.35);
  float ridge = .22 + .05*fbm(vec2(p.x*2.4, 6.));
  col = mix(col, vec3(.26,.30,.28), smoothstep(.006,-.002,uv.y-ridge));
  float ridge2 = .14 + .04*fbm(vec2(p.x*3.4, 11.));
  col = mix(col, vec3(.12,.15,.14), smoothstep(.006,-.002,uv.y-ridge2));
  float shift = -l*.12;
  float dA = tower(p, -.62+shift, .14, .52, .055);
  float dB = tower(p, .12+shift, .14, .52, .055);
  float dC = tower(p, .86+shift, .14, .52, .055);
  float dd = min(dA, min(dB, dC));
  col = mix(col, vec3(.05,.06,.07), 1.-smoothstep(.0,.003,dd));
  // cables entre torres
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    float yy0 = .62 - fk*.045;
    float seg = (p.x - (-.62+shift)) / .74;
    float sag = -.07*4.*fract(seg)*(1.-fract(seg));
    float wire = smoothstep(.0025,.0, abs(uv.y - (yy0 + sag + .0)));
    col = mix(col, vec3(.05,.06,.07), wire*.8*step(-.62+shift, p.x)*step(p.x, .86+shift+.74));
  }
  vec2 dp = vec2(-.12 + .04*sin(t*.5), .60 + .012*sin(t*.9));
  // haz de escaneo
  float beam = smoothstep(.12, .0, abs(p.x - dp.x - .0) - (dp.y-uv.y)*.35)*step(uv.y,dp.y)*step(.0,dp.y-uv.y);
  col += vec3(.55,.8,1.)*beam*.12*(.6+.4*sin(t*3.));
  col = drone(col, p, dp, .12*clamp(a,.6,1.), t, vec3(.7,.85,1.));
  return col;
}

vec3 sField(vec2 uv, float a, float t, float l){ // 7 \xb7 Agricultura de precisi\xf3n
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  float hz = .42;
  vec3 col;
  float d = length((p - vec2(-.35, hz+.06))*vec2(1.,1.4));
  if (uv.y > hz){
    float y = (uv.y-hz)/(1.-hz);
    col = skyGrad(y, vec3(.12,.22,.40), vec3(.85,.62,.40), vec3(1.,.82,.50));
    col += vec3(1.,.8,.4)*.5/(1.+d*d*35.) + vec3(1.,.96,.8)*smoothstep(.045,.025,d);
  } else {
    float y = hz - uv.y;
    float z = 1./(y+.03);
    float xr = p.x*z;
    float row = smoothstep(.2,.8, abs(sin(xr*9. + l*3.)));
    vec3 g1 = vec3(.10,.20,.07), g2 = vec3(.38,.42,.14);
    col = mix(g1, g2, row*.8);
    col += vec3(1.,.7,.3)*.25*exp(-abs(p.x+.35)*2.)*exp(-y*3.);
    col *= .55 + .45*smoothstep(.0,.25,y);
    col = mix(col, vec3(.95,.72,.45), exp(-y*16.)*.85);
    float tex = noise(vec2(xr*40., z*6.));
    col *= .9 + .2*tex;
  }
  vec2 dp = vec2(.22 + .03*sin(t*.5), .56 + .014*sin(t*1.0));
  // niebla de tratamiento
  float mist = fbm(vec2((p.x-dp.x)*8., (uv.y-.40)*10. - t*.6));
  col = mix(col, vec3(.9,.95,.8), smoothstep(.5,.8,mist)*smoothstep(.2,.0,abs(p.x-dp.x)-.0)*step(uv.y,dp.y-.05)*step(.38,uv.y)*.35);
  col = drone(col, p, dp, .13*clamp(a,.6,1.), t, vec3(1.,.8,.5));
  return col;
}

vec3 sRunway(vec2 uv, float a, float t, float l){ // 8 \xb7 Cierre
  vec2 p = vec2((uv.x-.5)*a, uv.y);
  float hz = .44;
  vec3 col;
  float d = length((p - vec2(0., hz+.005))*vec2(1.,2.));
  if (uv.y > hz){
    float y = (uv.y-hz)/(1.-hz);
    col = skyGrad(y, vec3(.015,.03,.08), vec3(.10,.15,.30), vec3(.95,.55,.25));
    col += vec3(1.,.6,.3)*.45/(1.+d*d*40.);
  } else {
    float y = hz-uv.y;
    float z = 1./(y+.025);
    col = mix(vec3(.30,.16,.10), vec3(.02,.03,.06), smoothstep(0.,.2,y));
    col += vec3(1.,.55,.25)*.4*exp(-abs(p.x)*3.)*exp(-y*6.);
    float lane = smoothstep(.02,.0,abs(p.x*z)-.0)*.0;
    float dash = step(.5, fract(z*.35 - t*.5)) * smoothstep(.012,.0, abs(p.x) - .004*z*.2 - .001);
    col += vec3(1.,.85,.6)*dash*.35*exp(-y*3.);
    float side = smoothstep(.02,.0, abs(abs(p.x*z)-3.2)) * step(.5, fract(z*.5 - t*.3));
    col += vec3(1.,.8,.5)*side*.9*exp(-y*2.);
  }
  vec2 dp = vec2(.0, .58 - l*.06 + .01*sin(t));
  col = drone(col, p, dp, .09*clamp(a,.6,1.), t, vec3(1.,.7,.4));
  return col;
}

vec3 pick(int i, vec2 uv, float a, float t, float l){
  if (i <= 0) return sCoast(uv, a, t, l);
  if (i == 1) return sHangar(uv, a, t, l);
  if (i == 2) return sVoid(uv, a, t, l);
  if (i == 3) return sSunsetDrone(uv, a, t, l);
  if (i == 4) return sDusk(uv, a, t, l);
  if (i == 5) return sSea(uv, a, t, l);
  if (i == 6) return sInspect(uv, a, t, l);
  if (i == 7) return sField(uv, a, t, l);
  return sRunway(uv, a, t, l);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float a = u_res.x / u_res.y;
  float idx = floor(u_scene + .0001);
  float f = clamp(u_scene - idx, 0., 1.);
  float m = smoothstep(.84, 1., f);
  vec3 col = pick(int(idx), uv, a, u_time, f);
  if (m > .001) col = mix(col, pick(int(idx)+1, uv, a, u_time, 0.), m);
  // tono de cine: curva suave + vi\xf1eta
  col = col / (1. + col*.12);
  col = pow(col, vec3(.95));
  float v = length((uv-.5)*vec2(a*.6, 1.));
  col *= 1. - .35*smoothstep(.35, 1.0, v);
  gl_FragColor = vec4(col, 1.);
}
`;e.s(["World",0,class{mobile;canvas;gl;prog;uRes;uTime;uScene;scene;raf;running;visible;on;t0;scale;onVis;io;constructor(e,o){this.mobile=o,this.scene=0,this.raf=0,this.running=!1,this.visible=!0,this.on=!0,this.t0=performance.now(),this.onVis=()=>this.sync(),this.canvas=document.createElement("canvas"),this.canvas.setAttribute("aria-hidden","true"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",pointerEvents:"none"});let c=e.querySelector(".stage-shade");e.insertBefore(this.canvas,c);let s=this.canvas.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!s)throw Error("webgl");this.gl=s,this.scale=o?.55:.72;let a=(e,t)=>{let o=s.createShader(e);if(s.shaderSource(o,t),s.compileShader(o),!s.getShaderParameter(o,s.COMPILE_STATUS)){let e=s.getShaderInfoLog(o);throw s.deleteShader(o),Error("shader: "+e)}return o},l=s.createProgram();if(s.attachShader(l,a(s.VERTEX_SHADER,"attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }")),s.attachShader(l,a(s.FRAGMENT_SHADER,t)),s.linkProgram(l),!s.getProgramParameter(l,s.LINK_STATUS))throw Error("link: "+s.getProgramInfoLog(l));this.prog=l,s.useProgram(l);let v=s.createBuffer();s.bindBuffer(s.ARRAY_BUFFER,v),s.bufferData(s.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),s.STATIC_DRAW);let i=s.getAttribLocation(l,"a");s.enableVertexAttribArray(i),s.vertexAttribPointer(i,2,s.FLOAT,!1,0,0),this.uRes=s.getUniformLocation(l,"u_res"),this.uTime=s.getUniformLocation(l,"u_time"),this.uScene=s.getUniformLocation(l,"u_scene"),this.io=new IntersectionObserver(e=>{this.visible=e[0]?.isIntersecting??!0,this.sync()}),this.io.observe(e),document.addEventListener("visibilitychange",this.onVis)}resize(e,t){let o=Math.min(window.devicePixelRatio||1,1.5),c=Math.max(2,Math.round(e*this.scale*Math.min(o,1.25))),s=Math.max(2,Math.round(t*this.scale*Math.min(o,1.25)));(this.canvas.width!==c||this.canvas.height!==s)&&(this.canvas.width=c,this.canvas.height=s,this.gl.viewport(0,0,c,s)),this.frame()}setScene(e){this.scene=e}setActive(e){this.on!==e&&(this.on=e,this.canvas.style.opacity=e?"1":"0",this.sync())}sync(){let e=this.visible&&this.on&&!document.hidden;if(e&&!this.running){this.running=!0;let e=()=>{this.running&&(this.frame(),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}else!e&&this.running&&(this.running=!1,cancelAnimationFrame(this.raf))}frame(){let e=this.gl;e.uniform2f(this.uRes,this.canvas.width,this.canvas.height),e.uniform1f(this.uTime,(performance.now()-this.t0)/1e3),e.uniform1f(this.uScene,this.scene),e.drawArrays(e.TRIANGLES,0,3)}dispose(){this.running=!1,cancelAnimationFrame(this.raf),this.io.disconnect(),document.removeEventListener("visibilitychange",this.onVis),this.gl.getExtension("WEBGL_lose_context")?.loseContext(),this.canvas.remove()}}])}]);