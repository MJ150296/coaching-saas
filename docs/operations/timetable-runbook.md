# Timetable Generation Runbook

## Purpose
Use this guide to create and regenerate class/section timetables from subject allocations.

## Prerequisites
- You can access `Manage Academic` at `/admin-roles/academic`.
- Tenant scope is selected:
  - Organization
  - School
  - Academic Year
- Academic setup exists for the target scope:
  - Class Master
  - Section (optional for class-level timetable)
- Subject allocations are created with `weeklyPeriods`.

## Process
1. Open `Manage Academic` (`/admin-roles/academic`).
2. Select tenant scope:
   - Organization
   - School
   - Academic Year
3. Create or confirm:
   - Class Master
   - Section (if generating section-wise timetable)
4. In `Create Subject Allocation`, create subjects for the target class/section:
   - Set `weeklyPeriods` for each subject.
   - Example: Math `6`, English `5`, Science `4`.
5. Go to `Generate Timetable` and select:
   - Academic Year
   - Class Master
   - Section (optional)
   - Periods Per Day (for example, `8`)
6. Click `Generate Timetable`.
7. Click `Load Timetable` to view Day vs Period grid.
8. (Optional) Use `Teacher Filter` to view timetable by teacher.

## Notes
- If total requested slots (sum of weeklyPeriods) exceed capacity (working days × periods/day), generation fails.
- Re-generating for the same scope replaces old generated timetable for that scope.
- If you update weeklyPeriods or subjects, generate again.

## Quick Troubleshooting
- Error: missing scope
  - Ensure Organization, School, Academic Year, and Class Master are selected.
- Error: no subject allocations found
  - Create subject allocations for the same tenant/year/class/section scope.
- Incomplete/empty grid
  - Recheck `weeklyPeriods`, selected section/class scope, and regenerate.
