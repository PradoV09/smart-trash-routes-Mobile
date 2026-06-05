import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { logOutOutline, moonOutline, sunnyOutline, clipboardOutline, checkmarkCircleOutline, timeOutline, listOutline } from 'ionicons/icons';
import { AsignacionesService, Asignacion } from '../../services/asignaciones.service';
import { AuthService } from '../../services/auth.service';
import { GpsService } from '../../services/gps.service';
import { AsignacionCardComponent } from '../../components/asignacion-card/asignacion-card.component';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';
import { WebSocketService } from '../../services/websocket.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, AsignacionCardComponent, SkeletonCardComponent]
})
export class HomePage implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  loading = false;
  isInitialLoading = true;
  isDark = false;
  private serverErrorListener: any;
  private wsConnections: WebSocket[] = [];

  // KPIs
  get completadas(): number {
    return this.asignaciones.filter(a => a.estado === 'completada').length;
  }
  get pendientes(): number {
    return this.asignaciones.filter(a => a.estado === 'pendiente' || a.estado === 'en_curso').length;
  }
  get total(): number {
    return this.asignaciones.length;
  }

  // Date formatting
  get currentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    return now.toLocaleDateString('es-ES', options);
  }

  // Separated assignments
  get asignacionesPendientes(): Asignacion[] {
    return this.asignaciones.filter(a => a.estado === 'pendiente' || a.estado === 'en_curso');
  }
  get asignacionesCompletadas(): Asignacion[] {
    return this.asignaciones.filter(a => a.estado === 'completada');
  }


  constructor(
    private asignacionesService: AsignacionesService,
    private authService: AuthService,
    private toastController: ToastController,
    private webSocketService: WebSocketService,
    private gpsService: GpsService
  ) {
    addIcons({ logOutOutline, moonOutline, sunnyOutline, clipboardOutline, checkmarkCircleOutline, timeOutline, listOutline });
    this.isDark = document.body.classList.contains('dark-theme');
  }

  ngOnInit() {
    this.cargarAsignaciones();
    this.setupErrorListener();
  }

  ngOnDestroy() {
    this.wsConnections.forEach(ws => ws.close());
    this.gpsService.detenerTracking();
    if (this.serverErrorListener) {
      window.removeEventListener('api:error', this.serverErrorListener);
    }
  }

  setupErrorListener() {
    this.serverErrorListener = (e: any) => {
      this.presentToast(e.detail || 'Error del servidor', 'danger');
    };
    window.addEventListener('api:error', this.serverErrorListener);
  }

  setupWebSockets(asignaciones: Asignacion[]) {
    this.wsConnections.forEach(ws => ws.close());
    this.wsConnections = [];

    const token = localStorage.getItem('access_token');
    if (!token) return;

    asignaciones.forEach(a => {
      if (a.estado === 'completada' || a.estado === 'cancelada') return;
      const ws = new WebSocket(
        `${environment.apiConfig.websockets.baseUrl}/ws/asignacion/${a.id}?token=${token}`
      );
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (['recorrido_iniciado', 'recorrido_finalizado', 'asignacion_cancelada'].includes(data.evento)) {
            this.cargarAsignaciones();
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };
      this.wsConnections.push(ws);
    });
  }

  async cargarAsignaciones() {
    this.isInitialLoading = this.asignaciones.length === 0;
    try {
      this.asignaciones = await this.asignacionesService.getAsignaciones();
      this.setupWebSockets(this.asignaciones);

      // Iniciar GPS si hay una asignación en curso
      const enCurso = this.asignaciones.find(a => a.estado === 'en_curso');
      if (enCurso) {
        this.gpsService.iniciarTracking(enCurso.id, enCurso.id_recorrido);
      } else {
        this.gpsService.detenerTracking();
      }
    } catch (err: any) {
      this.presentToast(err.message, 'danger');
    } finally {
      this.isInitialLoading = false;
      this.loading = false;
    }
  }

  async handleIniciar(id: string | number) {
    this.loading = true;
    try {
      const data = await this.asignacionesService.iniciarRecorrido(id);
      this.presentToast('Recorrido iniciado', 'success');
      // Obtener id_recorrido de la respuesta
      const idRecorrido = data?.recorrido_externo_id || data?.id_recorrido || null;
      this.gpsService.iniciarTracking(id, idRecorrido);
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  async handleFinalizar(id: string | number) {
    this.loading = true;
    try {
      await this.asignacionesService.finalizarRecorrido(id);
      this.presentToast('Recorrido finalizado', 'success');
      this.gpsService.detenerTracking();
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  async logout() {
    const enCurso = this.asignaciones.find(a => a.estado === 'en_curso');
    if (enCurso) {
      this.presentToast('No puedes cerrar sesión con una ruta en curso', 'warning');
      return;
    }

    this.wsConnections.forEach(ws => { try { ws.close(); } catch (e) {} });
    this.wsConnections = [];
    this.gpsService.detenerTracking();
    try { this.webSocketService.disconnectAll(); } catch (e) {}
    this.authService.logout();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message, duration: 3000, color, position: 'top'
    });
    toast.present();
  }

  async doRefresh(event: any) {
    await this.cargarAsignaciones();
    event.target.complete();
  }
}