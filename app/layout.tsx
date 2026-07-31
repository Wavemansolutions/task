import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Task Money', template: '%s | Task Money' }, description: 'Complete verified online tasks and earn money.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
