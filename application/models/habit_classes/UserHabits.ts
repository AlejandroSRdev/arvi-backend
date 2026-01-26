export class HabitosUsuario {
  constructor(
    public readonly puntuaciones: Record<string, number>,
    public readonly rangos: Record<string, string>,
    public readonly puntuacionTotalGeneral: number,
    public readonly ultimaActualizacion: Date
  ) {}
}
