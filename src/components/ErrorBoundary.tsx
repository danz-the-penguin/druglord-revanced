import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Underworld Engine Uncaught UI Exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-mono">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertOctagon className="w-8 h-8 shrink-0 animate-pulse" />
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider">Syndicate Interface Fault</h2>
                <p className="text-xs text-rose-300">An unexpected terminal error was intercepted.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-950 text-xs text-rose-300 overflow-x-auto">
              <code>{this.state.error?.message || 'Unknown runtime exception'}</code>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your game progress is preserved in browser local storage. Click below to reboot the syndicate terminal.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reboot Underworld Terminal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
