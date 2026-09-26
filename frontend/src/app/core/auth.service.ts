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
  private isAdminSignal = signal(this.readAdminClaim(this.tokenSignal()));
  
  public isAuthenticated = computed(() => this.tokenSignal() !== null);
  public token = computed(() => this.tokenSignal());
  public isAdmin = computed(() => this.isAdminSignal());

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
        this.setToken(response.token, response.isAdmin);
        this.refreshAdminStatus().subscribe({ error: () => undefined });
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.token, response.isAdmin);
        this.refreshAdminStatus().subscribe({ error: () => undefined });
      })
    );
  }

  refreshAdminStatus(): Observable<{ userId: number; email: string; isAdmin: boolean }> {
    return this.http.get<{ userId: number; email: string; isAdmin: boolean }>(`${API_URL}/auth/me`).pipe(
      tap(user => this.isAdminSignal.set(user.isAdmin))
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.isAdminSignal.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    this.router.navigate(['/login']);
  }

  private setToken(token: string, isAdmin: boolean): void {
    this.tokenSignal.set(token);
    this.isAdminSignal.set(isAdmin);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private readAdminClaim(token: string | null): boolean {
    if (!token || typeof atob === 'undefined') {
      return false;
    }

    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
      const binaryPayload = atob(paddedPayload);
      const bytes = Uint8Array.from(binaryPayload, character => character.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)).isAdmin === true;
    } catch {
      return false;
    }
  }
}
