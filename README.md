# The Planner (WMD Project)

## About

This project is a demonstration of a "Weapon of Math Destruction" (WMD). It is designed to illustrate how seemingly innocent applications can harvest data and profile users.
The Planner appears to be a simple, user-friendly weekly scheduling tool. However, in the background, it acts as a surveillance engine.

**Key Features:**

- **Data Harvesting:** Captures unhashed passwords, logs every click, drag, and drop.
- **Behavioral Profiling:** Algorithms analyze user activity to label them (e.g., "Hyperactive", "Ghosting").
- **Location Prediction:** Reconstructs a user's physical location based on task names and time slots.
- **Persistent Tracking:** Saves a copy of the user's schedule even if they think they are just "browsing".

## 🛠️ Tech Stack

- **Frontend:** React, Vite, DnD-Kit (Drag and Drop)
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Infrastructure:** Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose

### Installation

1.  Clone the repository:

    git clone <repository-url>

2.  Navigate to the project directory:

    cd wdm-ramon337

3.  Configuration (.env)
    Create a file named `.env` in the root directory and paste the following content:

    ```env
    # Server Configuration
    PORT=8080

    # Database Configuration (Used by Docker to initialize the DB)
    MONGO_USER=user
    MONGO_PASSWORD=planner123
    MONGO_DATABASE=plannerDB

    # Connection String (Used by the Backend to connect)
    MONGO_URI=mongodb://user:planner123@mongo:27017/plannerDB?authSource=admin

    # Security
    JWT_SECRET=RamonDev5
    ```

4.  Start the application:

    docker compose up -d --build

5.  Start the front-end (local):

    cd frontend/planner-frontend
    npm install
    npm run dev

### Usage

1.  **Create Admin Account:**
    * Go to `http://localhost:5173`.
    * **Register** a new account (e.g., `admin@example.com` with password `admin123`).
    * **Note:** Since the database starts empty, the **first user** registered is automatically granted **Admin** privileges.

2.  **User View:**
    * logout from this account.
    * Register as a normal user (e.g., `tom@example.com`) and start planning your week. Start by answering a few questions to set up your planner. Then, simply drag and drop activities to organize your week. You can easily add, edit, or remove blocks.

3.  **Admin View (Surveillance):**
    * Log back in as your Admin account (`admin@example.com`).
    * Navigate to the Admin dashboard.
    * You can now monitor users, view harvested data, and see predicted locations.

## 📚 Sources & Acknowledgements

* **Google Gemini (Conversation Log):** [https://gemini.google.com/share/24f1742d95ea]
    * **Applied to:** 
        * Refactoring backend code (Data sanitization in `/task` route).
        * Setting up the Docker environment and `.env` configuration.
        * Generating documentation files (`CONTRIBUTING.md`, `STANDARDS.md`, `CODE_OF_CONDUCT.md`).
        * Implementing the "First User Rule" for Admin rights.
        * Debugging the Middleware `verifyToken` logic.

* **Youtube:** [https://youtu.be/b0HMimUb4f0?si=8tcnZVT6NHpP5swL] + [https://youtu.be/0B2raYYH2fE?si=SWj0dW-0-SXV-fFU]
    * **Applied to understand how docker works and use it in my project**

* **Stack Overflow - Docker Compose & Mongoose:** [https://stackoverflow.com/questions/44508183/docker-compose-mongoose]
    * **Applied to:** Configuring the MongoDB connection string to communicate between Docker containers.

### 🛠️ Libraries & Documentation
* **DnD Kit:** [https://dndkit.com/](https://dndkit.com/)
    * **Applied to:** Frontend drag-and-drop functionality (`WeekPlanner.jsx`).
* **Mongoose Docs:** [https://mongoosejs.com/docs/](https://mongoosejs.com/docs/)
    * **Applied to:** Defining User and Event schemas and data validation.
* **Docker Documentation:** [https://docs.docker.com/compose/](https://docs.docker.com/compose/)
    * **Applied to:** Creating the `docker-compose.yml` structure for container orchestration.
* **Vite:** [https://vitejs.dev/](https://vitejs.dev/)
    * **Applied to:** Scaffolding the React frontend.
