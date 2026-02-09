import { rootRoute } from './root.route';
import { appRoute } from './app.route';
import { loginRoute, registerRoute } from './auth.route';

export const routes = [
  {
    ...rootRoute,
    children: [appRoute, loginRoute, registerRoute],
  },
];
