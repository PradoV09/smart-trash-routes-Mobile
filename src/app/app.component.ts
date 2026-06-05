import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OfflineStorageService } from './services/offline-storage.service';
import { SyncService } from './services/sync.service';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private offlineStorage: OfflineStorageService,
    private syncService: SyncService,
    private swUpdateService: SwUpdateService
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    // Inicializar IndexedDB
    await this.offlineStorage.init();

    // Iniciar escucha de red y sincronización automática
    this.syncService.init();

    // Iniciar gestión de actualizaciones del Service Worker
    this.swUpdateService.init();

    console.log('[App] Modo offline-first + Service Worker inicializados.');
  }

  initializeApp() {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
  }
}
