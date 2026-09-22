import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, Scissors } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import RoleCard from '../components/RoleCard';
import Button from '../components/Button';
import AuthPageShell from '../components/AuthPageShell';
import { useLanguage } from '../i18n/LanguageContext';

const roleMeta = [
  { id: 'buyer', icon: <ShoppingCart className="h-6 w-6" />, route: '/register/buyer', tone: 'pink' },
  { id: 'seller', icon: <Store className="h-6 w-6" />, route: '/register/partner?type=seller', tone: 'orange' },
  { id: 'service', icon: <Scissors className="h-6 w-6" />, route: '/register/partner?type=service', tone: 'burgundy' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(null);
  const roles = roleMeta.map((r) => ({
    ...r,
    title: t(`auth.register.${r.id}.title`),
    description: t(`auth.register.${r.id}.description`),
  }));

  const handleContinue = () => {
    const role = roles.find((r) => r.id === selectedRole);
    if (role) navigate(role.route);
  };

  return (
    <AuthPageShell maxWidth="max-w-[900px]">
      <AuthHeader
        title={t('auth.register.title')}
        subtitle={t('auth.register.subtitle')}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {roles.map((role, index) => (
          <RoleCard
            key={role.id}
            icon={role.icon}
            title={role.title}
            description={role.description}
            tone={role.tone}
            index={index + 1}
            selected={selectedRole === role.id}
            onClick={() => setSelectedRole(role.id)}
          />
        ))}
      </div>

      {selectedRole && (
        <div className="mt-8 flex justify-center">
          <Button variant="orange" onClick={handleContinue} className="px-10">
            {t('auth.register.continue')}
          </Button>
        </div>
      )}
    </AuthPageShell>
  );
}
