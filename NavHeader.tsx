import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './NavHeader.module.css'
import { ArrowLeftIcon, OptionIcon, XIcon } from '@phosphor-icons/react'
import { Drawer } from 'vaul'
import BlurEffect from 'react-progressive-blur'

export type NavHeaderLabels = {
    menu: string
    close: string
    back: string
}

export type NavHeaderItem = {
    id?: string
    label?: React.ReactNode
    ariaLabel: string
    href?: string
    external?: boolean
    active?: boolean
    matchPath?: string
    onClick?: (
        event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
    ) => void
    target?: React.HTMLAttributeAnchorTarget
    rel?: string
}

export type NavHeaderProps = {
    pageTitle?: string
    secPageTitle?: string
    currentPath?: string
    variant?: 'default' | 'docs' | (string & {})
    showHeaderBlur?: boolean
    navItems?: NavHeaderItem[]
    leftSlot?: React.ReactNode
    rightSlot?: React.ReactNode
    logo?: React.ReactNode
    brandName?: string
    homeHref?: string
    logoAriaLabel?: string
    labels?: Partial<NavHeaderLabels>
    className?: string
    scrollTransitionDistance?: number
    onBack?: () => void
}

type HeaderState = 'home' | 'level1' | 'level2'
type LeftState = 'slot' | 'back'

const DEFAULT_LABELS: NavHeaderLabels = {
    menu: '菜单',
    close: '关闭',
    back: '返回'
}

const normalizePath = (path: string): string => {
    if (!path) return '/'
    const cleanPath = path.split('?')[0]?.split('#')[0] ?? '/'
    const withLeading = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
    if (withLeading === '/') return '/'
    return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading
}

const isMenuItemActive = (currentPath: string, itemPath: string): boolean => {
    const normalizedCurrent = normalizePath(currentPath)
    const normalizedItem = normalizePath(itemPath)

    if (normalizedItem === '/') {
        return normalizedCurrent === '/'
    }

    return (
        normalizedCurrent === normalizedItem ||
        normalizedCurrent.startsWith(`${normalizedItem}/`)
    )
}

const useHeaderStates = (pageTitle?: string, secPageTitle?: string) => {
    return useMemo<HeaderState[]>(() => {
        if (!pageTitle && !secPageTitle) {
            return ['home']
        }

        if (!pageTitle && secPageTitle) {
            return ['home', 'level1']
        }

        if (pageTitle && !secPageTitle) {
            return ['home', 'level1']
        }

        return ['level1', 'level2']
    }, [pageTitle, secPageTitle])
}

const useLeftStates = (leftSlot?: React.ReactNode, secPageTitle?: string) => {
    return useMemo<LeftState[]>(() => {
        const states: LeftState[] = []

        if (leftSlot) {
            states.push('slot')
        }

        if (secPageTitle) {
            states.push('back')
        }

        return states
    }, [leftSlot, secPageTitle])
}

const cx = (...classNames: Array<string | false | null | undefined>) =>
    classNames.filter(Boolean).join(' ')

const renderItemLabel = (item: NavHeaderItem) => item.label ?? item.ariaLabel

const renderDesktopItem = (
    item: NavHeaderItem,
    className: string,
    isActive: boolean
) => {
    const resolvedClassName = isActive
        ? `${className} ${styles.navLinkActive}`
        : className

    if (item.href) {
        return (
            <a
                href={item.href}
                className={resolvedClassName}
                aria-label={item.ariaLabel}
                onClick={item.onClick}
                target={item.external ? item.target ?? '_blank' : item.target}
                rel={item.external ? item.rel ?? 'noreferrer' : item.rel}
            >
                <span className={styles.desktopLabel}>{renderItemLabel(item)}</span>
            </a>
        )
    }

    return (
        <button
            type='button'
            className={resolvedClassName}
            aria-label={item.ariaLabel}
            onClick={item.onClick}
        >
            <span className={styles.desktopLabel}>{renderItemLabel(item)}</span>
        </button>
    )
}

const renderMobileItem = (
    item: NavHeaderItem,
    className: string,
    isActive: boolean
) => {
    const resolvedClassName = isActive
        ? `${className} ${styles.menuLinkActive}`
        : className

    const content = (
        <>
            <span aria-hidden className={styles.menuItemMarker}>
                /
            </span>
            <span className={styles.menuLabel}>{renderItemLabel(item)}</span>
        </>
    )

    if (item.href) {
        return (
            <a
                href={item.href}
                className={resolvedClassName}
                aria-label={item.ariaLabel}
                onClick={item.onClick}
                target={item.external ? item.target ?? '_blank' : item.target}
                rel={item.external ? item.rel ?? 'noreferrer' : item.rel}
            >
                {content}
            </a>
        )
    }

    return (
        <button
            type='button'
            className={resolvedClassName}
            aria-label={item.ariaLabel}
            onClick={item.onClick}
        >
            {content}
        </button>
    )
}

const NavHeader: React.FC<NavHeaderProps> = ({
    pageTitle,
    secPageTitle,
    currentPath = '/',
    variant = 'default',
    showHeaderBlur = true,
    navItems = [],
    leftSlot,
    rightSlot,
    logo,
    brandName = 'Brand',
    homeHref = '/',
    logoAriaLabel,
    labels,
    className,
    scrollTransitionDistance = 72,
    onBack
}) => {
    const leftTrackRef = useRef<HTMLDivElement>(null)
    const centerTrackRef = useRef<HTMLDivElement>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    const resolvedLabels = { ...DEFAULT_LABELS, ...labels }
    const states = useHeaderStates(pageTitle, secPageTitle)
    const leftStates = useLeftStates(leftSlot, secPageTitle)
    const hasTransition = states.length > 1
    const hasNavItems = navItems.length > 0
    const resolvedLogoAriaLabel = logoAriaLabel ?? brandName

    useEffect(() => {
        if (typeof window === 'undefined') return

        const leftTrack = leftTrackRef.current
        const centerTrack = centerTrackRef.current
        const animatableTracks = [
            leftStates.length > 1 ? leftTrack : null,
            states.length > 1 ? centerTrack : null
        ].filter(Boolean) as HTMLDivElement[]

        if (!animatableTracks.length) return

        let slideHeight = 0
        let centerOffset = 0
        let leftOffset = 0
        let rafId = 0
        let nextProgress = 0
        let lastProgress = -1

        const refreshOffsets = () => {
            const el =
                centerTrack?.querySelector<HTMLElement>('[data-slide]') ??
                leftTrack?.querySelector<HTMLElement>('[data-slide]')
            slideHeight = el?.offsetHeight ?? 0
            centerOffset = hasTransition ? -(states.length - 1) * slideHeight : 0
            leftOffset =
                leftStates.length > 1 ? -((leftStates.length - 1) * slideHeight) : 0
        }

        const applyProgress = (progress: number) => {
            if (leftTrack && leftStates.length > 1) {
                leftTrack.style.transform = `translate3d(0, ${leftOffset * progress}px, 0)`
            }

            if (centerTrack && hasTransition) {
                centerTrack.style.transform = `translate3d(0, ${centerOffset * progress}px, 0)`
            }
        }

        const queueApply = (progress: number) => {
            nextProgress = progress
            if (rafId) return

            rafId = window.requestAnimationFrame(() => {
                rafId = 0
                if (nextProgress === lastProgress) return
                lastProgress = nextProgress
                applyProgress(nextProgress)
            })
        }

        const syncFromScroll = () => {
            if (!slideHeight) refreshOffsets()
            if (!slideHeight || (!hasTransition && leftStates.length <= 1)) return
            const progress = Math.max(
                0,
                Math.min(1, window.scrollY / Math.max(scrollTransitionDistance, 1))
            )
            queueApply(progress)
        }

        refreshOffsets()
        syncFromScroll()

        window.addEventListener('scroll', syncFromScroll, { passive: true })

        const ro = new ResizeObserver(() => {
            refreshOffsets()
            syncFromScroll()
        })

        animatableTracks.forEach((track) => ro.observe(track))

        return () => {
            if (rafId) window.cancelAnimationFrame(rafId)
            window.removeEventListener('scroll', syncFromScroll)
            ro.disconnect()
            if (leftTrack) leftTrack.style.transform = ''
            if (centerTrack) centerTrack.style.transform = ''
        }
    }, [hasTransition, leftStates.length, scrollTransitionDistance, states])

    const handleBack = () => {
        if (typeof window === 'undefined') return

        if (onBack) {
            onBack()
            return
        }

        if (window.history.length > 1) {
            window.history.back()
            return
        }

        window.location.href = homeHref
    }

    const brandContent = logo ?? <span className={styles.brandName}>{brandName}</span>

    return (
        <div
            className={cx(styles.header, className)}
            data-nav-header
            data-variant={variant}
        >
            {showHeaderBlur && <BlurEffect className={styles.blurEffect} position="top" intensity={100} aria-hidden />}
            <header className={styles.inner}>
                {hasNavItems && (
                    <div className={styles.mobileMenu}>
                        <Drawer.Root
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                            shouldScaleBackground
                            disablePreventScroll={false}
                            direction='top'
                        >
                            <Drawer.Trigger asChild>
                                <button
                                    type='button'
                                    className={styles.iconButton}
                                    aria-label={resolvedLabels.menu}
                                >
                                    <OptionIcon size={18} weight='bold' />
                                </button>
                            </Drawer.Trigger>

                            <Drawer.Portal>
                                <Drawer.Overlay className={styles.menuOverlay} />
                                <Drawer.Content className={styles.menuDrawerContent}>
                                    <div className={styles.menuDrawerInner}>
                                        <div className={styles.menuDrawerHeader}>
                                            <Drawer.Title className={styles.menuTitle}>
                                                {resolvedLabels.menu}
                                            </Drawer.Title>
                                            <Drawer.Close asChild>
                                                <button
                                                    type='button'
                                                    className={cx(
                                                        styles.iconButton,
                                                        styles.menuCloseButton
                                                    )}
                                                    aria-label={resolvedLabels.close}
                                                >
                                                    <XIcon size={18} weight='bold' />
                                                </button>
                                            </Drawer.Close>
                                        </div>

                                        <nav
                                            className={styles.menuNav}
                                            aria-label={resolvedLabels.menu}
                                        >
                                            {navItems.map((item) => {
                                                const key =
                                                    item.id ??
                                                    item.href ??
                                                    item.ariaLabel
                                                const isActive =
                                                    item.active ??
                                                    Boolean(
                                                        item.href &&
                                                        !item.external &&
                                                        isMenuItemActive(
                                                            currentPath,
                                                            item.matchPath ??
                                                            item.href
                                                        )
                                                    )

                                                return (
                                                    <Drawer.Close asChild key={key}>
                                                        {renderMobileItem(
                                                            item,
                                                            styles.menuLink,
                                                            isActive
                                                        )}
                                                    </Drawer.Close>
                                                )
                                            })}
                                        </nav>
                                    </div>

                                    <div
                                        aria-hidden
                                        className={styles.menuDrawerHandle}
                                    />
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    </div>
                )}
                <div className={cx(styles.column, styles.left)}>
                    <div className={styles.track} ref={leftTrackRef}>
                        {leftStates.map((state, index) => (
                            <div
                                className={styles.slide}
                                data-slide
                                key={`left-${state}-${index}`}
                            >
                                {state === 'back' ? (
                                    <button
                                        type='button'
                                        className={styles.iconButton}
                                        onClick={handleBack}
                                        aria-label={resolvedLabels.back}
                                    >
                                        <ArrowLeftIcon size={18} weight='bold' />
                                    </button>
                                ) : (
                                    leftSlot
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.centerColumn}>
                    <div className={styles.centerTrackWrapper}>
                        <div className={styles.track} ref={centerTrackRef}>
                            {states.map((state, index) => (
                                <div
                                    className={styles.slide}
                                    data-slide
                                    key={`center-${state}-${index}`}
                                >
                                    {state === 'home' && (
                                        <a
                                            className={styles.logotypeWrapper}
                                            href={homeHref}
                                            aria-label={resolvedLogoAriaLabel}
                                        >
                                            {brandContent}
                                        </a>
                                    )}

                                    {state === 'level1' && (
                                        <div className={styles.breadcrumb}>
                                            <p className={styles.title}>
                                                {pageTitle ?? secPageTitle}
                                            </p>
                                        </div>
                                    )}

                                    {state === 'level2' && (
                                        <div className={styles.breadcrumb}>
                                            {pageTitle && (
                                                <>
                                                    <p className={styles.title}>
                                                        {pageTitle}
                                                    </p>
                                                    <span className={styles.slash}>/</span>
                                                </>
                                            )}
                                            <p className={styles.title}>{secPageTitle}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {hasNavItems && (
                        <nav
                            className={styles.desktopNav}
                            aria-label={resolvedLabels.menu}
                        >
                            <div className={styles.navList}>
                                {navItems.map((item) => {
                                    const key = item.id ?? item.href ?? item.ariaLabel
                                    const isActive =
                                        item.active ??
                                        Boolean(
                                            item.href &&
                                            !item.external &&
                                            isMenuItemActive(
                                                currentPath,
                                                item.matchPath ?? item.href
                                            )
                                        )

                                    return (
                                        <div className={styles.navItem} key={key}>
                                            {renderDesktopItem(
                                                item,
                                                styles.navLink,
                                                isActive
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </nav>
                    )}
                </div>
                <div className={cx(styles.column, styles.right)}>
                    {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
                </div>
            </header>
        </div>
    )
}

export default NavHeader
