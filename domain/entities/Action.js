/**
 * Action Entity (Domain Layer)
 *
 * Represents a single action within a habit series.
 * Contains business state and behavior related to action completion.
 *
 * Note: This is a domain entity, NOT a DTO.
 * It should only be used inside domain/application layers,
 * never exposed to controllers or contracts.
 */

import { Difficulty } from './Difficulty.js';

export class Action {
  /**
   * @param {string} id - Unique identifier
   * @param {string} nombre - Action name
   * @param {string} descripcion - Action description
   * @param {string} dificultad - Difficulty level (from Difficulty enum values)
   * @param {number} puntuacion - Current score
   * @param {boolean} completada - Completion status
   * @param {Date} [fechaCompletada] - Completion date
   * @param {string} [respuestaVerificacion] - Verification response
   * @param {number} [bonusPuntos] - Bonus points
   */
  constructor(
    id,
    nombre,
    descripcion,
    dificultad,
    puntuacion,
    completada = false,
    fechaCompletada = null,
    respuestaVerificacion = null,
    bonusPuntos = 0
  ) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.dificultad = dificultad;
    this.puntuacion = puntuacion;
    this.completada = completada;
    this.fechaCompletada = fechaCompletada;
    this.respuestaVerificacion = respuestaVerificacion;
    this.bonusPuntos = bonusPuntos;
  }
}

export default Action;
