import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkService } from './network.service';

export interface FotoReporte {
  imagen_base64: string;
}

export interface ReporteRequest {
  asunto: string;
  descripcion: string;
  estado: 'baja' | 'media' | 'alta';
  latitud: number;
  longitud: number;
  fotos?: FotoReporte[];
  id_asignacion?: number | string;
}

export interface Reporte {
  id_registro: number;
  asunto: string;
  descripcion: string;
  fecha: string;
  estado: string;
  id_usuario: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(
    private api: ApiService,
    private offlineStorage: OfflineStorageService,
    private network: NetworkService
  ) {}

  /**
   * Envía un reporte. Si no hay conexión, lo guarda offline
   * para sincronizar cuando vuelva internet.
   */
  async enviarReporte(reporte: ReporteRequest): Promise<any> {
    if (this.network.isOnline) {
      try {
        return await this.api.fetch('/api/driver/reportes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reporte)
        });
      } catch (error) {
        // Si falla estando online, guardar offline como respaldo
        console.warn('[Reporte] Error enviando, guardando offline:', error);
        await this.offlineStorage.guardarReporte(reporte);
        return { offline: true, message: 'Reporte guardado localmente. Se enviará al recuperar conexión.' };
      }
    } else {
      console.log('[Reporte] Sin conexión. Guardando reporte offline...');
      await this.offlineStorage.guardarReporte(reporte);
      return { offline: true, message: 'Sin conexión. Reporte guardado localmente.' };
    }
  }

  async getReportes(): Promise<Reporte[]> {
    const res = await this.api.fetch('/api/driver/reportes', { method: 'GET' });
    return res?.data || res || [];
  }

  async getReporte(id: number): Promise<Reporte> {
    const res = await this.api.fetch(`/api/driver/reportes/${id}`, { method: 'GET' });
    return res?.data || res;
  }
}
