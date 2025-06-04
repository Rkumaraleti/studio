-- Merchant Profiles Table
CREATE TABLE IF NOT EXISTS merchant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_name TEXT NOT NULL,
    public_merchant_id TEXT UNIQUE NOT NULL,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_profiles_user_id ON merchant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_public_id ON merchant_profiles(public_merchant_id);

ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON merchant_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON merchant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON merchant_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    price_currency TEXT DEFAULT 'INR',
    category TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_merchant_id ON menu_items(merchant_id);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their menu"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM merchant_profiles
      WHERE merchant_profiles.id = menu_items.merchant_id
      AND merchant_profiles.user_id = auth.uid()
    )
  );

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    public_merchant_id TEXT NOT NULL,
    display_order_id TEXT UNIQUE,
    customer_uid UUID,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_public_merchant_id ON orders(public_merchant_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchant_profiles
      WHERE merchant_profiles.public_merchant_id = orders.public_merchant_id
      AND merchant_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Merchants can update their orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM merchant_profiles
      WHERE merchant_profiles.public_merchant_id = orders.public_merchant_id
      AND merchant_profiles.user_id = auth.uid()
    )
  ); 