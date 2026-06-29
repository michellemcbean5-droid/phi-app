import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { PHI_COLORS } from '../assets/brandColors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // You can log the error to an error reporting service here
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={this.resetErrorBoundary}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PHI_COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PHI_COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: PHI_COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: PHI_COLORS.royalBlue,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: PHI_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
