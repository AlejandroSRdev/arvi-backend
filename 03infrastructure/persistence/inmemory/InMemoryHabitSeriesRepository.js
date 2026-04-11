/**
 * Layer: Infrastructure
 * File: InMemoryHabitSeriesRepository.js
 * Responsibility:
 * In-memory stub for IHabitSeriesRepository used when ARVI_TEST_MODE=true.
 * Currently minimal — extended as acceptance scenarios begin to exercise habit series.
 */

export class InMemoryHabitSeriesRepository {
  constructor() {
    this.series = new Map();
  }

  async save(s) {
    this.series.set(s.id, s);
    return s;
  }

  async getById(id) {
    return this.series.get(id) ?? null;
  }

  _reset() {
    this.series.clear();
  }
}

export default InMemoryHabitSeriesRepository;
