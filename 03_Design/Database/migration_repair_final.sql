-- ============================================================================
-- HEMS DATABASE REPAIR MIGRATION (FINAL)
-- Ensures all tables and columns match the application requirements.
-- ============================================================================

-- 1. Repair EVENTS table
DO $$ 
BEGIN
    -- Core fields verification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='duration') THEN
        ALTER TABLE public.events ADD COLUMN duration TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='description') THEN
        ALTER TABLE public.events ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='location') THEN
        ALTER TABLE public.events ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='special_requirements') THEN
        ALTER TABLE public.events ADD COLUMN special_requirements TEXT;
    END IF;

    -- Ensure correct types for guest_count and budget if they exist
    ALTER TABLE public.events ALTER COLUMN guest_count TYPE INTEGER USING (guest_count::INTEGER);
    ALTER TABLE public.events ALTER COLUMN budget TYPE NUMERIC USING (budget::NUMERIC);
END $$;


-- 2. Create TASKS table if missing or fix columns
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create EVENT_REQUIREMENTS table if missing or fix columns
CREATE TABLE IF NOT EXISTS public.event_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(40) DEFAULT 'units',
    estimated_unit_cost NUMERIC DEFAULT 0,
    estimated_cost NUMERIC DEFAULT 0,
    priority VARCHAR(30) DEFAULT 'Medium',
    status VARCHAR(40) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration to add columns if they were missing in an existing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_requirements' AND column_name='unit') THEN
        ALTER TABLE public.event_requirements ADD COLUMN unit VARCHAR(40) DEFAULT 'units';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_requirements' AND column_name='estimated_unit_cost') THEN
        ALTER TABLE public.event_requirements ADD COLUMN estimated_unit_cost NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_requirements' AND column_name='priority') THEN
        ALTER TABLE public.event_requirements ADD COLUMN priority VARCHAR(30) DEFAULT 'Medium';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_requirements' AND column_name='status') THEN
        ALTER TABLE public.event_requirements ADD COLUMN status VARCHAR(40) DEFAULT 'Pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_requirements' AND column_name='notes') THEN
        ALTER TABLE public.event_requirements ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 4. Create EXPENSES table (Crucial for Budget feature)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    date_incurred DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create SUPPLIERS and ASSOCIATIONS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    rating NUMERIC(2, 1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    service_id UUID, -- Optional link to a specific service
    agreed_price NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can manage their own events" ON public.events;
CREATE POLICY "Users can manage their own events" ON public.events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage tasks for their events" ON public.tasks;
CREATE POLICY "Users can manage tasks for their events" ON public.tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage requirements for their events" ON public.event_requirements;
CREATE POLICY "Users can manage requirements for their events" ON public.event_requirements FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage expenses for their events" ON public.expenses;
CREATE POLICY "Users can manage expenses for their events" ON public.expenses FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
