import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import styles from '../styles/error-boundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className={`ee-error-boundary ${styles.errorBoundary}`}
          role="alert"
        >
          <strong className="ee-error-title">Something went wrong</strong>
          <p className={`ee-error-message ${styles.errorMessage}`}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
