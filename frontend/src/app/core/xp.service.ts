import { Injectable, computed, signal } from '@angular/core';

export type StatKey =
  | 'physique'
  | 'intelligence'
  | 'spirituality'
  | 'sociality'
  | 'success'
  | 'ego';

export type TaskPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Task {
  id: string;
  name: string;
  xp: number;
  stat: StatKey;
  period: TaskPeriod;
  createdAt: number;
}

const STORAGE_KEY = 'life_rpg_tasks';

/**
 * Stores manually-added tasks and the XP they award, persisted to
 * localStorage. XP is aggregated per primary stat and consumed by the
 * profile page to show progress on each stat and substat.
 */
@Injectable({
  providedIn: 'root',
})
export class XpService {
  private tasksSignal = signal<Task[]>(this.load());

  public tasks = computed(() => this.tasksSignal());

  /** Total XP awarded per primary stat. */
  public xpByStat = computed<Record<StatKey, number>>(() => {
    const totals: Record<StatKey, number> = {
      physique: 0,
      intelligence: 0,
      spirituality: 0,
      sociality: 0,
      success: 0,
      ego: 0,
    };
    for (const task of this.tasksSignal()) {
      totals[task.stat] += task.xp;
    }
    return totals;
  });

  addTask(name: string, xp: number, stat: StatKey, period: TaskPeriod): void {
    const task: Task = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(),
      xp: Math.max(0, Math.round(xp)),
      stat,
      period,
      createdAt: Date.now(),
    };
    this.tasksSignal.update((tasks) => [task, ...tasks]);
    this.persist();
  }

  removeTask(id: string): void {
    this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== id));
    this.persist();
  }

  tasksForPeriod(period: TaskPeriod): Task[] {
    return this.tasksSignal().filter((t) => t.period === period);
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasksSignal()));
  }

  private load(): Task[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Task[]) : [];
    } catch {
      return [];
    }
  }
}
