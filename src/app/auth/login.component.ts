import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h1>Liberia Admin</h1>
        <h2>{{ isLoginMode() ? 'Login' : 'Register Admin' }}</h2>

        <div *ngIf="error()" class="error-message">
          {{ error() }}
        </div>
        <div *ngIf="success()" class="success-message">
          {{ success() }}
        </div>

        <form *ngIf="isLoginMode()" (submit)="onLogin($event)">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" [(ngModel)]="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required>
          </div>
          <button type="submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <form *ngIf="!isLoginMode()" (submit)="onRegister($event)">
          <div class="form-group">
            <label for="reg-username">Username</label>
            <input type="text" id="reg-username" [(ngModel)]="regUsername" name="regUsername" required>
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" [(ngModel)]="regPassword" name="regPassword" required>
          </div>
          <button type="submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Registering...' : 'Register' }}
          </button>
        </form>

        <div class="toggle-mode">
          <a href="javascript:void(0)" (click)="toggleMode()">
            {{ isLoginMode() ? 'Need an account? Register' : 'Have an account? Login' }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .login-box {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:disabled {
      background-color: #ccc;
    }
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .success-message {
      background-color: #d4edda;
      color: #155724;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .toggle-mode {
      margin-top: 20px;
    }
    .toggle-mode a {
      color: #007bff;
      text-decoration: none;
      font-size: 0.9rem;
    }
    h1 { margin-bottom: 10px; color: #333; }
    h2 { margin-bottom: 20px; color: #666; font-size: 1.2rem; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = signal(true);
  username = '';
  password = '';

  regUsername = '';
  regPassword = '';

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  toggleMode() {
    this.isLoginMode.update(v => !v);
    this.error.set(null);
    this.success.set(null);
  }

  onLogin(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.error.set('Invalid username or password');
        this.isLoading.set(false);
      }
    });
  }

  onRegister(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.register(this.regUsername, this.regPassword).subscribe({
      next: () => {
        this.success.set('Admin user created successfully! You can now login.');
        this.isLoginMode.set(true);
        this.isLoading.set(false);
        this.username = this.regUsername;
        this.regUsername = '';
        this.regPassword = '';
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.error.set(err.error?.detail || 'Registration failed. User might already exist.');
        this.isLoading.set(false);
      }
    });
  }
}
