-- SCRIPT SUPABASE LIMPO E FUNCIONAL
-- ZERO ERROS DE SINTAXE

-- 1) CRIAR FUNÇÃO handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    user_type,
    status,
    joined_date,
    preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    NEW.email,
    'client',
    'active',
    NOW(),
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2) CRIAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3) MIGRAR USUÁRIOS EXISTENTES
INSERT INTO public.user_profiles (
    id,
    name,
    email,
    user_type,
    status,
    joined_date,
    preferences,
    created_at,
    updated_at
)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', 'Usuário Migrado'),
    au.email,
    'client',
    'active',
    au.created_at,
    '{}'::jsonb,
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4) CRIAR POLÍTICA ADMIN (com verificação manual)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Admin can view all profiles'
    ) THEN
        CREATE POLICY "Admin can view all profiles"
        ON public.user_profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND user_type = 'admin'
            )
        );
    END IF;
END $$;

-- MENSAGEM DE SUCESSO
SELECT 'SUPABASE CONFIGURADO COM SUCESSO!' as resultado;
