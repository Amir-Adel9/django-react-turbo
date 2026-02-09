import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useAuth } from '@/shared/hooks/use-auth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Hello, {user?.name ?? user?.email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type='button'
            variant='outline'
            onClick={() => void handleLogout()}
          >
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
