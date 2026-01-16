import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  @Output() openNewEntry = new EventEmitter<void>();
}
