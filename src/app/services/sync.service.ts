import { Injectable } from '@angular/core';
import { NetworkService } from './network.service';
import { OfflineStorageService } from './offline-storage.service';
import { AsignacionesService } from './asignaciones.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private sincronizando = false;

  constructor(
    private network: NetworkService,
    private offlineStorage: OfflineStorageService,
    private asignaciones: AsignacionesService,
    private api: ApiService
  ) {}

  /**
   * Inicia la escucha de eventos de red.
   * Llamar desde AppComponent.ngOnInit()
   */
  init() {
    this.network.online$.subscribe(isOnline => {
      if (isOnline) {
        console.log('[Sync] Conexión recuperada. Iniciando sincronización...');
        this.sincronizarTodo();
      }
    });
  }

  async sincronizarTodo(): Promise<void> {
    if (this.sincronizando) return;
    if (this.network.isOffline) return;

    this.sincronizando = true;
    console.log('[Sync] Iniciando sincronización completa...');

    try {
      await this.sincronizarPosiciones();
      await this.sincronizarReportes();
      await this.sincronizarFotos();
      console.log('[Sync] Sincronización completa exitosa.');
    } catch (error) {
      console.error('[Sync] Error durante sincronización:', error);
    } finally {
      this.sincronizando = false;
    }
  }

  // ─── POSICIONES GPS ────────────────────────────────────────────────────────

  private async sincronizarPosiciones(): Promise<void> {
    const pendientes = await this.offlineStorage.getPosicionesPendientes();
    if (pendientes.length === 0) return;

    console.log(`[Sync] Sincronizando ${pendientes.length} posiciones GPS...`);

    for (const pos of pendientes) {
      try {
        // Endpoint interno
        await this.asignaciones.enviarPosicion(pos.asignacionId, {
          latitud: pos.latitud,
          longitud: pos.longitud,
          accuracy: pos.accuracy,
          speed: pos.speed,
          bearing: pos.bearing,
          timestamp: pos.timestamp
        });

        // Endpoint externo (si aplica)
        if (pos.idRecorrido) {
          await this.asignaciones.enviarPosicionExterna(pos.idRecorrido, pos.latitud, pos.longitud);
        }

        await this.offlineStorage.marcarPosicionSincronizada(pos.id!);
        console.log(`[Sync] Posición ${pos.id} sincronizada.`);
      } catch (error) {
        console.error(`[Sync] Error sincronizando posición ${pos.id}:`, error);
        // Continúa con la siguiente; no se marca como sincronizada
      }
    }

    await this.offlineStorage.limpiarPosicionesSincronizadas();
  }

  // ─── REPORTES ─────────────────────────────────────────────────────────────

  private async sincronizarReportes(): Promise<void> {
    const pendientes = await this.offlineStorage.getReportesPendientes();
    if (pendientes.length === 0) return;

    console.log(`[Sync] Sincronizando ${pendientes.length} reportes...`);

    for (const reporte of pendientes) {
      try {
        await this.api.fetch('/api/driver/reportes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reporte.payload)
        });

        await this.offlineStorage.marcarReporteSincronizado(reporte.id!);
        console.log(`[Sync] Reporte ${reporte.id} sincronizado.`);
      } catch (error) {
        console.error(`[Sync] Error sincronizando reporte ${reporte.id}:`, error);
      }
    }
  }

  // ─── FOTOS ─────────────────────────────────────────────────────────────────

  private async sincronizarFotos(): Promise<void> {
    const pendientes = await this.offlineStorage.getFotosPendientes();
    if (pendientes.length === 0) return;

    console.log(`[Sync] Sincronizando ${pendientes.length} fotos...`);

    for (const foto of pendientes) {
      try {
        await this.api.fetch(`/api/driver/asignaciones/${foto.asignacionId}/fotos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(foto.payload)
        });

        await this.offlineStorage.marcarFotoSincronizada(foto.id!);
        console.log(`[Sync] Foto ${foto.id} sincronizada.`);
      } catch (error) {
        console.error(`[Sync] Error sincronizando foto ${foto.id}:`, error);
      }
    }
  }

  async getPendientesCount(): Promise<{ posiciones: number; reportes: number; fotos: number; total: number }> {
    const counts = await this.offlineStorage.contarPendientes();
    return {
      ...counts,
      total: counts.posiciones + counts.reportes + counts.fotos
    };
  }
}
