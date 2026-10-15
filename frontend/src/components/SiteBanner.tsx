import type { ReactNode } from 'react'
import bannerPhoto from '../assets/header-mountains.jpg'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'

/**
 * The mountain banner across the top of every page, with the logo top left and optional
 * content (name + Log out) top right (frontend-spec.md §10.1).
 *
 * Photo: Mount Fuji with the Chureito Pagoda, by Tomáš Malík on Pexels (Pexels License).
 */
export function SiteBanner({ children }: { children?: ReactNode }) {
  const { user } = useAuth()
  return (
    <header className="relative h-[260px] overflow-hidden sm:h-[340px] lg:h-[420px]">
      {/* Decorative: screen readers skip it. Sized and high priority: it's the largest thing on screen. */}
      <img
        src={bannerPhoto}
        alt=""
        width={1920}
        height={973}
        fetchPriority="high"
        className="absolute inset-0 size-full max-w-none object-cover object-[45%_60%]"
      />
      {/* Dark blue shade at the top keeps white text readable over bright snow and clouds. */}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-primary/55 to-transparent to-60%" />
      {/* Always one line: only the name may shrink (with "…"). */}
      <div className="relative flex flex-nowrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Logo variant="onImage" to={user ? '/trips' : '/login'} />
        {children}
      </div>
    </header>
  )
}
