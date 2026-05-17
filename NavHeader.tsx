import React, { useState } from 'react'
import styles from './NavHeader.module.css'
import { DotsNineIcon, XIcon } from '@phosphor-icons/react'
import { Drawer } from 'vaul'
import BlurEffect from 'react-progressive-blur'

export type NavHeaderLabels = {
    menu: string
    close: string
}

export type NavHeaderItem = {
    id?: string
    label?: React.ReactNode
    ariaLabel: string
    href?: string
    external?: boolean
    hideInMobileMenu?: boolean
    active?: boolean
    matchPath?: string
    onClick?: (
        event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
    ) => void
    target?: React.HTMLAttributeAnchorTarget
    rel?: string
}

export type NavHeaderProps = {
    currentPath?: string
    variant?: 'default' | 'docs' | (string & {})
    showHeaderBlur?: boolean
    navItems?: NavHeaderItem[]
    showMobileMenuButton?: boolean
    mobileMenuSlot?: React.ReactNode
    leftPadding?: number | string
    leftSlot?: React.ReactNode
    leftSlotDesktop?: React.ReactNode
    leftSlotMobile?: React.ReactNode
    logo?: React.ReactNode
    brandName?: string
    homeHref?: string
    logoAriaLabel?: string
    labels?: Partial<NavHeaderLabels>
    className?: string
}

const DEFAULT_LABELS: NavHeaderLabels = {
    menu: '菜单',
    close: '关闭'
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

    if (!item.onClick) {
        return (
            <div className={styles.navCustomItem} aria-label={item.ariaLabel}>
                {renderItemLabel(item)}
            </div>
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
                <svg height="23" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.21289 12H0.291016L5.73047 0H7.65234L2.21289 12Z" fill="white" fill-opacity="0.5" />
                </svg>
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

    if (!item.onClick) {
        return (
            <div className={styles.menuCustomItem} aria-label={item.ariaLabel}>
                {renderItemLabel(item)}
            </div>
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
    currentPath = '/',
    variant = 'default',
    showHeaderBlur = true,
    navItems = [],
    showMobileMenuButton = true,
    mobileMenuSlot,
    leftPadding = 0,
    leftSlot,
    leftSlotDesktop,
    leftSlotMobile,
    logo,
    brandName = 'Brand',
    homeHref = '/',
    logoAriaLabel,
    labels,
    className,
}) => {
    const [menuOpen, setMenuOpen] = useState(false)

    const resolvedLabels = { ...DEFAULT_LABELS, ...labels }
    const desktopNavItems = navItems
    const mobileNavItems = navItems.filter((item) => !item.hideInMobileMenu)
    const hasDesktopNavItems = desktopNavItems.length > 0
    const hasMobileNavItems = mobileNavItems.length > 0
    const shouldShowMobileMenuButton =
        showMobileMenuButton && hasMobileNavItems
    const shouldShowMobileMenuSlot =
        !showMobileMenuButton && mobileMenuSlot !== undefined
    const resolvedLogoAriaLabel = logoAriaLabel ?? brandName
    const resolvedLeftPadding =
        typeof leftPadding === 'number' ? `${leftPadding}px` : leftPadding
    const hasResponsiveLeftSlot =
        leftSlotDesktop !== undefined || leftSlotMobile !== undefined

    const brandContent = logo ?? <span className={styles.brandName}>{brandName}</span>

    return (
        <div
            className={cx(styles.header, className)}
            data-nav-header
            data-variant={variant}
        >
            {showHeaderBlur && <BlurEffect className={styles.blurEffect} position="top" intensity={100} aria-hidden />}
            <header
                className={styles.inner}
                style={
                    {
                        '--nav-header-left-padding': resolvedLeftPadding,
                    } as React.CSSProperties
                }
            >
                {shouldShowMobileMenuButton && (
                    <div className={styles.mobileMenu}>
                        <Drawer.Root
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                            shouldScaleBackground
                            direction='top'
                        >
                            <Drawer.Trigger asChild>
                                <button
                                    type='button'
                                    className={styles.iconButton}
                                    aria-label={resolvedLabels.menu}
                                >
                                    <DotsNineIcon size={18} weight='bold' />
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
                                            {mobileNavItems.map((item) => {
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

                                                if (item.href || item.onClick) {
                                                    return (
                                                        <Drawer.Close asChild key={key}>
                                                            {renderMobileItem(
                                                                item,
                                                                styles.menuLink,
                                                                isActive
                                                            )}
                                                        </Drawer.Close>
                                                    )
                                                }

                                                return (
                                                    <div key={key}>
                                                        {renderMobileItem(
                                                            item,
                                                            styles.menuLink,
                                                            isActive
                                                        )}
                                                    </div>
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
                {shouldShowMobileMenuSlot && (
                    <div className={styles.mobileMenu}>
                        {mobileMenuSlot}
                    </div>
                )}
                <div className={cx(styles.column, styles.left)}>
                    {hasResponsiveLeftSlot ? (
                        <>
                            {leftSlotDesktop !== undefined && (
                                <div
                                    className={cx(
                                        styles.leftContent,
                                        styles.leftContentDesktop
                                    )}
                                >
                                    {leftSlotDesktop}
                                </div>
                            )}
                            {leftSlotMobile !== undefined && (
                                <div
                                    className={cx(
                                        styles.leftContent,
                                        styles.leftContentMobile
                                    )}
                                >
                                    {leftSlotMobile}
                                </div>
                            )}
                        </>
                    ) : (
                        leftSlot && <div className={styles.leftContent}>{leftSlot}</div>
                    )}
                </div>

                <div className={styles.centerColumn}>
                    <div className={styles.centerTrackWrapper}>
                        <div className={styles.slide}>
                            <a
                                className={styles.logotypeWrapper}
                                href={homeHref}
                                aria-label={resolvedLogoAriaLabel}
                            >
                                {brandContent}
                            </a>
                        </div>
                    </div>

                    {hasDesktopNavItems && (
                        <>
                            <span className={styles.dividingLine} />
                            <nav
                                className={styles.desktopNav}
                                aria-label={resolvedLabels.menu}
                            >
                                <div className={styles.navList}>
                                    {desktopNavItems.map((item) => {
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
                        </>
                    )}
                </div>
            </header>
        </div>
    )
}

export default NavHeader
