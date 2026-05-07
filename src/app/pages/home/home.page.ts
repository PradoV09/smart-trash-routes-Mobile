import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { logOutOutline, moonOutline, sunnyOutline, clipboardOutline } from 'ionicons/icons';
import { AsignacionesService, Asignacion } from '../../services/asignaciones.service';
import { AuthService } from '../../services/auth.service';
import { AsignacionCardComponent } from '../../components/asignacion-card/asignacion-card.component';
import { environment } from '../../../environments/environment';
import { WebSocketService, WebSocketConnection } from '../../services/websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, AsignacionCardComponent]
})
export class HomePage implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  loading = false;
  private ws!: WebSocket;
  private serverErrorListener: any;

  constructor(
    private asignacionesService: AsignacionesService,
    private authService: AuthService,
    private toastController: ToastController,
    private webSocketService: WebSocketService
  ) {
    addIcons({ logOutOutline, moonOutline, sunnyOutline, clipboardOutline });
    this.isDark = document.body.classList.contains('dark-theme');
  }

  ngOnInit() {
    this.cargarAsignaciones();
    this.setupErrorListener();
  }

  private wsConnections: WebSocket[] = [];

  ngOnDestroy() {
    this.wsConnections.forEach(ws => ws.close());
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
    // Close existing
    this.wsConnections.forEach(ws => ws.close());
    this.wsConnections = [];

    const token = localStorage.getItem('access_token');
    if (!token) return;

    asignaciones.forEach(a => {
      const ws = new WebSocket(`wss://smart-trash-backend-production.up.railway.app/ws/asignacion/${a.id}?token=${token}`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.evento === 'recorrido_iniciado' || data.evento === 'recorrido_finalizado' || data.evento === 'asignacion_cancelada') {
            this.cargarAsignaciones();
          }
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };
      this.wsConnections.push(ws);
    });
  }

  async cargarAsignaciones() {
    this.loading = true;
    try {
      this.asignaciones = await this.asignacionesService.getAsignaciones();
      await this.setupWebSockets(this.asignaciones);
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
      // Reload assignments to get updated status
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
      // Reload assignments to get updated status
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  logout() {
    console.log('Iniciando logout...');

    // Disconnect WebSockets first (async but don't wait to block)
    this.webSocketService.disconnectAll()
      .then(() => {
        console.log('Logout: WebSockets desconectados exitosamente');
      })
      .catch((error) => {
        console.error('Logout: Error desconectando WebSockets:', error);
      })
      .finally(() => {
        // Always navigate to login, regardless of disconnection outcome
        this.authService.logout();
        console.log('Logout completado - navegando a login');
      });
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