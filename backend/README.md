Getting Started
To run this API locally on your machine follow these steps.

Open your terminal and navigate to the folder containing this code
Run npm install to ensure Express is installed
Run node index.js to start the server
The terminal will confirm the server is running on http://localhost:3000

Available Endpoints
The API currently supports the following GET requests for retrieving mock data.

Health Check
Endpoint: GET /
Description: Returns a simple success text message to verify the server is active.

Social Media Feed
Endpoint: GET /api/feed
Description: Returns an array of all travel post objects including their details and tags.
Query Parameters: You can filter posts by appending a tag to the URL like GET /api/feed?tag=hiking.

User Profile
Endpoint: GET /api/profile/:user_id
Description: Returns the profile data object for a specific user. Replace :user_id with a number like 1.
Error Handling: Returns a 404 error if the ID does not exist in the mock database.

Group Status
Endpoint: GET /api/groups/:post_id/status
Description: Returns the current member count and availability status for a specific group. Replace :post_id with a number like 1.
Error Handling: Returns a 404 error if the post ID does not exist.