import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-box">
        <h1>Life RPG</h1>
        <h2>Create Account</h2>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input 
              id="displayName"
              type="text" 
              formControlName="displayName"
              placeholder="Your character name"
            />
            <div class="error" *ngIf="form.get('displayName')?.touched && form.get('displayName')?.invalid">
              Name required
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email"
              type="email" 
              formControlName="email"
              placeholder="your@email.com"
            />
            <div class="error" *ngIf="form.get('email')?.touched && form.get('email')?.invalid">
              Valid email required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              type="password" 
              formControlName="password"
              placeholder="••••••••"
            />
            <div class="error" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">
              Password must be at least 6 characters
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="login-link">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      font-family: 'Rajdhani', sans-serif;
    }

    .register-box {
      background: rgba(20, 25, 50, 0.8);
      border: 2px solid #00d4ff;
      border-radius: 8px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
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
      margin: 0 0 30px 0;
      font-size: 18px;
      font-weight: 300;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: #00d4ff;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
    }

    input {
      width: 100%;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #00d4ff;
      border-radius: 4px;
      color: #fff;
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #00ffff;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }

    .error {
      color: #ff4444;
      font-size: 12px;
      margin-top: 4px;
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
      margin-top: 10px;
    }

    button:hover:not(:disabled) {
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .login-link {
      text-align: center;
      color: #aaa;
      margin-top: 20px;
      font-size: 14px;
    }

    .login-link a {
      color: #00d4ff;
      text-decoration: none;
      transition: color 0.3s;
    }

    .login-link a:hover {
      color: #00ffff;
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  errorMessage = '';

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { displayName, email, password } = this.form.value;

    this.authService.register(email!, password!, displayName!).subscribe({
      next: () => {
        this.router.navigate(['/onboarding']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error || 'Registration failed';
      }
    });
  }
}
