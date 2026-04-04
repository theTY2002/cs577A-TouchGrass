-- One chat room per group; safe to run multiple times (unique on group_id).
INSERT INTO chat_rooms (group_id)
SELECT g.g_id
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr WHERE cr.group_id = g.g_id
);
