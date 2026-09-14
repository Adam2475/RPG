import { Injectable, computed, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = typeof window !== 'undefined' && window.location.port === '4200'
  ? 'http://localhost:3000/api'
  : '/api';

export interface Profile {
  displayName: string;
  physique: number;
  intelligence: number;
  spirituality: number;
  sociality: number;
  success: number;
  ego: number;
  onboarded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSignal = signal<Profile | null>(null);
  public profile = computed(() => this.profileSignal());

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return new Observable(observer => {
      this.http.get<Profile>(`${API_URL}/profile`).subscribe({
        next: (profile) => {
          this.profileSignal.set(profile);
          observer.next(profile);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  updateStats(stats: Partial<Omit<Profile, 'displayName' | 'onboarded'>>): Observable<any> {
    return new Observable(observer => {
      this.http.put(`${API_URL}/profile/stats`, stats).subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  submitOnboarding(stats: {
    physique: number;
    intelligence: number;
    spirituality: number;
    sociality: number;
    success: number;
    ego: number;
  }): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${API_URL}/profile/onboarding`, stats).subscribe({
        next: (response) => {
          // Update profile onboarded flag
          const currentProfile = this.profileSignal();
          if (currentProfile) {
            this.profileSignal.set({ ...currentProfile, ...stats, onboarded: true });
          }
          observer.next(response);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
}
