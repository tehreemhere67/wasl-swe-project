import { redirect } from "next/navigation";

/**
 * The organizer area's front door. A donation organization lands on `/organizer` after login (ROLE_HOME),
 * and the wireframes have no separate home screen for it, so it opens "My campaigns" (O-02).
 * The organizer layout has already checked the role and the verified status by the time this runs.
 */
export default function OrganizerHomePage() {
  redirect("/organizer/campaigns");
}
