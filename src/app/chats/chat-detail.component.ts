import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-detail">
      <div class="chat-header">
        <h3>Chat Context: {{ sessionId }}</h3>
        <button class="close-btn" (click)="onClose.emit()">×</button>
      </div>
      <div class="message-history">
        <div *ngFor="let msg of messages" [ngClass]="['message', msg.sender_type]">
          <div class="sender">
            <strong>{{ msg.sender_type | titlecase }}</strong> 
            <small>{{ msg.created_at | date:'shortTime' }}</small>
            <span *ngIf="msg.feedback" class="feedback-icon" [title]="msg.feedback">
              {{ msg.feedback === 'up' ? '👍' : '👎' }}
            </span>
          </div>
          <div class="content">{{ msg.content }}</div>
        </div>
      </div>
      <div class="reply-box">
        <textarea [(ngModel)]="replyText" placeholder="Type your response..."></textarea>
        <div class="actions">
          <button class="send-btn" (click)="sendReply()" [disabled]="!replyText">Send Response</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-detail {
      border: 1px solid #ccc;
      padding: 15px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }
    .message-history {
      height: 400px;
      overflow-y: auto;
      margin-bottom: 15px;
      border: 1px solid #eee;
      padding: 15px;
      background: #f8f9fa;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .message {
      max-width: 80%;
      padding: 10px;
      border-radius: 8px;
    }
    .sender {
      font-size: 0.8rem;
      margin-bottom: 5px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .feedback-icon {
      font-size: 1rem;
    }
    .user {
      background: #e3f2fd;
      align-self: flex-start;
      border-bottom-left-radius: 0;
    }
    .agent {
      background: #f5f5f5;
      align-self: flex-start;
      border-bottom-left-radius: 0;
      border: 1px dashed #ccc;
    }
    .admin {
      background: #e8f5e9;
      align-self: flex-end;
      border-bottom-right-radius: 0;
    }
    .reply-box textarea {
      width: 100%;
      height: 100px;
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
    }
    .send-btn {
      background-color: #28a745;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    .send-btn:disabled {
      background-color: #ccc;
    }
  `]
})
export class ChatDetailComponent implements OnInit {
  @Input() sessionId!: string;
  @Input() apiUrl!: string;
  @Output() onClose = new EventEmitter<void>();
  @Output() onReplied = new EventEmitter<void>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  messages: any[] = [];
  replyText = '';

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${this.apiUrl}/admin/chat/${this.sessionId}/history`, { headers }).subscribe({
      next: data => this.messages = data,
      error: err => console.error('Failed to load history', err)
    });
  }

  sendReply() {
    if (!this.replyText) return;
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post(`${this.apiUrl}/admin/chat/${this.sessionId}/respond`, { message: this.replyText }, { headers }).subscribe({
      next: () => {
        this.replyText = '';
        this.loadHistory();
        this.onReplied.emit();
      },
      error: err => console.error('Failed to send response', err)
    });
  }
}
