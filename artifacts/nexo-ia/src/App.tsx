import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { esES } from '@clerk/localizations';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import HomePage from '@/pages/home';
import StudyPage from '@/pages/study';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1e6660',
    colorForeground: '#193e40',
    colorMutedForeground: '#71847b',
    colorDanger: '#b65345',
    colorBackground: '#fbfaf4',
    colorInput: '#fffdf7',
    colorInputForeground: '#193e40',
    colorNeutral: '#dfe2d5',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbfaf4] rounded-[24px] w-[440px] max-w-full overflow-hidden border border-[#dfe2d5] shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#193e40] font-bold',
    headerSubtitle: 'text-[#71847b]',
    socialButtonsBlockButtonText: 'text-[#193e40] font-semibold',
    formFieldLabel: 'text-[#315c55] font-semibold',
    footerActionLink: 'text-[#1e6660] font-bold',
    footerActionText: 'text-[#71847b]',
    dividerText: 'text-[#71847b]',
    identityPreviewEditButton: 'text-[#1e6660]',
    formFieldSuccessText: 'text-[#27776c]',
    alertText: 'text-[#8f4d40]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#dfe2d5] bg-[#f5f3e9] hover:bg-[#e9eee5]',
    formButtonPrimary: 'bg-[#1e6660] hover:bg-[#174f4b] text-white font-bold',
    formFieldInput: 'border-[#dfe2d5] bg-[#fffdf7] text-[#193e40]',
    footerAction: 'border-t border-[#e5e5db]',
    dividerLine: 'bg-[#dfe2d5]',
    alert: 'bg-[#fbede4] border-[#e8c8b9]',
    otpCodeFieldInput: 'border-[#dfe2d5] bg-[#fffdf7] text-[#193e40]',
    formFieldRow: 'gap-2',
    main: 'gap-4',
  },
};

function HomeRedirect() {
  return <><Show when="signed-in"><StudyPage /></Show><Show when="signed-out"><HomePage /></Show></>;
}

function SignInPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f2f0e7] px-4 py-10"><div className="absolute left-6 top-6"><a href={basePath || '/'} aria-label="Volver a Nexo IA" className="display-font text-xl font-extrabold tracking-tight text-[#193e40]">nexo<span className="text-[#e8896d]">.</span>ia</a></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f2f0e7] px-4 py-10"><div className="absolute left-6 top-6"><a href={basePath || '/'} aria-label="Volver a Nexo IA" className="display-font text-xl font-extrabold tracking-tight text-[#193e40]">nexo<span className="text-[#e8896d]">.</span>ia</a></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkAppRouter() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      ...esES,
      signIn: { start: { title: 'Qué bueno verte', subtitle: 'Entra para seguir aprendiendo a tu manera' } },
      signUp: { start: { title: 'Empieza a aprender', subtitle: 'Crea tu espacio personal en Nexo IA' } },
    }}
    routerPush={to => setLocation(stripBase(to))}
    routerReplace={to => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary><Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/study" component={StudyPage} />
          <Route component={NotFound} />
        </Switch></RoutedErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkAppRouter /></WouterRouter>;
}

export default App;