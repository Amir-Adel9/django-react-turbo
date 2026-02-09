/**
 * Loader helper for guest-only routes (login, register).
 * Returns null so the route can render. Authentication check is handled
 * client-side by the Login/Register components using the Redux store.
 */
export async function requireGuest(
  _args?: unknown,
): Promise<null> {
  return null;
}
