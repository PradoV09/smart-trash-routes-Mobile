import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { Asignacion } from '../../services/asignaciones.service';
import { addIcons } from 'ionicons';
import {
  busOutline, peopleOutline, timeOutline,
  playOutline, checkmarkCircleOutline, mapOutline, cameraOutline,
  navigateOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-asignacion-card',
  templateUrl: './asignacion-card.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, DecimalPipe, DatePipe, SlicePipe]
})
export class AsignacionCardComponent {
  @Input() asignacion!: Asignacion;
  @Output() iniciar = new EventEmitter<string | number>();
  @Output() finalizar = new EventEmitter<string | number>();

  constructor() {
    addIcons({ busOutline, peopleOutline, timeOutline, playOutline, checkmarkCircleOutline, mapOutline, cameraOutline, navigateOutline });
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente':  return 'badge-warning';
      case 'en_curso':   return 'badge-info';
      case 'completada': return 'badge-success';
      case 'cancelada':  return 'badge-error';
      default:           return 'badge-info';
    }
  }

  formatEstado(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_curso': 'En progreso',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    return estadoMap[estado] || estado.replace('_', ' ').toUpperCase();
  }

  getProgressWidth(): number {
    switch (this.asignacion.estado) {
      case 'pendiente': return 0;
      case 'completada': return 100;
      case 'en_curso': return 50; // Placeholder - should come from actual progress
      default: return 0;
    }
  }

  getAvatarColor(index: number): string {
    const colors = ['#1D9E75', '#2dcecc', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[index % colors.length];
  }

  onIniciar()   { this.iniciar.emit(this.asignacion.id); }
  onFinalizar() { this.finalizar.emit(this.asignacion.id); }
  onVerMapa()   { window.location.href = '/map'; }
}