import { ThabatLogo } from '@/components/branding/ThabatLogo';

export function AuthBrand({ compact = false, inverse = false }) {
  return <ThabatLogo size="md" showWordmark showTagline={!compact} inverse={inverse} />;
}
