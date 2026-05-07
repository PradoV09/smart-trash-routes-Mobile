export const environment = {
  production: true,
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
