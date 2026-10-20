-- ============================================================================
-- HOSPITALITY AND EVENT MANAGEMENT SYSTEM (HEMS)
-- Supabase PostgreSQL Relational Schema with Row Level Security (RLS)
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS Profile Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    role VARCHAR(40) NOT NULL DEFAULT 'Event Manager',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own profile"
    ON public.users FOR ALL
    USING (auth.uid() = id);

-- Trigger to automatically create public.users profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'Event Manager')
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. EVENTS Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    event_date DATE NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget > 0),
    location VARCHAR(255),
    duration VARCHAR(100),
    description TEXT,
    special_requirements TEXT,
    expected_audience TEXT,
    food_requirements TEXT,
    decoration_requirements TEXT,
    entertainment_requirements TEXT,
    transportation_requirements TEXT,
    other_notes TEXT,
    complexity VARCHAR(30) DEFAULT 'Medium',
    complexity_reason TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'Planning', -- Draft, Planning, Confirmed, Completed, Cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own events"
    ON public.events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);


-- 3. EVENT REQUIREMENTS Table
CREATE TABLE IF NOT EXISTS public.event_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL,
    item VARCHAR(180) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit VARCHAR(40) DEFAULT 'units',
    estimated_unit_cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (estimated_unit_cost >= 0),
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_cost >= 0),
    priority VARCHAR(30) NOT NULL DEFAULT 'Medium', -- High, Medium, Low
    status VARCHAR(40) NOT NULL DEFAULT 'Pending',   -- Pending, Approved, Sourced, Fulfilled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access requirements of their events"
    ON public.event_requirements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.event_requirements.event_id
            AND public.events.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.event_requirements.event_id
            AND public.events.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_requirements_event ON public.event_requirements(event_id);


-- 4. TASKS Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(80),
    priority VARCHAR(30) DEFAULT 'Medium',
    estimated_duration INTEGER DEFAULT 1,
    duration_unit VARCHAR(30) DEFAULT 'days',
    suggested_start_date DATE,
    suggested_due_date DATE,
    due_date DATE NOT NULL,
    dependency VARCHAR(255),
    assigned_role VARCHAR(120),
    assigned_to VARCHAR(120),
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(40) NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Completed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access tasks of their events"
    ON public.tasks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.tasks.event_id
            AND public.events.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.tasks.event_id
            AND public.events.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_tasks_event ON public.tasks(event_id);


-- 5. SUPPLIERS Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    location VARCHAR(180) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.5 CHECK (rating >= 1.0 AND rating <= 5.0),
    status VARCHAR(40) NOT NULL DEFAULT 'Active', -- Preferred, Active, Inactive
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public suppliers or manage their own"
    ON public.suppliers FOR ALL
    USING (user_id IS NULL OR user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- 6. SUPPLIER SERVICES Table
CREATE TABLE IF NOT EXISTS public.supplier_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    service_name VARCHAR(180) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    availability VARCHAR(40) NOT NULL DEFAULT 'Available'
);

ALTER TABLE public.supplier_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access services of accessible suppliers"
    ON public.supplier_services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.suppliers
            WHERE public.suppliers.id = public.supplier_services.supplier_id
            AND (public.suppliers.user_id IS NULL OR public.suppliers.user_id = auth.uid())
        )
    );


-- 7. EVENT SUPPLIERS (Associative Bridge Entity)
CREATE TABLE IF NOT EXISTS public.event_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.supplier_services(id) ON DELETE SET NULL,
    agreed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (agreed_price >= 0),
    status VARCHAR(40) NOT NULL DEFAULT 'Confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supplier links of their events"
    ON public.event_suppliers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.event_suppliers.event_id
            AND public.events.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.event_suppliers.event_id
            AND public.events.user_id = auth.uid()
        )
    );


-- 8. EXPENSES Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access expenses of their events"
    ON public.expenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.expenses.event_id
            AND public.events.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.expenses.event_id
            AND public.events.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_expenses_event ON public.expenses(event_id);
