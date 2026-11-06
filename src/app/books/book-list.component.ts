import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Books</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Author</th>
          <th>Format</th>
          <th>Chunks</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let book of books">
          <td>{{ book.id }}</td>
          <td>{{ book.title }}</td>
          <td>{{ book.author }}</td>
          <td>{{ (book.source_format || 'text') | uppercase }}</td>
          <td>{{ book.chunk_count ?? 0 }}</td>
          <td>{{ book.ingestion_status || 'completed' }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class BookListComponent {
  @Input() books: any[] = [];
}
