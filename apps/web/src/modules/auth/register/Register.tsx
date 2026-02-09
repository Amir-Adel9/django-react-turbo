import { useNavigate } from 'react-router-dom';
import { RegisterView } from './components/RegisterView';
import { useAuth } from '@/shared/hooks/use-auth';

export function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <RegisterView onSuccess={() => navigate('/login', { replace: true })} />
  );
}
