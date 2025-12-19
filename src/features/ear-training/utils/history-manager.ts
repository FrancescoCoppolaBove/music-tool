/**
 * ANTI-REPETITION HISTORY SYSTEM
 * Previene ripetizioni noiose negli esercizi
 */

/**
 * Generic history manager per evitare ripetizioni
 */
export class HistoryManager<T> {
  private history: T[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 5) {
    this.maxHistory = maxHistory;
  }

  /**
   * Aggiungi elemento alla history
   */
  add(item: T): void {
    this.history.push(item);

    // Mantieni solo gli ultimi N elementi
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Controlla se elemento è nella history recente
   */
  includes(item: T): boolean {
    return this.history.includes(item);
  }

  /**
   * Seleziona random da array evitando history
   */
  selectRandom<U>(items: U[], selector: (item: U) => T): U | null {
    if (items.length === 0) return null;

    // Se tutti gli item sono nella history, resetta
    const available = items.filter((item) => !this.includes(selector(item)));

    if (available.length === 0) {
      console.log('⚠️ All items in history, resetting...');
      this.reset();
      return items[Math.floor(Math.random() * items.length)];
    }

    // Seleziona random da quelli disponibili
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Reset history
   */
  reset(): void {
    this.history = [];
  }

  /**
   * Ottieni history corrente
   */
  getHistory(): T[] {
    return [...this.history];
  }
}

/**
 * Perfect Pitch History (evita ultime 5 note)
 */
export const perfectPitchHistory = new HistoryManager<string>(5);

/**
 * Intervals History (evita ultimi 4 intervalli)
 */
export const intervalsHistory = new HistoryManager<string>(4);

/**
 * Chords History (evita ultimi 4 accordi)
 */
export const chordsHistory = new HistoryManager<string>(4);

/**
 * Scales History (evita ultime 3 scale)
 */
export const scalesHistory = new HistoryManager<string>(3);

/**
 * Progressions History (evita ultime 3 progressioni)
 */
export const progressionsHistory = new HistoryManager<string>(3);

/**
 * Scale Degrees History (evita ultimi 4 gradi)
 */
export const scaleDegreesHistory = new HistoryManager<string>(4);
