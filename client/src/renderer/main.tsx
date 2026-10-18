import * as Sentry from '@sentry/electron/renderer';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastContainer } from "react-toastify";
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/confirmContext';
import { ConfigurationsProvider } from './contexts/configurationContext';
import '../i18n';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://c4a321d596ed8726ce01949d87dc0d84@o4508920124276736.ingest.us.sentry.io/4512271446900736",
  environment: import.meta.env.MODE || (import.meta.env.PROD ? 'production' : 'development'),
  tracesSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Session Replay: 0% for normal sessions to preserve free quota (50/month),
  // 100% for error sessions so you can see video replay when an error occurs
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  ignoreErrors: [
    "fetch failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "aborted",
    "ResizeObserver loop completed with undelivered notifications",
    "ResizeObserver loop limit exceeded",
  ],
});

try {
  (window as any).electronAPI?.getDeviceInfo?.().then((device: any) => {
    if (device?.hostname) {
      Sentry.setTag("hostname", device.hostname);
      if (device.username) {
        Sentry.setTag("os_user", device.username);
      }
      Sentry.setContext("device", {
        name: device.hostname,
        os_user: device.username,
      });
    }
  }).catch(() => {});
} catch {
  // Ignore
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#d32f2f' }}>Algo salió mal / Something went wrong</h2>
          <p style={{ color: '#555', margin: '16px 0' }}>{this.state.error?.message || 'Error inesperado'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#023c69',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reiniciar aplicación / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <AuthProvider>
      <ConfirmProvider>
        <ConfigurationsProvider>
          <App />
        </ConfigurationsProvider>
      </ConfirmProvider>
    </AuthProvider>
    <ToastContainer position='top-right' autoClose={3000} />
  </RootErrorBoundary>
);