
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  props: any;
  state: any;
  setState: any;

  constructor(props: any) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
    this.setState = this.setState.bind(this);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
      if (this.state.hasError) {
      let isQuotaError = false;
      let isPermissionError = false;
      try {
        if (this.state.error?.message) {
          const errorData = JSON.parse(this.state.error.message);
          if (errorData.error) {
            if (errorData.error.includes('Quota limit exceeded')) {
              isQuotaError = true;
            } else if (errorData.error.includes('insufficient permissions')) {
              isPermissionError = true;
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-10 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4">
              {isQuotaError ? 'Cloud Capacity Reached' : isPermissionError ? 'Access Restricted' : 'Something Went Wrong'}
            </h1>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
              {isQuotaError 
                ? "The application has reached its temporary cloud capacity. We've optimized the system to use offline data where possible, but some features may be limited until the quota resets."
                : isPermissionError
                ? "You don't have permission to perform this action. If you are a Super Admin, please ensure you are signed in with your authorized Google account."
                : "An unexpected error occurred. We've logged the details and our team is looking into it. Please try refreshing the page."}
            </p>

            <div className="space-y-3">
              <button 
                onClick={this.handleReset}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-black transition-all border-b-4 border-slate-700"
              >
                <RefreshCw size={16} />
                <span>Refresh Application</span>
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="w-full py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:border-slate-300 transition-all"
              >
                <Home size={16} />
                <span>Back to Home</span>
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-10 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40 border border-slate-100">
                <p className="text-[10px] font-mono text-slate-400 uppercase mb-2">Error Details (Dev Only)</p>
                <pre className="text-[10px] font-mono text-rose-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
