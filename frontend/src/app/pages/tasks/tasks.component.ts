import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TasksService, StatKey, TaskPeriod } from '../../core/tasks.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="tasks-container">
      <header class="tasks-header">
        <div class="header-content">
          <div>
            <h1>Tasks</h1>
            <p class="subtitle">Manage your quests and award yourself XP manually.</p>
          </div>
          <div class="header-actions">
            <button class="nav-btn" (click)="goProfile()">Profile</button>
            <button class="logout-btn" (click)="onLogout()">Logout</button>
          </div>
        </div>
      </header>

      <main class="tasks-content">
        <nav class="period-tabs">
          <button
            *ngFor="let period of periods"
            class="period-tab"
            [class.active]="period === activePeriod"
            (click)="setActivePeriod(period)"
          >
            {{ period }}
          </button>
        </nav>

        <section class="task-panel">
          <div *ngIf="error" class="error-banner">
            {{ error }}
          </div>
          <div class="task-toolbar">
            <div class="task-summary">
              <span class="summary-count">{{ tasksForPeriod().length }}</span>
              <span>{{ activePeriod }} task{{ tasksForPeriod().length === 1 ? '' : 's' }}</span>
            </div>
            <button class="secondary-btn" (click)="toggleCreateTaskForm()">
              {{ showCreateTaskForm ? 'Close' : 'New Task' }}
            </button>
          </div>

          <form
            class="task-form"
            *ngIf="showCreateTaskForm"
            [formGroup]="taskForm"
            (ngSubmit)="onAddTask()"
          >
            <div class="form-group">
              <label for="name">Task name</label>
              <input id="name" formControlName="name" placeholder="e.g. Read for 30 minutes" />
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="xp">XP value</label>
                <input id="xp" type="number" formControlName="xp" min="1" />
              </div>

              <div class="form-group">
                <label for="stat">Primary stat</label>
                <select id="stat" formControlName="stat">
                  <option *ngFor="let stat of statKeys" [value]="stat">{{ stat | titlecase }}</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label for="period">Period</label>
                <select id="period" formControlName="period">
                  <option *ngFor="let period of periods" [value]="period">{{ period }}</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="submit-btn">Create task</button>
              <button type="button" class="cancel-btn" (click)="toggleCreateTaskForm()">Cancel</button>
            </div>
          </form>

          <ng-container *ngIf="tasksForPeriod().length > 0; else emptyState">
            <ul class="task-list">
              <li class="task-item" [class.completed]="task.completed" *ngFor="let task of tasksForPeriod()">
                <div class="task-meta">
                  <div class="task-checkbox">
                    <input
                      type="checkbox"
                      [id]="'task-' + task.id"
                      [checked]="task.completed"
                      (change)="toggleTaskCompletion(task.id, !task.completed)"
                    />
                    <label [for]="'task-' + task.id"></label>
                  </div>
                  <span class="task-name">{{ task.name }}</span>
                  <span class="task-tag">{{ task.stat | titlecase }}</span>
                </div>
                <div class="task-footer">
                  <span class="task-xp">+{{ task.xp }} XP</span>
                  <button class="remove-btn" type="button" (click)="removeTask(task.id)">Remove</button>
                </div>
              </li>
            </ul>
          </ng-container>

          <ng-template #emptyState>
            <div class="empty-state">
              <div class="empty-icon">🗒️</div>
              <h2>No {{ activePeriod.toLowerCase() }} tasks yet</h2>
              <p>Your {{ activePeriod.toLowerCase() }} quests will appear here. Complete them to level up your stats.</p>
            </div>
          </ng-template>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .tasks-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d0a2e 100%);
      background-attachment: fixed;
      color: #fff;
      font-family: 'Rajdhani', sans-serif;
    }

    .tasks-header {
      background: rgba(0, 212, 255, 0.05);
      border-bottom: 2px solid #00d4ff;
      padding: 20px;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 16px;
    }

    h1 {
      font-family: 'Orbitron', sans-serif;
      color: #00d4ff;
      margin: 0;
      font-size: 32px;
      text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
    }

    .subtitle {
      margin: 8px 0 0;
      color: #93b6d5;
      font-size: 14px;
    }

    .action-btn,
    .secondary-btn,
    .submit-btn,
    .cancel-btn,
    .back-btn {
      padding: 10px 18px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      text-transform: uppercase;
      transition: all 0.3s;
    }

    .action-btn:hover,
    .secondary-btn:hover,
    .submit-btn:hover,
    .cancel-btn:hover,
    .back-btn:hover {
      background: #00d4ff;
      color: #001018;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .nav-btn,
    .logout-btn {
      padding: 10px 18px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      text-transform: uppercase;
      transition: all 0.3s;
    }

    .nav-btn:hover,
    .logout-btn:hover {
      background: #00d4ff;
      color: #001018;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .logout-btn {
      background: rgba(255, 69, 0, 0.1);
      border-color: #ff4500;
      color: #ff6b6b;
    }

    .logout-btn:hover {
      background: #ff4500;
      color: #fff;
      box-shadow: 0 0 10px rgba(255, 69, 0, 0.6);
    }

    .tasks-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px 20px;
      gap: 32px;
    }

    .period-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 32px;
      background: rgba(0, 212, 255, 0.05);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      padding: 6px;
      width: 100%;
      max-width: 1200px;
    }

    .period-tab {
      padding: 10px 24px;
      background: transparent;
      border: none;
      color: #8aa0c0;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.25s;
    }

    .period-tab:hover {
      color: #00d4ff;
    }

    .period-tab.active {
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      color: #001018;
      box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
    }

    .task-panel {
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .error-banner {
      padding: 12px 16px;
      background: rgba(255, 69, 0, 0.1);
      border: 1px solid rgba(255, 69, 0, 0.4);
      border-radius: 8px;
      color: #ff6b6b;
      font-size: 14px;
    }

    .task-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .task-summary {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #c8def5;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .summary-count {
      display: inline-flex;
      min-width: 34px;
      justify-content: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(0, 212, 255, 0.12);
      color: #00d4ff;
      font-weight: 700;
    }

    .task-form {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 16px;
      padding: 24px;
      display: grid;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      gap: 18px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #9ccce8;
    }

    input,
    select {
      width: 100%;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(0, 212, 255, 0.18);
      border-radius: 10px;
      color: #eef6ff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.25s;
    }

    input:focus,
    select:focus {
      border-color: #00d4ff;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.18);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .task-list {
      display: grid;
      gap: 16px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .task-item {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 212, 255, 0.15);
      border-radius: 16px;
      transition: all 0.25s;
    }

    .task-item.completed {
      background: rgba(0, 212, 255, 0.08);
      border-color: rgba(0, 212, 255, 0.3);
      opacity: 0.7;
    }

    .task-checkbox {
      position: relative;
      display: inline-block;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .task-checkbox input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }

    .task-checkbox label {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(0, 212, 255, 0.5);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.25s;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }

    .task-checkbox input:checked + label {
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      border-color: #00d4ff;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }

    .task-checkbox input:checked + label::after {
      content: '✓';
      color: #001018;
      font-weight: bold;
      font-size: 14px;
    }

    .task-meta {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .task-name {
      font-size: 16px;
      font-weight: 700;
      color: #e4f5ff;
    }

    .task-tag {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(0, 212, 255, 0.12);
      color: #00d4ff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .task-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .task-xp {
      color: #b7f2ff;
      font-weight: 600;
    }

    .remove-btn {
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #fff;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s;
    }

    .remove-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .empty-state {
      text-align: center;
      color: #8aa0c0;
      max-width: 560px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 56px;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 12px rgba(0, 212, 255, 0.4));
    }

    .empty-state h2 {
      color: #00d4ff;
      font-family: 'Orbitron', sans-serif;
      margin: 0 0 12px 0;
      font-size: 22px;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
  `]
})
export class TasksComponent implements OnInit {
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);

  readonly periods = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;
  readonly statKeys: StatKey[] = ['physique', 'intelligence', 'spirituality', 'sociality', 'success', 'ego'];

  activePeriod: (typeof this.periods)[number] = 'Daily';
  showCreateTaskForm = false;
  isLoading = false;
  error: string | null = null;

  taskForm = this.formBuilder.group({
    name: ['', Validators.required],
    xp: [10, [Validators.required, Validators.min(1)]],
    stat: ['physique', Validators.required],
    period: [this.activePeriod, Validators.required]
  });

  ngOnInit() {
    this.loadTasks();
  }

  private loadTasks() {
    this.isLoading = true;
    this.error = null;
    this.tasksService.loadTasks().subscribe({
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.error = 'Failed to load tasks';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  setActivePeriod(period: TaskPeriod) {
    this.activePeriod = period;
    this.taskForm.patchValue({ period });
  }

  toggleCreateTaskForm() {
    this.showCreateTaskForm = !this.showCreateTaskForm;
    if (this.showCreateTaskForm) {
      this.taskForm.patchValue({ period: this.activePeriod });
    }
  }

  onAddTask() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const { name, xp, stat, period } = this.taskForm.value;
    if (
      !name ||
      xp === null ||
      xp === undefined ||
      !stat ||
      !period
    ) {
      return;
    }

    this.tasksService.addTask(
      name,
      xp as number,
      stat as StatKey,
      period as TaskPeriod
    ).subscribe({
      next: () => {
        this.taskForm.reset({
          name: '',
          xp: 10,
          stat: 'physique',
          period: this.activePeriod
        });
        this.showCreateTaskForm = false;
      },
      error: (err) => {
        console.error('Failed to create task:', err);
        this.error = 'Failed to create task';
      }
    });
  }

  tasksForPeriod() {
    return this.tasksService.tasksForPeriod(this.activePeriod);
  }

  removeTask(id: number) {
    this.tasksService.removeTask(id).subscribe({
      error: (err) => {
        console.error('Failed to remove task:', err);
        this.error = 'Failed to remove task';
      }
    });
  }

  toggleTaskCompletion(id: number, completed: boolean) {
    this.tasksService.toggleTaskCompletion(id, completed).subscribe({
      error: (err) => {
        console.error('Failed to update task:', err);
        this.error = 'Failed to update task';
      }
    });
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
