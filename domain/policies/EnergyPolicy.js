/**
 * Energy Policy (Domain)
 *
 * ANÁLISIS DE MIGRACIÓN:
 *
 * Archivos analizados:
 * - src/models/Energy.js → Todo es infraestructura (Firestore, transacciones)
 * - src/services/energyService.js → Solo orquestación de repositorios
 * - src/config/plans.js → Políticas de plan (ya en PlanPolicy.js)
 *
 * CONCLUSIÓN:
 * NO hay lógica de políticas de energía adicional para migrar.
 *
 * Lógica existente ya correctamente ubicada:
 * - Reglas puras de energía → domain/entities/Energy.js
 *   · needsDailyRecharge()
 *   · canConsumeEnergy()
 *   · calculateNewEnergy()
 *
 * - Políticas de energía por plan → domain/policies/PlanPolicy.js
 *   · tokensToEnergy()
 *   · canConsumeEnergy() (considerando plan)
 *   · PLANS[].maxEnergy
 *   · PLANS[].dailyRecharge
 *
 * Este archivo queda VACÍO intencionalmente.
 * Las políticas de energía están correctamente distribuidas entre:
 * - Entities (reglas puras)
 * - PlanPolicy (reglas de negocio por plan)
 */

export default {};
