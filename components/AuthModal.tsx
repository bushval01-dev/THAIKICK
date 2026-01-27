
import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, X, Loader } from 'lucide-react';
import { signIn, signUp } from '../services/authService';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLongWait, setIsLongWait] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setIsLongWait(false);

        // Show "Waking up..." message if it takes > 3 seconds
        const longWaitTimer = setTimeout(() => setIsLongWait(true), 3000);

        // Timeout Promise (60s for cold start)
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out (60s). System might be undergoing maintenance.")), 60000)
        );

        try {
            const authPromise = isLogin
                ? signIn(email, password)
                : signUp(email, password, name);

            // Race against timeout
            await Promise.race([authPromise, timeout]);

            clearTimeout(longWaitTimer);

            if (!isLogin) {
                alert("Account created! Please check your email to confirm specific details or just login if auto-confirmed.");
            }

            onLoginSuccess();
            onClose();
        } catch (err: any) {
            clearTimeout(longWaitTimer);
            console.error("Auth Error:", err);
            // Better error message handling
            let msg = err.message || 'Authentication failed';
            if (msg.includes("Invalid login credentials")) msg = "Incorrect email or password.";
            if (msg.includes("Email not confirmed")) msg = "Please confirm your email address first.";

            setError(msg);
        } finally {
            setLoading(false);
            setIsLongWait(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/80 backdrop-blur-sm animate-reveal">
            <div className="bg-white p-8 w-full max-w-md relative border-2 border-brand-charcoal shadow-[12px_12px_0px_0px_#3471AE]">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-brand-charcoal">
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                    <div className="font-mono text-xs font-bold text-brand-blue uppercase mb-2">
                        {isLogin ? 'Welcome Back' : 'New Fighter'}
                    </div>
                    <h2 className="text-3xl font-black uppercase text-brand-charcoal">
                        {isLogin ? 'Login' : 'Join Us'}
                    </h2>
                </div>

                {error && (
                    <div className="bg-brand-red/10 border border-brand-red p-3 mb-6 font-mono text-xs text-brand-red">
                        ERROR: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="font-mono text-xs font-bold uppercase">Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-brand-bone border-2 border-gray-200 p-3 pl-10 font-mono text-brand-charcoal focus:border-brand-blue focus:outline-none"
                                    placeholder="Your Full Name"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="font-mono text-xs font-bold uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-bone border-2 border-gray-200 p-3 pl-10 font-mono text-brand-charcoal focus:border-brand-blue focus:outline-none"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-mono text-xs font-bold uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-brand-bone border-2 border-gray-200 p-3 pl-10 font-mono text-brand-charcoal focus:border-brand-blue focus:outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-charcoal text-white font-black uppercase py-4 hover:bg-brand-blue transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : (isLogin ? 'Access System' : 'Create Account')}
                    </button>

                    {isLongWait && loading && (
                        <div className="text-center animate-pulse mt-4">
                            <span className="font-mono text-[10px] text-brand-blue font-bold uppercase tracking-widest">
                                Initializing Secure Database...<br />Please wait (Cold Start)
                            </span>
                        </div>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-mono text-xs text-gray-500 hover:text-brand-charcoal underline uppercase"
                    >
                        {isLogin ? "Need an account? Request Access" : "Have an account? Login"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AuthModal;
