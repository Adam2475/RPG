import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/profile.service';
import { AuthService } from '../../core/auth.service';
import { StatsHexagon3dComponent } from '../../shared/stats-hexagon-3d.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, StatsHexagon3dComponent],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="header-content">
          <h1>{{ profileService.profile()?.displayName || 'Character' }}</h1>
          <div class="header-actions">
            <button class="nav-btn" (click)="goTasks()">Tasks</button>
            <button *ngIf="authService.isAdmin()" class="nav-btn" (click)="goAdmin()">Admin</button>
            <button class="logout-btn" (click)="onLogout()">Logout</button>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-summary" *ngIf="profileService.profile() as profile">
          <div class="hexagon-container">
            <app-stats-hexagon-3d [stats]="statsFromProfile(profile)"></app-stats-hexagon-3d>
          </div>
          <div class="global-level-card">
            <div class="level-chip">Level {{ globalLevel(profile).level }}</div>
            <h2>Global Level</h2>
            <p class="level-desc">Your overall progression across all primary stats.</p>
            <div class="level-meter">
              <div class="level-fill" [style.width.%]="globalLevel(profile).progress"></div>
            </div>
            <div class="level-meta">
              <span>Progress to next</span>
              <strong>{{ globalLevel(profile).progress }}%</strong>
            </div>
            <div class="level-breakdown">
              <div>
                <span>Total stats</span>
                <strong>{{ globalLevel(profile).total }}</strong>
              </div>
              <div>
                <span>Average stat</span>
                <strong>{{ globalLevel(profile).average | number:'1.0-0' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <button
          *ngIf="profileService.profile()"
          class="scroll-down-btn"
          (click)="scrollToStats()"
          aria-label="Scroll to secondary stats"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div #statsSection class="secondary-stats" *ngIf="profileService.profile() as profile">
          <h2 class="secondary-title">Secondary Stats</h2>
          <div class="stat-group" *ngFor="let group of secondaryGroups(profile)">
            <div class="group-header">
              <span class="group-name">{{ group.primary }}</span>
              <span class="group-value">{{ group.value }}</span>
            </div>
            <ul class="secondary-list">
              <li class="secondary-item" *ngFor="let stat of group.subs">
                <div class="secondary-info">
                  <span class="secondary-name">{{ stat.name }}</span>
                  <span class="secondary-value">{{ stat.value }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="stat.value"></div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="loading" *ngIf="!profileService.profile()">
          <p>Loading character...</p>
        </div>

        <div class="error" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d0a2e 100%);
      background-attachment: fixed;
      color: #fff;
      font-family: 'Rajdhani', sans-serif;
    }

    .profile-header {
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
    }

    h1 {
      font-family: 'Orbitron', sans-serif;
      color: #00d4ff;
      margin: 0;
      font-size: 32px;
      text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
    }

    .logout-btn {
      padding: 8px 16px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      text-transform: uppercase;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: #00d4ff;
      color: #000;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn {
      padding: 8px 16px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      text-transform: uppercase;
      transition: all 0.3s;
    }

    .nav-btn:hover {
      background: #00d4ff;
      color: #000;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
    }

    .profile-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px 20px;
      gap: 32px;
      overflow-y: auto;
    }

    .profile-summary {
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-items: center;
    }

    .hexagon-container {
      width: 100%;
      max-width: 600px;
      height: 100%;
      max-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .global-level-card {
      width: 100%;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 24px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.08);
    }

    .level-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(0, 212, 255, 0.12);
      border: 1px solid rgba(0, 212, 255, 0.3);
      color: #00d4ff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .global-level-card h2 {
      margin: 0;
      color: #ffffff;
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
    }

    .level-desc {
      margin: 0;
      color: #a9cce5;
      line-height: 1.6;
    }

    .level-meter {
      width: 100%;
      height: 14px;
      background: rgba(0, 212, 255, 0.12);
      border: 1px solid rgba(0, 212, 255, 0.25);
      border-radius: 999px;
      overflow: hidden;
    }

    .level-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d4ff 0%, #00ffff 100%);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .level-meta {
      display: flex;
      justify-content: space-between;
      color: #c8def5;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .level-breakdown {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .level-breakdown span {
      display: block;
      color: #8aa0c0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .level-breakdown strong {
      display: block;
      margin-top: 6px;
      font-family: 'Orbitron', sans-serif;
      font-size: 26px;
      color: #ffffff;
    }

    @media (min-width: 960px) {
      .profile-summary {
        flex-direction: row;
        align-items: stretch;
        justify-content: center;
      }

      .hexagon-container {
        flex: 2;
      }

      .global-level-card {
        flex: 1;
        min-width: 280px;
        max-width: 320px;
      }
    }

    .scroll-down-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 212, 255, 0.08);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      cursor: pointer;
      transition: all 0.3s;
      animation: bounce 1.8s infinite;
      flex-shrink: 0;
      margin-top: -32px;
    }

    .scroll-down-btn:hover {
      background: #00d4ff;
      color: #001018;
      box-shadow: 0 0 16px rgba(0, 212, 255, 0.7);
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(8px); }
    }

    .secondary-stats {
      width: 100%;
      max-width: 600px;
    }

    .secondary-title {
      font-family: 'Orbitron', sans-serif;
      color: #00d4ff;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0 0 20px 0;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
    }

    .secondary-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .stat-group {
      margin-bottom: 28px;
    }

    .stat-group:last-child {
      margin-bottom: 0;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 8px;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(0, 212, 255, 0.3);
    }

    .group-name {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      color: #00ffff;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
    }

    .group-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      color: #00d4ff;
    }

    .secondary-item {
      position: relative;
      padding-left: 22px;
    }

    .secondary-item::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 7px;
      width: 8px;
      height: 8px;
      background: #00d4ff;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
    }

    .secondary-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .secondary-name {
      font-size: 15px;
      font-weight: 600;
      color: #cfe6ff;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .secondary-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      color: #00d4ff;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: rgba(0, 212, 255, 0.12);
      border: 1px solid rgba(0, 212, 255, 0.25);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0099cc 0%, #00d4ff 60%, #00ffff 100%);
      border-radius: 6px;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
      transition: width 0.5s ease;
    }

    .loading,
    .error {
      font-size: 18px;
      text-align: center;
      color: #aaa;
    }

    .error {
      color: #ff4444;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileService = inject(ProfileService);
  public authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';

  @ViewChild('statsSection') statsSection?: ElementRef<HTMLElement>;

  ngOnInit() {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        // Profile loaded
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile';
        console.error(error);
      }
    });
  }

  statsFromProfile(profile: any) {
    return {
      physique: profile.physique || 0,
      intelligence: profile.intelligence || 0,
      spirituality: profile.spirituality || 0,
      sociality: profile.sociality || 0,
      success: profile.success || 0,
      ego: profile.ego || 0
    };
  }

  secondaryGroups(profile: any): Array<{
    primary: string;
    value: number;
    subs: Array<{ name: string; value: number }>;
  }> {
    const s = this.statsFromProfile(profile);
    const avg = (...values: number[]) =>
      Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    return [
      {
        primary: 'Physique',
        value: s.physique,
        subs: [
          { name: 'Strength', value: avg(s.physique, s.ego) },
          { name: 'Endurance', value: avg(s.physique, s.success) },
          { name: 'Agility', value: avg(s.physique, s.intelligence) },
          { name: 'Vitality', value: avg(s.physique, s.spirituality) }
        ]
      },
      {
        primary: 'Intelligence',
        value: s.intelligence,
        subs: [
          { name: 'Logic', value: avg(s.intelligence, s.success) },
          { name: 'Memory', value: avg(s.intelligence, s.physique) },
          { name: 'Focus', value: avg(s.intelligence, s.spirituality) },
          { name: 'Creativity', value: avg(s.intelligence, s.sociality) }
        ]
      },
      {
        primary: 'Spirituality',
        value: s.spirituality,
        subs: [
          { name: 'Mindfulness', value: avg(s.spirituality, s.intelligence) },
          { name: 'Willpower', value: avg(s.spirituality, s.ego) },
          { name: 'Inner Peace', value: avg(s.spirituality, s.sociality) },
          { name: 'Faith', value: avg(s.spirituality, s.physique) }
        ]
      },
      {
        primary: 'Sociality',
        value: s.sociality,
        subs: [
          { name: 'Charisma', value: avg(s.sociality, s.ego) },
          { name: 'Empathy', value: avg(s.sociality, s.spirituality) },
          { name: 'Networking', value: avg(s.sociality, s.success) },
          { name: 'Communication', value: avg(s.sociality, s.intelligence) }
        ]
      },
      {
        primary: 'Success',
        value: s.success,
        subs: [
          { name: 'Wealth', value: avg(s.success, s.ego) },
          { name: 'Career', value: avg(s.success, s.intelligence) },
          { name: 'Productivity', value: avg(s.success, s.physique) },
          { name: 'Discipline', value: avg(s.success, s.spirituality) }
        ]
      },
      {
        primary: 'Ego',
        value: s.ego,
        subs: [
          { name: 'Confidence', value: avg(s.ego, s.sociality) },
          { name: 'Resilience', value: avg(s.ego, s.physique) },
          { name: 'Ambition', value: avg(s.ego, s.success) },
          { name: 'Self-Image', value: avg(s.ego, s.spirituality) }
        ]
      }
    ];
  }

  globalLevel(profile: any) {
    const stats = this.statsFromProfile(profile);
    const total =
      stats.physique +
      stats.intelligence +
      stats.spirituality +
      stats.sociality +
      stats.success +
      stats.ego;
    const average = total / 6;
    const level = Math.max(1, Math.floor(average / 10) || 1);
    const progress = Math.round((average % 10) * 10);

    return {
      level,
      progress,
      total,
      average,
    };
  }

  onLogout() {
    this.authService.logout();
  }

  goTasks() {
    this.router.navigate(['/tasks']);
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }

  scrollToStats() {
    this.statsSection?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}
