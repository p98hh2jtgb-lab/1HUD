// SURVIVAL HUD v1.0 — CYBER
// Mod i pavarur: vetëm SURVIVAL CHANCE, pa rrethet e makinave.
// Motori i matjes është portuar nga HUD PRO v5.1 (dëmi strukturor + goditja).

angular.module('beamng.apps')

.directive('survivalhudPanel', ['$document', '$window', '$timeout', '$rootScope', function($document, $window, $timeout, $rootScope) {
  return {
    replace: true,
    restrict: 'EA',
    templateUrl: '/ui/modules/apps/SurvivalHUD/app.html',
    link: function(scope, element) {
      var STORAGE_KEY = 'survivalhud_config_v1';

      // =====================================================
      // DEFAULTS
      // =====================================================
      function defaults() {
        return {
          on: true,
          showPanel: true,
          miniButton: true,
          posX: 50,
          posY: 11,
          size: 56,
          editPosition: false,

          // cyber skin
          accentColor: '#00e5ff',
          brackets: true,
          scanlines: true,
          glitch: 2,              // 0=off 1=vetëm hit 2=+ambient 3=strong

          // teksti
          labelOn: true,
          labelText: 'SURVIVAL CHANCE',
          labelScale: 0.26,
          labelTracking: 0.42,
          showPercent: true,
          decimals: 0,
          footerOn: true,
          footerText: 'STRUCTURAL INTEGRITY // LIVE',

          // ngjyrat
          valueColor: '#eaffff',
          deltaColor: '#ff2d6f',
          dynamicColor: true,
          warningColor: '#ff7a2f',
          criticalColor: '#ff334d',
          warningThreshold: 55,
          criticalThreshold: 20,

          // statusi & emoji
          statusOn: true,
          statusSize: 0.24,
          statusSpacing: 0.30,
          statusPosition: 'bottom',
          statusPulse: true,
          emojiOn: true,
          emojiMode: 'right',
          emojiSize: 0.42,
          emojiPop: true,

          // efektet
          glow: 14,
          outline: 1,
          showDelta: true,
          deltaDuration: 850,
          deltaMin: 1,
          deltaPosition: 'right',
          deltaSize: 0.34,
          smoothTime: 340,
          lowPulse: false,
          displayMode: 'always',    // always | change | danger
          autoHideMs: 3000,
          dangerShowAt: 55,

          // formula
          sensitivity: 1.0,
          formula: 'balanced',      // forgiving | balanced | hardcore | damageOnly
          damageWeight: 1.0,
          impactWeight: 1.0,
          speedWeight: 1.0,
          minAlive: 1,

          // paneli & tastet
          panelX: 18,
          panelY: 90,
          toggleKey: 'v',
          resetKey: 'r',
          panelKey: 'h',

          presets: []
        };
      }

      function normalizeConfig(saved) {
        var cfg = angular.extend({}, defaults(), saved || {});
        var nums = ['posX','posY','size','glow','outline','warningThreshold','criticalThreshold','smoothTime',
                    'deltaDuration','deltaMin','deltaSize','autoHideMs','dangerShowAt','sensitivity',
                    'damageWeight','impactWeight','speedWeight','minAlive','labelScale','labelTracking',
                    'statusSize','statusSpacing','emojiSize','decimals','panelX','panelY'];
        for (var i = 0; i < nums.length; i++) {
          var k = nums[i];
          if (cfg[k] === undefined || cfg[k] === null || (typeof cfg[k] === 'number' && !isFinite(cfg[k]))) {
            cfg[k] = defaults()[k];
          }
        }
        if ([0,1,2,3].indexOf(cfg.glitch) < 0) cfg.glitch = 2;
        if (['always','change','danger'].indexOf(cfg.displayMode) < 0) cfg.displayMode = 'always';
        if (['forgiving','balanced','hardcore','damageOnly'].indexOf(cfg.formula) < 0) cfg.formula = 'balanced';
        if (['bottom','top'].indexOf(cfg.statusPosition) < 0) cfg.statusPosition = 'bottom';
        if (['right','left'].indexOf(cfg.emojiMode) < 0) cfg.emojiMode = 'right';
        if (['right','top','bottom'].indexOf(cfg.deltaPosition) < 0) cfg.deltaPosition = 'right';
        if (!cfg.labelText) cfg.labelText = 'SURVIVAL CHANCE';
        if (!cfg.footerText) cfg.footerText = 'STRUCTURAL INTEGRITY // LIVE';
        if (!cfg.accentColor) cfg.accentColor = '#00e5ff';
        if (!cfg.valueColor) cfg.valueColor = '#eaffff';
        if (!cfg.toggleKey) cfg.toggleKey = 'v';
        if (!cfg.resetKey) cfg.resetKey = 'r';
        if (!cfg.panelKey) cfg.panelKey = 'h';
        if (!angular.isArray(cfg.presets)) cfg.presets = [];
        return cfg;
      }

      function load() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return defaults();
          return normalizeConfig(JSON.parse(raw));
        } catch (e) {
          return defaults();
        }
      }

      scope.cfg = load();
      scope.tab = 'pamja';
      scope.presetName = '';
      scope.palette = ['#00e5ff','#00ffa3','#42ff68','#9dff3f','#ffde59','#ff9f1c','#ff7a2f','#ff5b5b',
                       '#ff2d6f','#ff334d','#ffffff','#eaffff','#b9ffd0','#a78bfa','#7aa2ff','#0a0f14',
                       '#14e5f2','#ffd9ae','#ffc2cc','#8fd8e6','#c8f0f8','#39d353','#f0b23a','#101820'];

      var persistTimer = null;
      scope.persist = function() {
        if (persistTimer) { try { clearTimeout(persistTimer); } catch (e) {} }
        persistTimer = setTimeout(function() {
          try {
            var clone = angular.extend({}, scope.cfg);
            delete clone.showPanel;      // paneli gjithmone hapet ne fillim te sesionit
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
          } catch (e) {}
        }, 120);
      };

      // =====================================================
      // GJENDJA E RUN-IT (nuk ruhet — secili run fillon 100%)
      // =====================================================
      scope.st = {
        damageRatio: 0,        // 0..1, vetëm rritet gjatë run-it
        chance: 100,           // përqindja reale
        displayValue: 100,     // vlera e animuar
        visible: true,
        deltaVisible: false,
        deltaText: '',
        hit: false,
        emojiPulse: false
      };

      var hitTimer = null, deltaTimer = null, hideTimer = null, tweenTimer = null, emojiTimer = null;

      // =====================================================
      // MOTORI (portuar nga HUD PRO v5.1)
      // =====================================================
      function computeTargetChance(currentRatio, deltaDamage, speedKmh) {
        var sensitivity = Math.max(0.65, Math.min(1.35, Number(scope.cfg.sensitivity) || 1));
        var formula = scope.cfg.formula || 'balanced';
        var formulaScale = formula === 'forgiving' ? 0.78 : (formula === 'hardcore' ? 1.28 : 1.0);
        var curveExp = formula === 'forgiving' ? 0.92 : (formula === 'hardcore' ? 0.72 : 0.82);

        var damageWeight = Number(scope.cfg.damageWeight);  if (!isFinite(damageWeight)) damageWeight = 1;
        var impactWeight = Number(scope.cfg.impactWeight);  if (!isFinite(impactWeight)) impactWeight = 1;
        var speedWeight  = Number(scope.cfg.speedWeight);   if (!isFinite(speedWeight))  speedWeight = 1;
        damageWeight = Math.max(0, Math.min(2, damageWeight));
        impactWeight = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, impactWeight));
        speedWeight  = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, speedWeight));

        if (currentRatio >= 0.995) return 0;
        if (currentRatio < 0.0005) return 100;

        var structuralRisk = Math.pow(currentRatio, curveExp) * 100 * damageWeight;
        var speedFactor = 0.30 + Math.min(1, speedKmh / 160) * 0.45 * speedWeight;
        var impactRisk = deltaDamage * 100 * speedFactor * impactWeight;
        var target = 100 - (structuralRisk + impactRisk) * sensitivity * formulaScale;
        var minAlive = Math.max(1, Math.min(15, Number(scope.cfg.minAlive) || 1));
        return Math.max(minAlive, Math.min(99.9, target));
      }

      function onTelemetry(d) {
        if (!d) return;
        var ratio = Number(d.ratio);
        if (!isFinite(ratio)) ratio = 0;
        ratio = Math.max(0, Math.min(1, ratio));
        var speedKmh = Math.max(0, Number(d.speedKmh) || 0);

        var oldDamage = Math.max(0, Math.min(1, Number(scope.st.damageRatio) || 0));
        var newDamage = Math.max(oldDamage, ratio);
        scope.st.damageRatio = newDamage;
        var deltaDamage = Math.max(0, newDamage - oldDamage);

        var target = computeTargetChance(newDamage, deltaDamage, speedKmh);
        var oldChance = Math.max(0, Math.min(100, Number(scope.st.chance)));
        if (!isFinite(oldChance)) oldChance = 100;

        if (target < oldChance) {
          scope.st.chance = target;
          animateDisplay(target);
          showHit();
          if (scope.cfg.showDelta !== false && (oldChance - target) >= (Number(scope.cfg.deltaMin) || 1)) {
            showDelta(oldChance - target);
          }
        }

        if ((scope.cfg.displayMode || 'always') === 'change') {
          scope.st.visible = true;
          if (hideTimer) { try { $timeout.cancel(hideTimer); } catch (e) {} }
          hideTimer = $timeout(function() { scope.st.visible = false; }, Math.max(500, Number(scope.cfg.autoHideMs) || 3000));
        }
        scope.$applyAsync();
      }

      // tween 30fps i numrit
      function animateDisplay(target) {
        target = Math.max(0, Math.min(100, Number(target)));
        if (!isFinite(target)) target = 100;
        var start = Number(scope.st.displayValue);
        if (!isFinite(start)) start = target;
        if (tweenTimer) { try { $timeout.cancel(tweenTimer); } catch (e) {} }
        var duration = Math.max(120, Math.min(900, Number(scope.cfg.smoothTime) || 340));
        var began = Date.now();
        function frame() {
          var t = Math.min(1, (Date.now() - began) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          scope.st.displayValue = start + (target - start) * eased;
          if (t < 1) {
            tweenTimer = $timeout(frame, 33);
          } else {
            scope.st.displayValue = target;
          }
        }
        frame();
      }

      function showHit() {
        scope.st.hit = false;
        $timeout(function() {
          scope.st.hit = true;
          if (hitTimer) { try { $timeout.cancel(hitTimer); } catch (e) {} }
          hitTimer = $timeout(function() { scope.st.hit = false; }, 460);
        }, 10);
      }

      function showDelta(drop) {
        drop = Math.max(0, Number(drop) || 0);
        scope.st.deltaText = '-' + (drop >= 10 ? drop.toFixed(0) : drop.toFixed(1)).replace(/\.0$/, '') + '%';
        scope.st.deltaVisible = true;
        if (deltaTimer) { try { $timeout.cancel(deltaTimer); } catch (e) {} }
        deltaTimer = $timeout(function() { scope.st.deltaVisible = false; },
                              Math.max(300, Number(scope.cfg.deltaDuration) || 850));
      }

      // =====================================================
      // LUA ENGINE
      // =====================================================
      function engineLua(cmd) {
        try {
          if (window.bngApi && typeof window.bngApi.engineLua === 'function') {
            window.bngApi.engineLua(cmd); return true;
          }
          if (window.bngApi && typeof window.bngApi.engineLuaAsync === 'function') {
            window.bngApi.engineLuaAsync(cmd); return true;
          }
        } catch (e) {}
        return false;
      }
      function bootEngine() { engineLua("extensions.load('survivalhud')"); }

      // =====================================================
      // VLERAT E EKRANIT
      // =====================================================
      scope.numText = function() {
        var decimals = Math.max(0, Math.min(1, Number(scope.cfg.decimals) || 0));
        return scope.st.displayValue.toFixed(decimals);
      };

      scope.visualValue = function() {
        var v = Number(scope.st.displayValue);
        return isFinite(v) ? Math.max(0, Math.min(100, v)) : 100;
      };

      scope.statusText = function() {
        var v = scope.visualValue();
        if (v <= 0) return 'NO CHANCE';
        if (v <= Number(scope.cfg.criticalThreshold || 20)) return 'CRITICAL';
        if (v <= Number(scope.cfg.warningThreshold || 55)) return 'DANGER';
        if (v <= 80) return 'CAUTION';
        return 'SAFE';
      };

      scope.emojiText = function() {
        var s = scope.statusText();
        if (s === 'SAFE') return '😎';
        if (s === 'CAUTION') return '😬';
        if (s === 'DANGER') return '😰';
        if (s === 'CRITICAL') return '😵';
        return '💀';
      };

      function hexToRgb(hex) {
        var h = String(hex || '#000000').replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var n = parseInt(h, 16); if (!isFinite(n)) n = 0;
        return [(n>>16)&255, (n>>8)&255, n&255];
      }
      function hexToRgba(hex, a) {
        var c = hexToRgb(hex);
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
      }
      function mixHex(a, b, t) {
        var x = hexToRgb(a), y = hexToRgb(b);
        t = Math.max(0, Math.min(1, Number(t) || 0));
        var out = [];
        for (var i = 0; i < 3; i++) out.push(Math.round(x[i] + (y[i] - x[i]) * t));
        return '#' + out.map(function(v) { return ('0' + v.toString(16)).slice(-2); }).join('');
      }

      scope.valueColorNow = function() {
        var v = scope.visualValue();
        var safe = scope.cfg.valueColor || '#eaffff';
        if (!scope.cfg.dynamicColor) return safe;
        var critical = Math.max(1, Math.min(100, Number(scope.cfg.criticalThreshold) || 20));
        var warning = Math.max(critical + 1, Math.min(100, Number(scope.cfg.warningThreshold) || 55));
        var warningColor = scope.cfg.warningColor || '#ff7a2f';
        var criticalColor = scope.cfg.criticalColor || '#ff334d';
        if (v > warning) return safe;
        if (v > critical) return mixHex(safe, warningColor, (warning - v) / Math.max(1, warning - critical));
        return mixHex(warningColor, criticalColor, (critical - v) / Math.max(1, critical));
      };

      // =====================================================
      // KLASET & STILET
      // =====================================================
      scope.hudVisible = function() {
        if (!scope.cfg.on) return false;
        if (scope.cfg.editPosition) return true;
        var mode = scope.cfg.displayMode || 'always';
        if (mode === 'change') return scope.st.visible !== false;
        if (mode === 'danger') return scope.visualValue() <= Number(scope.cfg.dangerShowAt || 55);
        return true;
      };

      scope.hudClass = function() {
        var g = Math.max(0, Math.min(3, Number(scope.cfg.glitch) || 0));
        return {
          'edit-position': scope.cfg.editPosition === true,
          'no-brackets': scope.cfg.brackets === false,
          'no-scan': scope.cfg.scanlines === false,
          'no-footer': scope.cfg.footerOn === false,
          'glitch-2': g === 2,
          'glitch-3': g === 3,
          'hit': scope.st.hit === true,
          'delta-top': scope.cfg.deltaPosition === 'top',
          'delta-bottom': scope.cfg.deltaPosition === 'bottom',
          'status-top': scope.cfg.statusPosition === 'top',
          'status-pulse': scope.cfg.statusPulse !== false && scope.st.hit === true,
          'low-pulse': scope.cfg.lowPulse !== false && scope.visualValue() <= Number(scope.cfg.criticalThreshold || 20)
        };
      };

      scope.hudStyle = function() {
        var acc = scope.cfg.accentColor || '#00e5ff';
        var glow = Math.max(0, Math.min(40, Number(scope.cfg.glow) || 0));
        var g = Math.max(0, Math.min(3, Number(scope.cfg.glitch) || 0));
        return {
          left: Math.max(0, Math.min(100, Number(scope.cfg.posX) || 0)) + '%',
          top: Math.max(0, Math.min(100, Number(scope.cfg.posY) || 0)) + '%',
          fontSize: Math.max(30, Math.min(130, Number(scope.cfg.size) || 56)) + 'px',
          '--acc': acc,
          '--acc-soft': hexToRgba(acc, 0.35),
          '--glow': (glow / 100) + 'em',
          '--g': (2 + g * 2),
          '--hitms': '440ms',
          '--dms': Math.max(300, Number(scope.cfg.deltaDuration) || 850) + 'ms'
        };
      };

      scope.labelStyle = function() {
        return {
          fontSize: Math.max(0.15, Math.min(0.6, Number(scope.cfg.labelScale) || 0.26)) + 'em',
          letterSpacing: Math.max(0.05, Math.min(0.7, Number(scope.cfg.labelTracking) || 0.42)) + 'em',
          textIndent: Math.max(0.05, Math.min(0.7, Number(scope.cfg.labelTracking) || 0.42)) + 'em'
        };
      };

      scope.numStyle = function() {
        var col = scope.valueColorNow();
        var glow = Math.max(0, Math.min(40, Number(scope.cfg.glow) || 0));
        var outline = Math.max(0, Number(scope.cfg.outline) || 0);
        return {
          color: col,
          textShadow: '0 4px 14px rgba(0,0,0,.75), 0 0 ' + (glow / 100) + 'em ' + col,
          WebkitTextStroke: outline + 'px rgba(0,0,0,.55)'
        };
      };

      scope.deltaStyle = function() {
        return {
          color: scope.cfg.deltaColor || '#ff2d6f',
          fontSize: Math.max(0.2, Math.min(1, Number(scope.cfg.deltaSize) || 0.34)) + 'em'
        };
      };

      scope.statusStyle = function() {
        return {
          fontSize: Math.max(0.12, Math.min(0.6, Number(scope.cfg.statusSize) || 0.24)) + 'em',
          letterSpacing: Math.max(0, Math.min(0.5, Number(scope.cfg.statusSpacing) || 0.3)) + 'em',
          textIndent: Math.max(0, Math.min(0.5, Number(scope.cfg.statusSpacing) || 0.3)) + 'em'
        };
      };

      scope.emojiStyle = function() {
        return { fontSize: Math.max(0.15, Math.min(1, Number(scope.cfg.emojiSize) || 0.42)) + 'em' };
      };

      scope.statusWrapClass = function() {
        return {
          'emoji-left': scope.cfg.emojiMode === 'left',
          'emoji-pop': scope.st.emojiPulse && scope.cfg.emojiPop !== false
        };
      };

      scope.panelStyle = function() {
        return {
          left: Math.max(0, Number(scope.cfg.panelX || 18)) + 'px',
          top: Math.max(0, Number(scope.cfg.panelY || 90)) + 'px'
        };
      };

      // =====================================================
      // VEPRIMET
      // =====================================================
      scope.toggleHud = function() {
        scope.cfg.on = !scope.cfg.on;
        if (scope.cfg.on) scope.st.visible = true;
        scope.persist();
      };

      scope.toggleEdit = function() {
        scope.cfg.editPosition = !scope.cfg.editPosition;
        scope.persist();
      };

      scope.resetRun = function() {
        scope.st.damageRatio = 0;
        scope.st.chance = 100;
        scope.st.displayValue = 100;
        scope.st.deltaVisible = false;
        scope.st.visible = true;
        if (tweenTimer) { try { $timeout.cancel(tweenTimer); } catch (e) {} }
        engineLua("if extensions.survivalhud and extensions.survivalhud.resetRun then extensions.survivalhud.resetRun() end");
        scope.$applyAsync();
      };

      scope.testHit = function(power) {
        $rootScope.$broadcast('survivalhud.cost', {
          ratio: Math.min(1, (Number(scope.st.damageRatio) || 0) + Number(power)),
          speedKmh: 40 + Math.round(Number(power) * 260)
        });
      };

      scope.openPanel = function() { scope.cfg.showPanel = true; scope.persist(); };
      scope.closePanel = function() { scope.cfg.showPanel = false; scope.persist(); };

      // drag i HUD-it
      scope.startDrag = function(evt) {
        if (!scope.cfg.editPosition || !evt) return;
        evt.preventDefault(); evt.stopPropagation();
        function move(ev) {
          scope.$applyAsync(function() {
            scope.cfg.posX = Math.max(0, Math.min(100, ev.clientX / Math.max(1, $window.innerWidth) * 100));
            scope.cfg.posY = Math.max(0, Math.min(100, ev.clientY / Math.max(1, $window.innerHeight) * 100));
          });
        }
        function up() {
          $document.off('mousemove', move);
          $document.off('mouseup', up);
          scope.persist();
        }
        $document.on('mousemove', move);
        $document.on('mouseup', up);
      };

      // =====================================================
      // NGJYRAT (picker)
      // =====================================================
      var openPicker = null;
      var onDocClickPicker = function() { openPicker = null; };
      scope.isPickerOpen = function(field) { return openPicker === field; };
      scope.togglePicker = function(field, $event) {
        if ($event) $event.stopPropagation();
        openPicker = (openPicker === field) ? null : field;
      };
      scope.pickColor = function(field, color) {
        scope.cfg[field] = color;
        scope.cfg[field + '__raw'] = color;
        openPicker = null;
        scope.persist();
      };
      scope.setColorField = function(field) {
        var raw = String(scope.cfg[field + '__raw'] || '').trim();
        if (/^#[0-9a-fA-F]{6}$/.test(raw) || /^#[0-9a-fA-F]{3}$/.test(raw)) {
          scope.cfg[field] = raw;
          scope.persist();
        }
      };
      $document.on('click', onDocClickPicker);

      // =====================================================
      // PRESETS
      // =====================================================
      var PRESET_FIELDS = ['posX','posY','size','accentColor','brackets','scanlines','glitch',
        'labelOn','labelText','labelScale','labelTracking','showPercent','decimals','footerOn','footerText',
        'valueColor','deltaColor','dynamicColor','warningColor','criticalColor','warningThreshold','criticalThreshold',
        'statusOn','statusSize','statusSpacing','statusPosition','statusPulse','emojiOn','emojiMode','emojiSize','emojiPop',
        'glow','outline','showDelta','deltaDuration','deltaMin','deltaPosition','deltaSize','smoothTime','lowPulse',
        'displayMode','autoHideMs','dangerShowAt','sensitivity','formula','damageWeight','impactWeight','speedWeight','minAlive',
        'toggleKey','resetKey','panelKey'];

      scope.savePreset = function() {
        var name = (scope.presetName || '').trim();
        if (!name) return;
        var data = {};
        angular.forEach(PRESET_FIELDS, function(k) { data[k] = scope.cfg[k]; });
        var existing = null;
        angular.forEach(scope.cfg.presets, function(p) { if (p.name === name) existing = p; });
        if (existing) { existing.data = data; existing.updatedAt = Date.now(); }
        else scope.cfg.presets.push({ name: name, data: data, updatedAt: Date.now() });
        scope.presetName = '';
        scope.persist();
      };
      scope.loadPreset = function(preset) {
        if (!preset || !preset.data) return;
        angular.forEach(preset.data, function(v, k) { scope.cfg[k] = v; });
        scope.persist();
      };
      scope.deletePreset = function(preset) {
        var i = scope.cfg.presets.indexOf(preset);
        if (i >= 0) scope.cfg.presets.splice(i, 1);
        scope.persist();
      };

      // =====================================================
      // EVENTS NGA LUA / DEMO
      // =====================================================
      var unsubCost = $rootScope.$on('survivalhud.cost', function(e, d) { onTelemetry(d); });

      var unsubAction = $rootScope.$on('survivalhud.action', function(e, data) {
        if (!data || !data.action) return;
        if (data.action === 'toggle') scope.toggleHud();
        else if (data.action === 'reset') scope.resetRun();
        else if (data.action === 'panel') { scope.cfg.showPanel = !scope.cfg.showPanel; scope.persist(); }
        scope.$applyAsync();
      });

      // emoji pulse kur ndryshon statusi
      var unwatchEmoji = scope.$watch(function() { return scope.statusText(); }, function(now, before) {
        if (!before || now === before || scope.cfg.emojiPop === false) return;
        scope.st.emojiPulse = false;
        $timeout(function() {
          scope.st.emojiPulse = true;
          if (emojiTimer) { try { $timeout.cancel(emojiTimer); } catch (e) {} }
          emojiTimer = $timeout(function() { scope.st.emojiPulse = false; }, 520);
        }, 10);
      });

      // =====================================================
      // HOTKEYS (V / R / H — te ndryshueshme)
      // =====================================================
      function isTypingTarget(target) {
        if (!target) return false;
        var tag = (target.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
      }
      function keyMatches(e, configured) {
        if (!configured) return false;
        var conf = String(configured).trim().toLowerCase();
        if (!conf) return false;
        var key = String(e.key || '').trim().toLowerCase();
        var code = String(e.code || '').trim().toLowerCase();
        var keyCode = e.keyCode || e.which;
        if (conf === key || conf === code) return true;
        if (conf.length === 1) {
          if (key === conf) return true;
          if (code === ('key' + conf)) return true;
          if (keyCode && String.fromCharCode(keyCode).toLowerCase() === conf) return true;
        }
        return false;
      }
      var lastStamp = 0;
      function hotkeyEntry(e) {
        var stamp = e.timeStamp || Date.now();
        if (stamp === lastStamp) return;
        lastStamp = stamp;
        if (!scope.cfg || scope.cfg.on === undefined) return;
        if (isTypingTarget(e.target)) return;
        var handled = false;
        if (keyMatches(e, scope.cfg.panelKey)) {
          scope.$applyAsync(function() { scope.cfg.showPanel = !scope.cfg.showPanel; scope.persist(); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.toggleKey)) {
          scope.$applyAsync(function() { scope.toggleHud(); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.resetKey)) {
          scope.$applyAsync(function() { scope.resetRun(); });
          handled = true;
        }
        if (handled) {
          try { e.preventDefault(); e.stopPropagation(); } catch (x) {}
          return false;
        }
      }
      var node = element && element[0] ? element[0] : null;
      $document.on('keydown', hotkeyEntry);
      try { $window.addEventListener('keydown', hotkeyEntry, true); } catch (e) {}
      try { if (node) node.addEventListener('keydown', hotkeyEntry, true); } catch (e) {}

      bootEngine();

      scope.$on('$destroy', function() {
        if (unsubCost) { try { unsubCost(); } catch (e) {} }
        if (unsubAction) { try { unsubAction(); } catch (e) {} }
        if (unwatchEmoji) { try { unwatchEmoji(); } catch (e) {} }
        $document.off('keydown', hotkeyEntry);
        $document.off('click', onDocClickPicker);
        try { $window.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        try { if (node) node.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        [hitTimer, deltaTimer, hideTimer, tweenTimer, emojiTimer].forEach(function(t) {
          if (t) { try { $timeout.cancel(t); } catch (e) {} }
        });
      });
    }
  };
}]);
