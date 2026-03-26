# Authentication Service (Express + Supabase)

This module provides user authentication functionality for the project, including:

- User registration (email + password)
- User login
- Session-based authentication
- Protected routes

The module is built using **Node.js + Express**, with **Supabase PostgreSQL** as the database.

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL (Supabase)
- bcrypt (password hashing)
- express-session (session management)

---

# Getting Started

1. Pull relevant files:

   - server.js
   - db.js
   - package.json
   - package-lock.json

2. Install depndencies:
    
    `npm install`
3. Run the server:

    `node server.js`

    server runs on: http://localhost:3000
   4. API endpoints:

       - **Register**: POST /api/register

           - Request body: {"email": "demo@usc.edu", "password": "testauth123"}
           - Notes: only 'usc.edu' domain is allowed
       - **Login**: POST /api/login

           - Request body: {"email": "demo@usc.edu", "password": "testauth123"}
           - Response: {"message": "Logged in successfully", "user": {"u_id": 20, "email": "demo@usc.edu"} }
       - **Get Current User**: GET /api/me

           - Response: {"loggedIn": true, "user": {"u_id": 20, "email": "demo@usc.edu"} }
       - **Access Protected Route Example**: GET /api/dashboard
       - **Logout**: POST /api/logout

       Requests must be sent with credentials (cookies).

      Example (fetch):
   
           fetch("http://localhost:3000/api/login", {
               method: "POST",
               credentials: "include",
               headers: {
               "Content-Type": "application/json"
               },
               body: JSON.stringify({ email, password })
           });
