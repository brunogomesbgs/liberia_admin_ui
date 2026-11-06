import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Chat Requests (Human in Loop)</h2>
    <table>
      <thead>
        <tr>
          <th>Session ID</th>
          <th>Book</th>
          <th>User ID</th>
          <th>Sentiment</th>
          <th>Evaluations</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let chat of requestedChats">
          <td>{{ chat.id }}</td>
          <td>{{ chat.book_title }}</td>
          <td>{{ chat.user_id }}</td>
          <td>{{ chat.sentiment || 'Neutral' }}</td>
          <td>{{ chat.evaluation_count || 0 }}</td>
          <td>
            <button (click)="onAnswer.emit(chat.id)">Answer Chat</button>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class ChatRequestsComponent {
  @Input() requestedChats: any[] = [];
  @Output() onAnswer = new EventEmitter<string>();
}
