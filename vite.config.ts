import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false,
        clientPort: 443,
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          frontend_index: path.resolve(__dirname, '04_Source_Code/frontend/index.html'),
          login: path.resolve(__dirname, '04_Source_Code/frontend/login.html'),
          register: path.resolve(__dirname, '04_Source_Code/frontend/register.html'),
          dashboard: path.resolve(__dirname, '04_Source_Code/frontend/dashboard.html'),
          create_event: path.resolve(__dirname, '04_Source_Code/frontend/create-event.html'),
          event_details: path.resolve(__dirname, '04_Source_Code/frontend/event-details.html'),
          requirements: path.resolve(__dirname, '04_Source_Code/frontend/requirements.html'),
          tasks: path.resolve(__dirname, '04_Source_Code/frontend/tasks.html'),
          budget: path.resolve(__dirname, '04_Source_Code/frontend/budget.html'),
          suppliers: path.resolve(__dirname, '04_Source_Code/frontend/suppliers.html'),
          settings: path.resolve(__dirname, '04_Source_Code/frontend/settings.html'),
          dev_diagnostics: path.resolve(__dirname, '04_Source_Code/frontend/dev-diagnostics.html'),
        },
      },
    },
  };
});
