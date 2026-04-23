import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './stores/context.js';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Home } from './routes/Home.js';
import { Rules } from './routes/Rules.js';
import { Login } from './routes/Login.js';
import { Register } from './routes/Register.js';
import { ForgotPassword } from './routes/ForgotPassword.js';
import { Lobby } from './routes/Lobby.js';
import { Game } from './routes/Game.js';
import { Profile } from './routes/Profile.js';

const noop = () => {};

export const App = observer(() => {
  const { auth } = useStore();

  useEffect(() => {
    if (auth.status === 'unknown') {
      auth.hydrate().catch(noop);
    }
  }, [auth]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:id"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
});
