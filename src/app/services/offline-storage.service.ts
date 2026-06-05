import { Injectable } from '@angular/core';

export interface PosicionPendiente {
  id?: number;
  asignacionId: string | number;
  idRecorrido?: string | null;
  latitud: number;
  longitud: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  timestamp: string;
  sincronizado: boolean;
}

export interface ReportePendiente {
  id?: number;
  payload: any;
  timestamp: string;
  sincronizado: boolean;
}

export interface FotoPendiente {
  id?: number;
  asignacionId: string | number;
  payload: any;
  timestamp: string;
  sincronizado: boolean;
}

export interface AsignacionCache {
  id: string | number;
  data: any;
  cachedAt: string;
}

const DB_NAME = 'smart-trash-offline';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('posiciones')) {
          const posStore = db.createObjectStore('posiciones', { keyPath: 'id', autoIncrement: true });
          posStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        }

        if (!db.objectStoreNames.contains('reportes')) {
          const repStore = db.createObjectStore('reportes', { keyPath: 'id', autoIncrement: true });
          repStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        }

        if (!db.objectStoreNames.contains('fotos')) {
          const fotoStore = db.createObjectStore('fotos', { keyPath: 'id', autoIncrement: true });
          fotoStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        }

        if (!db.objectStoreNames.contains('asignaciones_cache')) {
          db.createObjectStore('asignaciones_cache', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private getDB(): IDBDatabase {
    if (!this.db) throw new Error('IndexedDB no inicializado. Llama a init() primero.');
    return this.db;
  }

  // ─── POSICIONES GPS ────────────────────────────────────────────────────────

  async guardarPosicion(posicion: Omit<PosicionPendiente, 'id' | 'sincronizado'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('posiciones', 'readwrite');
      const store = tx.objectStore('posiciones');
      const record: PosicionPendiente = { ...posicion, sincronizado: 0 as any };
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPosicionesPendientes(): Promise<PosicionPendiente[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('posiciones', 'readonly');
      const store = tx.objectStore('posiciones');
      const index = store.index('sincronizado');
      const req = index.getAll(IDBKeyRange.only(0));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async marcarPosicionSincronizada(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('posiciones', 'readwrite');
      const store = tx.objectStore('posiciones');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.sincronizado = 1 as any;
          const putReq = store.put(record);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async limpiarPosicionesSincronizadas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('posiciones', 'readwrite');
      const store = tx.objectStore('posiciones');
      const index = store.index('sincronizado');
      const req = index.openCursor(IDBKeyRange.only(1));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ─── REPORTES ─────────────────────────────────────────────────────────────

  async guardarReporte(payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('reportes', 'readwrite');
      const store = tx.objectStore('reportes');
      const record: ReportePendiente = {
        payload,
        timestamp: new Date().toISOString(),
        sincronizado: 0 as any
      };
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getReportesPendientes(): Promise<ReportePendiente[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('reportes', 'readonly');
      const store = tx.objectStore('reportes');
      const index = store.index('sincronizado');
      const req = index.getAll(IDBKeyRange.only(0));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async marcarReporteSincronizado(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('reportes', 'readwrite');
      const store = tx.objectStore('reportes');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.sincronizado = 1 as any;
          const putReq = store.put(record);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ─── FOTOS ─────────────────────────────────────────────────────────────────

  async guardarFoto(asignacionId: string | number, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('fotos', 'readwrite');
      const store = tx.objectStore('fotos');
      const record: FotoPendiente = {
        asignacionId,
        payload,
        timestamp: new Date().toISOString(),
        sincronizado: 0 as any
      };
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getFotosPendientes(): Promise<FotoPendiente[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('fotos', 'readonly');
      const store = tx.objectStore('fotos');
      const index = store.index('sincronizado');
      const req = index.getAll(IDBKeyRange.only(0));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async marcarFotoSincronizada(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('fotos', 'readwrite');
      const store = tx.objectStore('fotos');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.sincronizado = 1 as any;
          const putReq = store.put(record);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ─── CACHÉ DE ASIGNACIONES ─────────────────────────────────────────────────

  async guardarAsignacionesCache(asignaciones: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('asignaciones_cache', 'readwrite');
      const store = tx.objectStore('asignaciones_cache');

      // Limpiar primero
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        let pendientes = asignaciones.length;
        if (pendientes === 0) { resolve(); return; }
        asignaciones.forEach(a => {
          const record: AsignacionCache = {
            id: a.id,
            data: a,
            cachedAt: new Date().toISOString()
          };
          const putReq = store.put(record);
          putReq.onsuccess = () => { pendientes--; if (pendientes === 0) resolve(); };
          putReq.onerror = () => reject(putReq.error);
        });
      };
      clearReq.onerror = () => reject(clearReq.error);
    });
  }

  async getAsignacionesCache(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getDB().transaction('asignaciones_cache', 'readonly');
      const store = tx.objectStore('asignaciones_cache');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.map((r: AsignacionCache) => r.data));
      req.onerror = () => reject(req.error);
    });
  }

  // ─── CONTADORES ────────────────────────────────────────────────────────────

  async contarPendientes(): Promise<{ posiciones: number; reportes: number; fotos: number }> {
    const [posiciones, reportes, fotos] = await Promise.all([
      this.getPosicionesPendientes(),
      this.getReportesPendientes(),
      this.getFotosPendientes()
    ]);
    return {
      posiciones: posiciones.length,
      reportes: reportes.length,
      fotos: fotos.length
    };
  }
}