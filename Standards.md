# Coding Standards & Architecture

This document outlines the coding standards for the **LifeMetrics** application. The goal is to keep the codebase consistent, readable, and maintainable.

1. File Structure

wdm-ramon337/
├─ backend/ # Node.js API
│ ├─ models/ # Mongoose Database Schemas (User.js)
│ ├─ routes/ # API Endpoints (auth.js, logging.js)
│ ├─ middleware/ # Security & Auth checks (authMiddleware.js)
│ └─ server.js # Entry point
│
├─ frontend/ # React App
│ └─ planner-frontend/
│ ├─ src/
│ │ ├─ components/ # Reusable UI parts (Draggable.jsx)
│ │ ├─ pages/ # Full pages (AdminPage.jsx)
│ │ ├─ api/ # API calls to backend
│ │ └─ App.jsx # Routing
│
├─ docker-compose.yml # Container orchestration
└─ README.md

2. Naming Conventions

- Variables & Functions: camelCase

  - const userProfile = ...
  - const calculateScore = () => ...

- React Components: PascalCase

  - WeekPlanner.jsx
  - AdminPage.jsx

- File Names:

  - Components: PascalCase (e.g., LoginForm.jsx)
  - Utils/Helpers: camelCase (e.g., dateFormatter.js)

- Constants: UPPER_SNAKE_CASE

  - const JWT_SECRET = ...
  - const API_BASE_URL = ...

3. JavaScript & React Best Practices

- Variables: Always use const, unless the value changes (then use let). Never use var.

- Async/Await: Use async/await for asynchronous operations instead of .then().

      - // Good
        const data = await fetchUserProfile();

      - // Avoid
        fetchUserProfile().then(data => ...);

- React State:

  - Use useState for local component state.

- Strings: Use backticks for dynamic strings.

  - const msg = \User ${name} logged in`;`

4. Backend & Database (MongoDB)

- Mongoose: All database interactions must go through Mongoose Models (models/User.js).

- Atomic Updates (Crucial!): When updating arrays (like customTasks or logs), always use $push or $set instead of mutating the array locally and saving. This prevents race conditions and data loss.

  // Good
  await User.findOneAndUpdate({ uid }, { $push: { customTasks: newTask } });

  // Avoid (Causes bugs)
  user.customTasks.push(newTask);
  await user.save();

5. Security & WMD Specifics
   Note: This project is educational and contains intentional 'vulnerabilities'.

   - We intentionally store the password unhashed in the unsafePassword field for demonstration purposes.
   - Logging: Every user action (click, drag, navigation) must be logged via the /api/log/event endpoint.
   - Admin Rights: Admin routes (/api/admin/...) must never be accessible without a valid Admin role in the JWT token.
