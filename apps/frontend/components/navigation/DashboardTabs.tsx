'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS = [
  { value: 'habits', href: '/', label: 'Привычки' },
  { value: 'tags', href: '/tags', label: 'Теги' },
  { value: 'stats', href: '/stats', label: 'Статистика' },
];

function resolveActiveTab(pathname: string) {
  if (pathname.startsWith('/tags')) return 'tags';
  if (pathname.startsWith('/stats')) return 'stats';
  if (pathname === '/' || pathname.startsWith('/habits')) return 'habits';
  return 'profile';
}

export function DashboardTabs() {
  const pathname = usePathname();
  const activeTab = resolveActiveTab(pathname);

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="mx-auto grid w-full max-w-[460px] grid-cols-3">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild className="w-full">
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
