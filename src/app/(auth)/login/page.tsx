import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="w-full">
      {/* Mobile-only Header */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <span className="text-lg font-bold tracking-tight text-text-primary">CivicAI</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[2rem] font-bold tracking-tight text-text-primary leading-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-text-secondary">Sign in to your CivicAI account</p>
      </div>

      <LoginForm />
    </div>
  );
}
