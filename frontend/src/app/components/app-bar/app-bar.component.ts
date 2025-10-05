import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './app-bar.component.html',
  styleUrl: './app-bar.component.scss'
})
export class AppBarComponent implements OnInit, OnDestroy {
  @Output() workflowsClick = new EventEmitter<void>();
  @Output() standardPropertiesClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  title = 'Resources Manager';
  isDarkTheme = false;

  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkTheme = theme === 'dark';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onWorkflowsClick(): void {
    this.workflowsClick.emit();
  }

  onStandardPropertiesClick(): void {
    this.standardPropertiesClick.emit();
  }

  onExportClick(): void {
    this.exportClick.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
