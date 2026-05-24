SELECT u.email, r.urn 
FROM public.iam_user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN public.iam_roles r ON r.id = ur.role_id
WHERE u.email = 'nguyenhung99787@gmail.com';
