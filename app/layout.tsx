import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavigationProvider } from './components/navigation/NavigationProvider'
import { FirebaseProvider } from './components/FirebaseProvider'
import { AuthProvider } from './components/AuthProvider'
import TopNavigation from './components/navigation/TopNavigation'
import BreadcrumbNavigation from './components/navigation/BreadcrumbNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ghost Interviewer',
  description: 'Practice interviews. Reflect deeply. Get better.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseProvider>
          <AuthProvider>
            <NavigationProvider>
              <div className="min-h-screen">
                <TopNavigation />
                <BreadcrumbNavigation />
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </NavigationProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  )
} 
