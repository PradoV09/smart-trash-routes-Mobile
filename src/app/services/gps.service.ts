import { Injectable } from '@angular/core';
import { AsignacionesService } from './asignaciones.service';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkService } from './network.service';

@Injectable({ providedIn: 'root' })
export class GpsService {
  private intervalo: any;
  private asignacionId: string | number | null = null;
  private idRecorrido: string | null = null;

  constructor(
    private asignacionesService: AsignacionesService,
    private offlineStorage: OfflineStorageService,
    private network: NetworkService
  ) {}

  iniciarTracking(id: string | number, idRecorrido?: string) {
    this.asignacionId = id;
    this.idRecorrido = idRecorrido || null;
    this.enviarPosicion();
    this.intervalo = setInterval(() => this.enviarPosicion(), 30000);
  }

  detenerTracking() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this.asignacionId = null;
    this.idRecorrido = null;
  }

  private enviarPosicion() {
    if (!this.asignacionId) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const posicion = {
          asignacionId: this.asignacionId!,
          idRecorrido: this.idRecorrido,
          latitud: latitude,
          longitud: longitude,
          accuracy: accuracy ?? undefined,
          speed: speed ?? 0,
          bearing: heading ?? 0,
          timestamp: new Date().toISOString()
        };

        if (this.network.isOnline) {
          // Con conexión: enviar directo
          try {
            await this.asignacionesService.enviarPosicion(this.asignacionId!, {
              latitud: latitude,
              longitud: longitude,
              accuracy,
              speed: speed || 0,
              bearing: heading || 0,
              timestamp: posicion.timestamp
            });
          } catch (err) {
            console.warn('[GPS] Error enviando online, guardando offline:', err);
            await this.offlineStorage.guardarPosicion(posicion);
          }

          if (this.idRecorrido) {
            try {
              await this.asignacionesService.enviarPosicionExterna(this.idRecorrido, latitude, longitude);
            } catch (err) {
              console.error('[GPS] Error GPS externo:', err);
            }
          }
        } else {
          // Sin conexión: guardar en IndexedDB
          console.log('[GPS] Sin conexión. Guardando posición offline...');
          await this.offlineStorage.guardarPosicion(posicion);
        }
      },
      (err) => console.error('[GPS] Error obteniendo posición:', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}
