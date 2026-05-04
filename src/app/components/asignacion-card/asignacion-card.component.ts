import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { Asignacion } from '../../services/asignaciones.service';
import { addIcons } from 'ionicons';
import {
  busOutline, peopleOutline, timeOutline,
  playOutline, checkmarkCircleOutline
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
    addIcons({ busOutline, peopleOutline, timeOutline, playOutline, checkmarkCircleOutline });
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
    return estado.replace('_', ' ').toUpperCase();
  }

  onIniciar()   { this.iniciar.emit(this.asignacion.id); }
  onFinalizar() { this.finalizar.emit(this.asignacion.id); }
}