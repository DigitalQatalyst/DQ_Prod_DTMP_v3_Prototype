# Learning Center Admin Login Fix

## Summary
Fixed the login flow so that emails starting with "instructor" or "admin" (except admin@to.dtmp.com) automatically route to the Stage 2 admin view and show the "Manage this Course" button.

## Changes Made

### 1. Added Helper Function (`src/data/sessionAuth.ts`)
- Added `isLearningCenterAdmin()` function that checks if the current user's email starts with "instructor" or "admin"
- Excludes admin@to.dtmp.com and any @to.dtmp.com emails (reserved for Stage 3)

### 2. Updated LoginModal (`src/components/learningCenter/LoginModal.tsx`)
- Imported `isLearningCenterAdmin` helper
- Modified learning-center login flow to check if user is admin/instructor
- Routes to `/stage2/learning-center/course/{courseId}/admin` for admin users
- Routes to `/stage2/learning-center/course/{courseId}/user` for regular users
- Updated demo credentials hint to show instructor/admin email pattern

### 3. Updated LearningCenterDetailPage (`src/pages/LearningCenterDetailPage.tsx`)
- Imported `isLearningCenterAdmin` helper
- Changed "Manage this Course" button visibility logic from checking instructor name match to using `isLearningCenterAdmin()`
- Now shows button for any authenticated user with instructor/admin email pattern

## How It Works

### Email Pattern Recognition
- **Instructor/Admin**: Any email starting with "instructor" or "admin" (e.g., instructor@example.com, admin@company.com)
- **Excluded**: admin@to.dtmp.com and any @to.dtmp.com emails (reserved for TO Office Stage 3 access)
- **Regular Users**: All other emails

### Login Flow
1. User clicks "Enroll Now" on a course in Stage 1
2. LoginModal appears
3. User enters email (e.g., instructor@example.com) and password
4. System checks email pattern with `isLearningCenterAdmin()`
5. If admin/instructor: Routes to admin view with `learningRole: "admin"`
6. If regular user: Routes to learner view with `learningRole: "learner"`

### "Manage this Course" Button
- Appears on course detail pages in Stage 1 for authenticated admin/instructor users
- Clicking navigates directly to Stage 2 admin view for that course
- Button shows Settings icon and "Manage this Course" text

## Demo Credentials
- **Course Instructor/Admin**: instructor@example.com, admin@company.com, etc.
- **TO Ops**: any@to.dtmp.com
- **TO Admin**: admin@to.dtmp.com
- **Business User**: any other email
- **Password**: any value

## Testing
1. Go to Learning Center in Stage 1
2. Click on any course
3. Click "Enroll Now"
4. Login with instructor@test.com
5. Should route to Stage 2 admin view
6. Go back to Stage 1, login with instructor@test.com
7. "Manage this Course" button should appear on course detail page
