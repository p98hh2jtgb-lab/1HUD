// TESTE FUNKSIONALE — SURVIVAL HUD v1.0
// I ngarkon app.js e vertete me stub-a te Angular/BeamNG dhe i teston te gjitha funksionet.
// Run: node tests/test.js

'use strict';

var fs = require('fs');
var path = require('path');

// ---------- stub-a ----------
var storage = {};
global.localStorage = {
  getItem: function(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
  setItem: function(k, v) { storage[k] = String(v); },
  removeItem: function(k) { delete storage[k]; }
};

global.window = {
  addEventListener: function() {}, removeEventListener: function() {},
  innerWidth: 1920, innerHeight: 1080
};

// setTimeout sinkron (persist eshte debounce)
global.setTimeout = function(fn) { fn(); return 0; };
global.clearTimeout = function() {};

// koha e rreme per tween
var realNow = Date.now.bind(Date);
var fakeNow = realNow();
Date.now = function() { return fakeNow; };
function advance(ms) { fakeNow += ms; }

var capturedFactory = null;
global.angular = {
  module: function() {
    return {
      directive: function(name, arr) { capturedFactory = arr; }
    };
  },
  extend: function(dst) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i] || {};
      Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
    }
    return dst;
  },
  forEach: function(obj, fn) {
    if (Array.isArray(obj)) { obj.forEach(function(v, i) { fn(v, i); }); }
    else if (obj) { Object.keys(obj).forEach(function(k) { fn(obj[k], k); }); }
  },
  isArray: Array.isArray
};

// $timeout stub me radhe
var timeouts = [];
function $timeout(fn, ms) { timeouts.push(fn); return timeouts.length - 1; }
$timeout.cancel = function(id) { if (timeouts[id]) timeouts[id] = null; };
function flush(max) {
  max = max || 200;
  var n = 0;
  while (timeouts.some(function(f) { return f; }) && n < max) {
    var batch = timeouts.filter(function(f) { return f; });
    timeouts = [];
    batch.forEach(function(f) { f(); });
    advance(40);
    n++;
  }
}

var handlers = {};
var watchers = [];
var $rootScope = {
  $on: function(name, fn) { handlers[name] = fn; return function() {}; },
  $broadcast: function(name, data) {
    if (handlers[name]) handlers[name]({}, data);
  }
};
var $document = { on: function() {}, off: function() {} };

// ---------- ngarko app.js ----------
var appPath = path.join(__dirname, '..', 'ui', 'modules', 'apps', 'SurvivalHUD', 'app.js');
eval(fs.readFileSync(appPath, 'utf8'));

if (typeof capturedFactory !== 'function' && !Array.isArray(capturedFactory)) {
  throw new Error('directive factory nuk u kap');
}
var factory = capturedFactory;
var factoryFn = Array.isArray(factory) ? factory[factory.length - 1] : factory;
var directiveDef = factoryFn($document, global.window, $timeout, $rootScope);
if (typeof directiveDef !== 'object' || typeof directiveDef.link !== 'function') {
  throw new Error('directive definition i pavlefshem');
}

// ---------- nderto scope ----------
function fresh() { delete storage['survivalhud_config_v1']; return makeScope(); }
function flushOneRound() {
  var batch = timeouts.filter(function(f) { return f; });
  timeouts = [];
  batch.forEach(function(f) { f(); });
  advance(40);
}
function makeScope() {
  var scope = {
    $watch: function(fn, cb) { watchers.push({ fn: fn, cb: cb }); return function() {}; },
    $on: function(name, fn) { handlers[name] = fn; return function() {}; },
    $applyAsync: function(fn) { if (fn) fn(); },
    $broadcast: $rootScope.$broadcast
  };
  var element = [{ addEventListener: function() {}, removeEventListener: function() {} }];
  directiveDef.link(scope, element);
  return scope;
}

// ---------- assertion helpers ----------
var passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ FAIL: ' + msg); }
}
function near(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, msg + ' (=' + a.toFixed(2) + ', pritet ~' + b + ')'); }
function fireWatchers() { watchers.forEach(function(w) { var v = w.fn(); if (v !== w.last) { var old = w.last; w.last = v; w.cb(v, old); } }); }
function cost(ratio, speed) { $rootScope.$broadcast('survivalhud.cost', { ratio: ratio, speedKmh: speed || 0 }); }

// =====================================================
console.log('\n[1] DEFAULTS & NORMALIZE');
var scope = makeScope();
ok(scope.cfg.on === true, 'on=true default');
ok(scope.cfg.glitch === 2, 'glitch=2 default');
ok(scope.cfg.formula === 'balanced', 'formula=balanced default');
ok(scope.cfg.accentColor === '#00e5ff', 'accent=#00e5ff default');
ok(scope.cfg.labelText === 'SURVIVAL CHANCE', 'labelText default');
ok(Array.isArray(scope.cfg.presets), 'presets array bosh');

// normalize me vlera te prishura
var bad = { glitch: 9, formula: 'xxx', displayMode: 'hmm', statusPosition: 'mid', emojiMode: 'up', deltaPosition: 'left', posX: null, size: NaN, labelText: '' };
storage['survivalhud_config_v1'] = JSON.stringify(bad);
var scope2 = makeScope();
ok(scope2.cfg.glitch === 2, 'normalize: glitch 9 -> 2');
ok(scope2.cfg.formula === 'balanced', 'normalize: formula xxx -> balanced');
ok(scope2.cfg.displayMode === 'always', 'normalize: displayMode -> always');
ok(scope2.cfg.statusPosition === 'bottom', 'normalize: statusPosition -> bottom');
ok(scope2.cfg.emojiMode === 'right', 'normalize: emojiMode -> right');
ok(scope2.cfg.deltaPosition === 'right', 'normalize: deltaPosition -> right');
ok(scope2.cfg.posX === 50 && scope2.cfg.size === 56, 'normalize: posX/size null/NaN -> default');
ok(scope2.cfg.labelText === 'SURVIVAL CHANCE', 'normalize: labelText bosh -> default');
delete storage['survivalhud_config_v1'];

// =====================================================
console.log('\n[2] MOTORI — TELEMETRIA');
var s = makeScope();
cost(0.30, 80);
flush();
ok(s.st.chance < 100, 'goditje 30% damage @80km/h e zbret chance nga 100 (=' + s.st.chance.toFixed(1) + ')');
ok(s.st.chance > 20, '...dhe mbetet mbi 20 (jo e jashtezakonshme)');
near(s.st.displayValue, s.st.chance, 2, 'displayValue tween-ohet deri ne chance');
ok(s.st.damageRatio === 0.30, 'damageRatio = 0.30');

var before = s.st.chance;
cost(0.10, 0);   // dëmi bie (makina u qetësua) — s'duhet të ngjise
ok(s.st.chance === before, 'chance NUK ngjitet kur dëmi bie (rregulli i run-it)');
ok(s.st.damageRatio === 0.30, 'damageRatio mbetet max (0.30)');

cost(0.31, 10);  // rritje e vogël me shpejtësi të ulët
ok(s.st.chance <= before, 'chance vetëm bie ose mbetet');

// TOTALLED
var s2 = makeScope();
cost(0.999, 200); flush();
ok(s2.st.chance === 0, 'ratio 0.999 = TOTALLED -> 0%');
ok(s2.statusText() === 'NO CHANCE', 'statusi NO CHANCE ne 0%');
ok(s2.emojiText() === '💀', 'emoji 💀 ne NO CHANCE');

// =====================================================
console.log('\n[3] STATUSI & EMOJI');
var s3 = makeScope();
[[95, 'SAFE', '😎'], [75, 'CAUTION', '😬'], [40, 'DANGER', '😰'], [15, 'CRITICAL', '😵'], [0, 'NO CHANCE', '💀']]
.forEach(function(t) {
  s3.st.displayValue = t[0];
  ok(s3.statusText() === t[1], t[0] + '% -> ' + t[1]);
  ok(s3.emojiText() === t[2], t[0] + '% -> ' + t[2]);
});

// threshold-et custom
var s3b = makeScope();
s3b.cfg.warningThreshold = 70; s3b.cfg.criticalThreshold = 35;
s3b.st.displayValue = 50;
ok(s3b.statusText() === 'DANGER', 'threshold custom: 50% -> DANGER (warn=70)');

// =====================================================
console.log('\n[4] FORMULAT');
function oneShot(formula, ratio, speed) {
  var x = makeScope();
  x.cfg.formula = formula;
  cost(ratio, speed); flush();
  return x.st.chance;
}
var forgiving = oneShot('forgiving', 0.4, 120);
var balanced  = oneShot('balanced', 0.4, 120);
var hardcore  = oneShot('hardcore', 0.4, 120);
ok(forgiving > balanced && balanced > hardcore,
   'forgiving(' + forgiving.toFixed(1) + ') > balanced(' + balanced.toFixed(1) + ') > hardcore(' + hardcore.toFixed(1) + ')');
var dmgOnly = oneShot('damageOnly', 0.05, 300);
var withImpact = oneShot('balanced', 0.05, 300);
ok(dmgOnly > withImpact, 'damageOnly e injoron shpejtesine (' + dmgOnly.toFixed(1) + ' > ' + withImpact.toFixed(1) + ')');

// pesha me 0
var s4 = makeScope();
s4.cfg.impactWeight = 0; s4.cfg.speedWeight = 0;
cost(0.05, 300); flush();
near(s4.st.chance, oneShot('damageOnly', 0.05, 0), 0.01, 'pesha 0 = damageOnly');

// minAlive
var s5 = makeScope();
s5.cfg.minAlive = 10;
cost(0.9, 250); flush();
ok(s5.st.chance >= 10, 'minAlive=10 e mban chance mbi 10 (=' + s5.st.chance.toFixed(1) + ')');

// =====================================================
console.log('\n[5] VEPRIMET');
var s6 = makeScope();
s6.toggleHud();
ok(s6.cfg.on === false, 'toggleHud() e fik');
ok(s6.hudVisible() === false, 'hudVisible()=false kur s\'on');
s6.toggleHud();
ok(s6.cfg.on === true, 'toggleHud() e ndez prapë');
ok(JSON.parse(storage['survivalhud_config_v1']).on === true, 'persist shkruan ne localStorage');

// reset run
s6.testHit(0.4); flush();
ok(s6.st.chance < 100, 'testHit e zbret chance');
s6.resetRun();
ok(s6.st.chance === 100 && s6.st.displayValue === 100 && s6.st.damageRatio === 0, 'resetRun() kthen 100% + damage 0');
ok(s6.hudVisible() === true, 'hudVisible pas reset');

// action nga bindings
var s7 = makeScope();
handlers['survivalhud.action']({}, { action: 'toggle' });
ok(s7.cfg.on === false, 'action toggle e fik HUD-in');
handlers['survivalhud.action']({}, { action: 'reset' });
ok(s7.st.chance === 100, 'action reset kthen 100');
handlers['survivalhud.action']({}, { action: 'panel' });
ok(s7.cfg.showPanel === false, 'action panel e mbyll panelin');

// visibility modes
var s8 = fresh();
s8.cfg.displayMode = 'danger'; s8.cfg.dangerShowAt = 55;
s8.st.displayValue = 80;
ok(s8.hudVisible() === false, 'danger mode: 80% > 55 -> e fshehur');
s8.st.displayValue = 40;
ok(s8.hudVisible() === true, 'danger mode: 40% <= 55 -> e dukshme');

var s8b = fresh();
s8b.cfg.displayMode = 'change'; s8b.st.visible = false;
ok(s8b.hudVisible() === false, 'change mode: e fshehur para ndryshimit');
cost(0.25, 60);
ok(s8b.hudVisible() === true, 'change mode: duket menjehere pas goditjes');
flush(200);
ok(s8b.hudVisible() === false, 'change mode: auto-hide pas ' + s8b.cfg.autoHideMs + 'ms');

// =====================================================
console.log('\n[6] KLAset & STILET');
var s9 = makeScope();
s9.cfg.glitch = 3; s9.cfg.brackets = false; s9.cfg.scanlines = false;
var cls = s9.hudClass();
ok(cls['glitch-3'] === true, 'hudClass: glitch-3');
ok(cls['no-brackets'] === true, 'hudClass: no-brackets');
ok(cls['no-scan'] === true, 'hudClass: no-scan');
ok(cls['edit-position'] === false, 'hudClass: edit-position off default');

var st9 = s9.hudStyle();
ok(st9.left === '50%' && st9.top === '11%', 'hudStyle: pozicioni %');
ok(st9.fontSize === '56px', 'hudStyle: madhesia px');
ok(st9['--acc'] === '#00e5ff', 'hudStyle: --acc accent');
ok(String(st9['--acc-soft']).indexOf('rgba(0,229,255,0.35)') === 0, 'hudStyle: --acc-soft rgba');

// numStyle me dynamic color
var s10 = makeScope();
s10.st.displayValue = 90;
ok(s10.numStyle().color === s10.cfg.valueColor, 'numStyle: 90% = ngjyra safe');
s10.st.displayValue = 10;
ok(s10.numStyle().color !== s10.cfg.valueColor, 'numStyle: 10% = ngjyra kritike (dyn)');
s10.cfg.dynamicColor = false;
ok(s10.numStyle().color === s10.cfg.valueColor, 'numStyle: dynamicColor off = gjithmonë safe');

// =====================================================
console.log('\n[7] DELTA & HIT');
var s11 = fresh();
s11.cfg.deltaMin = 1;
cost(0.25, 120);
ok(s11.st.deltaVisible === true, 'delta -X% dukshme menjehere pas goditjes');
ok(/^-[\d.]+%$/.test(s11.st.deltaText), 'deltaText format ok: ' + s11.st.deltaText);
ok(s11.st.hit === false, 'hit burst ne pritje (delay 10ms per rindezjen CSS)');
flushOneRound();
ok(s11.st.hit === true, 'hit burst aktiv pas goditjes');
flushOneRound();
ok(s11.st.hit === false, 'hit burst fiket pas animacionit');
ok(s11.st.deltaVisible === false, 'delta fshihet pas kohëzgjatjes');

// delta minimale nuk shfaqet
var s12 = fresh();
s12.cfg.deltaMin = 50;
cost(0.05, 30); flush();
ok(s12.st.deltaVisible === false, 'delta nën minimum nuk shfaqet');

// =====================================================
console.log('\n[8] PRESETS');
var s13 = makeScope();
s13.cfg.posX = 33; s13.cfg.size = 90; s13.cfg.accentColor = '#ff2d6f';
s13.presetName = 'Testi';
s13.savePreset();
ok(s13.cfg.presets.length === 1 && s13.cfg.presets[0].name === 'Testi', 'savePreset e ruan');
var s13b = makeScope();
s13b.cfg.posX = 50;
s13b.loadPreset(s13.cfg.presets[0]);
ok(s13b.cfg.posX === 33 && s13b.cfg.size === 90 && s13b.cfg.accentColor === '#ff2d6f', 'loadPrest e ngarkon të gjitha');
s13b.deletePreset(s13b.cfg.presets[0]);
ok(s13b.cfg.presets.length === 0, 'deletePreset e fshin');

// =====================================================
console.log('\n[9] EMOJI PULSE ($watch)');
var s14 = fresh();
s14.st.displayValue = 90;
fireWatchers();
s14.st.displayValue = 40;
fireWatchers();
flushOneRound();
ok(s14.st.emojiPulse === true, 'emojiPulse aktivizohet kur ndryshon statusi');
flushOneRound();
ok(s14.st.emojiPulse === false, 'emojiPulse fiket pas 520ms');

// =====================================================
console.log('\n[10] NGJYRAT (picker)');
var s15 = makeScope();
s15.togglePicker('accentColor', { stopPropagation: function() {} });
ok(s15.isPickerOpen('accentColor') === true, 'togglePicker hap');
s15.pickColor('accentColor', '#ff2d6f');
ok(s15.cfg.accentColor === '#ff2d6f' && s15.isPickerOpen('accentColor') === false, 'pickColor vendos + mbyll');
s15.cfg.accentColor__raw = '#00ffa3';
s15.setColorField('accentColor');
ok(s15.cfg.accentColor === '#00ffa3', 'setColorField pranon hex valid');
s15.cfg.accentColor__raw = 'gabim';
s15.cfg.accentColor = '#123456';
s15.setColorField('accentColor');
ok(s15.cfg.accentColor === '#123456', 'setColorField refuzon hex invalid');

// =====================================================
console.log('\n============================================');
console.log('REZULTATI: ' + passed + ' kaluan, ' + failed + ' deshtuan');
console.log('============================================');
process.exit(failed ? 1 : 0);
