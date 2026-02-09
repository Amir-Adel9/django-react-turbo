/**
 * Full-page layout for auth pages (Login, Register) with a clean SVG pattern
 * background using the primary (blue) accent.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6'>
      <div className='absolute inset-0 -z-10' aria-hidden>
        <svg
          className='h-full w-full'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'
        >
          <defs>
            <radialGradient id='auth-glow' cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.12' />
              <stop offset='100%' stopColor='var(--primary)' stopOpacity='0' />
            </radialGradient>
            <pattern
              id='auth-dots'
              x='0'
              y='0'
              width='32'
              height='32'
              patternUnits='userSpaceOnUse'
            >
              <circle
                cx='16'
                cy='16'
                r='1.25'
                fill='var(--primary)'
                opacity='0.38'
              />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#auth-glow)' />
          <rect width='100%' height='100%' fill='url(#auth-dots)' />
        </svg>
      </div>
      {children}
    </main>
  );
}
