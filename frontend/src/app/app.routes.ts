import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { onboardingGuard, profileGuard } from './core/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/profile',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard, profileGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'tasks',
    canActivate: [authGuard, profileGuard],
    loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent)
  },
  {
    path: '**',
    redirectTo: '/profile'
  }
];
