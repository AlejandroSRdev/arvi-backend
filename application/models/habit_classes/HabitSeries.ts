import { Accion } from './Action';

export class SerieTematica {
  constructor(
    public readonly id: string,
    public readonly titulo: string,
    public readonly descripcion: string,
    public readonly listaAcciones: Accion[],
    public rango: string,
    public puntuacionTotal: number,
    public readonly fechaCreacion: Date,
    public ultimaActividad: Date
  ) {}

  calcularRango(): string {
    if (this.puntuacionTotal >= 1000) return 'diamond';
    if (this.puntuacionTotal >= 600) return 'golden';
    if (this.puntuacionTotal >= 300) return 'silver';
    return 'bronze';
  }
}
