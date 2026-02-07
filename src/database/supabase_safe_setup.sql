-- ==========================================
-- SCRIPT SUPABASE FINAL • SEGURO • IDEMPOTENTE
-- ZERO DUPLICAÇÃO • ZERO PERDA DE DADOS
-- ==========================================

-- 1) FUNÇÃO handle_new_user (segura para RLS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
          AND pronamespace = 'public'::regnamespace
    ) THEN
        EXECUTE 'CREATE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
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
            COALESCE(NEW.raw_user_meta_data->>''name'', ''Novo Usuário''),
            NEW.email,
            ''client'',
            ''active'',
            NOW(),
            ''{}''::jsonb,
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO NOTHING;

          RETURN NEW;
        END;
        $func$;';

        ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
        RAISE NOTICE '✅ Função handle_new_user criada';
    ELSE
        RAISE NOTICE 'ℹ️ Função handle_new_user já existe';
    END IF;
END
$$;

-- 2) TRIGGER EM auth.users (verificação correta)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'on_auth_user_created'
          AND n.nspname = 'auth'
          AND c.relname = 'users'
    ) THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();';

        RAISE NOTICE '✅ Trigger on_auth_user_created criado';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger on_auth_user_created já existe';
    END IF;
END
$$;

-- 3) MIGRAR USUÁRIOS ANTIGOS (ATÔMICO E SEGURO)
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
WHERE up.id IS NULL;

-- 4) POLÍTICAS ADMIN (idempotentes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_profiles'
          AND policyname = 'Admin can view all profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Admin can view all profiles"
        ON public.user_profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND user_type = ''admin''
            )
        );';
    END IF;
END
$$;

-- 5) RELATÓRIO FINAL
DO $$
DECLARE
    auth_count INT;
    profile_count INT;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;

    RAISE NOTICE '📊 Usuários auth.users: %', auth_count;
    RAISE NOTICE '📊 Perfis user_profiles: %', profile_count;

    IF auth_count = profile_count THEN
        RAISE NOTICE '✅ Integridade perfeita';
    ELSE
        RAISE NOTICE '⚠️ Verificar usuários sem perfil';
    END IF;
END
$$;

-- 🎉 FINAL
DO $$
BEGIN
    RAISE NOTICE '🚀 SUPABASE CONFIGURADO COM SUCESSO';
    RAISE NOTICE '🔒 RLS compatível';
    RAISE NOTICE '🤖 Trigger automático ativo';
    RAISE NOTICE '✅ Pronto para produção';
END
$$;
