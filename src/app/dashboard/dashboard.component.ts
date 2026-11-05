import { Component, signal, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { UserListComponent } from '../users/user-list.component';
import { BookListComponent } from '../books/book-list.component';
import { ChatRequestsComponent } from '../chats/chat-requests.component';
import { ChatDetailComponent } from '../chats/chat-detail.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UserListComponent,
    BookListComponent,
    ChatRequestsComponent,
    ChatDetailComponent
  ],
  template: `
    <nav class="admin-nav">
      <div class="nav-brand">{{ title() }}</div>
      <div class="nav-links">
        <button [class.active]="activeTab() === 'users'" (click)="setTab('users')">Users</button>
        <button [class.active]="activeTab() === 'books'" (click)="setTab('books')">Books</button>
        <button [class.active]="activeTab() === 'chats'" (click)="setTab('chats')">Chat Requests</button>
      </div>
      <div class="nav-auth">
        <button (click)="logout()">Logout</button>
      </div>
    </nav>

    <div class="admin-content">
      <app-user-list *ngIf="activeTab() === 'users'" [users]="users()" (onCreateUser)="createUser($event)"></app-user-list>
      <app-book-list *ngIf="activeTab() === 'books'" [books]="books()"></app-book-list>
      <app-chat-requests *ngIf="activeTab() === 'chats' && !selectedChatId()" [requestedChats]="requestedChats()" (onAnswer)="answerChat($event)"></app-chat-requests>
      <app-chat-detail *ngIf="activeTab() === 'chats' && selectedChatId()" [sessionId]="selectedChatId()!" [apiUrl]="apiUrl" (onClose)="closeChat()" (onReplied)="onReplied()"></app-chat-detail>
    </div>
  `,
  styles: [`
    .admin-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background-color: #333;
      color: white;
    }
    .nav-brand {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .nav-links button {
      background: none;
      border: none;
      color: #ccc;
      padding: 10px 15px;
      cursor: pointer;
      font-size: 1rem;
    }
    .nav-links button.active {
      color: white;
      border-bottom: 2px solid white;
    }
    .nav-auth button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 5px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    .admin-content {
      padding: 20px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  protected readonly title = signal('Liberia Admin');
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  users = signal<any[]>([]);
  books = signal<any[]>([]);
  requestedChats = signal<any[]>([]);

  activeTab = signal<'users' | 'books' | 'chats'>('users');
  selectedChatId = signal<string | null>(null);

  protected apiUrl = '';
  private refreshInterval: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.location.port) {
        this.apiUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
      } else {
        this.apiUrl = `${window.location.origin}:8000`;
      }
    } else {
      this.apiUrl = 'http://localhost:8000'; // Fallback for SSR
    }
  }

  ngOnInit() {
    this.loadData();
    if (isPlatformBrowser(this.platformId)) {
      this.refreshInterval = setInterval(() => this.loadRequestedChats(), 5000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadData() {
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${this.apiUrl}/admin/users`, { headers }).subscribe({
      next: data => this.users.set(data),
      error: err => {
        console.error('Failed to load users', err);
        if (err.status === 401) this.authService.logout();
      }
    });
    this.http.get<any[]>(`${this.apiUrl}/admin/books`, { headers }).subscribe({
      next: data => this.books.set(data),
      error: err => console.error('Failed to load books', err)
    });
    this.loadRequestedChats();
  }

  loadRequestedChats() {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${this.apiUrl}/admin/chats/requested`, { headers }).subscribe({
      next: data => {
        // Only update if data changed to avoid unnecessary re-renders
        if (JSON.stringify(data) !== JSON.stringify(this.requestedChats())) {
          this.requestedChats.set(data);
        }
      },
      error: err => console.error('Failed to load chat requests', err)
    });
  }

  setTab(tab: 'users' | 'books' | 'chats') {
    this.activeTab.set(tab);
  }

  createUser(userData: {username: string, password_hash: string}) {
    const token = this.authService.getToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Origin': 'admin-ui'
    };
    this.http.post(`${this.apiUrl}/users`, userData, { headers }).subscribe({
      next: () => {
        alert('Admin user created successfully');
        this.loadData();
      },
      error: err => console.error('Failed to create admin user', err)
    });
  }

  answerChat(sessionId: string) {
    this.selectedChatId.set(sessionId);
  }

  closeChat() {
    this.selectedChatId.set(null);
  }

  onReplied() {
    this.loadRequestedChats();
  }

  logout() {
    this.authService.logout();
  }
}
