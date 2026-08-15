            {isAuthenticating ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Synchronizing Node...</>
            ) : (
              <>{isSignUpMode ? 'Create Secure Business Account' : 'Authenticate & Secure Entry'}</>
            )}
          </button>

          {/* TOGGLE LINK FOOTER */}
          <div className="text-center mt-2 border-t pt-3 border-slate-800/80">
            <button type="button" onClick={() => { setIsSignUpMode(!isSignUpMode); setAuthError(''); setChecked(false); }} className="text-xs font-medium text-slate-400 hover:text-orange-400 transition-all underline">
              {isSignUpMode ? "Already have a workshop setup? Sign In here" : "Don't have a business node registered? Sign Up here"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#070A12] text-slate-100 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 p-6 text-center bg-[#0B1329] shadow-2xl">
            <h2 className="text-lg font-bold">Terminal Interface Exception</h2>
            <button onClick={() => window.location.reload()} className="mt-5 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all">Reload Terminal</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
