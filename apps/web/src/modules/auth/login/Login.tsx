import { useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import { LoginView } from './components/LoginView';
import { useAuth } from '@/shared/hooks/use-auth';

export function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
  const fromAuthFailure = searchParams.get('fromAuthFailure') === '1';
  const hasNavigatedToFromRef = useRef(false);

  useEffect(() => {
    if (fromAuthFailure) {
      dispatch(setUser(null));
      hasNavigatedToFromRef.current = false;
    }
  }, [fromAuthFailure, dispatch]);

  useEffect(() => {
    if (user && !fromAuthFailure && !hasNavigatedToFromRef.current) {
      hasNavigatedToFromRef.current = true;
      navigate(from, { replace: true });
    }
  }, [user, fromAuthFailure, from, navigate]);

  if (user && !fromAuthFailure) {
    return null;
  }

  return (
    <LoginView
      from={from}
      onSuccess={() => navigate(from, { replace: true })}
    />
  );
}
