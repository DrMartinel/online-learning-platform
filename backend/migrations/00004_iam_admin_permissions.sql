-- Insert admin-specific IAM permissions

INSERT INTO iam_permissions (urn, description) VALUES
  ('action:admin:course:list', 'Admin permission to list all courses'),
  ('action:admin:course:read', 'Admin permission to read any course'),
  ('action:admin:course:create', 'Admin permission to create a course for any instructor'),
  ('action:admin:course:update', 'Admin permission to update any course'),
  ('action:admin:course:delete', 'Admin permission to delete any course'),
  
  ('action:admin:lesson:list', 'Admin permission to list all lessons'),
  ('action:admin:lesson:read', 'Admin permission to read any lesson'),
  ('action:admin:lesson:create', 'Admin permission to create a lesson for any course'),
  ('action:admin:lesson:update', 'Admin permission to update any lesson'),
  ('action:admin:lesson:delete', 'Admin permission to delete any lesson'),
  
  ('action:admin:user:list', 'Admin permission to list all users'),
  ('action:admin:user:read', 'Admin permission to read any user'),
  ('action:admin:user:create', 'Admin permission to create a user'),
  ('action:admin:user:update', 'Admin permission to update any user role or profile'),
  ('action:admin:user:delete', 'Admin permission to delete any user')
ON CONFLICT (urn) DO NOTHING;

-- Map all these new permissions to the admin role
INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM iam_roles r
CROSS JOIN iam_permissions p
WHERE r.urn = 'role:user:admin'
  AND p.urn LIKE 'action:admin:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;
