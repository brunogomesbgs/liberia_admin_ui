import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Users</h2>

    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
      <h3>Create New Admin User</h3>
      <input type="text" [(ngModel)]="newUsername" placeholder="Username">
      <input type="password" [(ngModel)]="newPassword" placeholder="Password">
      <button (click)="onCreateAdmin()">Create Admin</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Role</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of users">
          <td>{{ user.id }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.created_at }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class UserListComponent {
  @Input() users: any[] = [];
  @Output() onCreateUser = new EventEmitter<{username: string, password_hash: string}>();

  newUsername = '';
  newPassword = '';

  onCreateAdmin() {
    if (this.newUsername && this.newPassword) {
      this.onCreateUser.emit({
        username: this.newUsername,
        password_hash: this.newPassword
      });
      this.newUsername = '';
      this.newPassword = '';
    }
  }
}
