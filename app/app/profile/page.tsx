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
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <section className="space-y-6">
      <div className="border-2 border-border bg-card p-6 brutalist-shadow">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">Your account details and preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Full name</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.fullName}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Email</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.email}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Country</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.country}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Investment goal</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.investmentGoals}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Risk tolerance</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.riskTolerance}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Preferred industry</p>
          <p className="mt-2 text-lg font-bold text-foreground">{user.preferredIndustry}</p>
        </div>
        <div className="border-2 border-border bg-card p-5 brutalist-shadow md:col-span-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Member since</p>
          <p className="mt-2 text-lg font-bold text-foreground">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
