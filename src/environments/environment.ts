// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiConfig: {
    baseUrl: 'https://smart-trash-backend-production.up.railway.app',
    endpoints: {
      auth: {
        login: '/api/auth/login',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password'
      },
      driver: {
        asignaciones: '/api/driver/asignaciones',
        iniciarRecorrido: (id: string) => `/api/driver/asignaciones/${id}/iniciar`,
        finalizarRecorrido: (id: string) => `/api/driver/asignaciones/${id}/finalizar`
      },
      admin: {
        usuarios: '/api/admin/usuarios',
        vehiculos: '/api/admin/vehiculos',
        asignaciones: '/api/admin/asignaciones'
      }
    },
    websockets: {
      baseUrl: 'wss://smart-trash-backend-production.up.railway.app',
      endpoints: {
        asignacion: (id: string) => `/ws/asignacion/${id}`
      }
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
