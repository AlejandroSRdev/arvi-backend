/**
 * UserHabits Entity (Domain Layer)
 *
 * Represents the aggregated habit statistics for a user.
 * Contains scores and ranks across all series.
 *
 * Note: This is a domain entity, NOT a DTO.
 * It should only be used inside domain/application layers,
 * never exposed to controllers or contracts.
 */

export class UserHabits {
  /**
   * @param {Record<string, number>} puntuaciones - Scores per series (seriesId -> score)
   * @param {Record<string, string>} rangos - Ranks per series (seriesId -> rank)
   * @param {number} puntuacionTotalGeneral - Overall total score
   * @param {Date} ultimaActualizacion - Last update timestamp
   */
  constructor(
    puntuaciones,
    rangos,
    puntuacionTotalGeneral,
    ultimaActualizacion
  ) {
    this.puntuaciones = puntuaciones;
    this.rangos = rangos;
    this.puntuacionTotalGeneral = puntuacionTotalGeneral;
    this.ultimaActualizacion = ultimaActualizacion;
  }
}

export default UserHabits;
