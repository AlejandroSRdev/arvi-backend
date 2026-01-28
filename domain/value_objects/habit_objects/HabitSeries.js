/**
 * HabitSeries Entity (Domain Layer)
 *
 * Represents a thematic series of habit actions.
 * Contains business logic for rank calculation based on score.
 *
 * Note: This is a domain entity, NOT a DTO.
 * It should only be used inside domain/application layers,
 * never exposed to controllers or contracts.
 */

export class HabitSeries {
  /**
   * @param {string} id - Unique identifier
   * @param {string} titulo - Series title
   * @param {string} descripcion - Series description
   * @param {Action[]} listaAcciones - List of actions in the series
   * @param {string} rango - Current rank (bronze, silver, golden, diamond)
   * @param {number} puntuacionTotal - Total accumulated score
   * @param {Date} fechaCreacion - Creation date
   * @param {Date} ultimaActividad - Last activity date
   */
  constructor(
    id,
    titulo,
    descripcion,
    listaAcciones,
    rango,
    puntuacionTotal,
    fechaCreacion,
    ultimaActividad
  ) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.listaAcciones = listaAcciones;
    this.rango = rango;
    this.puntuacionTotal = puntuacionTotal;
    this.fechaCreacion = fechaCreacion;
    this.ultimaActividad = ultimaActividad;
  }

  /**
   * Calculate the rank based on total score.
   * Business rule:
   * - >= 1000 points: diamond
   * - >= 600 points: golden
   * - >= 300 points: silver
   * - < 300 points: bronze
   *
   * @returns {string} The calculated rank
   */
  calcularRango() {
    if (this.puntuacionTotal >= 1000) return 'diamond';
    if (this.puntuacionTotal >= 600) return 'golden';
    if (this.puntuacionTotal >= 300) return 'silver';
    return 'bronze';
  }
}

export default HabitSeries;
