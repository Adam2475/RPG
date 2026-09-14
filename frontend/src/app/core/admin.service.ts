import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = typeof window !== 'undefined' && window.location.port === '4200'
  ? 'http://localhost:3000/api'
  : '/api';

export interface DatabaseTable {
  name: string;
  columns: Array<{ name: string; type: string; notnull: number; pk: number }>;
  rows: Array<Record<string, unknown>>;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getDatabase(): Observable<{ tables: DatabaseTable[] }> {
    return this.http.get<{ tables: DatabaseTable[] }>(`${API_URL}/admin/database`);
  }
}