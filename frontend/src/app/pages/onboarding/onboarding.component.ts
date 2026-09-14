import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/profile.service';

const QUESTIONS = [
  { stat: 'physique', label: 'Physique', description: 'Physical strength and fitness level' },
  { stat: 'intelligence', label: 'Intelligence', description: 'Mental capability and learning ability' },
  { stat: 'spirituality', label: 'Spirituality (Balance)', description: 'Inner peace and mindfulness' },
  { stat: 'sociality', label: 'Sociality', description: 'Social connections and relationships' },
  { stat: 'success', label: 'Success (Economic)', description: 'Financial and career accomplishments' },
  { stat: 'ego', label: 'Ego (Self-Esteem)', description: 'Confidence and self-worth' }
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-box">
        <h1>Life RPG</h1>
        <h2>Character Creation</h2>
        <p class="subtitle">Rate your current stats (1-10)</p>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="questions">
            <div *ngFor="let question of questions" class="question-group">
              <div class="question-header">
                <label [for]="question.stat">{{ question.label }}</label>
                <span class="description">{{ question.description }}</span>
              </div>
              <div class="scale-input">
                <input 
                  type="range"
                  [id]="question.stat"
                  [formControlName]="question.stat"
                  min="1"
                  max="10"
                  class="slider"
                />
                <div class="scale-labels">
                  <span>1</span>
                  <span class="current-value">{{ form.get(question.stat)?.value }}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating Character...' : 'Create Character' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      font-family: 'Rajdhani', sans-serif;
      padding: 20px;
    }

    .onboarding-box {
      background: rgba(20, 25, 50, 0.9);
      border: 2px solid #00d4ff;
      border-radius: 8px;
      padding: 40px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    }

    h1 {
      font-family: 'Orbitron', sans-serif;
      color: #00d4ff;
      text-align: center;
      margin: 0 0 10px 0;
      font-size: 28px;
      text-shadow: 0 0 10px #00d4ff;
    }

    h2 {
      color: #00d4ff;
      text-align: center;
      margin: 0 0 5px 0;
      font-size: 18px;
      font-weight: 300;
    }

    .subtitle {
      text-align: center;
      color: #aaa;
      margin: 0 0 30px 0;
      font-size: 14px;
    }

    .questions {
      margin-bottom: 30px;
    }

    .question-group {
      margin-bottom: 25px;
    }

    .question-header {
      margin-bottom: 10px;
    }

    label {
      display: block;
      color: #00d4ff;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .description {
      display: block;
      color: #888;
      font-size: 12px;
      font-weight: 300;
      margin-top: 2px;
    }

    .scale-input {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(0, 212, 255, 0.2);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #00d4ff;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #00d4ff;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #888;
    }

    .current-value {
      color: #00d4ff;
      font-weight: bold;
    }

    .error {
      color: #ff4444;
      font-size: 12px;
      margin-bottom: 15px;
      text-align: center;
    }

    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      border: none;
      color: #000;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      text-transform: uppercase;
      transition: all 0.3s;
    }

    button:hover:not(:disabled) {
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class OnboardingComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    physique: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    intelligence: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    spirituality: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    sociality: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    success: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    ego: [5, [Validators.required, Validators.min(1), Validators.max(10)]]
  });

  questions = QUESTIONS;
  loading = false;
  errorMessage = '';

  ngOnInit() {
    // Initialize sliders to trigger change detection
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.valueChanges.subscribe(() => {
        // Trigger change detection
      });
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const values = this.form.value;
    const stats = {
      physique: values.physique! * 10,
      intelligence: values.intelligence! * 10,
      spirituality: values.spirituality! * 10,
      sociality: values.sociality! * 10,
      success: values.success! * 10,
      ego: values.ego! * 10
    };

    this.profileService.submitOnboarding(stats).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error || 'Failed to complete onboarding';
      }
    });
  }
}
