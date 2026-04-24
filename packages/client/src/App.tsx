import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './stores/context';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './routes/Home';
import { Rules } from './routes/Rules';
import { Login } from './routes/Login';
import { Register } from './routes/Register';
import { ForgotPassword } from './routes/ForgotPassword';
import { Lobby } from './routes/Lobby';
import { Game } from './routes/Game';
import { Profile } from './routes/Profile';

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
