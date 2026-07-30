-- =======================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS CONTROLE99
-- Execute este script no SQL Editor do seu projeto Supabase
-- =======================================================

-- 1. Cria a tabela de lançamentos diários (entries)
CREATE TABLE IF NOT EXISTS public.entries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    rides NUMERIC DEFAULT 0,
    tips NUMERIC DEFAULT 0,
    km NUMERIC DEFAULT 0,
    hours NUMERIC DEFAULT 0,
    fuel NUMERIC DEFAULT 0,
    food NUMERIC DEFAULT 0,
    others NUMERIC DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita a Segurança em Nível de Linha (Row Level Security - RLS)
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- 3. Cria política para garantir que cada usuário acesse e altere APENAS seus próprios dados
DROP POLICY IF EXISTS "Usuários gerenciam apenas seus próprios dados" ON public.entries;
CREATE POLICY "Usuários gerenciam apenas seus próprios dados"
    ON public.entries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Indice para buscas rápidas por data e usuário
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.entries (user_id, date DESC);
