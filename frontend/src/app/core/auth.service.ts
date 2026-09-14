import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_URL = typeof window !== 'undefined' && window.location.port === '4200'
  ? 'http://localhost:3000/api'
  : '/api';

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  );
  
  public isAuthenticated = computed(() => this.tokenSignal() !== null);
  public token = computed(() => this.tokenSignal());
  public isAdmin = computed(() => this.readAdminClaim(this.tokenSignal()));

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, {
      email,
      password,
      displayName
    }).pipe(
      tap(response => {
        this.setToken(response.token);
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.token);
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    this.router.navigate(['/login']);
  }

  private setToken(token: string): void {
    this.tokenSignal.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private readAdminClaim(token: string | null): boolean {
    if (!token || typeof atob === 'undefined') {
      return false;
    }

    try {
      return JSON.parse(atob(token.split('.')[1])).isAdmin === true;
    } catch {
      return false;
    }
  }
}
