import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface SummaryCard {
  title: string;
  value: string;
  meta: string;
  tone?: 'negative' | 'default';
}

@Component({
  selector: 'app-summary-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-section.component.html',
  styleUrl: './summary-section.component.scss'
})
export class SummarySectionComponent {
  @Input({ required: true }) summaryCards: SummaryCard[] = [];
}
