-- Create merchant_profiles table
CREATE TABLE IF NOT EXISTS merchant_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_name TEXT NOT NULL,
    restaurant_description TEXT,
    currency TEXT DEFAULT 'INR',
    payment_gateway_configured BOOLEAN DEFAULT false,
    payment_gateway_account_id TEXT,
    static_menu_url TEXT,
    public_merchant_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_user_id ON merchant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_public_id ON merchant_profiles(public_merchant_id);

-- Enable RLS
ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON merchant_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON merchant_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON merchant_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to generate public merchant ID
CREATE OR REPLACE FUNCTION generate_public_merchant_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_merchant_id IS NULL THEN
        NEW.public_merchant_id := 'M' || substr(md5(random()::text), 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate public merchant ID
CREATE TRIGGER set_public_merchant_id
    BEFORE INSERT ON merchant_profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_public_merchant_id(); 