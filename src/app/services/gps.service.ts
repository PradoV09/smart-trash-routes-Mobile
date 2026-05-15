import { Injectable } from '@angular/core';
import { AsignacionesService } from './asignaciones.service';

@Injectable({
  providedIn: 'root'
})
export class GpsService {
  private intervalo: any;
  private asignacionId: string | number | null = null;
  private idRecorrido: string | null = null;

  constructor(private asignacionesService: AsignacionesService) {}

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

        // Enviar a endpoint interno
        try {
          await this.asignacionesService.enviarPosicion(this.asignacionId!, {
            latitud: latitude,
            longitud: longitude,
            accuracy: accuracy,
            speed: speed || 0,
            bearing: heading || 0,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('GPS interno error', err);
        }

        // Enviar a API externa si tenemos id_recorrido
        if (this.idRecorrido) {
          try {
            await this.asignacionesService.enviarPosicionExterna(
              this.idRecorrido,
              latitude,
              longitude
            );
          } catch (err) {
            console.error('GPS externo error', err);
          }
        }
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}