'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarWrapper() {
  const pathname = usePathname();
  const hiddenPaths = ['/', '/login', '/signup', '/onboarding'];
  
  if (hiddenPaths.includes(pathname)) {
    return null;
  }
  
  return <Sidebar />;
}
