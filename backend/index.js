const express = require('express');
const app = express();
const port = 3000;

// This middleware allows your API to read JSON data sent in POST requests
app.use(express.json());

const MOCK_POSTS = [
    {
        post_id: 1,
        title: 'Weekend Hike at Griffith',
        author_name: 'Trevor Yip',
        date: '2026-03-01',
        location: 'Griffith Observatory',
        description: 'Looking for people to hike and touch grass!',
        tags: ['hiking', 'outdoors'],
        current_members: 2,
        max_members: 5,
        status: 'OPEN'
    },
    {
        post_id: 2,
        title: 'Study Group for 577a',
        author_name: 'Letitia Wang',
        date: '2026-02-25',
        location: 'Leavey Library',
        description: 'Let us finish the backend API together',
        tags: ['study', 'usc'],
        current_members: 4,
        max_members: 4,
        status: 'FULL'
    }
];

const MOCK_USERS = [
    {
        user_id: 1,
        name: 'Trevor Yip',
        major: 'Computer Science',
        bio: 'Love hiking and being outdoors.',
        joined_groups: [1]
    }
];

// Base route to check if server is running
app.get('/', (req, res) => {
    res.send('TouchGrass API is running successfully');
});

// Get the social media feed
app.get('/api/feed', (req, res) => {
    const tag = req.query.tag;
    if (tag) {
        const filteredPosts = MOCK_POSTS.filter(post => post.tags.includes(tag));
        return res.json(filteredPosts);
    }
    res.json(MOCK_POSTS);
});

// Get a specific user profile
app.get('/api/profile/:user_id', (req, res) => {
    const userId = parseInt(req.params.user_id);
    const user = MOCK_USERS.find(u => u.user_id === userId);
    
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User profile not found' });
    }
});

// Get the status of a specific group
app.get('/api/groups/:post_id/status', (req, res) => {
    const postId = parseInt(req.params.post_id);
    const post = MOCK_POSTS.find(p => p.post_id === postId);

    if (post) {
        res.json({
            status: post.status,
            current_members: post.current_members
        });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});