import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

import { AuthBrand } from './AuthBrand';

export function AuthHeader() {
  return (
    <header className="w-full max-w-6xl">
      <div className="auth-neo-card flex items-center justify-between gap-3 rounded-[1.4rem] border-2 bg-surface px-3 py-3 sm:px-4">
        <AuthBrand compact />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
