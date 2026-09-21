-- CreatorPack / HUD PRO — GE Lua extension
-- Autor: daimy
--
-- Ura mes bindings-ave te BeamNG (Options -> Controls) dhe UI app-it.
-- Cdo funksion i dergon nje event UI-se permes guihooks.trigger('pfhud.action', ...),
-- te cilin app.js e degjon me $rootScope.$on('pfhud.action', ...).

local M = {}

-- v3.1.3 RREGULLIM KRITIK: damageBase deklarohej me 'local' POSHTE funksioneve
-- qe e perdornin (resetCost/repairVehicle). Ato shkruanin ne nje variabel
-- GLOBALE tjeter, ndersa damageRatio() lexonte lokalen qe mbetej gjithmone 0.
-- Rrjedhim: "Zero kosten" dhe ndryshimi i makines nuk e zeronin kurre koston.
local damageBase = 0

-- =====================================================
-- Ndihmes
-- =====================================================

-- guihooks ekziston vetem kur UI-ja eshte gati. Nese nje bindings shtypet
-- para se te ngarkohet UI, thirrja e paketuar shmang nje error ne konsole.
local function trigger(action)
  if guihooks == nil or guihooks.trigger == nil then
    log('W', 'creatorpack', 'guihooks nuk eshte gati; veprimi u anashkalua: ' .. tostring(action))
    return
  end
  guihooks.trigger('pfhud.action', { action = action })
end

-- =====================================================
-- Veprimet e HUD PRO (thirren nga pfhud_actions.json)
-- =====================================================

local function pfhudPass()        trigger('pass')        end
local function pfhudFail()        trigger('fail')        end
local function pfhudNext()        trigger('next')        end
local function pfhudPrev()        trigger('prev')        end
local function pfhudReset()       trigger('reset')       end
local function pfhudTogglePanel() trigger('togglePanel') end

-- Shtesa v2.1: Undo dhe guidat, per t'i pasur edhe si bindings
local function pfhudUndo()         trigger('undo')        end
local function pfhudToggleGuides() trigger('toggleGuides') end

-- Shtesa v5.1: ON/OFF i rrumullakateve te makinave (vetem Survival Chance ne ekran)
local function pfhudToggleVehicles() trigger('toggleVehicles') end

-- =====================================================
-- Perputhshmeri me strukturen origjinale te CreatorPack
-- =====================================================

local function setHudVisible(visible)
  if guihooks == nil or guihooks.trigger == nil then return end
  guihooks.trigger('creatorpack.visibility', { visible = visible })
end

local function setSurvivalVisible(visible)
  if guihooks == nil or guihooks.trigger == nil then return end
  guihooks.trigger('creatorpack.survivalVisibility', { visible = visible })
end

local function setSensitivity(value)
  -- rezervuar
end

-- =====================================================
-- v3.0 — REPAIR COST
-- =====================================================
-- Metoda e sakte: map.objects[vehId].damage jep nje numer te vetem
-- direkt ne GE Lua. Vlera shkallezohet me cmimin e makines:
--   career   -> vlera reale e riparimit
--   jbeam    -> raw * Value / 300000
--   fallback -> raw * 0.35

local costEnabled      = false
local costTimer        = 0
local costInterval     = 0.25
local cachedMode       = 'fallback'
local cachedInventoryId = nil
local cachedMultiplier = nil
local cachedVehId      = nil
local cachedVehicleValue = 15000

local function normKey(v)
  if v == nil then return '' end
  v = tostring(v):lower():gsub('\\','/')
  v = v:gsub('%.pc$','')
  v = v:gsub('^vehicles/','')
  return v
end

local function basenameKey(v)
  v = normKey(v)
  return v:match('([^/]+)$') or v
end

local function readConfigValue(cfg)
  if not cfg then return nil end
  local candidates = {
    cfg.Value, cfg.value, cfg['Value'], cfg['value'],
    cfg.config and cfg.config.Value, cfg.config and cfg.config.value
  }
  for _, x in ipairs(candidates) do
    x = tonumber(x)
    if x and x > 0 then return x end
  end
  return nil
end

local function resolveVehicleValue()
  local vehId = be:getPlayerVehicleID(0)
  cachedVehId         = vehId
  cachedMode          = 'fallback'
  cachedInventoryId   = nil
  cachedMultiplier    = nil
  cachedVehicleValue  = 15000
  if not vehId then return end

  if career_career and career_career.isActive()
     and career_modules_inventory and career_modules_valueCalculator then
    local invId = career_modules_inventory.getInventoryIdFromVehicleId(vehId)
    if invId then
      cachedMode        = 'career'
      cachedInventoryId = invId
      -- Vlera e makines pa dem (e perdorim si tavan realist te kostos).
      local okValue, vehicleValue = pcall(career_modules_valueCalculator.getInventoryVehicleValue, invId, true)
      if okValue and tonumber(vehicleValue) and vehicleValue > 0 then
        cachedVehicleValue = tonumber(vehicleValue)
      end
      return
    end
  end

  local veh = be:getObject(vehId)
  if veh and veh.JBeam then
    -- v3.4: Mos u mbeshtet vetem te string parsing i partConfig.
    -- Shume konfigurime/custom cars nuk e japin ne ate format; ne ate rast
    -- e marrim Value nga lista reale e konfigurimeve te BeamNG.
    local rawConfig = veh.partConfig or ''
    local configKey = basenameKey(rawConfig)
    local configNorm = normKey(rawConfig)

    -- v3.5: robust current-config matching. BeamNG config entries can expose
    -- the key as a basename, a vehicles/... path, or a .pc path. The old
    -- exact comparison missed many custom/vanilla configs and fell back to
    -- $30k, which is why the UI kept stopping around $27k.
    local okList, list = pcall(core_vehicles.getConfigList, true)
    if okList and list and list.configs then
      local bestValue, bestScore = nil, -1
      for _, cfg in pairs(list.configs) do
        local model = normKey(cfg.model_key or cfg.model or cfg.JBeam)
        if model == normKey(veh.JBeam) then
          local key = cfg.key or cfg.config_key or cfg.filename or cfg.path
          local value = readConfigValue(cfg)
          if value and value > 0 then
            local kNorm = normKey(key)
            local score = 1
            if kNorm == configNorm or basenameKey(kNorm) == configKey then score = 100 end
            if kNorm ~= '' and (kNorm:find(configKey, 1, true) or configKey:find(basenameKey(kNorm), 1, true)) then score = math.max(score, 50) end
            if score > bestScore then bestScore, bestValue = score, value end
          end
        end
      end
      if bestValue then
        cachedMode         = 'jbeam'
        cachedMultiplier   = bestValue
        cachedVehicleValue = bestValue
        return
      end
    end

    -- Fallback 2: model metadata.
    local okCurrentCfg, currentCfg = pcall(core_vehicles.getCurrentVehicleDetails)
    if okCurrentCfg and currentCfg then
      local direct = readConfigValue(currentCfg) or readConfigValue(currentCfg.config) or readConfigValue(currentCfg.model)
      if direct and direct > 0 then
        cachedMode, cachedMultiplier, cachedVehicleValue = 'jbeam', direct, direct
        return
      end
    end

    local okModel, modelInfo = pcall(core_vehicles.getModel, veh.JBeam)
    if okModel and modelInfo then
      local modelValue = tonumber(modelInfo.Value or modelInfo.value or (modelInfo.model and (modelInfo.model.Value or modelInfo.model.value)))
      if modelValue and modelValue > 0 then
        cachedMode         = 'jbeam'
        cachedMultiplier   = modelValue
        cachedVehicleValue = modelValue
        return
      end
    end

    -- Fallback 3: current vehicle details (works for some vanilla/custom configs).
    local okCurrent, current = pcall(core_vehicles.getCurrentVehicleDetails)
    if okCurrent and current then
      local candidates = {
        current.Value, current.value,
        current.current and current.current.Value,
        current.current and current.current.value,
        current.config and current.config.Value,
        current.config and current.config.value,
        current.model and current.model.Value,
        current.model and current.model.value
      }
      for _, value in ipairs(candidates) do
        value = tonumber(value)
        if value and value > 0 then
          cachedMode         = 'jbeam'
          cachedMultiplier   = value
          cachedVehicleValue = value
          return
        end
      end
    end

    -- Fallback 4: direct config lookup, for older BeamNG builds.
    if configKey then
      local ok, info = pcall(core_vehicles.getConfig, veh.JBeam, configKey)
      if ok and info then
        local value = tonumber(info.Value or info.value)
        if value and value > 0 then
          cachedMode         = 'jbeam'
          cachedMultiplier   = value
          cachedVehicleValue = value
          return
        end
      end
    end
  end
end

local function calcCost()
  local vehId = be:getPlayerVehicleID(0)
  if not vehId then return 0, 'fallback', cachedVehicleValue end
  if vehId ~= cachedVehId then resolveVehicleValue() end

  local obj = map.objects[vehId]
  if not obj then return 0, cachedMode, cachedVehicleValue end
  local raw = obj.damage or 0

  if cachedMode == 'career' and cachedInventoryId then
    local vehicles = career_modules_inventory.getVehicles()
    local info = vehicles and vehicles[cachedInventoryId]
    if info then
      local ok, details = pcall(career_modules_valueCalculator.getRepairDetails, info)
      if ok and details and details.price then
        return math.floor(details.price), 'career', cachedVehicleValue
      end
    end
  end

  if cachedMode == 'jbeam' and cachedMultiplier then
    return math.floor(raw * cachedMultiplier / 300000), 'jbeam', cachedVehicleValue
  end

  return math.floor(raw * 0.35), 'fallback', cachedVehicleValue
end

local function setCostEnabled(v)
  costEnabled = (v == true or v == 'true')
  if costEnabled then resolveVehicleValue() end
end

-- Zeron numeruesin PA e riparuar makinen: mban demin aktual si baze,
-- keshtu qe makina tjeter fillon nga $0 edhe pse trupi mbetet i shtypur.
local function resetCost()
  local vehId = be:getPlayerVehicleID(0)
  if vehId then
    local obj = map.objects[vehId]
    damageBase = (obj and obj.damage) or 0
  else
    damageBase = 0
  end
  if guihooks and guihooks.trigger then
    guihooks.trigger('creatorpack.cost', { cost = 0, ratio = 0, mode = cachedMode, maxValue = cachedVehicleValue })
  end
end

-- Riparon makinen plotesisht dhe zeron gjithcka
local function repairVehicle()
  local vehId = be:getPlayerVehicleID(0)
  if vehId then
    local veh = be:getObject(vehId)
    if veh then veh:queueLuaCommand('beamstate.reset()') end
  end
  damageBase = 0
  if guihooks and guihooks.trigger then
    guihooks.trigger('creatorpack.cost', { cost = 0, ratio = 0, mode = cachedMode, maxValue = cachedVehicleValue })
  end
end

-- v3.1.3: kurba e demit.
-- Me pare: raw/300000 lineare -> nje prekje e vogel jepte tashme mijera dollare
-- dhe cdo perplasje mesatare e ngopte 100%. Tani perdorim nje shkalle shume me
-- te gjere dhe nje kurbe jo-lineare, keshtu qe gervishtjet mbeten te lira dhe
-- vetem shkaterrimi i vertete i afrohet maksimumit.
-- v3.3 — SHKALLA E DEMIT, e nxjerre nga MODI YT ORIGJINAL (v1.1.0).
--
-- Formula jote qe punonte ishte:
--     cost = raw * VleraMakines / 300000
-- Pra raw = 300,000 do te thote "dem sa 100% e vleres se makines",
-- domethene SHKATERRIM TOTAL — jo nje gervishtje.
--
-- Gabimi im ne v3.1.3/v3.1.4: e trajtova 300,000 si vlere te vogel dhe
-- e cova kufirin ne 2.5M e pastaj 12M. Kjo e beri cdo goditje ~$0-2.
-- Me pare (v3.1) e kisha lene 300,000 lineare, qe e ngopte me nje goditje.
--
-- Balanci i sakte: kufi 400,000 (pak mbi shkaterrimin total, qe te kete
-- hapesire per deformim ekstrem) me eksponent te bute 1.35.
--   raw  25,000 (goditje e vogel)   ->  $237   me max 10k
--   raw  60,000 (mesatare)          ->  $772
--   raw 200,000 (e rende)           ->  $3,923
--   raw 400,000 (shkaterrim)        ->  $10,000
local DAMAGE_TOTALLED_RAW = 400000
local DAMAGE_EXP          = 1.25
local damageSens          = 1.0

local function setDamageSensitivity(v)
  v = tonumber(v) or 1
  if v < 0.25 then v = 0.25 end
  if v > 4    then v = 4    end
  damageSens = v
end

-- v4.2 realistic damage percentage:
-- Sensitivity may make the visible percentage respond a little faster/slower,
-- but it can NEVER create 100%. TOTALLED is hard-gated by raw structural
-- damage, so a normal crash cannot turn the ring red just because sensitivity
-- was set to 4x. Before the hard gate the display is capped at 99%.
local function damageRatio()
  local vehId = be:getPlayerVehicleID(0)
  if not vehId then return 0 end
  local obj = map.objects[vehId]
  if not obj then return 0 end

  local raw = (obj.damage or 0) - damageBase
  if raw < 0 then raw = 0 end

  -- Only severe structural destruction is allowed to report 100%.
  if raw >= DAMAGE_TOTALLED_RAW then return 1 end

  local linear = raw / DAMAGE_TOTALLED_RAW
  if linear < 0 then linear = 0 end
  if linear > 0.999 then linear = 0.999 end

  -- Sensitivity is deliberately mild (roughly 0.91x..1.10x), unlike the old
  -- formula that divided the totalled threshold and reached 100% too early.
  local sensitivityScale = 0.90 + math.min(4, math.max(0.25, damageSens)) * 0.05
  local ratio = (linear ^ DAMAGE_EXP) * sensitivityScale

  if ratio > 0.99 then ratio = 0.99 end
  if ratio < 0 then ratio = 0 end
  return ratio
end

local function currentSpeedKmh()
  local vehId = be:getPlayerVehicleID(0)
  if not vehId then return 0 end
  local veh = be:getObject(vehId)
  if not veh then return 0 end
  local ok, speed = pcall(function()
    local vel = veh:getVelocity()
    return vel and vel:length() * 3.6 or 0
  end)
  if ok and tonumber(speed) then return math.max(0, tonumber(speed)) end
  return 0
end

local function onUpdate(dt)
  if not costEnabled then return end
  if not dt or dt <= 0 then return end

  costTimer = costTimer + dt
  if costTimer < costInterval then return end
  costTimer = 0

  if guihooks and guihooks.trigger then
    local cost, mode, vehicleValue = calcCost()
    guihooks.trigger('creatorpack.cost', {
      cost      = cost,
      ratio     = damageRatio(),
      speedKmh  = currentSpeedKmh(),
      mode      = mode,
      maxValue  = vehicleValue or cachedVehicleValue
    })
  end
end

local function onVehicleSwitched(oldId, newId)
  resolveVehicleValue()
  -- v3.2: makina e re mund te kete tashme dem te grumbulluar (p.sh. e ke
  -- rrahur me pare). Nese e leme damageBase=0, ratio kercen menjehere lart
  -- dhe kostoja e makines se re duket e gabuar. Marrim demin AKTUAL si baze,
  -- keshtu qe cdo makine e re fillon nga $0.
  local vehId = be:getPlayerVehicleID(0)
  local obj = vehId and map.objects[vehId]
  damageBase = (obj and obj.damage) or 0
end

local function onVehicleResetted(vehId)
  -- pas nje reset-i fizik makina eshte e paprekur -> baza kthehet ne 0
  if vehId == be:getPlayerVehicleID(0) then damageBase = 0 end
end

-- =====================================================
-- Cikli i jetes se extension-it
-- =====================================================
-- KJO ISHTE PJESA QE MUNGONTE.
-- extensions.load('creatorpack') pret nje extension me cikel jete te vlefshem.
-- Pa onExtensionLoaded, ngarkimi mund te deshtoje ne heshtje dhe
-- extensions.creatorpack mbetet nil -> bindings-at nuk bejne asgje.

function M.onExtensionLoaded()
  log('I', 'creatorpack', 'HUD PRO: extension u ngarkua')
  resolveVehicleValue()
  return true
end

function M.onExtensionUnloaded()
  log('I', 'creatorpack', 'HUD PRO: extension u shkarkua')
end

-- =====================================================
-- Interface publike
-- =====================================================

M.pfhudPass        = pfhudPass
M.pfhudFail        = pfhudFail
M.pfhudNext        = pfhudNext
M.pfhudPrev        = pfhudPrev
M.pfhudReset       = pfhudReset
M.pfhudTogglePanel = pfhudTogglePanel
M.pfhudUndo         = pfhudUndo
M.pfhudToggleGuides = pfhudToggleGuides
M.pfhudToggleVehicles = pfhudToggleVehicles

M.setCostEnabled      = setCostEnabled
M.resetCost           = resetCost
M.repairVehicle       = repairVehicle
M.onUpdate            = onUpdate
M.onVehicleSwitched   = onVehicleSwitched
M.onVehicleResetted   = onVehicleResetted

M.setHudVisible       = setHudVisible
M.setSurvivalVisible  = setSurvivalVisible
M.setSensitivity      = setSensitivity
M.setDamageSensitivity = setDamageSensitivity

return M
