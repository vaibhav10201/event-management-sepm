-- Migration to fix missing columns in public.events table
-- Resolves Successive PGRST204 errors for description and duration

DO $$ 
BEGIN
    -- Add duration if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='duration') THEN
        ALTER TABLE public.events ADD COLUMN duration VARCHAR(100);
    END IF;

    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='description') THEN
        ALTER TABLE public.events ADD COLUMN description TEXT;
    END IF;

    -- Add special_requirements if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='special_requirements') THEN
        ALTER TABLE public.events ADD COLUMN special_requirements TEXT;
    END IF;

    -- Add complexity fields if missing (used for AI planning)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='complexity') THEN
        ALTER TABLE public.events ADD COLUMN complexity VARCHAR(30) DEFAULT 'Medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='complexity_reason') THEN
        ALTER TABLE public.events ADD COLUMN complexity_reason TEXT;
    END IF;

END $$;

-- Reload schema cache notification (PostgREST)
NOTIFY pgrst, 'reload schema';
