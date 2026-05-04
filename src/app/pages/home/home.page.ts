import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { logOutOutline, moonOutline, sunnyOutline, clipboardOutline } from 'ionicons/icons';
import { AsignacionesService, Asignacion } from '../../services/asignaciones.service';
import { AuthService } from '../../services/auth.service';
import { AsignacionCardComponent } from '../../components/asignacion-card/asignacion-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, AsignacionCardComponent]
})
export class HomePage implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  loading = false;
  isDark = false;
  private wsConnections: WebSocket[] = [];
  private serverErrorListener: any;

  constructor(
    private asignacionesService: AsignacionesService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({ logOutOutline, moonOutline, sunnyOutline, clipboardOutline });
    this.isDark = document.body.classList.contains('dark-theme');
  }

  ngOnInit() {
    this.cargarAsignaciones();
    this.setupErrorListener();
  }

  ngOnDestroy() {
    this.wsConnections.forEach(ws => ws.close());
    if (this.serverErrorListener) {
      window.removeEventListener('api:error', this.serverErrorListener);
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
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
        `wss://smart-trash-backend-production.up.railway.app/ws/asignacion/${a.id}?token=${token}`
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
    this.loading = true;
    try {
      this.asignaciones = await this.asignacionesService.getAsignaciones();
      this.setupWebSockets(this.asignaciones);
    } catch (err: any) {
      this.presentToast(err.message, 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleIniciar(id: string | number) {
    this.loading = true;
    try {
      await this.asignacionesService.iniciarRecorrido(id);
      this.presentToast('Recorrido iniciado', 'success');
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
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}