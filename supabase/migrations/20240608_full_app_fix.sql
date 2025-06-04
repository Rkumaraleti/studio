-- Add static_menu_url column if not exists
ALTER TABLE merchant_profiles ADD COLUMN IF NOT EXISTS static_menu_url TEXT;

-- Enable RLS for merchant_profiles
ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;

-- Merchant RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON merchant_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON merchant_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON merchant_profiles;
CREATE POLICY "Users can view their own profile"
  ON merchant_profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON merchant_profiles FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON merchant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Public RLS
DROP POLICY IF EXISTS "Public can view merchant profiles" ON merchant_profiles;
CREATE POLICY "Public can view merchant profiles"
  ON merchant_profiles FOR SELECT
  USING (true);

-- Enable RLS for menu_items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Merchants can manage their menu" ON menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON menu_items;
CREATE POLICY "Merchants can manage their menu"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM merchant_profiles
      WHERE merchant_profiles.id = menu_items.merchant_id
      AND merchant_profiles.user_id = auth.uid()
    )
  );
CREATE POLICY "Public can view menu items"
  ON menu_items FOR SELECT
  USING (true);

-- Orders: allow public insert (optionally restrict as needed)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create order" ON orders;
CREATE POLICY "Anyone can create order"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_uid);

-- Allow users to receive updates for their own orders (for realtime)
DROP POLICY IF EXISTS "Users can receive updates for their own orders" ON orders;
CREATE POLICY "Users can receive updates for their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = customer_uid); 