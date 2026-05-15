import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <div class="admin-card skeleton-card" style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="skeleton skeleton-icon"></div>
          <div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton skeleton-badge"></div>
      </div>
      <div class="skeleton skeleton-divider"></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
        <div class="skeleton skeleton-block"></div>
        <div class="skeleton skeleton-block"></div>
      </div>
      <div class="skeleton skeleton-block-full"></div>
      <div class="skeleton skeleton-button"></div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      border: 1px solid var(--border-color);
      pointer-events: none;
    }
    .skeleton {
      background: var(--border-color);
      position: relative;
      overflow: hidden;
      border-radius: 4px;
    }
    .skeleton::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.2) 20%,
        rgba(255, 255, 255, 0.5) 60%,
        rgba(255, 255, 255, 0)
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }

    .skeleton-icon { width: 48px; height: 48px; border-radius: 14px; }
    .skeleton-title { width: 100px; height: 18px; margin-bottom: 8px; }
    .skeleton-subtitle { width: 60px; height: 14px; }
    .skeleton-badge { width: 80px; height: 24px; border-radius: 20px; }
    .skeleton-divider { height: 1px; margin-bottom: 16px; }
    .skeleton-block { height: 60px; border-radius: 12px; }
    .skeleton-block-full { height: 50px; border-radius: 12px; margin-bottom: 16px; }
    .skeleton-button { height: 45px; border-radius: 12px; }
  `]
})
export class SkeletonCardComponent {}
