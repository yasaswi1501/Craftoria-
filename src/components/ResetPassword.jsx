import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Strength states
  const [passwordStrength, setPasswordStrength] = useState('');
  const [strengthColor, setStrengthColor] = useState('');

  // Errors / Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      setStrengthColor('');
      return;
    }
    
    if (password.length < 6) {
      setPasswordStrength('Weak (too short)');
      setStrengthColor('text-red-500 bg-red-500/10');
    } else if (password.length >= 6 && password.length < 9) {
      if (/\d/.test(password)) {
        setPasswordStrength('Medium');
        setStrengthColor('text-amber-600 bg-amber-500/10');
      } else {
        setPasswordStrength('Weak (add numbers)');
        setStrengthColor('text-red-500 bg-red-500/10');
      }
    } else {
      if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        setPasswordStrength('Strong');
        setStrengthColor('text-emerald-600 bg-emerald-500/10');
      } else if (/\d/.test(password)) {
        setPasswordStrength('Medium');
        setStrengthColor('text-amber-600 bg-amber-500/10');
      } else {
        setPasswordStrength('Weak (add numbers & symbols)');
        setStrengthColor('text-red-500 bg-red-500/10');
      }
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred during password update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 text-brand-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-[32px] overflow-hidden p-6 sm:p-8 border border-brand-purple/30 shadow-[0_24px_50px_rgba(75,46,93,0.15)] flex flex-col text-brand-dark"
      >
        <h2 className="font-serif text-2xl font-bold text-center mb-1">
          Reset Password
        </h2>
        <p className="text-xs text-brand-dark/70 text-center uppercase tracking-widest font-semibold mb-6">
          Set your new password
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-100/60 border border-red-200 text-red-700 text-xs font-medium text-left">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
            <h3 className="font-serif text-lg font-bold mb-2">Password Updated!</h3>
            <p className="text-xs text-brand-dark/75 mb-6">
              Your password has been successfully reset. You can now use your new credentials.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-brand-plum text-white font-semibold text-xs uppercase tracking-widest hover:bg-brand-violet transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New Password */}
            <div className="flex flex-col text-left">
              <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1.5 ml-1">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Min. 6 characters"
                  className="w-full pl-11 pr-12 py-3 rounded-full text-xs glass-input focus:bg-white h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-4 flex items-center text-brand-plum/50 hover:text-brand-plum cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {passwordStrength && (
                <div className="flex items-center gap-2 mt-1.5 ml-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold">Strength:</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${strengthColor}`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col text-left">
              <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1.5 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Confirm new password"
                  className="w-full pl-11 pr-12 py-3 rounded-full text-xs glass-input focus:bg-white h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-4 flex items-center text-brand-plum/50 hover:text-brand-plum cursor-pointer focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3.5 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-11 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
