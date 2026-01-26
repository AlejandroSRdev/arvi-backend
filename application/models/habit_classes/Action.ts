import { Dificultad } from './Dificulty';

export class Accion {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly descripcion: string,
    public readonly dificultad: Dificultad,
    public puntuacion: number,
    public completada: boolean = false,
    public fechaCompletada?: Date,
    public respuestaVerificacion?: string,
    public bonusPuntos: number = 0
  ) {}
}
