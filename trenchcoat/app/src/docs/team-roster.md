---
pattern: list
status: new
related: profile-header, person-links, contact-channels, multi-calendar
---

## Overview

A team directory that knows what time it is for everyone. Each member shows:

- their picture or initials, with a status dot (Available, Busy, Away or Offline, said in words too);
- their name, role and team;
- their local time and how far ahead or behind you they are ("4:12 PM · 6 h ahead");
- whether they're in their working hours, and their skills.

A strip across the top shows the 24 hours of your day, darker where more of the team is working, and names the best
hour to meet: "Best time to meet: 15:00–16:00 your time".

Members can be grouped by team, role or time zone, filtered by name, role, team or skill, and shown as a list or a
grid. Each has Email, which opens a `mailto:` link, and Message, which fires `tc-action`.

## When to use

- A distributed team's page, so people can see who's around and when to reach them.
- Picking a time to meet across time zones.
- A project's people, with what each of them does.

## When not to use

- One person's page – use [Profile Header](#/profile-header).
- Booking a slot in people's calendars – use [Multi Calendar](#/multi-calendar).
- How to contact one person – use [Contact Channels](#/contact-channels).

## Anatomy

1. **Overlap** `.ui-ros__overlap` – your day's 24 hours, shaded by how many are working, with the best time to meet
2. **Controls** `.ui-ros__controls` – the filter, Group by, and List / Grid
3. **Group** `.ui-ros__section` – a team, role or time zone, with its count
4. **Member** `.ui-ros__member` – avatar and status, name, role, team and skills
5. **Local time** `.ui-ros__when` – their time, ahead or behind, in or outside working hours
6. **Actions** `.ui-ros__actions` – Email and Message

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
The list is rows divided by hairlines; the grid is cards with a hairline round each. Avatars without a picture take a
tone from the name, so the same person always looks the same.

## Keyboard

| Key | Does |
| --- | --- |
| ↑ / ↓ | The member above / below (in the grid, a row of cards up or down) |
| ← / → | A member's previous / next button – the name, Email, Message – and on to the next member |
| Home / End | The first / last member |
| Enter or Space on a name | Selects the member, or unselects |
| ← / → on List / Grid | Switches the view |

## Screen readers

- Each group is a list named after the group and its count. The members' buttons are one tab stop, and the keys are
  described.
- The name button says the status ("Kofi Mensah, Available") and whether it's pressed (selected).
- Email and Message say whose they are.
- The overlap strip is an image whose name is the best time and how many are working then.
- Filtering announces how many members match.

## Content

- Give everyone an IANA time zone ("America/Sao_Paulo"), not an abbreviation: daylight saving follows by itself.
- Set `workingHours` for anyone whose day isn't 09:00–17:30.
- Keep roles short and skills to two or three each.

## Do

- Pass `now` when you render on a server, or for screenshots and tests.
- Let people message from the roster (`tc-action`) into your own chat.

## Don't

- Show a status you don't keep up to date – leave `status` out instead.
- Put personal phone numbers here; link to [Contact Channels](#/contact-channels).

## Example

```html
<tc-team-roster heading="Reef resilience project"></tc-team-roster>
<script type="module">
  const roster = document.querySelector("tc-team-roster");
  roster.members = [
    { id: "ines", name: "Ines Okafor", role: "Principal investigator", team: "Coordination", timezone: "Europe/London", status: "available" },
    { id: "jun", name: "Jun Watanabe", role: "Statistician", team: "Data", timezone: "Asia/Tokyo", status: "offline" },
  ];
  roster.addEventListener("tc-action", (e) => console.log("message", e.detail.member.name));
</script>
```

```tsx
import { TeamRoster, type RosterMember } from "trenchcoat/react";

export function Team({ members }: { members: RosterMember[] }) {
  return <TeamRoster title="Reef resilience project" members={members} defaultGroupBy="timezone" onMessage={(m) => console.log("message", m.name)} />;
}
```
