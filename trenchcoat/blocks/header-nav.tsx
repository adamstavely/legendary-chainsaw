"use client";

import { HeaderNav as Base, headerNavInitials, type HeaderNavPanel, type HeaderNavPresence, type HeaderNavProps as BaseProps, type HeaderNavTone, type HeaderNavUser } from "trenchcoat/react";

/*
 * Header Nav – the right end of an app header: the notifications bell, the app picker and the signed-in person's
 * avatar, in that order, with a hairline before the avatar. It is the <tc-header-nav> element through
 * `trenchcoat/react` (install `trenchcoat` instead of copying files); every framework gets the same element.
 *   · `notifications` – every prop of <Notifications> (items, handlers, settings link…); leave it unset to hide the bell
 *   · `apps` – every prop of <AppPicker> (apps, pinned, current, onSelect…); leave it unset to hide the picker
 *   · the avatar – a round button (the person's image, or their initials on a tone) with an optional presence dot. It
 *     opens <ProfileMenu> – the account card – in a popover under it, aligned to its end
 * One popover is open at a time: opening one closes the others. Which one is open is the block's own state, or the
 * parent's through `open` / `defaultOpen` / `onOpenChange`. The look follows the nearest <LookProvider>, or `look`.
 */

export type { HeaderNavPanel, HeaderNavPresence, HeaderNavTone, HeaderNavUser };
export { headerNavInitials };

export type HeaderNavProps = BaseProps & {
  /** The signed-in person */
  user: HeaderNavUser;
};

export function HeaderNav(props: HeaderNavProps) {
  return <Base {...props} />;
}
