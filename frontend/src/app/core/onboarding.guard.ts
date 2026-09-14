import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const profileService = inject(ProfileService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, go to login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const profile = profileService.profile();

  // If profile not loaded yet, allow navigation and let component handle it
  if (!profile) {
    return true;
  }

  // If already onboarded, redirect to profile
  if (profile.onboarded) {
    router.navigate(['/profile']);
    return false;
  }

  return true;
};

export const profileGuard: CanActivateFn = (route, state) => {
  const profileService = inject(ProfileService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, go to login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const profile = profileService.profile();

  // If profile not loaded, allow navigation
  if (!profile) {
    return true;
  }

  // If not onboarded, redirect to onboarding
  if (!profile.onboarded) {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};
