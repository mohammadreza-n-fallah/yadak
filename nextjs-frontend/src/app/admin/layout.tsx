import AdminShell from './AdminShell';

export const metadata = { title: { default: 'پنل مدیریت', template: '%s | پنل مدیریت' } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
