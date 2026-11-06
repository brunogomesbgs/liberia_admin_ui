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
        <button [class.active]="activeTab() === 'evaluation'" (click)="setTab('evaluation')">RAG Evaluation</button>
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

      <div *ngIf="activeTab() === 'evaluation'" class="eval-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2>Retrieval & RAGAS Evaluation Telemetry</h2>
          <button (click)="runBenchmark()" [disabled]="benchmarkRunning()" style="padding: 8px 16px; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
            {{ benchmarkRunning() ? 'Running Benchmark...' : 'Run IR + RAGAS Benchmark' }}
          </button>
        </div>

        <div *ngIf="evaluationSummary()" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
            <h3>Indexed Corpus</h3>
            <p>Total Books: <strong>{{ evaluationSummary()?.corpus?.total_books ?? 0 }}</strong></p>
            <p>Indexed Chunks: <strong>{{ evaluationSummary()?.corpus?.total_chunks ?? 0 }}</strong></p>
          </div>
          <div style="padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
            <h3>User Feedback</h3>
            <p>Evaluated Responses: <strong>{{ evaluationSummary()?.feedback?.evaluated_messages ?? 0 }}</strong></p>
            <p>Thumbs Up / Down: <strong>{{ evaluationSummary()?.feedback?.thumbs_up ?? 0 }} / {{ evaluationSummary()?.feedback?.thumbs_down ?? 0 }}</strong></p>
            <p>Approval Rate: <strong>{{ evaluationSummary()?.feedback?.approval_rate !== null ? ((evaluationSummary()?.feedback?.approval_rate * 100) | number:'1.0-1') + '%' : 'N/A' }}</strong></p>
          </div>
          <div style="padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
            <h3>Similarity & Escalation</h3>
            <p>Avg Top Similarity: <strong>{{ evaluationSummary()?.retrieval_telemetry?.avg_top_similarity ?? 'N/A' }}</strong></p>
            <p>Active Escalations: <strong>{{ evaluationSummary()?.sessions?.active_escalations ?? 0 }}</strong></p>
          </div>
        </div>

        <div *ngIf="benchmarkResult()" style="padding: 16px; border: 1px solid #cce5ff; border-radius: 8px; background: #f8fbff;">
          <h3>Latest Benchmark Results (k = {{ benchmarkResult()?.k }}, samples = {{ benchmarkResult()?.sample_count }})</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
              <h4>IR Metrics</h4>
              <ul>
                <li>HitRate@k: <strong>{{ benchmarkResult()?.ir_metrics?.hit_rate_at_k }}</strong></li>
                <li>Recall@k: <strong>{{ benchmarkResult()?.ir_metrics?.recall_at_k }}</strong></li>
                <li>Precision@k: <strong>{{ benchmarkResult()?.ir_metrics?.precision_at_k }}</strong></li>
                <li>MRR@k: <strong>{{ benchmarkResult()?.ir_metrics?.mrr_at_k }}</strong></li>
                <li>nDCG@k: <strong>{{ benchmarkResult()?.ir_metrics?.ndcg_at_k }}</strong></li>
                <li>MAP@k: <strong>{{ benchmarkResult()?.ir_metrics?.map_at_k }}</strong></li>
              </ul>
            </div>
            <div>
              <h4>RAGAS Metrics</h4>
              <ul>
                <li>Context Precision: <strong>{{ benchmarkResult()?.ragas_metrics?.context_precision }}</strong></li>
                <li>Context Recall: <strong>{{ benchmarkResult()?.ragas_metrics?.context_recall }}</strong></li>
                <li>Faithfulness: <strong>{{ benchmarkResult()?.ragas_metrics?.faithfulness }}</strong></li>
                <li>Answer Relevancy: <strong>{{ benchmarkResult()?.ragas_metrics?.answer_relevancy }}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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
  evaluationSummary = signal<any | null>(null);
  benchmarkResult = signal<any | null>(null);
  benchmarkRunning = signal<boolean>(false);

  activeTab = signal<'users' | 'books' | 'chats' | 'evaluation'>('users');
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
    this.loadEvaluationSummary();
  }

  loadEvaluationSummary() {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${this.apiUrl}/admin/evaluation/summary`, { headers }).subscribe({
      next: data => this.evaluationSummary.set(data),
      error: err => console.error('Failed to load evaluation summary', err)
    });
  }

  runBenchmark() {
    const token = this.authService.getToken();
    if (!token) return;
    this.benchmarkRunning.set(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post<any>(`${this.apiUrl}/admin/evaluation/benchmark`, { k: 5, max_samples: 10 }, { headers }).subscribe({
      next: data => {
        this.benchmarkResult.set(data);
        this.benchmarkRunning.set(false);
        this.loadEvaluationSummary();
      },
      error: err => {
        console.error('Failed to run benchmark', err);
        this.benchmarkRunning.set(false);
      }
    });
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

  setTab(tab: 'users' | 'books' | 'chats' | 'evaluation') {
    this.activeTab.set(tab);
    if (tab === 'evaluation') {
      this.loadEvaluationSummary();
    }
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
