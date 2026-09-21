// TESTE FUNKSIONALE — SURVIVAL HUD v1.1
// HUD-i në ekran identik me v5.1; paneli i ri. Run: node tests/test.js

'use strict';

var fs = require('fs');
var path = require('path');

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

global.setTimeout = function(fn) { fn(); return 0; };
global.clearTimeout = function() {};

var realNow = Date.now.bind(Date);
var fakeNow = realNow();
Date.now = function() { return fakeNow; };
function advance(ms) { fakeNow += ms; }

var capturedFactory = null;
global.angular = {
  module: function() { return { directive: function(name, arr) { capturedFactory = arr; } }; },
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

var timeouts = [];
function $timeout(fn, ms) { timeouts.push(fn); return timeouts.length - 1; }
$timeout.cancel = function(id) { if (timeouts[id]) timeouts[id] = null; };
function flushOneRound() {
  var batch = timeouts.filter(function(f) { return f; });
  timeouts = [];
  batch.forEach(function(f) { f(); });
  advance(40);
}
function flush(max) {
  max = max || 200;
  var n = 0;
  while (timeouts.some(function(f) { return f; }) && n < max) { flushOneRound(); n++; }
}

var handlers = {};
var watchers = [];
var $rootScope = {
  $on: function(name, fn) { handlers[name] = fn; return function() {}; },
  $broadcast: function(name, data) { if (handlers[name]) handlers[name]({}, data); }
};
var $document = { on: function() {}, off: function() {} };

var appPath = path.join(__dirname, '..', 'ui', 'modules', 'apps', 'SurvivalHUD', 'app.js');
eval(fs.readFileSync(appPath, 'utf8'));

var factoryFn = Array.isArray(capturedFactory) ? capturedFactory[capturedFactory.length - 1] : capturedFactory;
var directiveDef = factoryFn($document, global.window, $timeout, $rootScope);
if (typeof directiveDef !== 'object' || typeof directiveDef.link !== 'function') {
  throw new Error('directive definition i pavlefshem');
}

function makeScope() {
  var scope = {
    $watch: function(fn, cb) { watchers.push({ fn: fn, cb: cb, last: undefined }); return function() {}; },
    $on: function(name, fn) { handlers[name] = fn; return function() {}; },
    $applyAsync: function(fn) { if (fn) fn(); },
    $broadcast: $rootScope.$broadcast
  };
  var element = [{ addEventListener: function() {}, removeEventListener: function() {} }];
  directiveDef.link(scope, element);
  return scope;
}
function fresh() { delete storage['survivalhud_config_v2']; return makeScope(); }

var passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ FAIL: ' + msg); }
}
function near(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, msg + ' (=' + a.toFixed(2) + ', pritet ~' + b + ')'); }
function fireWatchers() { watchers.forEach(function(w) { var v = w.fn(); if (v !== w.last) { var old = w.last; w.last = v; w.cb(v, old); } }); }
function cost(ratio, speed) { $rootScope.$broadcast('survivalhud.cost', { ratio: ratio, speedKmh: speed || 0 }); }

// =====================================================
console.log('\n[1] DEFAULTS & NORMALIZE — identike me v5.1');
var s = fresh();
ok(s.cfg.survivalOn === true, 'survivalOn=true');
ok(s.cfg.survivalValueColor === '#42ff68', 'valueColor=#42ff68 (jeshile si v5.1)');
ok(s.cfg.survivalDeltaColor === '#ff8a32', 'deltaColor=#ff8a32 (portokalli si v5.1)');
ok(s.cfg.survivalSize === 54 && s.cfg.survivalPosY === 8, 'size=54, posY=8 si v5.1');
ok(s.cfg.survivalLayout === 'inline' && s.cfg.survivalBackground === 'none', 'layout inline / bg none');
ok(s.cfg.survivalShowStatus === true && s.cfg.survivalEmojiOn === true && s.cfg.survivalEmojiSize === 0.34, 'status+emoji ON, 0.34 (v5.1 post-migrim)');
ok(s.cfg.survivalRollingCounter === false && s.cfg.survivalDeltaGhosts === false, 'rolling/ghost OFF (Smooth Pop si v5.1)');
ok(s.cfg.survivalFormula === 'balanced', 'formula=balanced');

var bad = { survivalLayout: 'x', survivalBackground: 'y', survivalDisplayMode: 'z', survivalFormula: 'w',
            survivalStatusPosition: 'mid', survivalEmojiMode: 'up', survivalDeltaPosition: 'left',
            survivalPosX: null, survivalSize: NaN, survivalFontWeight: '123', survivalLabelText: '' };
storage['survivalhud_config_v2'] = JSON.stringify(bad);
var s2 = makeScope();
ok(s2.cfg.survivalLayout === 'inline', 'normalize: layout -> inline');
ok(s2.cfg.survivalBackground === 'none', 'normalize: bg -> none');
ok(s2.cfg.survivalDisplayMode === 'always', 'normalize: displayMode -> always');
ok(s2.cfg.survivalFormula === 'balanced', 'normalize: formula -> balanced');
ok(s2.cfg.survivalStatusPosition === 'bottom' && s2.cfg.survivalEmojiMode === 'right' && s2.cfg.survivalDeltaPosition === 'right', 'normalize: pozicionet');
ok(s2.cfg.survivalPosX === 50 && s2.cfg.survivalSize === 54, 'normalize: null/NaN -> default');
ok(s2.cfg.survivalFontWeight === '900', 'normalize: fontWeight -> 900');
ok(s2.cfg.survivalLabelText === 'SURVIVAL CHANCE', 'normalize: labelText bosh -> default');

// =====================================================
console.log('\n[2] MOTORI — TELEMETRIA');
var s3 = fresh();
cost(0.30, 80); flush();
ok(s3.chance < 100, 'goditje 30% @80km/h e zbret chance (=' + s3.chance.toFixed(1) + ')');
near(s3.survival.displayValue, s3.chance, 2, 'displayValue tween deri ne chance');
ok(s3.damageRatio === 0.30, 'damageRatio = 0.30');
var before = s3.chance;
cost(0.10, 0);
ok(s3.chance === before, 'chance NUK ngjitet kur demi bie');
ok(s3.damageRatio === 0.30, 'damageRatio mbetet max');
var s4 = fresh();
cost(0.999, 200); flush();
ok(s4.chance === 0, 'TOTALLED -> 0%');
ok(s4.survivalStatus() === 'NO CHANCE', 'statusi NO CHANCE');
ok(s4.survivalEmojiText() === '💀', 'emoji 💀');

// =====================================================
console.log('\n[3] STATUSI & EMOJI (v5.1)');
var s5 = fresh();
[[95,'SAFE','😎'],[75,'CAUTION','😬'],[40,'DANGER','😰'],[15,'CRITICAL','😵'],[0,'NO CHANCE','💀']].forEach(function(t) {
  s5.survival.displayValue = t[0];
  ok(s5.survivalStatus() === t[1], t[0] + '% -> ' + t[1]);
  ok(s5.survivalEmojiText() === t[2], t[0] + '% -> ' + t[2]);
});
var s5b = fresh();
s5b.cfg.survivalWarningThreshold = 70; s5b.cfg.survivalCriticalThreshold = 35;
s5b.survival.displayValue = 50;
ok(s5b.survivalStatus() === 'DANGER', 'threshold custom: 50% -> DANGER');

// =====================================================
console.log('\n[4] FORMULAT');
function oneShot(formula, ratio, speed) {
  var x = fresh(); x.cfg.survivalFormula = formula;
  cost(ratio, speed); flush();
  return x.chance;
}
var forgiving = oneShot('forgiving', 0.4, 120);
var balanced  = oneShot('balanced', 0.4, 120);
var hardcore  = oneShot('hardcore', 0.4, 120);
ok(forgiving > balanced && balanced > hardcore,
   'forgiving(' + forgiving.toFixed(1) + ') > balanced(' + balanced.toFixed(1) + ') > hardcore(' + hardcore.toFixed(1) + ')');
ok(oneShot('damageOnly', 0.05, 300) > oneShot('balanced', 0.05, 300), 'damageOnly e injoron shpejtesine');
var s6 = fresh();
s6.cfg.survivalMinAlive = 10;
cost(0.9, 250); flush();
ok(s6.chance >= 10, 'minAlive=10 e mban mbi 10 (=' + s6.chance.toFixed(1) + ')');

// =====================================================
console.log('\n[5] VEPRIMET');
var s7 = fresh();
s7.toggleHud();
ok(s7.cfg.survivalOn === false && s7.survivalVisible() === false, 'toggleHud e fik');
s7.toggleHud();
ok(s7.cfg.survivalOn === true && s7.survivalVisible() === true, 'toggleHud e ndez');
ok(JSON.parse(storage['survivalhud_config_v2']).survivalOn === true, 'persist shkruan');
s7.testHit(0.4); flush();
ok(s7.chance < 100, 'testHit e zbret');
s7.resetRun();
ok(s7.chance === 100 && s7.survival.displayValue === 100 && s7.damageRatio === 0, 'resetRun kthen 100');

var s8 = fresh();
handlers['survivalhud.action']({}, { action: 'toggle' });
ok(s8.cfg.survivalOn === false, 'action toggle');
handlers['survivalhud.action']({}, { action: 'reset' });
ok(s8.chance === 100, 'action reset');
handlers['survivalhud.action']({}, { action: 'panel' });
ok(s8.cfg.survivalShowPanel === false, 'action panel');

var s9 = fresh();
s9.cfg.survivalDisplayMode = 'danger'; s9.cfg.survivalDangerShowAt = 55;
s9.chance = 80; s9.survival.displayValue = 80;
ok(s9.survivalVisible() === false, 'danger mode: 80% > 55 fshehur');
s9.chance = 40; s9.survival.displayValue = 40;
ok(s9.survivalVisible() === true, 'danger mode: 40% <= 55 dukshme');

var s10 = fresh();
s10.cfg.survivalDisplayMode = 'change'; s10.survival.visible = false;
ok(s10.survivalVisible() === false, 'change mode: fshehur para ndryshimit');
cost(0.25, 60);
ok(s10.survival.visible === true, 'change mode: duket pas goditjes');
flush(200);
ok(s10.survival.visible === false, 'change mode: auto-hide pas ' + s10.cfg.survivalAutoHideMs + 'ms');

// =====================================================
console.log('\n[6] KLAset & STILET (v5.1)');
var s11 = fresh();
s11.cfg.survivalLayout = 'stacked'; s11.cfg.survivalBackground = 'pill'; s11.cfg.survivalDeltaPosition = 'top';
var cls = s11.survivalClass();
ok(cls['layout-stacked'] === true, 'survivalClass: layout-stacked');
ok(cls['bg-pill'] === true, 'survivalClass: bg-pill');
ok(cls['delta-top'] === true, 'survivalClass: delta-top');
ok(cls['status-bottom'] === true, 'survivalClass: status-bottom default');
ok(cls['edit-position'] === false, 'survivalClass: edit-position off');

var st = s11.survivalStyle();
ok(st.left === '50%' && st.top === '8%', 'survivalStyle: 50%/8%');
ok(st.fontSize === '54px', 'survivalStyle: 54px');
ok(st.fontStyle === 'italic', 'survivalStyle: italic (si v5.1)');
s11.cfg.survivalBackground = 'none';
ok(s11.survivalStyle().backgroundColor === 'transparent', 'survivalStyle: bg transparent kur none');
s11.cfg.survivalBackground = 'pill';
s11.cfg.survivalBackground = 'card';
ok(String(s11.survivalStyle().backgroundColor).indexOf('rgba(7,16,22,0.55)') === 0, 'survivalStyle: bg card rgba');
s11.cfg.survivalItalic = false;
ok(s11.survivalStyle().fontStyle === 'normal', 'survivalStyle: italic off -> normal');

// numri: jeshile -> portokalli -> kuqe (si v5.1)
var s12 = fresh();
s12.survival.displayValue = 90;
ok(s12.survivalColor() === '#42ff68', 'survivalColor: 90% jeshile e qarte');
s12.survival.displayValue = 35;
ok(s12.survivalColor() !== '#42ff68' && s12.survivalColor().charAt(0) === '#', 'survivalColor: 35% miks portokalli');
s12.survival.displayValue = 5;
var cLow = s12.survivalColor();
ok(cLow !== '#42ff68', 'survivalColor: 5% drejt kuqes (#' + cLow + ')');
s12.cfg.survivalDynamicColor = false;
ok(s12.survivalColor() === '#42ff68', 'survivalColor: dynamic off = gjithmone jeshile');

// valueStyle me glow si v5.1
var vs = s12.survivalValueStyle();
ok(String(vs.textShadow).indexOf('0 0 10px') > -1, 'survivalValueStyle: glow 10px default');
ok(vs.fontWeight === '900', 'survivalValueStyle: weight 900');

// meterStyle
s12.survival.displayValue = 63;
var ms = s12.survivalMeterStyle();
ok(ms.width === '63%', 'survivalMeterStyle: width 63%');

// labelStyle
var ls = s12.survivalLabelStyle();
ok(ls.color === '#ffffff' && ls.fontSize === '0.6em', 'survivalLabelStyle: bardhe 0.6em');

// deltaStyle me opacity/scale (per ghosts)
var ds = s12.survivalDeltaStyle(0.34, 0.86);
ok(ds.opacity === 0.34 && String(ds.transform).indexOf('0.86') > -1, 'survivalDeltaStyle: ghost .34/.86');

// =====================================================
console.log('\n[7] DELTA / PULSE / ROLLING (v5.1 sjellja)');
var s13 = fresh();
cost(0.25, 120);
ok(s13.survival.deltaVisible === false, 'delta ne pritje (delay 12ms si v5.1)');
flushOneRound();
ok(s13.survival.deltaVisible === true, 'delta -X% dukshme pas goditjes');
ok(/^-[\d.]+%$/.test(s13.survival.deltaText), 'deltaText format: ' + s13.survival.deltaText);
ok(s13.survival.pulse === true, 'pulse aktiv');
ok(s13.survival.oldValue === 100, 'oldValue=100 (vlera para goditjes)');
flushOneRound();
ok(s13.survival.rolling === false, 'rolling OFF me default (Smooth Pop)');
var s13b = fresh();
s13b.cfg.survivalRollingCounter = true;
cost(0.25, 120); flushOneRound();
ok(s13b.survival.rolling === true, 'rolling ON kur aktivizohet');
flushOneRound();
ok(s13b.survival.rolling === false, 'rolling fiket pas rollDuration');

var s14 = fresh();
s14.cfg.survivalDeltaMin = 50;
cost(0.05, 30); flush();
ok(s14.survival.deltaVisible === false, 'delta nen minimum nuk shfaqet');

// =====================================================
console.log('\n[8] PRESETS');
var s15 = fresh();
s15.cfg.survivalPosX = 33; s15.cfg.survivalSize = 90; s15.cfg.survivalValueColor = '#ff2d6f';
s15.presetName = 'Testi';
s15.savePreset();
ok(s15.cfg.presets.length === 1 && s15.cfg.presets[0].name === 'Testi', 'savePreset');
var s15b = fresh();
s15b.cfg.survivalPosX = 50;
s15b.loadPreset(s15.cfg.presets[0]);
ok(s15b.cfg.survivalPosX === 33 && s15b.cfg.survivalSize === 90 && s15b.cfg.survivalValueColor === '#ff2d6f', 'loadPreset i plote');
ok(s15b.cfg.survivalOn === true, 'loadPreset NUK e cek survivalOn (gjendja ruhet jashte)');
s15b.deletePreset(s15b.cfg.presets[0]);
ok(s15b.cfg.presets.length === 0, 'deletePreset');

// =====================================================
console.log('\n[9] EMOJI PULSE');
var s16 = fresh();
s16.survival.displayValue = 90;
fireWatchers();
s16.survival.displayValue = 40;
fireWatchers();
flushOneRound();
ok(s16.survival.emojiPulse === true, 'emojiPulse aktivizohet kur ndryshon statusi');
flushOneRound();
ok(s16.survival.emojiPulse === false, 'emojiPulse fiket pas 520ms');

// =====================================================
console.log('\n[10] NGJYRAT (picker)');
var s17 = fresh();
s17.togglePicker('survivalValueColor', { stopPropagation: function() {} });
ok(s17.isPickerOpen('survivalValueColor') === true, 'togglePicker hap');
s17.pickColor('survivalValueColor', '#ff2d6f');
ok(s17.cfg.survivalValueColor === '#ff2d6f' && s17.isPickerOpen('survivalValueColor') === false, 'pickColor vendos + mbyll');
s17.cfg.survivalValueColor__raw = '#00ffa3';
s17.setColorField('survivalValueColor');
ok(s17.cfg.survivalValueColor === '#00ffa3', 'setColorField pranon hex valid');
s17.cfg.survivalValueColor__raw = 'gabim';
s17.cfg.survivalValueColor = '#123456';
s17.setColorField('survivalValueColor');
ok(s17.cfg.survivalValueColor === '#123456', 'setColorField refuzon hex invalid');

console.log('\n============================================');
console.log('REZULTATI: ' + passed + ' kaluan, ' + failed + ' deshtuan');
console.log('============================================');
process.exit(failed ? 1 : 0);
