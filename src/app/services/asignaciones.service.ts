import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Tripulante {
  id: number;
  rol_tripulacion: string;
  username: string;
  correo: string;
}

export interface Asignacion {
  id: string | number;
  placa: string;
  modelo: string;
  capacidad: number;
  estado: 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
  fecha: string;
  hora_salida?: string;
  // Campos de tripulación (de la spec)
  tripulacion_nombre?: string;
  tripulantes?: Tripulante[];
}

@Injectable({
  providedIn: 'root'
})
export class AsignacionesService {
  constructor(private api: ApiService) {}

  async getAsignaciones(): Promise<Asignacion[]> {
    const res = await this.api.fetch('/driver/asignaciones', { method: 'GET' });
    const lista = res?.data || [];

    return lista.map((a: any) => ({
      id: a.id_asignacion,
      placa: a.vehiculo?.placa || 'N/A',
      modelo: a.vehiculo?.modelo || 'N/A',
      capacidad: a.vehiculo?.capacidad_m3 || 0,
      estado: a.estado,
      fecha: a.fecha,
      hora_salida: a.hora_salida,
      // Tripulación desde la spec: a.tripulacion.nombre y a.tripulacion.miembros
      tripulacion_nombre: a.tripulacion?.nombre || null,
      tripulantes: (a.tripulacion?.miembros || []).map((m: any) => ({
        id: m.id,
        rol_tripulacion: m.rol_tripulacion,
        username: m.usuario?.username || '',
        correo: m.usuario?.correo || '',
      }))
    }));
  }

  async iniciarRecorrido(id: string | number): Promise<any> {
    const res = await this.api.fetch(`/driver/asignaciones/${id}/iniciar`, { method: 'POST' });
    return res?.data;
  }

  async finalizarRecorrido(id: string | number): Promise<any> {
    const res = await this.api.fetch(`/driver/asignaciones/${id}/finalizar`, { method: 'POST' });
    return res?.data;
  }
}