import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, DatabaseTable } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="admin-shell">
      <header class="admin-header">
        <div><p class="eyebrow">SYSTEM CONSOLE</p><h1>Database inspector</h1></div>
        <div class="actions"><button (click)="load()">Refresh</button><button (click)="goProfile()">Profile</button><button (click)="logout()">Logout</button></div>
      </header>
      <p class="notice">Read-only preview. Password hashes are intentionally hidden. Each table is limited to 500 rows.</p>
      <p class="status" *ngIf="loading">Loading database...</p>
      <p class="error" *ngIf="error">{{ error }}</p>
      <section class="table-list" *ngIf="!loading">
        <article class="table-panel" *ngFor="let table of tables">
          <div class="table-heading"><h2>{{ table.name }}</h2><span>{{ table.rows.length }} rows</span></div>
          <div class="grid-wrap"><table><thead><tr><th *ngFor="let column of table.columns">{{ column.name }}<small>{{ column.type }}</small></th></tr></thead>
            <tbody><tr *ngFor="let row of table.rows"><td *ngFor="let column of table.columns">{{ row[column.name] ?? '—' }}</td></tr><tr *ngIf="!table.rows.length"><td [attr.colspan]="table.columns.length">No rows</td></tr></tbody>
          </table></div>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .admin-shell{min-height:100vh;padding:32px clamp(16px,4vw,64px);background:linear-gradient(135deg,#07121b,#122532 55%,#091116);color:#eaf7f8;font-family:Rajdhani,sans-serif}.admin-header{display:flex;justify-content:space-between;gap:24px;align-items:end;max-width:1400px;margin:auto;border-bottom:1px solid #34747e;padding-bottom:22px}h1,h2{font-family:Orbitron,sans-serif;margin:0}.eyebrow{color:#70e5d2;letter-spacing:3px;font-size:12px;margin:0 0 8px}.admin-header h1{font-size:clamp(24px,4vw,42px);color:#f2ffff}.actions{display:flex;gap:8px;flex-wrap:wrap}.actions button{background:#153a47;border:1px solid #4d9da2;color:#dffefd;padding:9px 14px;border-radius:3px;cursor:pointer}.actions button:hover{background:#237174}.notice,.status,.error{max-width:1400px;margin:20px auto;color:#a9c6cb}.error{color:#ff8585}.table-list{max-width:1400px;margin:auto;display:grid;gap:24px}.table-panel{background:rgba(9,23,31,.82);border:1px solid #28525c;border-radius:6px;overflow:hidden}.table-heading{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #28525c}.table-heading h2{font-size:18px;color:#70e5d2}.table-heading span{color:#9ab7bb;font-size:13px}.grid-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:640px}th,td{text-align:left;padding:11px 14px;border-bottom:1px solid #1d3b43;white-space:nowrap;max-width:300px;overflow:hidden;text-overflow:ellipsis}th{color:#b5eff0;background:#102c35;font-size:13px}th small{display:block;color:#6e9a9e;font-weight:normal;margin-top:2px}td{color:#d1e1e2;font-size:14px}tbody tr:hover{background:rgba(112,229,210,.06)}
    @media(max-width:680px){.admin-header{align-items:start;flex-direction:column}.actions{width:100%}.actions button{flex:1}}
  `]
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  tables: DatabaseTable[] = [];
  loading = true;
  error = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.adminService.getDatabase().subscribe({ next: response => { this.tables = response.tables; this.loading = false; }, error: error => { this.loading = false; this.error = error.error?.error || 'Unable to load database'; } });
  }

  goProfile() { this.router.navigate(['/profile']); }
  logout() { this.authService.logout(); }
}