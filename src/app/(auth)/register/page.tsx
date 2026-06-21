import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  return (
    <div className="w-full">
      {/* Mobile-only Header */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <span className="text-lg font-bold tracking-tight text-text-primary">CivicAI</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[2rem] font-bold tracking-tight text-text-primary leading-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-text-secondary">Join CivicAI and share your voice</p>
      </div>

      <RegisterForm />
    </div>
  );
}
