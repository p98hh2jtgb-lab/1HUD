
angular.module('beamng.apps')

.directive('pfFileRead', function() {
  return {
    restrict: 'A',
    scope: {
      pfFileRead: '=',
      pfOnRead: '&?'
    },
    link: function(scope, element) {
      element.on('change', function(evt) {
        var file = evt.target.files && evt.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(e) {
          scope.$apply(function() {
            scope.pfFileRead = e.target.result;
            if (scope.pfOnRead) scope.pfOnRead();
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };
})

.directive('creatorpackPanel', ['$document', '$window', '$timeout', '$rootScope', function($document, $window, $timeout, $rootScope) {
  return {
    replace: true,
    restrict: 'EA',
    templateUrl: '/ui/modules/apps/CreatorPack/app.html',
    link: function(scope, element) {
      var STORAGE_KEY = 'pfhud_config_v14_working_upload_clone';

      function defaultItems(count) {
        var items = [];
        for (var i = 0; i < count; i++) {
          items.push({
            label: 'Makina ' + (i + 1),
            image: '',
            enabled: true,
            state: 'pending',
            imageScale: 1.0,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageRotation: 0,
            costMax: 10000,     // buxheti maksimal i riparimit per kete makine
            costNow: 0,         // legacy/internal cost value (not shown in HUD)
            damageRatio: 0,     // v4.1: 0..1 radial damage shown around the circle
            damagePulse: false,
            visited: i === 0,   // v4.2: hide damage UI until this slot is reached
            survivalChance: 100,
            costLocked: false   // freezes this vehicle result after PASS/FAIL
          });
        }
        return items;
      }

      function defaults() {
        return {
          showPanel: true,
          vehiclesOn: true,        // v5.1: false = fsheh rrumullakat e makinave, mbetet vetem Survival Chance
          vehiclesKey: 'v',        // v5.1: tasti UI per ON/OFF te rretheve
          positionX: 18,
          positionY: 18,
          panelX: 18,
          panelY: 112,
          itemSize: 112,
          gap: 14,
          imageScale: 1.0,
          showArrows: false,
          showMarks: true,
          markSize: 0.82,
          circleShape: 'circle',
          outlineWidth: 4,
          glow: 8,
          pendingFillOpacity: 0.16,
          pendingOutlineOpacity: 0.00,
          currentIndex: 0,
          soundOn: true,
          passKey: 'k',
          failKey: 'l',
          nextKey: 'PageDown',
          prevKey: 'PageUp',
          resetKey: 'g',
          togglePanelKey: 'h',
          useHotkeys: true,
          showMiniButton: true,
          fxPosX: 50,
          fxPosY: 24,
          fxScale: 1.0,
          hudDensity: 'normal',

          // ---- v4.3: SURVIVAL CHANCE ----
          survivalOn: true,
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
          survivalColorProfileVersion: 2,
          survivalDynamicColor: true,
          survivalWarningThreshold: 55,
          survivalCriticalThreshold: 20,
          survivalLayout: 'inline',       // inline | stacked | compact
          survivalBackground: 'none',     // none | pill | card
          survivalBackgroundColor: '#071016',
          survivalBackgroundOpacity: 0.55,
          survivalShowLabel: true,
          survivalShowStatus: false,
          survivalStatusSize: 0.28,
          survivalStatusSpacing: 0.16,
          survivalStatusWeight: '900',
          survivalStatusPosition: 'bottom',
          survivalStatusPulse: true,
          survivalEmojiOn: true,
          survivalEmojiMode: 'right',    // SAFE + emoji inline
          survivalEmojiSize: 0.34,
          survivalEmojiPop: true,
          survivalEmojiProfileVersion: 3,
          survivalShowMeter: false,
          survivalShowPercent: true,
          survivalLabelScale: 0.60,
          survivalFontFamily: 'futura',   // v5.1: 'futura' = Futura Extra Bold (embedded), 'narrow' = Arial Narrow i vjeter
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
          survivalAnimationProfileVersion: 3,
          survivalImpactShake: false,
          survivalLowPulse: false,
          survivalDisplayMode: 'always',  // always | change | danger
          survivalAutoHideMs: 3000,
          survivalDangerShowAt: 55,
          survivalFormula: 'balanced',    // forgiving | balanced | hardcore | damageOnly
          survivalDamageWeight: 1.0,
          survivalImpactWeight: 1.0,
          survivalSpeedWeight: 1.0,
          survivalMinAlive: 1,

          // ---- v2.1: GUIDAT PER SHORTS (9:16) ----
          guidesOn: false,         // shfaq kornizen e sigurt + vijat e mesit
          guideRatio: '9:16',      // 9:16 | 4:5 | 1:1 | 16:9
          guideCenterV: true,      // vija vertikale ne mes
          guideCenterH: true,      // vija horizontale ne mes
          guideThirds: false,      // rregulli i te tretave
          guideDim: 0.45,          // sa te erresohen anet jashte kornizes
          guideColor: '#00e5ff',

          // ---- v2.0 PREMIUM ----
          theme: 'luxury',         // default | glass | neon | minimal | luxury
          layout: 'row',           // row | grid | column
          gridCols: 4,
          autoAdvance: true,       // kalo automatikisht te itemi tjeter pas markimit
          // ---- v3.0: REPAIR COST (zevendeson statistikat) ----
          costOn: true,            // v4.1: enables live radial damage rings
          costAuto: true,          // vendose vete ne mes poshte rratheve
          costPosX: 50,            // perqindje, kur costAuto = false
          costPosY: 80,
          costGap: 40,             // hapesira nen rrathet kur costAuto = true
          costSize: 64,
          costLabel: true,
          costLabelText: 'REPAIR COST',
          costCurrency: '$',
          costColor: '#3dff88',
          costLabelColor: '#ffffff',
          costPulse: true,
          costDefaultMax: 30000,     // fallback kur nuk gjendet vlera e makines
          costAutoMax: true,           // tavani i kostos lidhet automatikisht me vleren e makines
          costVehicleFactor: 0.90,     // max repair ~= 90% e vleres se makines
          costFollowMark: true,      // kalo mbi rrethin e markuar kur shtyp PASS/FAIL
          costFollowMs: 2500,        // sa te rrije aty
          costPerCircle: false,      // v4.1: monetary values removed from HUD
          costBigOn: false,          // v3.1.4: shiriti i madh mbi rrathe - FIKUR
          costSens: 1.0,             // ndjeshmeria e demit
          costStick: true,           // v3.1.2: kostoja MBETET mbi rrethin e markuar
          costCircleColor: '#3dff88',   // ngjyra e kostos per-rreth
          costColorByState: false,      // ngjyros sipas PASS/FAIL
          costPassColor: '#3dff88',
          costFailColor: '#ff5b5b',
          costStyleClass: 'pf-cost-card',
          costFontWeight: '900',
          costCurve: 1.55,
          costMinDamage: 0.01,
          costShowBar: true,
          costCompactText: false,
          costGlow: true,
          animLevel: 'full',       // full | subtle | off
          showLabels: false,       // emrat nen fotot
          labelSize: 13,
          presets: [],             // presets te ruajtura
          items: defaultItems(8)
        };
      }

      function normalizeConfig(saved, fallback) {
        var cfg = angular.extend({}, fallback, saved || {});
        if (!cfg.items || !cfg.items.length) cfg.items = defaultItems(8);

        // force cleaner defaults from v4 while keeping user items/images if saved
        if (cfg.pendingFillOpacity === undefined || cfg.pendingFillOpacity === null) cfg.pendingFillOpacity = 0.18;
        // v5.1: ON/OFF per rrumullakat e makinave (false = vetem Survival Chance)
        if (cfg.vehiclesOn === undefined || cfg.vehiclesOn === null) cfg.vehiclesOn = true;
        if (!cfg.vehiclesKey) cfg.vehiclesKey = 'v';
        if (cfg.pendingOutlineOpacity === undefined || cfg.pendingOutlineOpacity === null) cfg.pendingOutlineOpacity = 0.08;
        if (cfg.showMiniButton === undefined || cfg.showMiniButton === null) cfg.showMiniButton = true;
        if (cfg.showMarks === undefined || cfg.showMarks === null) cfg.showMarks = true;
        if (cfg.markSize === undefined || cfg.markSize === null) cfg.markSize = 0.82;
        if (cfg.useHotkeys === undefined || cfg.useHotkeys === null) cfg.useHotkeys = true;
        if (cfg.panelX === undefined || cfg.panelX === null) cfg.panelX = 18;
        if (cfg.panelY === undefined || cfg.panelY === null) cfg.panelY = 112;
        if (cfg.fxPosX === undefined || cfg.fxPosX === null) cfg.fxPosX = 50;
        if (cfg.fxPosY === undefined || cfg.fxPosY === null) cfg.fxPosY = 24;
        if (cfg.fxScale === undefined || cfg.fxScale === null) cfg.fxScale = 1.0;

        // ---- v2.0 PREMIUM defaults (ruan konfigurimet e vjetra) ----
        if (!cfg.theme) cfg.theme = 'default';
        if (!cfg.layout) cfg.layout = 'row';
        if (cfg.gridCols === undefined || cfg.gridCols === null) cfg.gridCols = 4;
        if (cfg.autoAdvance === undefined || cfg.autoAdvance === null) cfg.autoAdvance = true;
        // v3.0: repair cost
        if (cfg.costOn === undefined || cfg.costOn === null) cfg.costOn = false;
        if (cfg.costAuto === undefined || cfg.costAuto === null) cfg.costAuto = true;
        if (cfg.costPosX === undefined || cfg.costPosX === null) cfg.costPosX = 50;
        if (cfg.costPosY === undefined || cfg.costPosY === null) cfg.costPosY = 80;
        if (cfg.costGap === undefined || cfg.costGap === null) cfg.costGap = 40;
        if (cfg.costSize === undefined || cfg.costSize === null) cfg.costSize = 64;
        if (cfg.costLabel === undefined || cfg.costLabel === null) cfg.costLabel = true;
        if (!cfg.costLabelText) cfg.costLabelText = 'REPAIR COST';
        if (!cfg.costCurrency) cfg.costCurrency = '$';
        if (!cfg.costColor) cfg.costColor = '#3dff88';
        if (!cfg.costLabelColor) cfg.costLabelColor = '#ffffff';
        if (cfg.costPulse === undefined || cfg.costPulse === null) cfg.costPulse = true;
        if (cfg.costDefaultMax === undefined || cfg.costDefaultMax === null) cfg.costDefaultMax = 30000;
        if (cfg.costAutoMax === undefined || cfg.costAutoMax === null) cfg.costAutoMax = true;
        if (cfg.costVehicleFactor === undefined || cfg.costVehicleFactor === null) cfg.costVehicleFactor = 0.90;
        if (cfg.costFollowMark === undefined || cfg.costFollowMark === null) cfg.costFollowMark = true;
        if (cfg.costFollowMs === undefined || cfg.costFollowMs === null) cfg.costFollowMs = 2500;
        if (cfg.costPerCircle === undefined || cfg.costPerCircle === null) cfg.costPerCircle = true;
        if (cfg.costBigOn === undefined || cfg.costBigOn === null) cfg.costBigOn = false;
        if (cfg.costSens === undefined || cfg.costSens === null) cfg.costSens = 1.0;
        if (cfg.costStick === undefined || cfg.costStick === null) cfg.costStick = true;
        if (!cfg.costCircleColor) cfg.costCircleColor = cfg.costColor || '#3dff88';
        if (cfg.costColorByState === undefined || cfg.costColorByState === null) cfg.costColorByState = false;
        if (!cfg.costPassColor) cfg.costPassColor = '#3dff88';
        if (!cfg.costFailColor) cfg.costFailColor = '#ff5b5b';
        if (!cfg.hudDensity) cfg.hudDensity = 'normal';
        if (cfg.theme === 'default') cfg.theme = 'luxury';
        if (!cfg.costStyleClass) cfg.costStyleClass = 'pf-cost-card';
        if (!cfg.costFontWeight) cfg.costFontWeight = '900';
        if (cfg.costCurve === undefined || cfg.costCurve === null) cfg.costCurve = 1.55;
        if (cfg.costMinDamage === undefined || cfg.costMinDamage === null) cfg.costMinDamage = 0.01;
        if (cfg.costShowBar === undefined || cfg.costShowBar === null) cfg.costShowBar = true;
        if (cfg.costCompactText === undefined || cfg.costCompactText === null) cfg.costCompactText = false;
        if (cfg.costGlow === undefined || cfg.costGlow === null) cfg.costGlow = true;

        // v4.1 migration: the old money line/readouts are replaced by damage rings.
        // Keep the cost engine internally because it already provides a stable 0..1 damage ratio.
        cfg.costOn = true;
        cfg.costBigOn = false;
        cfg.costPerCircle = false;

        // pastro celesat e vjeter te statistikave
        ['showStats','statsAuto','statsPosX','statsPosY','showStreak',
         'showPercent','showProgressBar','countUp'].forEach(function(k){ delete cfg[k]; });
        if (!cfg.animLevel) cfg.animLevel = 'full';
        if (cfg.showLabels === undefined || cfg.showLabels === null) cfg.showLabels = false;
        if (cfg.labelSize === undefined || cfg.labelSize === null) cfg.labelSize = 13;
        if (!angular.isArray(cfg.presets)) cfg.presets = [];

        // ---- v4.3 survival defaults ----
        if (cfg.survivalOn === undefined || cfg.survivalOn === null) cfg.survivalOn = true;
        if (cfg.survivalEditPosition === undefined || cfg.survivalEditPosition === null) cfg.survivalEditPosition = false;
        if (cfg.survivalPosX === undefined || cfg.survivalPosX === null) cfg.survivalPosX = 50;
        if (cfg.survivalPosY === undefined || cfg.survivalPosY === null) cfg.survivalPosY = 8;
        if (cfg.survivalSize === undefined || cfg.survivalSize === null) cfg.survivalSize = 54;
        if (cfg.survivalSensitivity === undefined || cfg.survivalSensitivity === null) cfg.survivalSensitivity = 1.0;
        if (!cfg.survivalLabelText) cfg.survivalLabelText = 'SURVIVAL CHANCE';
        if (!cfg.survivalLabelColor) cfg.survivalLabelColor = '#ffffff';
        if (!cfg.survivalValueColor) cfg.survivalValueColor = '#ffad32';
        if (!cfg.survivalDeltaColor) cfg.survivalDeltaColor = '#ff8a32';
        if (cfg.survivalDynamicColor === undefined || cfg.survivalDynamicColor === null) cfg.survivalDynamicColor = true;
        if (!cfg.survivalWarningColor) cfg.survivalWarningColor = '#ff7a2f';
        if (!cfg.survivalCriticalColor) cfg.survivalCriticalColor = '#ff334d';
        // v4.6: migrate the old dull orange normal colour, including saved configs.
        if (Number(cfg.survivalColorProfileVersion || 0) < 2) {
          cfg.survivalValueColor = '#42ff68';
          cfg.survivalWarningColor = '#ff7a2f';
          cfg.survivalCriticalColor = '#ff334d';
          cfg.survivalColorProfileVersion = 2;
        }
        if (cfg.survivalWarningThreshold == null) cfg.survivalWarningThreshold = 55;
        if (cfg.survivalCriticalThreshold == null) cfg.survivalCriticalThreshold = 20;
        if (!cfg.survivalLayout) cfg.survivalLayout = 'inline';
        if (!cfg.survivalBackground) cfg.survivalBackground = 'none';
        if (!cfg.survivalBackgroundColor) cfg.survivalBackgroundColor = '#071016';
        if (cfg.survivalBackgroundOpacity == null) cfg.survivalBackgroundOpacity = 0.55;
        if (cfg.survivalShowLabel == null) cfg.survivalShowLabel = true;
        if (cfg.survivalShowStatus == null) cfg.survivalShowStatus = false;
        if (cfg.survivalStatusSize == null) cfg.survivalStatusSize = 0.28;
        if (cfg.survivalStatusSpacing == null) cfg.survivalStatusSpacing = 0.16;
        if (!cfg.survivalStatusWeight) cfg.survivalStatusWeight = '900';
        if (!cfg.survivalStatusPosition) cfg.survivalStatusPosition = 'bottom';
        if (cfg.survivalStatusPulse == null) cfg.survivalStatusPulse = true;
        if (cfg.survivalEmojiOn == null) cfg.survivalEmojiOn = true;
        if (!cfg.survivalEmojiMode || cfg.survivalEmojiMode === 'replace') cfg.survivalEmojiMode = 'right';
        if (cfg.survivalEmojiSize == null) cfg.survivalEmojiSize = 0.62;
        if (cfg.survivalEmojiPop == null) cfg.survivalEmojiPop = true;
        // v5.0: inspect the ACTUAL saved object (not merged defaults), otherwise
        // old Replace-mode configs inherit the new version number and skip migration.
        var savedEmojiVersion = saved ? Number(saved.survivalEmojiProfileVersion || 0) : 0;
        if (savedEmojiVersion < 3) {
          cfg.survivalEmojiOn = true;
          cfg.survivalShowStatus = true;
          cfg.survivalEmojiMode = 'right';
          cfg.survivalEmojiSize = 0.34;
          cfg.survivalEmojiPop = true;
          cfg.survivalEmojiProfileVersion = 3;
        }
        if (cfg.survivalShowMeter == null) cfg.survivalShowMeter = false;
        if (cfg.survivalShowPercent == null) cfg.survivalShowPercent = true;
        if (cfg.survivalLabelScale == null) cfg.survivalLabelScale = 0.60;
        if (!cfg.survivalFontFamily) cfg.survivalFontFamily = 'futura';   // v5.1: Futura Extra Bold by default
        if (!cfg.survivalFontWeight) cfg.survivalFontWeight = '900';
        if (cfg.survivalItalic == null) cfg.survivalItalic = true;
        if (cfg.survivalOutline == null) cfg.survivalOutline = 1;
        if (cfg.survivalGlow == null) cfg.survivalGlow = 10;
        if (cfg.survivalDecimals == null) cfg.survivalDecimals = 0;
        if (cfg.survivalShowDelta == null) cfg.survivalShowDelta = true;
        if (cfg.survivalDeltaDuration == null) cfg.survivalDeltaDuration = 850;
        if (cfg.survivalDeltaMin == null) cfg.survivalDeltaMin = 1;
        if (!cfg.survivalDeltaPosition) cfg.survivalDeltaPosition = 'right';
        if (cfg.survivalDeltaSize == null) cfg.survivalDeltaSize = 0.42;
        if (cfg.survivalDeltaGhosts == null) cfg.survivalDeltaGhosts = true;
        if (cfg.survivalRollingCounter == null) cfg.survivalRollingCounter = false;
        if (cfg.survivalRollDuration == null) cfg.survivalRollDuration = 430;
        if (cfg.survivalSmoothTime == null) cfg.survivalSmoothTime = 340;
        if (cfg.survivalImpactShake == null) cfg.survivalImpactShake = false;
        if (cfg.survivalLowPulse == null) cfg.survivalLowPulse = false;
        // v4.7 performance migration: replace overlapping heavy effects with Smooth Pop.
        if (Number(cfg.survivalAnimationProfileVersion || 0) < 3) {
          cfg.survivalRollingCounter = false;
          cfg.survivalDeltaGhosts = false;
          cfg.survivalImpactShake = false;
          cfg.survivalLowPulse = false;
          cfg.survivalDeltaDuration = 900;
          cfg.survivalSmoothTime = 340;
          cfg.survivalAnimationProfileVersion = 3;
        }
        if (!cfg.survivalDisplayMode) cfg.survivalDisplayMode = 'always';
        if (cfg.survivalAutoHideMs == null) cfg.survivalAutoHideMs = 3000;
        if (cfg.survivalDangerShowAt == null) cfg.survivalDangerShowAt = 55;
        if (!cfg.survivalFormula) cfg.survivalFormula = 'balanced';
        if (cfg.survivalDamageWeight == null) cfg.survivalDamageWeight = 1.0;
        if (cfg.survivalImpactWeight == null) cfg.survivalImpactWeight = 1.0;
        if (cfg.survivalSpeedWeight == null) cfg.survivalSpeedWeight = 1.0;
        if (cfg.survivalMinAlive == null) cfg.survivalMinAlive = 1;

        // ---- v2.1 guides ----
        if (cfg.guidesOn === undefined || cfg.guidesOn === null) cfg.guidesOn = false;
        if (!cfg.guideRatio) cfg.guideRatio = '9:16';
        if (cfg.guideCenterV === undefined || cfg.guideCenterV === null) cfg.guideCenterV = true;
        if (cfg.guideCenterH === undefined || cfg.guideCenterH === null) cfg.guideCenterH = true;
        if (cfg.guideThirds === undefined || cfg.guideThirds === null) cfg.guideThirds = false;
        if (cfg.guideDim === undefined || cfg.guideDim === null) cfg.guideDim = 0.45;
        if (!cfg.guideColor) cfg.guideColor = '#00e5ff';
        cfg.passKey = 'k';
        cfg.failKey = 'l';
        cfg.nextKey = 'PageDown';
        cfg.prevKey = 'PageUp';
        cfg.resetKey = 'g';
        cfg.togglePanelKey = 'h';

        angular.forEach(cfg.items, function(item, idx) {
          if (item.enabled === undefined) item.enabled = true;
          if (!item.label) item.label = 'Makina ' + (idx + 1);
          if (!item.state) item.state = 'pending';
          if (item.imageScale === undefined || item.imageScale === null) item.imageScale = cfg.imageScale || 1.0;
          if (item.imageOffsetX === undefined || item.imageOffsetX === null) item.imageOffsetX = 0;
          if (item.imageOffsetY === undefined || item.imageOffsetY === null) item.imageOffsetY = 0;
          if (item.imageRotation === undefined || item.imageRotation === null) item.imageRotation = 0;
          if (item.costMax === undefined || item.costMax === null) item.costMax = Number(cfg.costDefaultMax) || 10000;
          if (item.costNow === undefined || item.costNow === null) item.costNow = 0;
          if (item.damageRatio === undefined || item.damageRatio === null) item.damageRatio = 0;
          item.damageRatio = Math.max(0, Math.min(1, Number(item.damageRatio) || 0));
          item.damagePulse = false;
          if (item.visited === undefined || item.visited === null) {
            item.visited = idx === Number(cfg.currentIndex || 0) || item.damageRatio > 0 || item.state !== 'pending';
          }
          if (item.survivalChance === undefined || item.survivalChance === null) {
            item.survivalChance = item.damageRatio >= 0.995 ? 0 : Math.max(1, Math.round(100 * (1 - Math.pow(item.damageRatio, 0.82))));
          }
          item.survivalChance = Math.max(0, Math.min(100, Number(item.survivalChance) || 0));
          if (item.costLocked === undefined || item.costLocked === null) item.costLocked = false;
        });

        return cfg;
      }

      function load() {
        var d = defaults();
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return d;
          return normalizeConfig(JSON.parse(raw), d);
        } catch (e) {
          return d;
        }
      }

      scope.cfg = load();
      scope.selected = Math.max(0, Math.min(scope.cfg.currentIndex || 0, scope.cfg.items.length - 1));
      if (scope.cfg.items[scope.selected]) scope.cfg.items[scope.selected].visited = true;
      scope.storageWarning = '';

      scope.rootClass = function() {
        return 'pf-theme-' + (scope.cfg.theme || 'default') +
               ' pf-anim-' + (scope.cfg.animLevel || 'full') +
               ' pf-layout-' + (scope.cfg.layout || 'row') +
               ' pf-density-' + (scope.cfg.hudDensity || 'normal') +
               (scope.cfg.costOn ? ' pf-damage-mode' : '');
      };

      scope.labelStyle = function() {
        return { fontSize: (Number(scope.cfg.labelSize) || 13) + 'px' };
      };
      scope.fx = { show: false, type: null };
      var fxTimer = null;


      scope.fileInputs = {};
      scope.registerFileInput = function(index, el) {
        scope.fileInputs[index] = el;
      };
      scope.openFilePicker = function(index) {
        var el = scope.fileInputs[index];
        if (el && el.click) el.click();
      };
      scope.readItemImage = function(index, inputEl) {
        try {
          var file = inputEl.files && inputEl.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(e) {
            scope.$applyAsync(function() {
              if (scope.cfg.items[index]) {
                scope.cfg.items[index].image = e.target.result;
                scope.persist();
              }
            });
          };
          reader.readAsDataURL(file);
        } catch (err) {}
      };

      window.pfhudReadImage = function(index, inputEl) {
        try {
          var file = inputEl.files && inputEl.files[0];
          if (!file) return;

          var reader = new FileReader();
          reader.onload = function(e) {
            try {
              var sc = angular.element(inputEl).scope();
              sc.$applyAsync(function() {
                sc.cfg.items[Number(index)].image = e.target.result;
                sc.persist();
              });
            } catch (err) {}
          };
          reader.readAsDataURL(file);
        } catch (e) {}
      };


      scope.setShape = function(shape) {
        scope.cfg.circleShape = shape;
        scope.persist();
      };

      scope.moveHud = function(dx, dy) {
        scope.cfg.positionX = Number(scope.cfg.positionX || 0) + dx;
        scope.cfg.positionY = Number(scope.cfg.positionY || 0) + dy;
        scope.persist();
      };

      scope.resizeHud = function(delta) {
        scope.cfg.itemSize = Math.max(40, Math.min(220, Number(scope.cfg.itemSize || 112) + delta));
        scope.persist();
      };

      scope.adjustGap = function(delta) {
        scope.cfg.gap = Math.max(0, Math.min(60, Number(scope.cfg.gap || 14) + delta));
        scope.persist();
      };


      function stripRaw(obj) {
        var out = {}, k;
        for (k in obj) {
          if (obj.hasOwnProperty(k) && k.indexOf('__raw') === -1) out[k] = obj[k];
        }
        return out;
      }

      scope.persist = function() {
        scope.cfg.currentIndex = scope.selected;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stripRaw(scope.cfg)));
          scope.storageWarning = '';
        } catch (e) {
          // Fotot ruhen si base64 -> mund ta kalojne kuoten ~5MB.
          // Provo edhe njehere pa presets, qe te pakten HUD-i te mos humbase.
          try {
            var slim = angular.extend(stripRaw(scope.cfg), { presets: [] });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
            scope.storageWarning = 'Memoria u mbush - presets nuk u ruajten. Perdor foto me te vogla.';
          } catch (e2) {
            scope.storageWarning = 'Nuk u ruajt: memoria eshte plot. Fshi disa foto ose perdor rezolucion me te vogel.';
          }
        }
      };

      // =====================================================
      // GUIDAT PER SHORTS / REELS (9:16)
      // =====================================================
      // U rikthyen ne v3.1 - u fshine gabimisht kur u hoqen statistikat.

      scope.viewport = { w: 1920, h: 1080 };

      function measureViewport() {
        try {
          var el = element && element[0] ? element[0] : null;
          var w = (el && el.offsetWidth) || $window.innerWidth || 1920;
          var h = (el && el.offsetHeight) || $window.innerHeight || 1080;
          if (w > 0 && h > 0) { scope.viewport.w = w; scope.viewport.h = h; }
        } catch (e) {}
      }
      measureViewport();

      function ratioValue(r) {
        switch (String(r)) {
          case '9:16': return 9 / 16;
          case '4:5':  return 4 / 5;
          case '1:1':  return 1;
          case '16:9': return 16 / 9;
          default:     return 9 / 16;
        }
      }

      scope.safeBox = function() {
        var vw = scope.viewport.w, vh = scope.viewport.h;
        var ar = ratioValue(scope.cfg.guideRatio);
        var boxH = vh, boxW = vh * ar;
        if (boxW > vw) { boxW = vw; boxH = vw / ar; }
        return { w:boxW, h:boxH, left:(vw-boxW)/2, top:(vh-boxH)/2, cx:vw/2, cy:vh/2 };
      };

      scope.guideFrameStyle = function() {
        var b = scope.safeBox();
        return { left:b.left+'px', top:b.top+'px', width:b.w+'px', height:b.h+'px',
                 borderColor: scope.cfg.guideColor };
      };
      scope.guideDimLeftStyle = function() {
        var b = scope.safeBox();
        return { left:'0px', top:'0px', width:Math.max(0,b.left)+'px', height:'100%',
                 background:'rgba(0,0,0,'+Number(scope.cfg.guideDim||0)+')' };
      };
      scope.guideDimRightStyle = function() {
        var b = scope.safeBox();
        return { left:(b.left+b.w)+'px', top:'0px',
                 width:Math.max(0, scope.viewport.w-(b.left+b.w))+'px', height:'100%',
                 background:'rgba(0,0,0,'+Number(scope.cfg.guideDim||0)+')' };
      };
      scope.guideVStyle = function(){ return { left: scope.safeBox().cx+'px', background: scope.cfg.guideColor }; };
      scope.guideHStyle = function(){ return { top:  scope.safeBox().cy+'px', background: scope.cfg.guideColor }; };
      scope.guideThirdStyle = function(which, i) {
        var b = scope.safeBox();
        if (which === 'v') return { left:(b.left + b.w*(i/3))+'px', background: scope.cfg.guideColor };
        return { top:(b.top + b.h*(i/3))+'px', background: scope.cfg.guideColor };
      };
      scope.guideLabel = function() {
        var b = scope.safeBox();
        return Math.round(b.w)+' x '+Math.round(b.h)+'  ('+scope.cfg.guideRatio+')';
      };
      scope.guideLabelStyle = function() {
        var b = scope.safeBox();
        return { left:b.left+'px', top:Math.max(0,b.top-26)+'px', color: scope.cfg.guideColor };
      };

      function hudDims() {
        var n = 0;
        angular.forEach(scope.cfg.items, function(it) { if (it && it.enabled !== false) n++; });
        if (n < 1) n = 1;

        var lay = scope.cfg.layout || 'row';
        var cols = n, rows = 1;
        if (lay === 'column') { cols = 1; rows = n; }
        else if (lay === 'grid') {
          cols = Math.max(1, Number(scope.cfg.gridCols) || 4);
          rows = Math.ceil(n / cols);
          if (n < cols) cols = n;
        }

        var size = Number(scope.cfg.itemSize) || 112;
        var gap  = Number(scope.cfg.gap) || 0;
        var labelH = scope.cfg.showLabels ? (Number(scope.cfg.labelSize) || 13) + 12 : 0;
        return {
          w: cols * size + (cols - 1) * gap,
          h: rows * size + (rows - 1) * gap + labelH
        };
      }

      scope.fitToGuide = function(where) {
        measureViewport();
        var b = scope.safeBox();
        var d = hudDims();

        scope.cfg.positionX = Math.round(b.left + (b.w - d.w) / 2);

        var pad = Math.round(b.h * 0.06);
        if (where === 'top')         scope.cfg.positionY = Math.round(b.top + pad);
        else if (where === 'bottom') scope.cfg.positionY = Math.round(b.top + b.h - d.h - pad - 70);
        else                         scope.cfg.positionY = Math.round(b.cy - d.h / 2);

        if (scope.cfg.positionX < 0) scope.cfg.positionX = 0;
        if (scope.cfg.positionY < 0) scope.cfg.positionY = 0;
        scope.persist();
      };

      scope.shortsPreset = function(kind) {
        scope.cfg.guidesOn = true;
        scope.cfg.guideRatio = '9:16';

        if (kind === 'grid2') { scope.cfg.layout = 'grid'; scope.cfg.gridCols = 2; }
        else { scope.cfg.layout = 'column'; }

        var b = scope.safeBox();
        var n = 0;
        angular.forEach(scope.cfg.items, function(it) { if (it && it.enabled !== false) n++; });
        if (n < 1) n = 1;

        var cols = (kind === 'grid2') ? Math.min(2, n) : 1;
        var rows = Math.ceil(n / cols);
        var gap = Number(scope.cfg.gap) || 14;

        var maxByH = (b.h * 0.72 - (rows - 1) * gap) / rows;
        var maxByW = (b.w * 0.86 - (cols - 1) * gap) / cols;
        var size = Math.floor(Math.min(maxByH, maxByW));
        if (size < 40) size = 40;
        if (size > 220) size = 220;
        scope.cfg.itemSize = size;

        scope.fitToGuide('center');
      };

      var onResize = function() { scope.$applyAsync(measureViewport); };
      $window.addEventListener('resize', onResize);

      // =====================================================
      // PREVIEW I MADH RRETHOR NE EDITOR
      // =====================================================
      scope.thumbStyle = function(item) {
        var radius = '50%';
        var shape = String(scope.cfg.circleShape).toLowerCase();
        if (shape === 'rounded') radius = '22px';
        if (shape === 'square')  radius = '0px';

        var bc = 'rgba(255,255,255,0.14)';
        if (item.state === 'pass') bc = 'rgba(104,255,164,0.98)';
        else if (item.state === 'fail') bc = 'rgba(255,88,88,0.98)';

        return {
          borderRadius: radius,
          borderWidth: Math.max(3, Number(scope.cfg.outlineWidth || 4)) + 'px',
          borderColor: bc,
          background: 'rgba(0,0,0,' + Number(scope.cfg.pendingFillOpacity || 0.16) + ')'
        };
      };

      scope.thumbImgStyle = function(item) {
        var scale = item.imageScale != null ? item.imageScale : (scope.cfg.imageScale || 1.0);
        var ox = Number(item.imageOffsetX || 0);
        var oy = Number(item.imageOffsetY || 0);
        var rot = Number(item.imageRotation || 0);
        var k = 190 / (Number(scope.cfg.itemSize) || 112);

        return {
          backgroundImage: item.image ? ('url(' + item.image + ')') : 'none',
          backgroundSize: Math.round(scale * 1.55 * 100) + '%',
          backgroundPosition: 'calc(50% + ' + (ox * k) + 'px) calc(50% + ' + (oy * k) + 'px)',
          transform: 'rotate(' + rot + 'deg)'
        };
      };

      // =====================================================
      // v3.1 — ZGJEDHES NGJYRASH
      // =====================================================
      // CEF-i i BeamNG nuk e hap dialogun e sistemit per <input type="color">,
      // prandaj perdorim nje palete te vetendertuar + fushe hex.

      scope.palette = [
        '#ffffff', '#c8d2dc', '#8c99a6', '#3c4652', '#000000', '#ff3c3c', '#ff6b35', '#ffa726',
        '#ffd400', '#c6ff00', '#3dff88', '#00e5a0', '#00d4ff', '#2f9bff', '#5b6cff', '#9b5bff',
        '#e05bff', '#ff4fa3', '#8d5524', '#00ffc8', '#ff0080', '#7cfc00', '#ff2d55', '#40e0d0'
      ];

      scope.pickerOpen = null;

      scope.isPickerOpen = function(key) { return scope.pickerOpen === key; };

      scope.togglePicker = function(key, ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        scope.pickerOpen = (scope.pickerOpen === key) ? null : key;
      };

      scope.closePicker = function() { scope.pickerOpen = null; };

      var HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

      function normalizeHex(h, fallback) {
        if (typeof h !== 'string') return fallback;
        var v = h.trim();
        if (v.charAt(0) !== '#') v = '#' + v;
        if (!HEX_RE.test(v)) return fallback;
        v = v.toLowerCase();
        if (v.length === 4) {   // #abc -> #aabbcc
          v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
        }
        return v;
      }

      scope.sameColor = function(a, b) {
        return normalizeHex(a, 'x') === normalizeHex(b, 'y');
      };

      // Shkrimi manual: ruaj tekstin e papërpunuar qe perdoruesi te
      // mund te shkruaje lirshem, apliko vetem kur behet hex i vlefshem.
      scope.setColorField = function(target, key) {
        if (!target) return;
        var raw = target[key + '__raw'];
        var norm = normalizeHex(raw, null);
        if (norm) { target[key] = norm; scope.persist(); }
      };

      scope.pickColor = function(target, key, color) {
        if (!target) return;
        var norm = normalizeHex(color, null);
        if (!norm) return;
        target[key] = norm;
        target[key + '__raw'] = norm;
        scope.persist();
      };

      // mbylle popup-in kur klikohet jashte
      function onDocClickPicker() {
        if (scope.pickerOpen !== null) {
          scope.$applyAsync(function() { scope.pickerOpen = null; });
        }
      }
      $document.on('click', onDocClickPicker);

      // mbush fushat __raw kur ngarkohet konfigurimi
      function syncColorRaw() {
        scope.cfg.costColor__raw = scope.cfg.costColor;
        scope.cfg.costLabelColor__raw = scope.cfg.costLabelColor;
        scope.cfg.costCircleColor__raw = scope.cfg.costCircleColor;
        scope.cfg.costPassColor__raw = scope.cfg.costPassColor;
        scope.cfg.costFailColor__raw = scope.cfg.costFailColor;
        if (scope.cfg.guideColor) scope.cfg.guideColor__raw = scope.cfg.guideColor;
        scope.cfg.survivalLabelColor__raw = scope.cfg.survivalLabelColor;
        scope.cfg.survivalValueColor__raw = scope.cfg.survivalValueColor;
        scope.cfg.survivalDeltaColor__raw = scope.cfg.survivalDeltaColor;
        scope.cfg.survivalWarningColor__raw = scope.cfg.survivalWarningColor;
        scope.cfg.survivalCriticalColor__raw = scope.cfg.survivalCriticalColor;
        scope.cfg.survivalBackgroundColor__raw = scope.cfg.survivalBackgroundColor;
      }
      syncColorRaw();

      // =====================================================
      // v3.1 — REPAIR COST (per makine, me maksimum)
      // =====================================================
      // Lua dergon demin e papërpunuar (0..1). Ne e shnderrojme ne
      // dollare duke e shumezuar me buxhetin maksimal te asaj makine.
      //   dem 0%   -> $0
      //   dem 13%  -> $1,300  (nese max = 10,000)
      //   dem 100% -> $10,000
      // Cdo makine e ka maksimumin e vet, i ndryshueshem nga paneli.

      scope.cost = { mode: 'fallback', pulse: false, ratio: 0 };

      var costLast = 0;
      var costPulseDelay = null;
      var costPulseTimer = null;
      var followTimer = null;

      // v4.3 Survival Chance animation state
      scope.survival = { pulse:false, shake:false, rolling:false, emojiPulse:false, oldValue:100, displayValue:100, visible:true, deltaVisible:false, deltaText:'' };
      var survivalPulseTimer = null;
      var survivalDeltaTimer = null;
      var survivalHideTimer = null;
      var survivalShakeTimer = null;
      var survivalRollTimer = null;
      var survivalTweenTimer = null;
      var survivalEmojiTimer = null;
      var unwatchSurvivalEmoji = null;

      // Lightweight 30 FPS number tween. New telemetry continues from the current
      // visual value instead of restarting/jumping every 0.25 seconds.
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

      function syncSurvivalDisplay() {
        var it = scope.cfg.items[scope.selected];
        var v = it ? Number(it.survivalChance) : 100;
        scope.survival.displayValue = isFinite(v) ? Math.max(0, Math.min(100, v)) : 100;
      }
      syncSurvivalDisplay();

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
        scope.survival.oldValue = isFinite(Number(oldValue)) ? Number(oldValue) : (scope.survivalRawValue ? scope.survivalRawValue() + drop : 100);

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

      // Kur shtypet PASS/FAIL, kostoja kalon perkohesisht mbi ate rreth
      scope.costFollowIdx = -1;

      // v3.2: paneli u nda ne tab-a per te hequr mbingarkesen vizuale
      scope.tab = 'kryesore';

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

      function bootCostLua() {
        engineLua("extensions.load('creatorpack')");
        engineLua("if extensions.creatorpack and extensions.creatorpack.setDamageSensitivity then "
                + "extensions.creatorpack.setDamageSensitivity(" + (Number(scope.cfg.costSens) || 1) + ") end");
        engineLua("if extensions.creatorpack and extensions.creatorpack.setCostEnabled then "
                + "extensions.creatorpack.setCostEnabled(" + (scope.cfg.costOn ? "true" : "false") + ") end");
      }

      scope.applyCostSens = function() {
        engineLua("if extensions.creatorpack and extensions.creatorpack.setDamageSensitivity then "
                + "extensions.creatorpack.setDamageSensitivity(" + (Number(scope.cfg.costSens) || 1) + ") end");
        scope.persist();
      };

      scope.toggleCost = function() {
        if (scope.cfg.costOn) bootCostLua();
        else engineLua("if extensions.creatorpack and extensions.creatorpack.setCostEnabled then "
                     + "extensions.creatorpack.setCostEnabled(false) end");
        scope.persist();
      };

      // Makina qe po matet tani: ajo e zgjedhur, nese s'eshte e ngrire
      function activeCostItem() {
        var it = scope.cfg.items[scope.selected];
        if (it && it.enabled !== false) return it;
        return null;
      }

      var unsubCost = $rootScope.$on('creatorpack.cost', function(e, d) {
        if (!d) return;
        scope.cost.mode = d.mode || 'fallback';

        // ratio 0..1 nga Lua (deformimi i papërpunuar ndaj referimit)
        var ratio = Number(d.ratio);
        if (!isFinite(ratio)) ratio = 0;
        ratio = Math.max(0, Math.min(1, ratio));
        scope.cost.ratio = ratio;

        var it = activeCostItem();
        if (!it) { scope.$applyAsync(); return; }
        it.visited = true;

        // v3.3: tavani i riparimit lidhet me vleren reale te makines.
        // 90% e vleres se makines, me kufi 5k..100k qe te mos dalin
        // as shuma qesharake, as repair costs me miliona.
        var vehicleValue = Number(d.maxValue);
        if (scope.cfg.costAutoMax && isFinite(vehicleValue) && vehicleValue > 0) {
          var factor = Number(scope.cfg.costVehicleFactor);
          if (!isFinite(factor)) factor = 0.90;
          factor = Math.max(0.50, Math.min(1.00, factor));
          var autoMax = Math.round((vehicleValue * factor) / 500) * 500;
          autoMax = Math.max(500, Math.min(250000, autoMax));
          it.costMax = autoMax;
        }

        // v4.1: store the actual damage ratio for this circle. It only grows
        // during a run and freezes together with the result after PASS/FAIL.
        if (!it.costLocked) {
          var oldDamage = Math.max(0, Math.min(1, Number(it.damageRatio) || 0));
          var newDamage = Math.max(oldDamage, ratio);
          it.damageRatio = newDamage;
          if (newDamage > oldDamage + 0.002 && scope.cfg.costPulse !== false && scope.cfg.animLevel !== 'off') {
            it.damagePulse = false;
            $timeout(function() {
              it.damagePulse = true;
              $timeout(function() { it.damagePulse = false; }, 430);
            }, 10);
          }
        }

        // v4.3: structural risk + recent impact severity. Chance never rises
        // during the run; 0% is reserved for a genuinely totalled vehicle.
        if (!it.costLocked) {
          var currentRatio = Math.max(0, Math.min(1, Number(it.damageRatio) || 0));
          var speedKmh = Math.max(0, Number(d.speedKmh) || 0);
          var deltaDamage = Math.max(0, currentRatio - oldDamage);
          var sensitivity = Math.max(0.65, Math.min(1.35, Number(scope.cfg.survivalSensitivity) || 1));
          var formula = scope.cfg.survivalFormula || 'balanced';
          var formulaScale = formula === 'forgiving' ? 0.78 : (formula === 'hardcore' ? 1.28 : 1.0);
          var curveExp = formula === 'forgiving' ? 0.92 : (formula === 'hardcore' ? 0.72 : 0.82);
          var damageWeight = Number(scope.cfg.survivalDamageWeight);
          var impactWeight = Number(scope.cfg.survivalImpactWeight);
          var speedWeight = Number(scope.cfg.survivalSpeedWeight);
          if (!isFinite(damageWeight)) damageWeight = 1;
          if (!isFinite(impactWeight)) impactWeight = 1;
          if (!isFinite(speedWeight)) speedWeight = 1;
          damageWeight = Math.max(0, Math.min(2, damageWeight));
          impactWeight = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, impactWeight));
          speedWeight = formula === 'damageOnly' ? 0 : Math.max(0, Math.min(2, speedWeight));
          var targetChance;
          if (currentRatio >= 0.995) {
            targetChance = 0;
          } else if (currentRatio < 0.0005) {
            targetChance = 100;
          } else {
            var structuralRisk = Math.pow(currentRatio, curveExp) * 100 * damageWeight;
            var speedFactor = 0.30 + Math.min(1, speedKmh / 160) * 0.45 * speedWeight;
            var impactRisk = deltaDamage * 100 * speedFactor * impactWeight;
            targetChance = 100 - (structuralRisk + impactRisk) * sensitivity * formulaScale;
            var minAlive = Math.max(1, Math.min(15, Number(scope.cfg.survivalMinAlive) || 1));
            targetChance = Math.max(minAlive, Math.min(99.9, targetChance));
          }
          var oldChance = Math.max(0, Math.min(100, Number(it.survivalChance)));
          if (!isFinite(oldChance)) oldChance = 100;
          if (targetChance < oldChance) {
            it.survivalChance = targetChance;
            if (it === activeCostItem()) animateSurvivalDisplay(targetChance);
            if (scope.cfg.survivalOn && it === activeCostItem()) showSurvivalDelta(oldChance - targetChance, oldChance);
          }
        }

        // e ngrire = u markua me PASS/FAIL; vlera e saj nuk preket me
        if (it.costLocked) { scope.$applyAsync(); return; }

        var max = Math.max(0, Number(it.costMax) || 0);
        var curve = Number(scope.cfg.costCurve);
        if (!isFinite(curve) || curve <= 0) curve = 1.55;
        var minDamage = Number(scope.cfg.costMinDamage);
        if (!isFinite(minDamage)) minDamage = 0.01;
        minDamage = Math.max(0, Math.min(0.25, minDamage));
        var effectiveRatio = ratio <= minDamage ? 0 : Math.max(0, Math.min(1, (ratio - minDamage) / (1 - minDamage)));
        // Non-linear premium curve: small hits stay cheap, major crashes scale harder.
        var v = Math.round(Math.pow(effectiveRatio, curve) * max);

        // kostoja vetem rritet gjate nje sesioni (nuk bie kur makina qetesohet)
        if (v < (it.costNow || 0)) v = it.costNow;

        if (scope.cfg.costPulse && v > costLast + Math.max(5, max * 0.005)) {
          if (costPulseDelay) { try { clearTimeout(costPulseDelay); } catch (x) {} }
          if (costPulseTimer) { try { clearTimeout(costPulseTimer); } catch (x) {} }
          scope.cost.pulse = false;
          costPulseDelay = setTimeout(function () {
            scope.$applyAsync(function () { scope.cost.pulse = true; });
            costPulseTimer = setTimeout(function () {
              scope.$applyAsync(function () { scope.cost.pulse = false; });
            }, 300);
          }, 10);
        }

        costLast = v;
        it.costNow = v;
        scope.$applyAsync();
      });

      function hexToRgba(hex, alpha) {
        var h = String(hex || '#000000').replace('#','');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var n = parseInt(h,16); if (!isFinite(n)) n = 0;
        return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+alpha+')';
      }

      function mixHex(a, b, t) {
        function rgb(h) {
          h = String(h || '#000000').replace('#','');
          if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
          var n = parseInt(h,16); if (!isFinite(n)) n = 0;
          return [(n>>16)&255,(n>>8)&255,n&255];
        }
        t = Math.max(0,Math.min(1,Number(t)||0));
        var x=rgb(a), y=rgb(b), out=[];
        for (var i=0;i<3;i++) out.push(Math.round(x[i]+(y[i]-x[i])*t));
        return '#'+out.map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('');
      }

      // ---- v4.1 radial damage helpers ----
      var DAMAGE_RING_CIRCUMFERENCE = 292.17; // 2 * PI * 46.5 (SVG viewBox)

      scope.damageRatioOf = function(item) {
        var r = item ? Number(item.damageRatio) : 0;
        if (!isFinite(r)) r = 0;
        return Math.max(0, Math.min(1, r));
      };

      scope.damagePercent = function(item) {
        var r = scope.damageRatioOf(item);
        if (r >= 0.995) return 100;
        return Math.round(r * 100);
      };

      scope.damageColor = function(item) {
        var pct = scope.damagePercent(item);
        if (pct >= 100) return '#ff334d'; // pure red only when fully destroyed
        if (pct <= 35) return mixHex('#42ff68','#9dff3f',pct/35);
        if (pct <= 75) return mixHex('#9dff3f','#ff8a2f',(pct-35)/40);
        return mixHex('#ff8a2f','#ff5638',(pct-75)/24);
      };

      scope.damageVisible = function(item, index) {
        if (!item) return false;
        return item.visited === true || index === scope.selected || item.costLocked === true || scope.damageRatioOf(item) > 0;
      };

      scope.damageLabel = function(item) {
        var pct = scope.damagePercent(item);
        if (pct >= 100) return 'TOTALLED';
        if (pct >= 80) return 'CRITICAL';
        return 'DAMAGE';
      };

      scope.damageValueStyle = function(item) {
        var color = scope.damageColor(item);
        return {
          color: color,
          textShadow: '0 2px 7px rgba(0,0,0,.95), 0 0 8px ' + color
        };
      };

      scope.damageRingOffset = function(item) {
        var r = scope.damageRatioOf(item);
        if (r >= 0.995) r = 1;
        return (DAMAGE_RING_CIRCUMFERENCE * (1 - r)).toFixed(2);
      };

      scope.damageReadoutClass = function(item, index) {
        var pct = scope.damagePercent(item);
        return {
          'damage-critical': pct >= 80 && pct < 100,
          'damage-totalled': pct >= 100,
          'is-inactive': index !== scope.selected && pct === 0,
          'is-unvisited': !scope.damageVisible(item, index)
        };
      };

      scope.survivalRawValue = function() {
        var it = activeCostItem();
        if (!it) return 100;
        var v = Number(it.survivalChance);
        return isFinite(v) ? Math.max(0, Math.min(100, v)) : 100;
      };

      scope.survivalVisualValue = function() {
        var v = Number(scope.survival.displayValue);
        return isFinite(v) ? Math.max(0,Math.min(100,v)) : scope.survivalRawValue();
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

      scope.survivalColor = function() {
        var value = scope.survivalVisualValue();
        var safe = scope.cfg.survivalValueColor || '#42ff68';
        if (!scope.cfg.survivalDynamicColor) return safe;
        var critical = Math.max(1, Math.min(100, Number(scope.cfg.survivalCriticalThreshold) || 20));
        var warning = Math.max(critical + 1, Math.min(100, Number(scope.cfg.survivalWarningThreshold) || 55));
        var warningColor = scope.cfg.survivalWarningColor || '#ff7a2f';
        var criticalColor = scope.cfg.survivalCriticalColor || '#ff334d';
        if (value > warning) return safe; // SAFE/high chance stays vivid green
        if (value > critical) return mixHex(safe, warningColor, (warning-value)/Math.max(1,warning-critical));
        return mixHex(warningColor, criticalColor, (critical-value)/Math.max(1,critical));
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
          'emoji-right': scope.cfg.survivalEmojiMode === 'right',
          'emoji-replace': scope.cfg.survivalEmojiMode === 'replace'
        };
      };

      // Pop only when SAFE/CAUTION/DANGER/CRITICAL/NO CHANCE actually changes.
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

      // =====================================================
      // v5.1 — ON/OFF per rrumullakat e makinave
      // Fshehja eshte thjesht vizuale: motori i demit dhe
      // Survival Chance vazhdojne te punojne normalisht.
      // =====================================================
      scope.vehiclesVisible = function() {
        return scope.cfg.vehiclesOn !== false;
      };
      scope.toggleVehicles = function() {
        scope.cfg.vehiclesOn = !scope.vehiclesVisible();
        scope.persist();
      };
      scope.toggleSurvival = function() {
        scope.cfg.survivalOn = !scope.cfg.survivalOn;
        if (scope.cfg.survivalOn) scope.survival.visible = true;
        scope.persist();
      };
      scope.survivalOnly = function() {
        scope.cfg.vehiclesOn = false;
        scope.cfg.survivalOn = true;
        scope.survival.visible = true;
        scope.persist();
      };
      scope.showVehiclesAgain = function() {
        scope.cfg.vehiclesOn = true;
        scope.persist();
      };

      scope.survivalClass = function() {
        var cls = {};
        cls['font-narrow'] = scope.cfg.survivalFontFamily === 'narrow';   // v5.1: Futura Extra Bold -> Arial Narrow
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
          color:col,
          fontWeight:scope.cfg.survivalFontWeight || '900',
          WebkitTextStroke:Math.max(0, Number(scope.cfg.survivalOutline) || 0)+'px rgba(0,0,0,.60)',
          textShadow:'0 3px 3px rgba(0,0,0,.88),0 0 '+glow+'px '+col,
          animationDuration:Math.max(220,Number(scope.cfg.survivalRollDuration)||430)+'ms'
        };
      };

      scope.survivalOldStyle = function() {
        return {
          color:scope.survivalColor(),
          animationDuration:Math.max(220,Number(scope.cfg.survivalRollDuration)||430)+'ms'
        };
      };

      scope.survivalStatusStyle = function() {
        return {
          color:scope.survivalColor(),
          fontSize:Math.max(.12,Math.min(.80,Number(scope.cfg.survivalStatusSize)||.28))+'em',
          letterSpacing:Math.max(0,Math.min(.45,Number(scope.cfg.survivalStatusSpacing)||0))+'em',
          fontWeight:scope.cfg.survivalStatusWeight||'900'
        };
      };

      scope.survivalDeltaStyle = function(opacity, scale) {
        return {
          color:scope.cfg.survivalDeltaColor||'#ff8a32',
          fontSize:Math.max(.20,Math.min(1.10,Number(scope.cfg.survivalDeltaSize)||.42))+'em',
          opacity:opacity,
          transform:'scale('+(scale||1)+')',
          animationDuration:Math.max(300,Number(scope.cfg.survivalDeltaDuration)||850)+'ms'
        };
      };

      scope.survivalMeterStyle = function() {
        return { width: Math.max(0, Math.min(100, scope.survivalVisualValue())) + '%', background: scope.survivalColor() };
      };

      scope.startSurvivalDrag = function(evt) {
        if (!scope.cfg.survivalEditPosition || !evt) return;
        evt.preventDefault(); evt.stopPropagation();
        measureViewport();
        function move(ev) {
          scope.$applyAsync(function() {
            scope.cfg.survivalPosX = Math.max(0, Math.min(100, ev.clientX / Math.max(1, scope.viewport.w) * 100));
            scope.cfg.survivalPosY = Math.max(0, Math.min(100, ev.clientY / Math.max(1, scope.viewport.h) * 100));
          });
        }
        function up() {
          $document.off('mousemove', move); $document.off('mouseup', up); scope.persist();
        }
        $document.on('mousemove', move); $document.on('mouseup', up);
      };

      scope.resetSurvival = function() {
        angular.forEach(scope.cfg.items, function(it) { if (it) it.survivalChance = 100; });
        scope.survival.deltaVisible = false; scope.survival.pulse = false; scope.survival.rolling = false; scope.survival.visible = true; syncSurvivalDisplay(); scope.persist();
      };

      scope.testSurvivalDrop = function() {
        var it = activeCostItem(); if (!it) return;
        var old = Number(it.survivalChance); if (!isFinite(old)) old = 100;
        var next = Math.max(0, old - 5); it.survivalChance = next; animateSurvivalDisplay(next); showSurvivalDelta(old-next, old); scope.persist();
      };

      // ---- legacy/internal cost values ----
      scope.currentCost = function() {
        var it = scope.cfg.items[scope.selected];
        return it ? (Number(it.costNow) || 0) : 0;
      };

      scope.costOfItem = function(item) {
        return item ? (Number(item.costNow) || 0) : 0;
      };

      scope.formatMoney = function(v) {
        v = Math.round(Number(v) || 0);
        var cur = scope.cfg.costCurrency || '$';
        if (scope.cfg.costCompactText) {
          if (v >= 1000000) return cur + (v/1000000).toFixed(1) + 'M';
          if (v >= 1000) return cur + (v/1000).toFixed(v >= 10000 ? 0 : 1) + 'K';
        }
        return cur + v.toLocaleString('en-US');
      };

      scope.costText = function() {
        // nese po ndjek nje rreth te markuar, trego koston e atij
        if (scope.costFollowIdx >= 0) {
          var f = scope.cfg.items[scope.costFollowIdx];
          if (f) return scope.formatMoney(f.costNow);
        }
        return scope.formatMoney(scope.currentCost());
      };

      scope.costTotal = function() {
        var t = 0;
        angular.forEach(scope.cfg.items, function(it) {
          if (it && it.enabled !== false) t += (Number(it.costNow) || 0);
        });
        return t;
      };

      scope.costVisible = function () {
        // v3.4: kur aktivizohet shiriti i madh, ne qender shfaqet VETEM
        // progress line — pa kartelë, pa sfond te zi dhe pa tekst te madh.
        return scope.cfg.costOn === true && scope.cfg.costBigOn === true;
      };

      // ---- pozicionimi ----
      // Normalisht: ne mes poshte rratheve.
      // Kur shtypet PASS/FAIL: kalon mbi ate rreth per disa sekonda.
      function itemCenter(idx) {
        var n = 0, order = [];
        angular.forEach(scope.cfg.items, function(it, i) {
          if (it && it.enabled !== false) { order.push(i); n++; }
        });
        var pos = order.indexOf(idx);
        if (pos < 0) return null;

        var lay = scope.cfg.layout || 'row';
        var size = Number(scope.cfg.itemSize) || 112;
        var gap  = Number(scope.cfg.gap) || 0;
        var cols = n, row = 0, col = pos;

        if (lay === 'column') { cols = 1; row = pos; col = 0; }
        else if (lay === 'grid') {
          cols = Math.max(1, Number(scope.cfg.gridCols) || 4);
          row = Math.floor(pos / cols);
          col = pos % cols;
        }

        var x = Number(scope.cfg.positionX || 0) + col * (size + gap) + size / 2;
        var y = Number(scope.cfg.positionY || 0) + row * (size + gap);
        return { x: x, y: y, size: size };
      }

      scope.costStyle = function () {
        // v3.4: progress line clean, transparent, pa card/sfond.
        var scale = scope.cost.pulse ? 1.04 : 1;
        var left = Number(scope.cfg.costPosX || 50) + '%';
        var top  = Number(scope.cfg.costPosY || 80) + '%';
        if (scope.cfg.costAuto) {
          var n = 0;
          angular.forEach(scope.cfg.items, function (it) { if (it && it.enabled !== false) n++; });
          if (n < 1) n = 1;
          var lay = scope.cfg.layout || 'row';
          var cols = n, rows = 1;
          if (lay === 'column') { cols = 1; rows = n; }
          else if (lay === 'grid') {
            cols = Math.max(1, Number(scope.cfg.gridCols) || 4);
            rows = Math.ceil(n / cols);
            if (n < cols) cols = n;
          }
          var size = Number(scope.cfg.itemSize) || 112;
          var gap  = Number(scope.cfg.gap) || 0;
          var labelH = scope.cfg.showLabels ? (Number(scope.cfg.labelSize) || 13) + 12 : 0;
          var hudW = cols * size + (cols - 1) * gap;
          var hudH = rows * size + (rows - 1) * gap + labelH;
          left = Math.round(Number(scope.cfg.positionX || 0) + hudW / 2) + 'px';
          top = Math.round(Number(scope.cfg.positionY || 0) + hudH + Number(scope.cfg.costGap || 40)) + 'px';
          return { left:left, top:top, transform:'translateX(-50%) scale(' + scale + ')' };
        }
        return { left:left, top:top, transform:'translate(-50%, -50%) scale(' + scale + ')' };
      };

      scope.costLabelStyle = function () {
        return {
          fontSize: Math.max(9, Math.round(Number(scope.cfg.costSize || 64) * 0.34)) + 'px',
          color: scope.cfg.costLabelColor || '#ffffff'
        };
      };

      scope.costValueStyle = function () {
        return {
          display: 'none'
        };
      };

      scope.costBarColor = function () {
        var it = activeCostItem();
        var now = it ? Math.max(0, Number(it.costNow) || 0) : 0;
        // Smooth 4-stage transition: green -> yellow -> orange -> red.
        var stops = [
          {v:0, c:[61,255,136]},
          {v:3000, c:[220,255,70]},
          {v:7000, c:[255,175,55]},
          {v:10000, c:[255,70,70]}
        ];
        if (now >= 10000) return '#ff4646';
        var a=stops[0], b=stops[1];
        for (var i=0;i<stops.length-1;i++) {
          if (now >= stops[i].v && now <= stops[i+1].v) { a=stops[i]; b=stops[i+1]; break; }
        }
        var t=(now-a.v)/Math.max(1,b.v-a.v);
        var rgb=a.c.map(function(x,j){ return Math.round(x+(b.c[j]-x)*t); });
        return 'rgb('+rgb.join(',')+')';
      };

      scope.costBarStyle = function () {
        var it = activeCostItem();
        var max = it ? Math.max(1, Number(it.costMax) || 1) : 1;
        var now = it ? Math.max(0, Number(it.costNow) || 0) : 0;
        var col = scope.costBarColor();
        return {
          width: Math.max(0, Math.min(100, (now / max) * 100)) + '%',
          background: col,
          boxShadow: scope.cfg.costGlow === false ? 'none' : '0 0 12px ' + col,
          transition: 'width 220ms cubic-bezier(.22,1,.36,1), background 500ms ease, box-shadow 500ms ease'
        };
      };

      // kostoja e vogel nen secilin rreth
      scope.circleCostStyle = function(item) {
        var top = scope.cfg.showLabels ? (Number(scope.cfg.labelSize) || 13) + 12 : 6;
        var col = scope.cfg.costCircleColor || scope.cfg.costColor || '#3dff88';
        if (scope.cfg.costColorByState && item) {
          if (item.state === 'pass') col = scope.cfg.costPassColor || '#3dff88';
          else if (item.state === 'fail') col = scope.cfg.costFailColor || '#ff5b5b';
        }
        return {
          marginTop: top + 'px',
          fontSize: Math.max(10, Math.round(Number(scope.cfg.itemSize || 112) * 0.16)) + 'px',
          color: col
        };
      };

      // ---- reset ----
      scope.resetCost = function() {
        engineLua("if extensions.creatorpack and extensions.creatorpack.resetCost then "
                + "extensions.creatorpack.resetCost() end");
        costLast = 0;
        angular.forEach(scope.cfg.items, function(it, idx) {
          if (it) { it.costNow = 0; it.damageRatio = 0; it.damagePulse = false; it.visited = idx === 0; it.survivalChance = 100; it.costLocked = false; }
        });
        scope.costFollowIdx = -1;
        syncSurvivalDisplay();
        scope.persist();
      };

      // v3.1.4: helper i perbashket (function declaration -> hoisted, i
      // perdorshem edhe nga next()/prev() qe ndodhen me poshte ne skedar).
      function releaseFollow() {
        if (followTimer) { try { $timeout.cancel(followTimer); } catch (e) {} }
        scope.costFollowIdx = -1;
      }

      // v3.1.2: hiq etiketen ngjitese nga rrethi (pa prekur vlerat)
      scope.clearCostFollow = function() {
        if (followTimer) { try { $timeout.cancel(followTimer); } catch (e) {} }
        scope.costFollowIdx = -1;
      };

      // v3.1.4: zero VETEM kostot, shenjat PASS/FAIL mbeten
      scope.resetAllCosts = function() {
        angular.forEach(scope.cfg.items, function(it, idx) {
          it.costNow = 0;
          it.damageRatio = 0;
          it.damagePulse = false;
          it.visited = idx === 0;
          it.survivalChance = 100;
          it.costLocked = false;
        });
        costLast = 0;
        releaseFollow();
        engineLua("if extensions.creatorpack and extensions.creatorpack.resetCost then "
                + "extensions.creatorpack.resetCost() end");
        syncSurvivalDisplay();
        scope.persist();
      };

      scope.resetCostOne = function(item) {
        if (!item) return;
        item.costNow = 0;
        item.damageRatio = 0;
        item.damagePulse = false;
        item.visited = true;
        item.survivalChance = 100;
        item.costLocked = false;
        costLast = 0;
        engineLua("if extensions.creatorpack and extensions.creatorpack.resetCost then "
                + "extensions.creatorpack.resetCost() end");
        scope.persist();
      };

      scope.applyMaxToAll = function() {
        var v = Number(scope.cfg.costDefaultMax) || 0;
        angular.forEach(scope.cfg.items, function(it) { if (it) it.costMax = v; });
        scope.persist();
      };

      // =====================================================
      // UNDO (Ctrl+Z)
      // =====================================================
      var undoStack = [];
      var UNDO_MAX = 40;

      function pushUndo(label) {
        try {
          undoStack.push({
            label: label || 'veprim',
            states: scope.cfg.items.map(function(it) { return it.state; }),
            selected: scope.selected
          });
          if (undoStack.length > UNDO_MAX) undoStack.shift();
        } catch (e) {}
      }

      scope.canUndo = function() { return undoStack.length > 0; };

      scope.undo = function() {
        var snap = undoStack.pop();
        if (!snap) return;
        angular.forEach(scope.cfg.items, function(it, i) {
          if (snap.states[i] !== undefined) {
            it.state = snap.states[i];
            if (it.state === 'pending') it.costLocked = false;
          }
        });
        scope.costFollowIdx = -1;
        scope.selected = snap.selected;
        scope.persist();
      };

      // =====================================================
      // PRESETS
      // =====================================================
      scope.presetName = '';

      // Cka ruhet ne preset: pamja/stili, JO fotot dhe JO rezultatet
      var PRESET_FIELDS = ['positionX','positionY','panelX','panelY','itemSize','gap','imageScale',
        'showArrows','showMarks','markSize','circleShape','outlineWidth','glow',
        'pendingFillOpacity','pendingOutlineOpacity','fxPosX','fxPosY','fxScale',
        'theme','layout','gridCols','animLevel','showLabels','labelSize',
        'costOn','costAuto','costPosX','costPosY','costGap','costSize','costLabel',
        'costLabelText','costCurrency','costColor','costLabelColor','costPulse',
        'costStick','costCircleColor','costColorByState','costPassColor','costFailColor',
        'costBigOn','costSens',
        'costPerCircle','costFollowMark','costFollowMs','costDefaultMax','costAutoMax','costVehicleFactor',
        'costStyleClass','costFontWeight','costCurve','costMinDamage','costShowBar','costCompactText','costGlow',
        'costPosX','costPosY','costSize','costGap','costLabel','costPulse','costCurrency','costLabelText',
        'hudDensity','theme','itemSize','gap','outlineWidth','glow','showArrows','showLabels','showMarks','markSize',
        'showMiniButton','soundOn',
        'vehiclesOn','vehiclesKey',
        'survivalOn','survivalPosX','survivalPosY','survivalSize','survivalSensitivity',
        'survivalLabelText','survivalLabelColor','survivalValueColor','survivalDeltaColor','survivalDynamicColor',
        'survivalWarningColor','survivalCriticalColor','survivalColorProfileVersion','survivalWarningThreshold','survivalCriticalThreshold',
        'survivalLayout','survivalBackground','survivalBackgroundColor','survivalBackgroundOpacity',
        'survivalShowLabel','survivalShowStatus','survivalStatusSize','survivalStatusSpacing','survivalStatusWeight','survivalStatusPosition','survivalStatusPulse','survivalEmojiOn','survivalEmojiMode','survivalEmojiSize','survivalEmojiPop','survivalEmojiProfileVersion',
        'survivalShowMeter','survivalShowPercent','survivalLabelScale',
        'survivalFontFamily','survivalFontWeight','survivalItalic','survivalOutline','survivalGlow','survivalDecimals',
        'survivalShowDelta','survivalDeltaDuration','survivalDeltaMin','survivalDeltaPosition','survivalDeltaSize','survivalDeltaGhosts','survivalRollingCounter','survivalRollDuration','survivalSmoothTime','survivalAnimationProfileVersion',
        'survivalImpactShake','survivalLowPulse','survivalDisplayMode','survivalAutoHideMs','survivalDangerShowAt',
        'survivalFormula','survivalDamageWeight','survivalImpactWeight','survivalSpeedWeight','survivalMinAlive'];

      scope.savePreset = function() {
        var name = (scope.presetName || '').trim();
        if (!name) { scope.storageWarning = 'Shkruaj nje emer per preset-in.'; return; }
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
      // EXPORT / IMPORT
      // =====================================================
      scope.exportText = '';
      scope.importText = '';

      scope.buildExport = function() {
        var out = angular.extend({}, scope.cfg);
        // hiq fotot base64 qe teksti te mos jete gjigant
        out.items = (scope.cfg.items || []).map(function(it) {
          var c = angular.extend({}, it);
          c.image = it.image ? '[image]' : '';
          return c;
        });
        scope.exportText = JSON.stringify(out, null, 2);
      };

      scope.applyImport = function() {
        try {
          var parsed = JSON.parse(scope.importText);
          if (!parsed || typeof parsed !== 'object') throw new Error('bad');
          // ruaj fotot ekzistuese
          var oldImages = (scope.cfg.items || []).map(function(it) { return it.image; });
          scope.cfg = normalizeConfig(parsed, defaults());
          angular.forEach(scope.cfg.items, function(it, i) {
            if (it.image === '[image]' || !it.image) it.image = oldImages[i] || '';
          });
          scope.selected = 0;
          scope.persist();
          scope.storageWarning = 'Konfigurimi u importua.';
        } catch (e) {
          scope.storageWarning = 'Teksti nuk eshte JSON i vlefshem.';
        }
      };

      scope.exportResults = function() {
        var lines = ['#,Emri,Rezultati'];
        angular.forEach(scope.cfg.items, function(it, i) {
          if (it.enabled === false) return;
          lines.push((i + 1) + ',"' + String(it.label || '').replace(/"/g, '""') + '",' + (it.state || 'pending'));
        });
        lines.push('');
        var np = 0, nf = 0;
        angular.forEach(scope.cfg.items, function(it) {
          if (!it || it.enabled === false) return;
          if (it.state === 'pass') np++;
          else if (it.state === 'fail') nf++;
        });
        var done = np + nf;
        lines.push('PASS,' + np);
        lines.push('FAIL,' + nf);
        lines.push('Perqindja,' + (done > 0 ? Math.round((np / done) * 100) : 0) + '%');
        scope.exportText = lines.join('\n');
      };

      scope.select = function(i) {
        scope.selected = i;
        if (scope.cfg.items[i]) scope.cfg.items[i].visited = true;
        syncSurvivalDisplay();
        // Kur zgjedh nje makine tjeter, kostoja ne mes i perket asaj makine,
        // jo rrethit te makines se kaluar.
        releaseFollow();
        costLast = Number((scope.cfg.items[i] && scope.cfg.items[i].costNow) || 0);
        scope.persist();
      };

      scope.addItem = function() {
        var idx = scope.cfg.items.length + 1;
        scope.cfg.items.push({
          label: 'Makina ' + idx,
          image: '',
          enabled: true,
          state: 'pending',
          imageScale: scope.cfg.imageScale || 1.0,
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageRotation: 0,
          costMax: Number(scope.cfg.costDefaultMax) || 10000,
          costNow: 0,
          damageRatio: 0,
          damagePulse: false,
          visited: true,
          survivalChance: 100,
          costLocked: false
        });
        scope.selected = scope.cfg.items.length - 1;
        scope.persist();
      };

      scope.removeItem = function(index) {
        if (scope.cfg.items.length <= 1) return;
        scope.cfg.items.splice(index, 1);
        if (scope.selected >= scope.cfg.items.length) scope.selected = scope.cfg.items.length - 1;
        scope.persist();
      };

      scope.moveItem = function(index, delta) {
        var j = index + delta;
        if (j < 0 || j >= scope.cfg.items.length) return;
        var tmp = scope.cfg.items[index];
        scope.cfg.items[index] = scope.cfg.items[j];
        scope.cfg.items[j] = tmp;
        if (scope.selected === index) scope.selected = j;
        else if (scope.selected === j) scope.selected = index;
        scope.persist();
      };

      scope.resetStates = function() {
        pushUndo('reset');
        angular.forEach(scope.cfg.items, function(item, idx) {
          item.state = 'pending';
          item.markedAt = null;
          item.costNow = 0;
          item.damageRatio = 0;
          item.damagePulse = false;
          item.visited = idx === 0;
          item.survivalChance = 100;
          item.costLocked = false;
        });
        costLast = 0;
        scope.costFollowIdx = -1;
        scope.selected = 0;
        syncSurvivalDisplay();
        scope.persist();
      };

      scope.clearAllImages = function() {
        angular.forEach(scope.cfg.items, function(item) {
          item.image = '';
        });
        scope.persist();
      };

      scope.togglePanel = function() {
        scope.cfg.showPanel = !scope.cfg.showPanel;
        scope.persist();
      };

      scope.openPanel = function() {
        scope.cfg.showPanel = true;
        scope.persist();
      };

      scope.closePanel = function() {
        scope.cfg.showPanel = false;
        scope.persist();
      };

      scope.hudStyle = function() {
        var st = {
          left: Number(scope.cfg.positionX || 0) + 'px',
          top: Number(scope.cfg.positionY || 0) + 'px',
          gap: Number(scope.cfg.gap || 0) + 'px'
        };

        var lay = scope.cfg.layout || 'row';
        if (lay === 'grid') {
          var cols = Math.max(1, Number(scope.cfg.gridCols) || 4);
          st.display = 'grid';
          st.gridTemplateColumns = 'repeat(' + cols + ', auto)';
          st.alignItems = 'center';
          st.justifyItems = 'center';
        } else if (lay === 'column') {
          st.display = 'flex';
          st.flexDirection = 'column';
          st.alignItems = 'center';
        } else {
          st.display = 'flex';
          st.flexDirection = 'row';
          st.alignItems = 'flex-start';
        }
        return st;
      };


      scope.panelStyle = function() {
        return {
          left: Number(scope.cfg.panelX || 18) + 'px',
          top: Number(scope.cfg.panelY || 112) + 'px'
        };
      };

      scope.startPanelDrag = function(evt) {
        if (!evt || (evt.target && evt.target.closest && evt.target.closest('button,input,select,label'))) return;
        var startX = evt.clientX;
        var startY = evt.clientY;
        var baseX = Number(scope.cfg.panelX || 18);
        var baseY = Number(scope.cfg.panelY || 112);
        function move(ev) {
          scope.$applyAsync(function() {
            scope.cfg.panelX = Math.max(0, baseX + (ev.clientX - startX));
            scope.cfg.panelY = Math.max(0, baseY + (ev.clientY - startY));
            scope.persist();
          });
        }
        function up() {
          $document.off('mousemove', move);
          $document.off('mouseup', up);
        }
        $document.on('mousemove', move);
        $document.on('mouseup', up);
        if (evt.preventDefault) evt.preventDefault();
      };

      scope.itemStyle = function(item) {
        var size = Number(scope.cfg.itemSize || 112);
        var radius = '50%';
        if (String(scope.cfg.circleShape).toLowerCase() === 'rounded') radius = '18px';
        if (String(scope.cfg.circleShape).toLowerCase() === 'square') radius = '0px';

        var borderColor = 'rgba(255,255,255,' + Number(scope.cfg.pendingOutlineOpacity || 0.08) + ')';
        var boxShadow = '0 0 ' + Number(scope.cfg.glow || 8) + 'px rgba(0,0,0,0.12)';

        if (item.state === 'pass') {
          borderColor = 'rgba(104,255,164,0.98)';
          boxShadow = '0 0 ' + Number(scope.cfg.glow || 8) + 'px rgba(104,255,164,0.28)';
        } else if (item.state === 'fail') {
          borderColor = 'rgba(255,88,88,0.98)';
          boxShadow = '0 0 ' + Number(scope.cfg.glow || 8) + 'px rgba(255,88,88,0.25)';
        }

        return {
          width: size + 'px',
          height: size + 'px',
          borderRadius: radius,
          borderWidth: Number(scope.cfg.outlineWidth || 4) + 'px',
          borderColor: borderColor,
          boxShadow: boxShadow,
          opacity: item.enabled === false ? 0.18 : (((item.state === 'pass' || item.state === 'fail') || (scope.selected === scope.cfg.items.indexOf(item))) ? 1 : 0.38),
          background: 'rgba(0,0,0,' + Number(scope.cfg.pendingFillOpacity || 0.16) + ')'
        };
      };

      scope.imageStyle = function(item) {
        var scale = item.imageScale != null ? item.imageScale : scope.cfg.imageScale || 1.0;
        var percent = Math.round(scale * 100);
        var ox = Number(item.imageOffsetX || 0);
        var oy = Number(item.imageOffsetY || 0);
        return {
          width: percent + '%',
          height: percent + '%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) translate(' + ox + 'px,' + oy + 'px)'
        };
      };


      scope.imageBgStyle = function(item) {
        var scale = item.imageScale != null ? item.imageScale : scope.cfg.imageScale || 1.0;
        var ox = Number(item.imageOffsetX || 0);
        var oy = Number(item.imageOffsetY || 0);
        var rot = Number(item.imageRotation || 0);
        var idx = scope.cfg.items.indexOf(item);
        var active = idx === scope.selected;
        var finalScale = scale * 1.55 * (active ? 1.10 : 1.0);
        return {
          backgroundImage: item.image ? ('url(' + item.image + ')') : 'none',
          backgroundSize: Math.round(finalScale * 100) + '%',
          backgroundPosition: 'calc(50% + ' + ox + 'px) calc(50% + ' + oy + 'px)',
          opacity: ((item.state === 'pass' || item.state === 'fail') || active) ? 1 : 0.45,
          transform: 'translateZ(0) rotate(' + rot + 'deg)'
        };
      };



      scope.fxMarkStyle = function() {
        var base = Number(scope.cfg.itemSize || 112) * 0.92 * Number(scope.cfg.fxScale || 1.0);
        return {
          left: Number(scope.cfg.fxPosX || 50) + '%',
          top: Number(scope.cfg.fxPosY || 24) + '%',
          fontSize: Math.round(base) + 'px'
        };
      };

      scope.triggerOverlayFx = function(type) {
        scope.fx.show = false;
        scope.fx.type = type;
        if (fxTimer) {
          try { $timeout.cancel(fxTimer); } catch (e) {}
          fxTimer = null;
        }
        $timeout(function() {
          scope.fx.type = type;
          scope.fx.show = true;
        }, 10, false);
        fxTimer = $timeout(function() {
          scope.fx.show = false;
          fxTimer = $timeout(function() {
            scope.fx.type = null;
          }, 260, false);
        }, 2300, false);
      };

      scope.stateClass = function(item, index) {
        var cls = 'pf-item';
        cls += ' state-' + (item.state || 'pending');
        if (index === scope.selected) cls += ' is-selected';
        if (item && item.pulse) cls += ' pf-pulse';
        if (item && item.damagePulse) cls += ' damage-hit';
        if (item.enabled === false) cls += ' is-disabled';
        return cls;
      };

      // v3.2.1 AUDIO FIX:
      // Perdoren skedaret MP3 te perfshire ne mod ne vend te WebAudio synth.
      // Kjo shmang problemet e AudioContext/autoplay ne CEF dhe ben qe
      // PASS/FAIL te kene efektet reale te zerit qe jane ne paket.
      var PF_SOUND_URLS = {
        pass: '/ui/modules/apps/CreatorPack/pass.mp3',
        fail: '/ui/modules/apps/CreatorPack/fail.mp3'
      };
      var pfSounds = {};

      function initPFSounds() {
        try {
          if (!$window.Audio) return;
          angular.forEach(PF_SOUND_URLS, function(url, kind) {
            var a = new $window.Audio();
            a.preload = 'auto';
            a.src = url;
            a.load();
            pfSounds[kind] = a;
          });
        } catch (e) {}
      }

      initPFSounds();

      function playPFSound(kind) {
        try {
          var base = pfSounds[kind];
          if (!base) return false;

          // Klonimi lejon tingullin te rifilloje edhe nese nje efekt tjeter
          // eshte ende duke u luajtur.
          var audio = base.cloneNode(true);
          audio.volume = 1.0;
          var p = audio.play();
          if (p && p.catch) p.catch(function() {
            // Fallback te objekti i preload-uar.
            try {
              base.currentTime = 0;
              base.volume = 1.0;
              var bp = base.play();
              if (bp && bp.catch) bp.catch(function(){});
            } catch (x) {}
          });
          return true;
        } catch (e) {
          return false;
        }
      }

      function beep(kind) {
        if (!scope.cfg.soundOn) return;
        playPFSound(kind);
      }

      scope.testSound = function(kind) { playPFSound(kind); };

      scope.markState = function(state, index) {
        if (index === undefined || index === null) index = scope.selected;
        var item = scope.cfg.items[index];
        if (!item || item.enabled === false) return;

        pushUndo('mark');
        item.state = state;
        item.markedAt = Date.now();

        // v3.1: ngrij koston e kesaj makine dhe coje etiketen mbi ate rreth
        item.costLocked = true;
        costLast = 0;   // makina tjeter fillon nga e para

        if (scope.cfg.costOn && scope.cfg.costFollowMark) {
          scope.costFollowIdx = index;
          if (followTimer) { try { $timeout.cancel(followTimer); } catch (e) {} }
          // v3.1.2: me costStick, etiketa MBETET mbi ate rreth pa afat.
          if (!scope.cfg.costStick) {
            followTimer = $timeout(function() {
              scope.costFollowIdx = -1;
            }, Math.max(400, Number(scope.cfg.costFollowMs) || 2500));
          }
        }

        // dem i ri per makinen tjeter
        engineLua("if extensions.creatorpack and extensions.creatorpack.resetCost then "
                + "extensions.creatorpack.resetCost() end");

        beep(state);
        scope.triggerOverlayFx(state);

        // pulsim i shkurter mbi item-in e markuar
        if (scope.cfg.animLevel !== 'off') {
          item.pulse = true;
          $timeout(function() { item.pulse = false; }, 420);
        }

        // kalo automatikisht te itemi tjeter i pamarkuar
        if (scope.cfg.autoAdvance) {
          var nextIdx = findNextPending(index);
          if (nextIdx !== -1) {
            scope.selected = nextIdx;
            scope.cfg.items[nextIdx].visited = true;
            syncSurvivalDisplay();
            // Mos e leme koston e makines se kaluar ne qender.
            // Makina e re duhet ta shfaqe koston e vet (zakonisht $0).
            releaseFollow();
            costLast = Number(scope.cfg.items[nextIdx].costNow || 0);
          }
        }

        scope.persist();
      };

      function findNextPending(from) {
        var n = scope.cfg.items.length;
        for (var step = 1; step <= n; step++) {
          var i = (from + step) % n;
          var it = scope.cfg.items[i];
          if (it && it.enabled !== false && it.state === 'pending') return i;
        }
        return -1;
      }

      scope.prev = function() {
        scope.selected = Math.max(0, scope.selected - 1);
        if (scope.cfg.items[scope.selected]) scope.cfg.items[scope.selected].visited = true;
        syncSurvivalDisplay();
        releaseFollow();
        costLast = Number((scope.cfg.items[scope.selected] && scope.cfg.items[scope.selected].costNow) || 0);
        scope.persist();
      };

      scope.next = function() {
        scope.selected = Math.min(scope.cfg.items.length - 1, scope.selected + 1);
        if (scope.cfg.items[scope.selected]) scope.cfg.items[scope.selected].visited = true;
        syncSurvivalDisplay();
        releaseFollow();
        costLast = Number((scope.cfg.items[scope.selected] && scope.cfg.items[scope.selected].costNow) || 0);
        scope.persist();
      };

      scope.syncGlobalImageScale = function() {
        angular.forEach(scope.cfg.items, function(item) {
          if (item.imageScale === undefined || item.imageScale === null) item.imageScale = scope.cfg.imageScale;
        });
        scope.persist();
      };

      scope.clearSavedSettings = function() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        scope.cfg = defaults();
        scope.selected = 0;
        syncSurvivalDisplay();
        scope.persist();
      };

      scope.keySummary = function() {
        return 'PASS K · FAIL L · PREV PageUp / Numpad4 · NEXT PageDown / Numpad6 · RESET G · PANEL H · RRETHET ON/OFF ' + (scope.cfg.vehiclesKey || 'V').toUpperCase();
      };


      var unsubPfhudAction = $rootScope.$on('pfhud.action', function(e, data) {
        if (!data || !data.action) return;
        if (data.action === 'pass') scope.markState('pass');
        else if (data.action === 'fail') scope.markState('fail');
        else if (data.action === 'next') scope.next();
        else if (data.action === 'prev') scope.prev();
        else if (data.action === 'reset') scope.resetStates();
        else if (data.action === 'togglePanel') scope.togglePanel();
        // v2.1: veprime te reja nga bindings-at
        else if (data.action === 'undo') scope.undo();
        else if (data.action === 'toggleGuides') {
          scope.cfg.guidesOn = !scope.cfg.guidesOn;
          scope.persist();
        }
        // v5.1: ON/OFF i rrumullakateve nga bindings (Options -> Controls)
        else if (data.action === 'toggleVehicles') scope.toggleVehicles();
        scope.$applyAsync();
      });

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

        if (conf === 'arrowleft') return key === 'arrowleft' || code === 'arrowleft' || keyCode === 37;
        if (conf === 'arrowright') return key === 'arrowright' || code === 'arrowright' || keyCode === 39;
        if (conf === 'arrowup') return key === 'arrowup' || code === 'arrowup' || keyCode === 38;
        if (conf === 'arrowdown') return key === 'arrowdown' || code === 'arrowdown' || keyCode === 40;
        if (conf === 'pageup' || conf === 'pgup') return key === 'pageup' || code === 'pageup' || keyCode === 33;
        if (conf === 'pagedown' || conf === 'pgdn' || conf === 'pgdown') return key === 'pagedown' || code === 'pagedown' || keyCode === 34;
        if (conf === 'numpad4' || conf === 'num4') return key === '4' || code === 'numpad4' || keyCode === 100;
        if (conf === 'numpad6' || conf === 'num6') return key === '6' || code === 'numpad6' || keyCode === 102;

        return false;
      }

      function handleHotkey(e) {
        if (!scope.cfg.useHotkeys) return;
        if (isTypingTarget(e.target)) return;

        var handled = false;

        // Ctrl+Z = Undo
        if ((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'z') {
          scope.$applyAsync(function(){ scope.undo(); });
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        if (keyMatches(e, scope.cfg.togglePanelKey)) {
          scope.$applyAsync(function(){ scope.togglePanel(); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.vehiclesKey)) {
          scope.$applyAsync(function(){ scope.toggleVehicles(); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.passKey)) {
          scope.$applyAsync(function(){ scope.markState('pass'); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.failKey)) {
          scope.$applyAsync(function(){ scope.markState('fail'); });
          handled = true;
        } else if (keyMatches(e, 'PageDown') || keyMatches(e, 'Numpad6') || keyMatches(e, scope.cfg.nextKey)) {
          scope.$applyAsync(function(){ scope.next(); });
          handled = true;
        } else if (keyMatches(e, 'PageUp') || keyMatches(e, 'Numpad4') || keyMatches(e, scope.cfg.prevKey)) {
          scope.$applyAsync(function(){ scope.prev(); });
          handled = true;
        } else if (keyMatches(e, scope.cfg.resetKey)) {
          scope.$applyAsync(function(){ scope.resetStates(); });
          handled = true;
        }

        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // FIX v2.0: me pare i njejti handler ishte i lidhur me keydown + keyup +
      // keypress njekohesisht, ne 3 target-e (node, $document, $window). Nje
      // shtypje e vetme e tastit e thirrte handler-in 2-3 here, keq per 'next'
      // (kercente 2 pozicione) dhe per markimet. Tani: VETEM keydown, dhe
      // vetem ne $document (qe i kap edhe eventet nga node-i permes bubbling).
      var node = element && element[0] ? element[0] : null;
      // nis uren e kostos nese moduli eshte i ndezur nga sesioni i kaluar
      if (scope.cfg.costOn) bootCostLua();

      // v3.1.2: tastet dështonin sepse handler-i ishte VETËM në $document.
      // Kur fokusi shkon te canvas-i i lojës (pas rinisjes, ose pasi klikon
      // në botë), dokumenti i UI-së nuk i merr më eventet. Tani dëgjojmë në
      // document, window DHE në vetë node-in, me capture=true, dhe mbrohemi
      // nga dublikimi me një vulë kohore për event.
      var lastHotkeyStamp = 0;
      function hotkeyEntry(e) {
        var stamp = e.timeStamp || Date.now();
        if (stamp === lastHotkeyStamp) return;   // i njejti event nga 2 target-e
        lastHotkeyStamp = stamp;
        return handleHotkey(e);
      }

      $document.on('keydown', hotkeyEntry);
      try { $window.addEventListener('keydown', hotkeyEntry, true); } catch (e) {}
      try { if (node) node.addEventListener('keydown', hotkeyEntry, true); } catch (e) {}

      // Mbaj fokusin te UI-ja: bëje node-in të fokusueshëm dhe rimerre fokusin
      // sa herë përdoruesi prek HUD-in ose panelin.
      $timeout(function() {
        try {
          if (node) {
            node.setAttribute('tabindex', '0');
            node.addEventListener('mousedown', function() {
              try { node.focus({ preventScroll: true }); } catch (x) {}
            }, true);
          }
        } catch (e) {}
      }, 250);

      scope.$on('$destroy', function() {
        if (fxTimer) { try { $timeout.cancel(fxTimer); } catch (e) {} }
        if (unsubPfhudAction) unsubPfhudAction();
        $document.off('keydown', hotkeyEntry);
        try { $window.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        try { if (node) node.removeEventListener('keydown', hotkeyEntry, true); } catch (e) {}
        $window.removeEventListener('resize', onResize);
        if (unsubCost) { try { unsubCost(); } catch(e) {} }
        if (costPulseDelay) { try { clearTimeout(costPulseDelay); } catch(e) {} }
        if (costPulseTimer) { try { clearTimeout(costPulseTimer); } catch(e) {} }
        if (followTimer) { try { $timeout.cancel(followTimer); } catch(e) {} }
        if (survivalPulseTimer) { try { $timeout.cancel(survivalPulseTimer); } catch(e) {} }
        if (survivalDeltaTimer) { try { $timeout.cancel(survivalDeltaTimer); } catch(e) {} }
        if (survivalHideTimer) { try { $timeout.cancel(survivalHideTimer); } catch(e) {} }
        if (survivalShakeTimer) { try { $timeout.cancel(survivalShakeTimer); } catch(e) {} }
        if (survivalRollTimer) { try { $timeout.cancel(survivalRollTimer); } catch(e) {} }
        if (survivalTweenTimer) { try { $timeout.cancel(survivalTweenTimer); } catch(e) {} }
        if (survivalEmojiTimer) { try { $timeout.cancel(survivalEmojiTimer); } catch(e) {} }
        if (unwatchSurvivalEmoji) { try { unwatchSurvivalEmoji(); } catch(e) {} }
        $document.off('click', onDocClickPicker);
      });
    }
  };
}]);
