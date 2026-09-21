// SURVIVAL HUD v1.1
// HUD-i në ekran është IDENTIK me HUD PRO v5.1 (shkronja, emoji, animacione — të paprekura).
// Vetëm paneli i opsioneve është i ri (graphite + i bardhë, ngjyra koherente).

angular.module('beamng.apps')

.directive('survivalhudPanel', ['$document', '$window', '$timeout', '$rootScope', function($document, $window, $timeout, $rootScope) {
  return {
    replace: true,
    restrict: 'EA',
    templateUrl: '/ui/modules/apps/SurvivalHUD/app.html',
    link: function(scope, element) {
      var STORAGE_KEY = 'survivalhud_config_v2';

      // =====================================================
      // DEFAULTS — të njëjta me HUD PRO v5.1 (post-migrim)
      // =====================================================
      function defaults() {
        return {
          survivalOn: true,
          survivalShowPanel: true,
          miniButton: true,
          survivalEditPosition: false,
          survivalPosX: 50,
          survivalPosY: 8,
          survivalSize: 54,
          survivalSensitivity: 1.0,
          survivalLabelText: 'SURVIVAL CHANCE',
          survivalLabelColor: '#ffffff',
          survivalValueColor: '#42ff68',
          survivalDeltaColor: '#ff8a32',
          survivalWarningColor: '#ff7a2f',
          survivalCriticalColor: '#ff334d',
          survivalDynamicColor: true,
          survivalWarningThreshold: 55,
          survivalCriticalThreshold: 20,
          survivalLayout: 'inline',
          survivalBackground: 'none',
          survivalBackgroundColor: '#071016',
          survivalBackgroundOpacity: 0.55,
          survivalShowLabel: true,
          survivalShowStatus: true,
          survivalStatusSize: 0.28,
          survivalStatusSpacing: 0.16,
          survivalStatusWeight: '900',
          survivalStatusPosition: 'bottom',
          survivalStatusPulse: true,
          survivalEmojiOn: true,
          survivalEmojiMode: 'right',
          survivalEmojiSize: 0.34,
          survivalEmojiPop: true,
          survivalShowMeter: false,
          survivalShowPercent: true,
          survivalLabelScale: 0.60,
          survivalFontWeight: '900',
          survivalItalic: true,
          survivalOutline: 1,
          survivalGlow: 10,
          survivalDecimals: 0,
          survivalShowDelta: true,
          survivalDeltaDuration: 850,
          survivalDeltaMin: 1,
          survivalDeltaPosition: 'right',
          survivalDeltaSize: 0.42,
          survivalDeltaGhosts: false,
          survivalRollingCounter: false,
          survivalRollDuration: 430,
          survivalSmoothTime: 340,
          survivalImpactShake: false,
          survivalLowPulse: false,
          survivalDisplayMode: 'always',
          survivalAutoHideMs: 3000,
          survivalDangerShowAt: 55,
          survivalFormula: 'balanced',
          survivalDamageWeight: 1.0,
          survivalImpactWeight: 1.0,
          survivalSpeedWeight: 1.0,
          survivalMinAlive: 1,
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
        var d = defaults();
        var nums = { survivalPosX:1, survivalPosY:1, survivalSize:1, survivalSensitivity:1, survivalWarningThreshold:1,
                     survivalCriticalThreshold:1, survivalBackgroundOpacity:1, survivalStatusSize:1, survivalStatusSpacing:1,
                     survivalEmojiSize:1, survivalLabelScale:1, survivalOutline:1, survivalGlow:1, survivalDecimals:1,
                     survivalDeltaDuration:1, survivalDeltaMin:1, survivalDeltaSize:1, survivalRollDuration:1,
                     survivalSmoothTime:1, survivalAutoHideMs:1, survivalDangerShowAt:1, survivalDamageWeight:1,
                     survivalImpactWeight:1, survivalSpeedWeight:1, survivalMinAlive:1, panelX:1, panelY:1 };
        angular.forEach(nums, function(_, k) {
          if (cfg[k] === undefined || cfg[k] === null || (typeof cfg[k] === 'number' && !isFinite(cfg[k]))) cfg[k] = d[k];
        });
        if (['inline','stacked','compact'].indexOf(cfg.survivalLayout) < 0) cfg.survivalLayout = 'inline';
        if (['none','pill','card'].indexOf(cfg.survivalBackground) < 0) cfg.survivalBackground = 'none';
        if (['always','change','danger'].indexOf(cfg.survivalDisplayMode) < 0) cfg.survivalDisplayMode = 'always';
        if (['forgiving','balanced','hardcore','damageOnly'].indexOf(cfg.survivalFormula) < 0) cfg.survivalFormula = 'balanced';
        if (['bottom','top'].indexOf(cfg.survivalStatusPosition) < 0) cfg.survivalStatusPosition = 'bottom';
        if (['right','left'].indexOf(cfg.survivalEmojiMode) < 0) cfg.survivalEmojiMode = 'right';
        if (['right','top','bottom'].indexOf(cfg.survivalDeltaPosition) < 0) cfg.survivalDeltaPosition = 'right';
        if (['700','800','900'].indexOf(String(cfg.survivalFontWeight)) < 0) cfg.survivalFontWeight = '900';
        if (!cfg.survivalLabelText) cfg.survivalLabelText = 'SURVIVAL CHANCE';
        if (!cfg.survivalLabelColor) cfg.survivalLabelColor = '#ffffff';
        if (!cfg.survivalValueColor) cfg.survivalValueColor = '#42ff68';
        if (!cfg.survivalDeltaColor) cfg.survivalDeltaColor = '#ff8a32';
        if (!cfg.survivalWarningColor) cfg.survivalWarningColor = '#ff7a2f';
        if (!cfg.survivalCriticalColor) cfg.survivalCriticalColor = '#ff334d';
        if (!cfg.survivalBackgroundColor) cfg.survivalBackgroundColor = '#071016';
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
      scope.palette = ['#ffffff','#eaffff','#42ff68','#9dff3f','#ffde59','#ff9f1c','#ff7a2f','#ff5b5b',
                       '#ff334d','#ff2d6f','#00e5ff','#14e5f2','#00ffa3','#7aa2ff','#a78bfa','#0a0f14',
                       '#101820','#8fd8e6','#c8f0f8','#39d353','#f0b23a','#ffd9ae','#ffc2cc','#b9ffd0'];

      var persistTimer = null;
      scope.persist = function() {
        if (persistTimer) { try { clearTimeout(persistTimer); } catch (e) {} }
        persistTimer = setTimeout(function() {
          try {
            var clone = angular.extend({}, scope.cfg);
            delete clone.survivalShowPanel;   // paneli hapet gjithmonë në fillim të sesionit
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
          } catch (e) {}
        }, 120);
      };

      // =====================================================
      // GJENDJA E RUN-IT (nuk ruhet — secili run fillon 100%)
      // =====================================================
      scope.chance = 100;
      scope.damageRatio = 0;

      // v4.3 survival animation state (identike me v5.1)
      scope.survival = { pulse:false, shake:false, rolling:false, emojiPulse:false, oldValue:100, displayValue:100, visible:true, deltaVisible:false, deltaText:'' };
      var survivalPulseTimer = null;
      var survivalDeltaTimer = null;
      var survivalHideTimer = null;
      var survivalShakeTimer = null;
      var survivalRollTimer = null;
      var survivalTweenTimer = null;
      var survivalEmojiTimer = null;
      var unwatchSurvivalEmoji = null;

      // Lightweight 30 FPS number tween (v5.1 i paprekur)
      function animateSurvivalDisplay(target) {
        target = Math.max(0, Math.min(100, Number(target)));
        if (!isFinite(target)) target = 100;
        var start = Number(scope.survival.displayValue);
        if (!isFinite(start)) start = target;
        if (survivalTweenTimer) { try { $timeout.cancel(survivalTweenTimer); } catch(e) {} }
        var duration = Math.max(120, Math.min(900, Number(scope.cfg.survivalSmoothTime) || 340));
        var began = Date.now();
        function frame() {
          var t = Math.min(1, (Date.now() - began) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          scope.survival.displayValue = start + (target - start) * eased;
          if (t < 1) survivalTweenTimer = $timeout(frame, 33);
          else { scope.survival.displayValue = target; survivalTweenTimer = null; }
        }
        frame();
      }

      // v5.1 i paprekur
      function showSurvivalDelta(drop, oldValue) {
        var decimals = Math.max(0, Math.min(1, Number(scope.cfg.survivalDecimals) || 0));
        drop = Math.max(0, Number(drop) || 0);
        var minDrop = Math.max(0.1, Number(scope.cfg.survivalDeltaMin) || 1);
        scope.survival.visible = true;

        if (survivalPulseTimer) { try { $timeout.cancel(survivalPulseTimer); } catch(e) {} }
        if (survivalDeltaTimer) { try { $timeout.cancel(survivalDeltaTimer); } catch(e) {} }
        if (survivalHideTimer) { try { $timeout.cancel(survivalHideTimer); } catch(e) {} }
        if (survivalShakeTimer) { try { $timeout.cancel(survivalShakeTimer); } catch(e) {} }

        scope.survival.pulse = false;
        scope.survival.shake = false;
        scope.survival.rolling = false;
        scope.survival.deltaVisible = false;
        if (survivalRollTimer) { try { $timeout.cancel(survivalRollTimer); } catch(e) {} }
        scope.survival.oldValue = isFinite(Number(oldValue)) ? Number(oldValue) : (scope.survivalRawValue() + drop);

        $timeout(function() {
          scope.survival.deltaText = '-' + drop.toFixed(decimals) + '%';
          scope.survival.pulse = true;
          scope.survival.rolling = scope.cfg.survivalRollingCounter !== false;
          scope.survival.shake = scope.cfg.survivalImpactShake !== false && drop >= minDrop;
          scope.survival.deltaVisible = scope.cfg.survivalShowDelta !== false && drop >= minDrop;
          survivalPulseTimer = $timeout(function() { scope.survival.pulse = false; }, 370);
          survivalRollTimer = $timeout(function() { scope.survival.rolling = false; }, Math.max(220, Number(scope.cfg.survivalRollDuration) || 430));
          survivalShakeTimer = $timeout(function() { scope.survival.shake = false; }, 430);
          survivalDeltaTimer = $timeout(function() { scope.survival.deltaVisible = false; },
            Math.max(300, Number(scope.cfg.survivalDeltaDuration) || 850));
        }, 12);

        if (scope.cfg.survivalDisplayMode === 'change') {
          survivalHideTimer = $timeout(function() { scope.survival.visible = false; },
            Math.max(500, Number(scope.cfg.survivalAutoHideMs) || 3000));
        }
      }

      // =====================================================
      // MOTORI (portuar nga HUD PRO v5.1)
      // =====================================================
      function computeTargetChance(currentRatio, deltaDamage, speedKmh) {
        var sensitivity = Math.max(0.65, Math.min(1.35, Number(scope.cfg.survivalSensitivity) || 1));
        var formula = scope.cfg.survivalFormula || 'balanced';
        var formulaScale = formula === 'forgiving' ? 0.78 : (formula === 'hardcore' ? 1.28 : 1.0);
        var curveExp = formula === 'forgiving' ? 0.92 : (formula === 'hardcore' ? 0.72 : 0.82);

        var damageWeight = Number(scope.cfg.survivalDamageWeight);  if (!isFinite(damageWeight)) damageWeight = 1;
        var impactWeight = Number(scope.cfg.survivalImpactWeight);  if (!isFinite(impactWeight)) impactWeight = 1;
        var speedWeight  = Number(scope.cfg.survivalSpeedWeight);   if (!isFinite(speedWeight))  speedWeight = 1;
        damageWeight = Math.max(0, Math.min(2, damageWeight));
        impactWeight = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, impactWeight));
        speedWeight  = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, speedWeight));

        if (currentRatio >= 0.995) return 0;
        if (currentRatio < 0.0005) return 100;

        var structuralRisk = Math.pow(currentRatio, curveExp) * 100 * damageWeight;
        var speedFactor = 0.30 + Math.min(1, speedKmh / 160) * 0.45 * speedWeight;
        var impactRisk = deltaDamage * 100 * speedFactor * impactWeight;
        var target = 100 - (structuralRisk + impactRisk) * sensitivity * formulaScale;
        var minAlive = Math.max(1, Math.min(15, Number(scope.cfg.survivalMinAlive) || 1));
        return Math.max(minAlive, Math.min(99.9, target));
      }

      function onTelemetry(d) {
        if (!d) return;
        var ratio = Number(d.ratio);
        if (!isFinite(ratio)) ratio = 0;
        ratio = Math.max(0, Math.min(1, ratio));
        var speedKmh = Math.max(0, Number(d.speedKmh) || 0);

        var oldDamage = Math.max(0, Math.min(1, Number(scope.damageRatio) || 0));
        var newDamage = Math.max(oldDamage, ratio);
        scope.damageRatio = newDamage;
        var deltaDamage = Math.max(0, newDamage - oldDamage);

        var target = computeTargetChance(newDamage, deltaDamage, speedKmh);
        var oldChance = Math.max(0, Math.min(100, Number(scope.chance)));
        if (!isFinite(oldChance)) oldChance = 100;

        if (target < oldChance) {
          scope.chance = target;
          animateSurvivalDisplay(target);
          if (scope.cfg.survivalOn) showSurvivalDelta(oldChance - target, oldChance);
        }
        scope.$applyAsync();
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
      // VLERAT E EKRANIT (v5.1 të paprekura)
      // =====================================================
      scope.survivalRawValue = function() {
        var v = Number(scope.chance);
        return isFinite(v) ? Math.max(0, Math.min(100, v)) : 100;
      };

      scope.survivalVisualValue = function() {
        var v = Number(scope.survival.displayValue);
        return isFinite(v) ? Math.max(0, Math.min(100, v)) : scope.survivalRawValue();
      };

      scope.survivalValue = function() {
        var decimals = Math.max(0, Math.min(1, Number(scope.cfg.survivalDecimals) || 0));
        return scope.survivalVisualValue().toFixed(decimals);
      };

      scope.formatSurvivalValue = function(value) {
        var decimals = Math.max(0, Math.min(1, Number(scope.cfg.survivalDecimals) || 0));
        var v = Number(value); if (!isFinite(v)) v = 100;
        return Math.max(0, Math.min(100, v)).toFixed(decimals);
      };

      function hexToRgb(hex) {
        var h = String(hex || '#000000').replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var n = parseInt(h, 16); if (!isFinite(n)) n = 0;
        return [(n>>16)&255, (n>>8)&255, n&255];
      }
      function hexToRgba(hex, alpha) {
        var c = hexToRgb(hex);
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
      }
      function mixHex(a, b, t) {
        var x = hexToRgb(a), y = hexToRgb(b);
        t = Math.max(0, Math.min(1, Number(t) || 0));
        var out = [];
        for (var i = 0; i < 3; i++) out.push(Math.round(x[i] + (y[i] - x[i]) * t));
        return '#' + out.map(function(v) { return ('0' + v.toString(16)).slice(-2); }).join('');
      }

      scope.survivalColor = function() {
        var value = scope.survivalVisualValue();
        var safe = scope.cfg.survivalValueColor || '#42ff68';
        if (!scope.cfg.survivalDynamicColor) return safe;
        var critical = Math.max(1, Math.min(100, Number(scope.cfg.survivalCriticalThreshold) || 20));
        var warning = Math.max(critical + 1, Math.min(100, Number(scope.cfg.survivalWarningThreshold) || 55));
        var warningColor = scope.cfg.survivalWarningColor || '#ff7a2f';
        var criticalColor = scope.cfg.survivalCriticalColor || '#ff334d';
        if (value > warning) return safe; // SAFE/high chance stays vivid green
        if (value > critical) return mixHex(safe, warningColor, (warning - value) / Math.max(1, warning - critical));
        return mixHex(warningColor, criticalColor, (critical - value) / Math.max(1, critical));
      };

      scope.survivalStatus = function() {
        var v = scope.survivalVisualValue();
        if (v <= 0) return 'NO CHANCE';
        if (v <= Number(scope.cfg.survivalCriticalThreshold || 20)) return 'CRITICAL';
        if (v <= Number(scope.cfg.survivalWarningThreshold || 55)) return 'DANGER';
        if (v <= 80) return 'CAUTION';
        return 'SAFE';
      };

      scope.survivalEmojiText = function() {
        var status = scope.survivalStatus();
        if (status === 'SAFE') return '😎';
        if (status === 'CAUTION') return '😬';
        if (status === 'DANGER') return '😰';
        if (status === 'CRITICAL') return '😵';
        return '💀';
      };

      scope.survivalEmojiStyle = function() {
        var size = Math.max(.14, Math.min(1.10, Number(scope.cfg.survivalEmojiSize) || .34));
        return { fontSize:size+'em' };
      };

      scope.survivalEmojiClass = function() {
        return {
          'emoji-pop': scope.survival.emojiPulse && scope.cfg.survivalEmojiPop !== false,
          'emoji-left': scope.cfg.survivalEmojiMode === 'left',
          'emoji-right': scope.cfg.survivalEmojiMode === 'right'
        };
      };

      // Pop only when statusi ndryshon (v5.1)
      unwatchSurvivalEmoji = scope.$watch(function(){ return scope.survivalStatus(); }, function(now, before) {
        if (!before || now === before || scope.cfg.survivalEmojiPop === false) return;
        if (survivalEmojiTimer) { try { $timeout.cancel(survivalEmojiTimer); } catch(e) {} }
        scope.survival.emojiPulse = false;
        $timeout(function(){
          scope.survival.emojiPulse = true;
          survivalEmojiTimer = $timeout(function(){ scope.survival.emojiPulse = false; }, 520);
        }, 10);
      });

      scope.survivalVisible = function() {
        if (!scope.cfg.survivalOn) return false;
        if (scope.cfg.survivalEditPosition) return true;
        var mode = scope.cfg.survivalDisplayMode || 'always';
        if (mode === 'change') return scope.survival.visible !== false;
        if (mode === 'danger') return scope.survivalRawValue() <= Number(scope.cfg.survivalDangerShowAt || 55);
        return true;
      };

      scope.survivalClass = function() {
        var cls = {};
        cls['layout-' + (scope.cfg.survivalLayout || 'inline')] = true;
        cls['bg-' + (scope.cfg.survivalBackground || 'none')] = true;
        cls['delta-' + (scope.cfg.survivalDeltaPosition || 'right')] = true;
        cls['pulse'] = scope.survival.pulse;
        cls['rolling'] = scope.survival.rolling;
        cls['status-' + (scope.cfg.survivalStatusPosition || 'bottom')] = true;
        cls['status-pulse'] = scope.cfg.survivalStatusPulse !== false && scope.survival.pulse;
        cls['impact-shake'] = scope.survival.shake;
        cls['low-pulse'] = scope.cfg.survivalLowPulse !== false && scope.survivalRawValue() <= Number(scope.cfg.survivalCriticalThreshold || 20);
        cls['edit-position'] = scope.cfg.survivalEditPosition;
        return cls;
      };

      scope.survivalStyle = function() {
        var bg = hexToRgba(scope.cfg.survivalBackgroundColor || '#071016', Math.max(0, Math.min(0.95, Number(scope.cfg.survivalBackgroundOpacity) || 0)));
        return {
          left: Math.max(0, Math.min(100, Number(scope.cfg.survivalPosX) || 0)) + '%',
          top: Math.max(0, Math.min(100, Number(scope.cfg.survivalPosY) || 0)) + '%',
          fontSize: Math.max(28, Math.min(110, Number(scope.cfg.survivalSize) || 54)) + 'px',
          fontStyle: scope.cfg.survivalItalic === false ? 'normal' : 'italic',
          fontWeight: scope.cfg.survivalFontWeight || '900',
          color: scope.survivalColor(),
          backgroundColor: (scope.cfg.survivalBackground || 'none') === 'none' ? 'transparent' : bg
        };
      };

      scope.survivalLabelStyle = function() {
        return {
          color: scope.cfg.survivalLabelColor || '#ffffff',
          fontSize: Math.max(.3, Math.min(1, Number(scope.cfg.survivalLabelScale) || .6)) + 'em',
          WebkitTextStroke: Math.max(0, Number(scope.cfg.survivalOutline) || 0) + 'px rgba(0,0,0,.72)'
        };
      };

      scope.survivalValueStyle = function() {
        var col = scope.survivalColor();
        var glow = Math.max(0, Math.min(30, Number(scope.cfg.survivalGlow) || 0));
        return {
          color: col,
          fontWeight: scope.cfg.survivalFontWeight || '900',
          WebkitTextStroke: Math.max(0, Number(scope.cfg.survivalOutline) || 0) + 'px rgba(0,0,0,.60)',
          textShadow: '0 3px 3px rgba(0,0,0,.88),0 0 ' + glow + 'px ' + col,
          animationDuration: Math.max(220, Number(scope.cfg.survivalRollDuration) || 430) + 'ms'
        };
      };

      scope.survivalOldStyle = function() {
        return {
          color: scope.survivalColor(),
          animationDuration: Math.max(220, Number(scope.cfg.survivalRollDuration) || 430) + 'ms'
        };
      };

      scope.survivalStatusStyle = function() {
        return {
          color: scope.survivalColor(),
          fontSize: Math.max(.12, Math.min(.80, Number(scope.cfg.survivalStatusSize) || .28)) + 'em',
          letterSpacing: Math.max(0, Math.min(.45, Number(scope.cfg.survivalStatusSpacing) || 0)) + 'em',
          fontWeight: scope.cfg.survivalStatusWeight || '900'
        };
      };

      scope.survivalDeltaStyle = function(opacity, scale) {
        return {
          color: scope.cfg.survivalDeltaColor || '#ff8a32',
          fontSize: Math.max(.20, Math.min(1.10, Number(scope.cfg.survivalDeltaSize) || .42)) + 'em',
          opacity: opacity,
          transform: 'scale(' + (scale || 1) + ')',
          animationDuration: Math.max(300, Number(scope.cfg.survivalDeltaDuration) || 850) + 'ms'
        };
      };

      scope.survivalMeterStyle = function() {
        return { width: Math.max(0, Math.min(100, scope.survivalVisualValue())) + '%', background: scope.survivalColor() };
      };

      scope.startSurvivalDrag = function(evt) {
        if (!scope.cfg.survivalEditPosition || !evt) return;
        evt.preventDefault(); evt.stopPropagation();
        function move(ev) {
          scope.$applyAsync(function() {
            scope.cfg.survivalPosX = Math.max(0, Math.min(100, ev.clientX / Math.max(1, $window.innerWidth) * 100));
            scope.cfg.survivalPosY = Math.max(0, Math.min(100, ev.clientY / Math.max(1, $window.innerHeight) * 100));
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
        scope.cfg.survivalOn = !scope.cfg.survivalOn;
        if (scope.cfg.survivalOn) scope.survival.visible = true;
        scope.persist();
      };

      scope.toggleEdit = function() {
        scope.cfg.survivalEditPosition = !scope.cfg.survivalEditPosition;
        scope.persist();
      };

      scope.resetRun = function() {
        scope.damageRatio = 0;
        scope.chance = 100;
        scope.survival.displayValue = 100;
        scope.survival.deltaVisible = false;
        scope.survival.rolling = false;
        scope.survival.visible = true;
        if (survivalTweenTimer) { try { $timeout.cancel(survivalTweenTimer); } catch(e) {} }
        engineLua("if extensions.survivalhud and extensions.survivalhud.resetRun then extensions.survivalhud.resetRun() end");
        scope.$applyAsync();
      };

      scope.testHit = function(power) {
        onTelemetry({ ratio: Math.min(1, (Number(scope.damageRatio) || 0) + Number(power)), speedKmh: 40 + Math.round(Number(power) * 260) });
      };

      scope.openPanel = function() { scope.cfg.survivalShowPanel = true; scope.persist(); };
      scope.closePanel = function() { scope.cfg.survivalShowPanel = false; scope.persist(); };

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
      var PRESET_FIELDS = ['survivalPosX','survivalPosY','survivalSize','survivalSensitivity',
        'survivalLabelText','survivalLabelColor','survivalValueColor','survivalDeltaColor','survivalDynamicColor',
        'survivalWarningColor','survivalCriticalColor','survivalWarningThreshold','survivalCriticalThreshold',
        'survivalLayout','survivalBackground','survivalBackgroundColor','survivalBackgroundOpacity',
        'survivalShowLabel','survivalShowStatus','survivalStatusSize','survivalStatusSpacing','survivalStatusWeight',
        'survivalStatusPosition','survivalStatusPulse','survivalEmojiOn','survivalEmojiMode','survivalEmojiSize','survivalEmojiPop',
        'survivalShowMeter','survivalShowPercent','survivalLabelScale','survivalFontWeight','survivalItalic',
        'survivalOutline','survivalGlow','survivalDecimals','survivalShowDelta','survivalDeltaDuration','survivalDeltaMin',
        'survivalDeltaPosition','survivalDeltaSize','survivalDeltaGhosts','survivalRollingCounter','survivalRollDuration',
        'survivalSmoothTime','survivalImpactShake','survivalLowPulse','survivalDisplayMode','survivalAutoHideMs',
        'survivalDangerShowAt','survivalFormula','survivalDamageWeight','survivalImpactWeight','survivalSpeedWeight','survivalMinAlive',
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
        else if (data.action === 'panel') { scope.cfg.survivalShowPanel = !scope.cfg.survivalShowPanel; scope.persist(); }
        scope.$applyAsync();
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
        if (!scope.cfg) return;
        if (isTypingTarget(e.target)) return;
        var handled = false;
        if (keyMatches(e, scope.cfg.panelKey)) {
          scope.$applyAsync(function() { scope.cfg.survivalShowPanel = !scope.cfg.survivalShowPanel; scope.persist(); });
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
        if (unwatchSurvivalEmoji) { try { unwatchSurvivalEmoji(); } catch (e) {} }
        $document.off('keydown', hotkeyEntry);
        $document.off('click', onDocClickPicker);
        try { $window.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        try { if (node) node.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        [survivalPulseTimer, survivalDeltaTimer, survivalHideTimer, survivalShakeTimer,
         survivalRollTimer, survivalTweenTimer, survivalEmojiTimer].forEach(function(t) {
          if (t) { try { $timeout.cancel(t); } catch (e) {} }
        });
      });
    }
  };
}]);
