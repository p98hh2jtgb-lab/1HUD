-- SURVIVAL HUD v1.0 — CYBER (GE Lua extension)
-- Mod i pavarur: dërgon telemetriren e dëmit te UI-se çdo 0.25s.
-- Portuar nga HUD PRO v5.1 (creatorpack.lua) — vetëm pjesa e matjes.

local M = {}

local damageBase = 0

-- Zgjidh vleren e makines (per modalitetin e karrieres; vetem informative)
local cachedVehicleValue = 15000

local function resolveVehicleValue()
  local vehId = be:getPlayerVehicleID(0)
  if not vehId then return end
  local obj = map.objects[vehId]
  if obj and obj.jbeam and obj.jbeam.Value then
    cachedVehicleValue = tonumber(obj.jbeam.Value) or cachedVehicleValue
  end
end

-- v4.2 realistic damage ratio (portuar direkt)
local DAMAGE_TOTALLED_RAW = 400000
local DAMAGE_EXP          = 1.25

local function damageRatio()
  local vehId = be:getPlayerVehicleID(0)
  if not vehId then return 0 end
  local obj = map.objects[vehId]
  if not obj then return 0 end

  local raw = (obj.damage or 0) - damageBase
  if raw < 0 then raw = 0 end
  if raw >= DAMAGE_TOTALLED_RAW then return 1 end

  local linear = raw / DAMAGE_TOTALLED_RAW
  if linear < 0 then linear = 0 end
  if linear > 0.999 then linear = 0.999 end

  local ratio = (linear ^ DAMAGE_EXP) * 1.0
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

-- =====================================================
-- Bindings (Options -> Controls)
-- =====================================================
local function trigger(action)
  if guihooks == nil or guihooks.trigger == nil then
    log('W', 'survivalhud', 'guihooks nuk eshte gati; veprimi u anashkalua: ' .. tostring(action))
    return
  end
  guihooks.trigger('survivalhud.action', { action = action })
end

local function svhudToggle()  trigger('toggle') end
local function svhudReset()   trigger('reset')  end
local function svhudPanel()   trigger('panel')  end

-- Reset i run-it: demi aktual behet baza e re (ratio rinis nga 0)
local function resetRun()
  local vehId = be:getPlayerVehicleID(0)
  if vehId then
    local obj = map.objects[vehId]
    damageBase = (obj and obj.damage) or 0
  else
    damageBase = 0
  end
  if guihooks and guihooks.trigger then
    guihooks.trigger('survivalhud.cost', { ratio = 0, speedKmh = 0 })
  end
end

-- =====================================================
-- Cikli i jetes
-- =====================================================
local timer = 0
local INTERVAL = 0.25

local function onUpdate(dt)
  if not dt or dt <= 0 then return end
  timer = timer + dt
  if timer < INTERVAL then return end
  timer = 0
  if guihooks and guihooks.trigger then
    guihooks.trigger('survivalhud.cost', {
      ratio    = damageRatio(),
      speedKmh = currentSpeedKmh()
    })
  end
end

local function onVehicleSwitched(oldId, newId)
  resolveVehicleValue()
  -- makina e re: demi aktual behet baza qe run-i te mos kerceje
  local vehId = be:getPlayerVehicleID(0)
  local obj = vehId and map.objects[vehId]
  damageBase = (obj and obj.damage) or 0
end

local function onVehicleResetted(vehId)
  -- pas nje recover/reseti fizik makina eshte e paprekur -> baza kthehet ne 0
  if vehId == be:getPlayerVehicleID(0) then damageBase = 0 end
end

local function onExtensionLoaded()
  log('I', 'survivalhud', 'SURVIVAL HUD v1.0 CYBER u ngarkua')
end

M.onUpdate          = onUpdate
M.onVehicleSwitched = onVehicleSwitched
M.onVehicleResetted = onVehicleResetted
M.onExtensionLoaded = onExtensionLoaded
M.resetRun          = resetRun
M.svhudToggle       = svhudToggle
M.svhudReset        = svhudReset
M.svhudPanel        = svhudPanel

return M
