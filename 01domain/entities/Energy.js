// domain/entities/Energy.js

export function needsDailyRecharge(lastRechargeDate) {
  if (!lastRechargeDate) return true;

  const now = new Date();
  const hoursSinceRecharge =
    (now - lastRechargeDate) / (1000 * 60 * 60);

  return hoursSinceRecharge >= 24;
}

export function calculateNewEnergy(maxEnergy) {
  return maxEnergy;
}

export function canConsumeEnergy(actual, required) {
  return actual >= required;
}

