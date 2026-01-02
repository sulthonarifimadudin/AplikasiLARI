import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import StartActivity from './pages/StartActivity';
import Dashboard from './pages/Dashboard';
import ActivityDetail from './pages/ActivityDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import EditProfile from './pages/EditProfile';
import Social from './pages/Social';
import Statistics from './pages/Statistics';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-navy-50">
                <Loader2 className="animate-spin text-navy-900" size={40} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AuthProvider>
                    <LanguageProvider>
                        <ThemeProvider>
                            <Routes>
                                <Route path="/login" element={<Login />} />

                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />

                                <Route path="/start" element={
                                    <ProtectedRoute>
                                        <StartActivity />
                                    </ProtectedRoute>
                                } />

                                <Route path="/activity/:id" element={
                                    <ProtectedRoute>
                                        <ActivityDetail />
                                    </ProtectedRoute>
                                } />

                                <Route path="/stats" element={
                                    <ProtectedRoute>
                                        <Statistics />
                                    </ProtectedRoute>
                                } />

                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                } />

                                <Route path="/profile/:id" element={
                                    <ProtectedRoute>
                                        <PublicProfile />
                                    </ProtectedRoute>
                                } />

                                <Route path="/profile/edit" element={
                                    <ProtectedRoute>
                                        <EditProfile />
                                    </ProtectedRoute>
                                } />

                                <Route path="/social" element={
                                    <ProtectedRoute>
                                        <Social />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </ThemeProvider>
                    </LanguageProvider>
                </AuthProvider>
        </Router>
    );
}

export default App;
