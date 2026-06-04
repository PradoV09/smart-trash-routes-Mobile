import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

export interface Tripulante {
  id: number;
  rol_tripulacion: string;
  username: string;
  correo: string;
}

export interface PuntoRuta {
  lat: number;
  lon: number;
}

export interface Asignacion {
  id: string | number;
  placa: string;
  modelo: string;
  capacidad: number;
  estado: 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
  fecha: string;
  hora_salida?: string;
  id_ruta?: string;
  id_recorrido?: string;
  ruta_nombre?: string;
  ruta_color?: string;
  ruta_shape?: PuntoRuta[];
  tripulacion_nombre?: string;
  tripulantes?: Tripulante[];
}

export interface PosicionGPS {
  latitud: number;
  longitud: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  timestamp: string;
}

export interface FotoAsignacion {
  nombre: string;
  data: string;
  tipo: 'recoleccion' | 'incidencia' | 'cumplimiento';
}

@Injectable({
  providedIn: 'root'
})
export class AsignacionesService {
  constructor(private api: ApiService) {}

  // Parsea el shape MultiLineString (string JSON) a array de {lat, lon}
  private parseShape(shape: any): PuntoRuta[] {
    if (!shape) return [];
    try {
      const geojson = typeof shape === 'string' ? JSON.parse(shape) : shape;
      if (geojson.type === 'MultiLineString') {
        // coordinates: [[[lon, lat], [lon, lat]], [[lon, lat]...]]
        const puntos: PuntoRuta[] = [];
        for (const linea of geojson.coordinates) {
          for (const coord of linea) {
            puntos.push({ lat: coord[1], lon: coord[0] });
          }
        }
        return puntos;
      }
      if (geojson.type === 'LineString') {
        return geojson.coordinates.map((c: number[]) => ({ lat: c[1], lon: c[0] }));
      }
      return [];
    } catch (e) {
      console.error('Error parseando shape', e);
      return [];
    }
  }

  async getAsignaciones(): Promise<Asignacion[]> {
    const res = await this.api.fetch('/api/driver/asignaciones', { method: 'GET' });
    console.log('API Response:', JSON.stringify(res));
    const lista = Array.isArray(res) ? res : (res?.data || []);
    const mapped = lista.map((a: any) => ({
      id: a.id_asignacion || a.id,
      id_ruta: a.id_ruta,
      id_recorrido: a.id_recorrido || a.recorrido_externo_id || null,
      placa: a.vehiculo?.placa || 'N/A',
      modelo: a.vehiculo?.modelo || 'N/A',
      capacidad: a.vehiculo?.capacidad_m3 || 0,
      estado: (a.estado || 'pendiente').toLowerCase(),
      fecha: a.fecha,
      hora_salida: a.hora_salida,
      ruta_nombre: a.ruta?.nombre_ruta || null,
      ruta_color: a.ruta?.color_hex || '#0A4174',
      ruta_shape: this.parseShape(a.ruta?.shape),
      tripulacion_nombre: a.tripulacion?.nombre || null,
      tripulantes: (a.tripulacion?.miembros || []).map((m: any) => ({
        id: m.id,
        rol_tripulacion: m.rol_tripulacion || m.rol,
        username: m.usuario?.username || m.username || 'Usuario',
        correo: m.usuario?.correo || m.correo || '',
      }))
    }));
    console.log('Mapped Asignaciones:', JSON.stringify(mapped));
    return mapped;
  }

  async iniciarRecorrido(id: string | number): Promise<any> {
    const res = await this.api.fetch(`/api/driver/asignaciones/${id}/iniciar`, { method: 'POST' });
    return res?.data;
  }

  async finalizarRecorrido(id: string | number): Promise<any> {
    const res = await this.api.fetch(`/api/driver/asignaciones/${id}/finalizar`, { method: 'POST' });
    return res?.data;
  }

  async enviarPosicion(id: string | number, posicion: PosicionGPS): Promise<any> {
    return this.api.fetch(`/api/driver/asignaciones/${id}/posiciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posicion)
    });
  }

  async enviarPosicionExterna(idRecorrido: string, lat: number, lon: number): Promise<any> {
    const token = localStorage.getItem('access_token');
    return fetch(`${environment.apiConfig.baseUrl}/api/recorridos/${idRecorrido}/posiciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lat, lon })
    });
  }

  async getPosicionesRecorrido(idRecorrido: string): Promise<{ lat: number; lon: number; timestamp: string }[]> {
    const res = await fetch(`${environment.apiConfig.baseUrl}/api/recorridos/${idRecorrido}/posiciones`);
    const data = await res.json();
    return data?.data || [];
  }

  async enviarFoto(id: string | number, foto: FotoAsignacion): Promise<any> {
    return this.api.fetch(`/api/driver/asignaciones/${id}/fotos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(foto)
    });
  }

  async getTripulacion(id: string | number): Promise<any> {
    const res = await this.api.fetch(`/api/driver/asignaciones/${id}/tripulacion`, { method: 'GET' });
    return res?.data || res;
  }
}