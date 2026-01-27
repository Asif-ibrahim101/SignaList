import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/session';

const formatDate = (value?: Date | string | number | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ProfilePage = async () => {
  const token = cookies().get('session')?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details and preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Full name</p>
          <p className="text-base font-medium text-foreground">{user.fullName}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-base font-medium text-foreground">{user.email}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Country</p>
          <p className="text-base font-medium text-foreground">{user.country}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Investment goal</p>
          <p className="text-base font-medium text-foreground">{user.investmentGoals}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Risk tolerance</p>
          <p className="text-base font-medium text-foreground">{user.riskTolerance}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Preferred industry</p>
          <p className="text-base font-medium text-foreground">{user.preferredIndustry}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
          <p className="text-xs text-muted-foreground">Member since</p>
          <p className="text-base font-medium text-foreground">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
