import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { t } = useLanguage();

    const { signIn, signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isLogin) {
                const { error } = await signIn({ email, password });
                if (error) throw error;
                navigate('/');
            } else {
                if (password !== confirmPassword) {
                    throw new Error("Password dan Konfirmasi Password tidak sama!");
                }
                const { error } = await signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName
                        }
                    }
                });
                if (error) throw error;
                alert('Registrasi berhasil! Silakan login (cek email jika perlu verifikasi).');
                setIsLogin(true);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            console.error("Google Login Error:", error);
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-8">
                    <img
                        src="/ESTE_LOGO.png"
                        alt="Este.RUN"
                        className="h-12 w-auto mx-auto mb-4 object-contain"
                        style={{
                            filter: `
                                drop-shadow(3px 0 0 #172554) 
                                drop-shadow(-3px 0 0 #172554) 
                                drop-shadow(0 3px 0 #172554) 
                                drop-shadow(0 -3px 0 #172554) 
                                drop-shadow(2px 2px 0 #172554) 
                                drop-shadow(-2px 2px 0 #172554) 
                                drop-shadow(2px -2px 0 #172554) 
                                drop-shadow(-2px -2px 0 #172554)
                                drop-shadow(0 4px 4px rgba(0,0,0,0.3))
                            `
                        }}
                    />
                    <p className="text-gray-500 text-sm">Masuk untuk mulai berlari</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="flex gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nama Depan</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                    placeholder="Agus"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nama Belakang</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                    placeholder="Supri"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">{isLogin ? 'Password' : 'Buat Password'}</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                            placeholder="********"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Konfirmasi Password</label>
                            <input
                                type="password"
                                required={!isLogin}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-navy-900 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-navy-800 transition-colors disabled:opacity-70 flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Masuk' : 'Daftar')}
                    </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-[1px] bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-xs font-medium">ATAU</span>
                    <div className="h-[1px] bg-gray-200 flex-1"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {t('login_google')}
                </button>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isLogin ? "Belum punya akun?" : "Sudah punya akun?"} <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-navy-600 hover:underline">{isLogin ? "Daftar" : "Login"}</button>
                </div>
            </div>
        </div>
    );
};

export default Login;
