import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_URL = typeof window !== 'undefined' && window.location.port === '4200'
  ? 'http://localhost:3000/api'
  : '/api';

export type StatKey =
  | 'physique'
  | 'intelligence'
  | 'spirituality'
  | 'sociality'
  | 'success'
  | 'ego';

export type TaskPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Task {
  id: number;
  name: string;
  xp: number;
  stat: StatKey;
  period: TaskPeriod;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private tasksSignal = signal<Task[]>([]);
  private loadedSignal = signal(false);

  public tasks = computed(() => this.tasksSignal());
  public loaded = computed(() => this.loadedSignal());

  /** Total XP awarded per primary stat (only from incomplete tasks). */
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
      if (!task.completed) {
        totals[task.stat] += task.xp;
      }
    }
    return totals;
  });

  constructor(private http: HttpClient) {}

  /** Load all tasks from the backend. */
  loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_URL}/tasks`).pipe(
      tap(tasks => {
        this.tasksSignal.set(tasks);
        this.loadedSignal.set(true);
      })
    );
  }

  /** Create a new task. */
  addTask(name: string, xp: number, stat: StatKey, period: TaskPeriod): Observable<Task> {
    return this.http.post<Task>(`${API_URL}/tasks`, {
      name,
      xp,
      stat,
      period
    }).pipe(
      tap(task => {
        this.tasksSignal.update(tasks => [task, ...tasks]);
      })
    );
  }

  /** Delete a task by ID. */
  removeTask(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/tasks/${id}`).pipe(
      tap(() => {
        this.tasksSignal.update(tasks => tasks.filter(t => t.id !== id));
      })
    );
  }

  /** Mark a task as complete or incomplete. */
  toggleTaskCompletion(id: number, completed: boolean): Observable<any> {
    return this.http.patch(`${API_URL}/tasks/${id}/complete`, { completed }).pipe(
      tap(() => {
        this.tasksSignal.update(tasks =>
          tasks.map(t =>
            t.id === id
              ? { ...t, completed, completedAt: completed ? Date.now() : null }
              : t
          )
        );
      })
    );
  }

  /** Get tasks for a specific period. */
  tasksForPeriod(period: TaskPeriod): Task[] {
    return this.tasksSignal().filter(t => t.period === period);
  }

  /** Get incomplete tasks for a specific period. */
  incompleteTasksForPeriod(period: TaskPeriod): Task[] {
    return this.tasksSignal().filter(t => t.period === period && !t.completed);
  }

  /** Get completed tasks for a specific period. */
  completedTasksForPeriod(period: TaskPeriod): Task[] {
    return this.tasksSignal().filter(t => t.period === period && t.completed);
  }
}
