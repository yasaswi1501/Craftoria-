import { Component } from 'react';
import { Sparkles, Home, RefreshCw } from 'lucide-react';

// Catches runtime errors thrown during render anywhere below it in the tree
// and shows a branded fallback instead of a blank page / raw stack trace.
// Deliberately does not receive router context -- it can be tripped by a
// bug in the router itself, so navigation here uses a hard reload.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logged for local/dev visibility only -- never rendered to the user.
    console.error('Craftoria runtime error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-[#FDFBFD] text-brand-dark">
        <div className="max-w-md w-full glass-card rounded-[36px] p-8 sm:p-10 text-center border border-brand-purple/20 shadow-[0_20px_60px_rgba(75,46,93,0.10)]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cream/80 border border-brand-purple/20 text-xs font-semibold tracking-wider text-brand-plum mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
            <span className="text-[10px] uppercase font-mono tracking-widest">Temporarily Unavailable</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark mb-3">
            Something Went Wrong
          </h1>

          <p className="text-xs sm:text-sm text-brand-dark/75 leading-relaxed max-w-sm mx-auto mb-8">
            We hit an unexpected snag while preparing this page. Please try again, or head back to our handmade collections.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={this.handleHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/70 hover:bg-white border border-brand-purple/30 text-brand-plum font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
