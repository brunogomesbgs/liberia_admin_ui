import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = '';
  private tokenKey = 'admin_token';

  currentUser = signal<any>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.location.port) {
        this.apiUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
      } else {
        this.apiUrl = `${window.location.origin}:8000`;
      }
    } else {
      this.apiUrl = 'http://localhost:8000';
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  login(username: string, password: string): Observable<any> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<any>(`${this.apiUrl}/token`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenKey, response.access_token);
        }
        this.currentUser.set({ username });
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, {
      username,
      password
    }, {
      headers: { 'X-Origin': 'admin-ui' }
    });
  }
}
