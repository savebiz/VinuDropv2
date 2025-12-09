'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-4 bg-red-900/80 rounded-lg text-white text-center">
                    <AlertTriangle className="mb-2 text-yellow-500" size={32} />
                    <h2 className="text-lg font-bold mb-1">Something went wrong</h2>
                    <p className="text-xs opacity-70 font-mono mb-2 max-w-[200px] break-words">
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                    <button
                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
