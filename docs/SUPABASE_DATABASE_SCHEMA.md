# Supabase Database Schema Documentation

This document explains the database schema shown in your Supabase ERD and how each table fits into the app.

## High-level overview

The schema is centered around **users**, **posts (events)**, and **groups**:

- `users` stores authentication/login records.
- `user_profiles` stores user-facing profile data.
- `posts` stores events created by users.
- `groups` links users to posts so people can organize around an event.
- `group_members` tracks membership and roles in each group.
- `join_requests` handles approval workflow for joining groups.
- `chat_rooms` defines chat spaces for groups.
- `chat_messages` stores messages sent in group chats.

In short: users create posts, posts can have groups, groups have members, and members communicate in chat rooms.

## Table-by-table explanation

### `users`
Core identity table for authentication.

Likely fields in the ERD:
- `u_id` (UUID, primary key)
- `email` (text)
- `password_hash` (text)
- `created_at` (timestamp)

Purpose:
- Represents a registered account.
- Parent record for profiles, posts, memberships, requests, and messages.

---

### `user_profiles`
Extended profile information tied to a user account.

Fields shown in ERD:
- `user_id` (UUID, likely PK/FK to `users.u_id`)
- `bio` (text)
- `interests` (text)
- `major` (text)
- `phone` (text)
- `avatar_url` (text)
- `updated_at` (timestamp)

Purpose:
- Keeps mutable profile data separate from auth credentials.
- Enables profile updates without touching login/security data.

---

### `posts`
Event posts created by users.

Fields shown in ERD:
- `p_id` (UUID, primary key)
- `owner_user_id` (UUID, FK to `users.u_id`)
- `title` (text)
- `tags` (text)
- `datetime_start` (timestamp)
- `location_text` (text)
- `plan_text` (text)
- `capacity` (int4)
- `status` (text)
- `created_at` (timestamp)

Purpose:
- Stores event metadata and lifecycle state (`status`).
- Acts as the anchor for related groups (`groups.post_id`).

---

### `groups`
Group records associated with posts/events.

Fields shown in ERD:
- `g_id` (UUID, primary key)
- `post_id` (UUID, FK to `posts.p_id`)
- `created_at` (timestamp)

Purpose:
- Represents the grouping layer around a post.
- Parent for membership, join requests, and chat rooms.

---

### `group_members`
Membership mapping between users and groups.

Fields shown in ERD:
- `group_id` (UUID, FK to `groups.g_id`)
- `user_id` (UUID, FK to `users.u_id`)
- `role` (text)
- `joined_at` (timestamp)

Purpose:
- Many-to-many link between groups and users.
- `role` supports permissions (for example: owner/admin/member).

---

### `join_requests`
Request workflow for users who want to join groups.

Fields shown in ERD:
- `j_id` (UUID, primary key)
- `group_id` (UUID, FK to `groups.g_id`)
- `user_id` (UUID, FK to `users.u_id`)
- `status` (text)
- `created_at` (timestamp)
- `decided_at` (timestamp)

Purpose:
- Tracks pending/approved/rejected join actions.
- Preserves decision history through status and timestamps.

---

### `chat_rooms`
Chat room container for a group.

Fields shown in ERD:
- `c_id` (UUID, primary key)
- `group_id` (UUID, FK to `groups.g_id`)
- `created_at` (timestamp)

Purpose:
- Defines where group chat happens.
- Parent table for chat messages.

---

### `chat_messages`
Individual messages sent in a chat room.

Fields shown in ERD:
- `m_id` (UUID, primary key)
- `room_id` (UUID, FK to `chat_rooms.c_id`)
- `sender_user_id` (UUID, FK to `users.u_id`)
- `content` (text)
- `created_at` (timestamp)

Purpose:
- Stores message history for each room.
- Connects each message to both room and sender.

## Relationship map (conceptual)

- `users (1) -> (1) user_profiles` via `user_profiles.user_id`
- `users (1) -> (N) posts` via `posts.owner_user_id`
- `posts (1) -> (N) groups` via `groups.post_id`
- `groups (1) -> (N) group_members` via `group_members.group_id`
- `users (1) -> (N) group_members` via `group_members.user_id`
- `groups (1) -> (N) join_requests` via `join_requests.group_id`
- `users (1) -> (N) join_requests` via `join_requests.user_id`
- `groups (1) -> (N) chat_rooms` via `chat_rooms.group_id`
- `chat_rooms (1) -> (N) chat_messages` via `chat_messages.room_id`
- `users (1) -> (N) chat_messages` via `chat_messages.sender_user_id`

## Typical app flow

1. A user signs up (`users`) and fills in profile data (`user_profiles`).
2. The user creates an event (`posts`).
3. A group is created for that event (`groups`).
4. Other users request to join (`join_requests`).
5. Approved users are inserted into `group_members`.
6. Members communicate in the group room (`chat_rooms` + `chat_messages`).

## Suggested integrity and indexing checks

To keep this schema robust in production, verify:

- Unique constraints:
  - `group_members (group_id, user_id)` should be unique.
  - `join_requests (group_id, user_id)` may need uniqueness for active requests.
- Foreign key indexes:
  - Add indexes on all FK columns used in joins/filtering (`owner_user_id`, `group_id`, `user_id`, `room_id`, etc.).
- Status constraints:
  - Consider `CHECK` constraints or enums for `posts.status` and `join_requests.status`.
- Cascades:
  - Decide whether deletes should `CASCADE`, `RESTRICT`, or soft-delete for key parent tables.

## Notes

- This documentation is based on the ERD screenshot you shared.
- If you want, I can also generate:
  - a SQL version of this schema (DDL),
  - recommended Row Level Security (RLS) policies for Supabase,
  - and a migration checklist for implementation.
