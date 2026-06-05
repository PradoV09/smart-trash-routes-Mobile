import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { arrowBackOutline, locateOutline, moonOutline, sunnyOutline, searchOutline, closeOutline, gitBranchOutline, trashOutline, navigateOutline, flagOutline, alertOutline, sendOutline, mapOutline, locationOutline } from 'ionicons/icons';
import { AsignacionesService } from '../../services/asignaciones.service';
import { ReporteModalComponent } from '../../components/reporte-modal/reporte-modal.component';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NgIf, FormsModule, ReporteModalComponent]
})
export class MapPage implements OnDestroy {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  private map!: L.Map;
  private userMarker?: L.Marker;
  private darkLayer!: L.TileLayer;
  private lightLayer!: L.TileLayer;
  private rutaAsignadaLayer?: L.Polyline;
  private recorridoLayer?: L.Polyline;
  private guiaLayer?: L.Polyline;
  private inicioRutaPoint?: L.LatLngExpression;
  private watchId?: number;
  private lastPosition?: L.LatLngExpression;

  isDark = false;
  coordsInfo = '';
  mapLoading = true;
  searchQuery = '';
  searchVisible = false;
  routeInfo = '';
  rutaNombre = '';
  tieneRutaAsignada = false;
  rutaEnCurso = false;
  mostrarReporte = false;
  idAsignacionEnCurso: string | number | undefined = undefined;
  asignacionActivaId: string | number | undefined = undefined;

  private readonly CENTER: L.LatLngExpression = [3.8772, -77.0282];

  constructor(private asignacionesService: AsignacionesService) {
    addIcons({ arrowBackOutline, locateOutline, moonOutline, sunnyOutline, searchOutline, closeOutline, gitBranchOutline, trashOutline, navigateOutline, flagOutline, alertOutline, sendOutline, mapOutline, locationOutline });
    this.isDark = localStorage.getItem('theme') === 'dark';
  }

  ionViewWillEnter() {
    this.mapLoading = true;
  }

  ionViewDidEnter() {
    setTimeout(() => this.initMap(), 600);
  }

  ionViewWillLeave() {
    if (this.map) {
      this.map.remove();
      (this.map as any) = null;
    }
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }

  private async initMap() {
    if (!this.mapElement) {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    if (this.map) {
      try { this.map.remove(); } catch (e) {}
    }

    try {
      this.map = L.map(this.mapElement.nativeElement, {
        center: this.CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
        doubleClickZoom: false,
        touchZoom: true,
        scrollWheelZoom: true
      });
    } catch (err) {
      console.error('Error creating Leaflet instance:', err);
      return;
    }

    this.lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Leaflet | © OpenStreetMap',
      maxZoom: 19
    });

    this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'Leaflet | © OpenStreetMap © CARTO',
      maxZoom: 19
    });

    if (this.isDark) {
      this.darkLayer.addTo(this.map);
    } else {
      this.lightLayer.addTo(this.map);
    }

    this.map.whenReady(() => {
      setTimeout(() => {
        this.mapLoading = false;
        if (this.map) {
          this.map.invalidateSize();
          setTimeout(() => this.map.invalidateSize(), 400);
        }
      }, 300);
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    await this.cargarRutaAsignada();
    await this.cargarRecorridoActivo();
    this.iniciarSeguimientoPosicion();
  }

  private async cargarRutaAsignada() {
    try {
      const asignaciones = await this.asignacionesService.getAsignaciones();
      const activa = asignaciones.find(a =>
        (a.estado === 'pendiente' || a.estado === 'en_curso') &&
        a.ruta_shape && a.ruta_shape.length > 1
      );

      if (!activa || !activa.ruta_shape || activa.ruta_shape.length < 2) return;

      const color = activa.ruta_color || '#0A4174';
      const latlngs: L.LatLngExpression[] = activa.ruta_shape.map(p => [p.lat, p.lon]);

      this.inicioRutaPoint = latlngs[0];
      this.tieneRutaAsignada = true;

      // Set asignacionActivaId for report button
      this.asignacionActivaId = activa.id;

      if (this.rutaAsignadaLayer) {
        this.map.removeLayer(this.rutaAsignadaLayer);
      }

      this.rutaAsignadaLayer = L.polyline(latlngs, {
        color: color,
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 4'
      }).addTo(this.map);

      const inicioIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      });

      const finIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      });

      L.marker(latlngs[0] as L.LatLngExpression, { icon: inicioIcon })
        .addTo(this.map)
        .bindPopup(`<b>🟢 Inicio de ruta</b><br>${activa.ruta_nombre || ''}`);

      L.marker(latlngs[latlngs.length - 1] as L.LatLngExpression, { icon: finIcon })
        .addTo(this.map)
        .bindPopup(`<b>🔴 Fin de ruta</b><br>${activa.ruta_nombre || ''}`);

      this.rutaNombre = activa.ruta_nombre || 'Ruta asignada';
      this.map.fitBounds(this.rutaAsignadaLayer.getBounds(), { padding: [50, 50] });

    } catch (err) {
      console.error('Error cargando ruta asignada', err);
    }
  }

  private async cargarRecorridoActivo() {
    try {
      const asignaciones = await this.asignacionesService.getAsignaciones();
      const enCurso = asignaciones.find(a => a.estado === 'en_curso' && a.id_recorrido);
      if (!enCurso || !enCurso.id_recorrido) {
        this.rutaEnCurso = false;
        this.idAsignacionEnCurso = undefined;
        return;
      }

      this.rutaEnCurso = true;
      this.idAsignacionEnCurso = enCurso.id;
      this.asignacionActivaId = enCurso.id;

      const posiciones = await this.asignacionesService.getPosicionesRecorrido(enCurso.id_recorrido);
      if (!posiciones || posiciones.length < 2) return;

      // Show only last 50 positions to avoid cluttering the map
      const ultimasPosiciones = posiciones.slice(-50);
      const latlngs: L.LatLngExpression[] = ultimasPosiciones.map(p => [p.lat, p.lon]);

      if (this.recorridoLayer) {
        this.map.removeLayer(this.recorridoLayer);
      }

      this.recorridoLayer = L.polyline(latlngs, {
        color: '#10B981',
        weight: 4,
        opacity: 0.9,
      }).addTo(this.map);

      const ultimoIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.3);"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      });

      L.marker(latlngs[latlngs.length - 1] as L.LatLngExpression, { icon: ultimoIcon })
        .addTo(this.map)
        .bindPopup('<b>📍 Última posición GPS</b>');

      this.routeInfo = `Recorrido: ${posiciones.length} pts registrados`;

    } catch (err) {
      console.error('Error cargando recorrido activo', err);
    }
  }

  async irAlInicioDeRuta() {
    if (!this.inicioRutaPoint) return;

    if (!navigator.geolocation) {
      this.map.flyTo(this.inicioRutaPoint, 17, { animate: true, duration: 1.5 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const userLatlng: L.LatLngExpression = [latitude, longitude];
        const inicio = this.inicioRutaPoint as [number, number];

        // Mostrar marcador usuario
        if (this.userMarker) {
          this.userMarker.setLatLng(userLatlng);
        } else {
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="width:20px;height:20px;background:#0A4174;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(10,65,116,0.3);"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
          });
          this.userMarker = L.marker(userLatlng, { icon: userIcon }).addTo(this.map);
          this.userMarker.bindPopup('<b>📍 Tu ubicación</b>').openPopup();
        }

        // Quitar guía anterior
        if (this.guiaLayer) {
          try { this.map.removeLayer(this.guiaLayer); } catch (e) {}
          this.guiaLayer = undefined;
        }

        try {
          this.routeInfo = 'Calculando ruta por calles...';

          // OSRM — ruteo por calles reales gratis con OpenStreetMap
          const url = `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${inicio[1]},${inicio[0]}?overview=full&geometries=geojson`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const ruta = data.routes[0];
            const coords: L.LatLngExpression[] = ruta.geometry.coordinates.map(
              (c: number[]) => [c[1], c[0]] as L.LatLngExpression
            );

            this.guiaLayer = L.polyline(coords, {
              color: '#F59E0B',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 4'
            }).addTo(this.map);

            const distM = ruta.distance;
            const tiempoMin = Math.ceil(ruta.duration / 60);
            const distTexto = distM < 1000
              ? `${distM.toFixed(0)} m`
              : `${(distM / 1000).toFixed(2)} km`;

            this.routeInfo = `Al inicio: ${distTexto} · ~${tiempoMin} min`;

            this.map.fitBounds(this.guiaLayer.getBounds(), { padding: [60, 60] });

            // Quitar guía después de 15 segundos
            setTimeout(() => {
              if (this.guiaLayer) {
                try { this.map.removeLayer(this.guiaLayer); } catch (e) {}
                this.guiaLayer = undefined;
              }
              this.routeInfo = '';
            }, 15000);

          } else {
            // Fallback línea recta si OSRM falla
            this.guiaLayer = L.polyline([userLatlng, this.inicioRutaPoint!], {
              color: '#F59E0B',
              weight: 3,
              opacity: 0.7,
              dashArray: '6, 6'
            }).addTo(this.map);

            const dist = L.latLng(userLatlng).distanceTo(L.latLng(this.inicioRutaPoint!));
            const metros = dist < 1000 ? `${dist.toFixed(0)} m` : `${(dist / 1000).toFixed(2)} km`;
            this.routeInfo = `Al inicio: ${metros} (línea recta)`;
            this.map.fitBounds(this.guiaLayer.getBounds(), { padding: [60, 60] });
          }

        } catch (err) {
          console.error('OSRM error', err);
          this.routeInfo = 'Error calculando ruta';
          this.map.flyTo(this.inicioRutaPoint!, 16, { animate: true, duration: 1.5 });
        }
      },
      (err) => {
        this.map.flyTo(this.inicioRutaPoint!, 17, { animate: true, duration: 1.5 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  goToMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng: L.LatLngExpression = [latitude, longitude];

        if (this.userMarker) {
          this.userMarker.setLatLng(latlng);
        } else {
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="width:20px;height:20px;background:#0A4174;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(10,65,116,0.3);"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
          });
          this.userMarker = L.marker(latlng, { icon: userIcon }).addTo(this.map);
          this.userMarker.bindPopup('<b>📍 Tu ubicación</b>').openPopup();
        }

        this.map.flyTo(latlng, 16, { animate: true, duration: 1.2 });
        this.coordsInfo = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true }
    );
  }

  toggleMapTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');

    if (this.map) {
      if (this.isDark) {
        this.map.removeLayer(this.lightLayer);
        this.darkLayer.addTo(this.map);
      } else {
        this.map.removeLayer(this.darkLayer);
        this.lightLayer.addTo(this.map);
      }
    }
  }

  toggleSearch() {
    this.searchVisible = !this.searchVisible;
    if (!this.searchVisible) this.searchQuery = '';
  }

  async searchPlace() {
    if (!this.searchQuery.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latlng: L.LatLngExpression = [parseFloat(lat), parseFloat(lon)];
        const searchIcon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#4E8EA2;border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        });
        const marker = L.marker(latlng, { icon: searchIcon }).addTo(this.map);
        marker.bindPopup(`<div style="font-family:sans-serif;font-size:12px;"><b>🔍 ${display_name.split(',')[0]}</b></div>`).openPopup();
        this.map.flyTo(latlng, 15, { animate: true, duration: 1.2 });
        this.coordsInfo = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
        this.searchVisible = false;
        this.searchQuery = '';
      }
    } catch (err) {
      console.error('Search error', err);
    }
  }

  goBack() { window.location.href = '/home'; }

  async onReporteEnviado() {
    this.mostrarReporte = false;
  }

  async onReporteCerrado() {
    this.mostrarReporte = false;
  }

  async abrirReporte() {
    // Ensure we have the active assignment ID before opening modal
    if (!this.asignacionActivaId) {
      try {
        const asignaciones = await this.asignacionesService.getAsignaciones();
        const activa = asignaciones.find(a => a.estado === 'en_curso' || a.estado === 'pendiente');
        if (activa) {
          this.asignacionActivaId = activa.id;
        }
      } catch (e) {
        console.error('Error al obtener asignación activa:', e);
      }
    }
    this.mostrarReporte = true;
  }

  private iniciarSeguimientoPosicion() {
    if (!navigator.geolocation) return;

    // Limpiar watch anterior si existe
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const currentPosition: L.LatLngExpression = [latitude, longitude];

        // Calcular distancia desde la última posición enviada
        let distancia = 0;
        if (this.lastPosition) {
          distancia = L.latLng(currentPosition).distanceTo(L.latLng(this.lastPosition));
        }

        // Enviar posición si es la primera o si la distancia es >= 10 metros
        if (!this.lastPosition || distancia >= 10) {
          this.lastPosition = currentPosition;

          // Enviar posición si hay una asignación activa
          if (this.asignacionActivaId && this.idAsignacionEnCurso) {
            try {
              const posicion = {
                latitud: latitude,
                longitud: longitude,
                accuracy: accuracy,
                speed: speed ?? undefined,
                bearing: heading ?? undefined,
                timestamp: new Date().toISOString()
              };

              // Usar enviarPosicionExterna si hay id_recorrido
              const asignaciones = await this.asignacionesService.getAsignaciones();
              const activa = asignaciones.find(a => a.id === this.asignacionActivaId);
              
              if (activa?.id_recorrido) {
                await this.asignacionesService.enviarPosicionExterna(
                  activa.id_recorrido,
                  latitude,
                  longitude
                );
              } else {
                await this.asignacionesService.enviarPosicion(
                  this.asignacionActivaId,
                  posicion
                );
              }

              console.log(`Posición enviada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (distancia: ${distancia.toFixed(0)}m)`);
            } catch (err) {
              console.error('Error enviando posición:', err);
            }
          }
        }
      },
      (err) => {
        console.error('Error en seguimiento GPS:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  }
}