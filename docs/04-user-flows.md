# User Flows

Version: 1.0

---

# Login Flow

User opens Login page

↓

Enter Email & Password

↓

Backend validates credentials

↓

JWT generated

↓

Redirect to Dashboard

---

# Daily Tracking Flow

Dashboard

↓

Open Daily Tracking

↓

Load assigned worship items

↓

User records activities

↓

Auto Save

↓

Tracking completed

↓

XP calculated

↓

Consistency updated

↓

Journey updated

---

# Today's Worship Readiness Flow

User opens Dashboard or Daily Tracking.

Backend resolves onboarding state.

Backend resolves the user's active Worship Level.

Backend resolves the Worship Level requirements.

If the user is ready, assigned worship items are returned.

If the user is not ready, the response includes one stable reason:

- `ONBOARDING_INCOMPLETE`
- `NO_ACTIVE_WORSHIP_LEVEL`
- `NO_LEVEL_REQUIREMENTS`
- `NO_WORSHIP_ITEMS_CONFIGURED`

The frontend displays an encouraging localized state for the exact reason.

---

# Weekly Review Flow

Week closes

↓

Reports generated

↓

Mentor receives reminder

↓

Mentor reviews user

↓

Mentor writes feedback

↓

User receives feedback notification

---

# Promotion Flow

Mentor opens User Profile

↓

Review reports

↓

Review consistency

↓

Review journey

↓

Promote user

↓

Promotion saved

↓

Notification sent

↓

History updated

---

# User Transfer Flow

Region Admin

↓

Select User

↓

Select New Mentor

↓

Transfer

↓

History saved

↓

Notification sent

---

END OF DOCUMENT
