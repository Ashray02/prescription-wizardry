-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('none', 'low', 'moderate', 'high', 'severe');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  blood_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create medical_history table
CREATE TABLE public.medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  diagnosis_date date,
  status text NOT NULL DEFAULT 'ongoing',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medical history"
  ON public.medical_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical history"
  ON public.medical_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical history"
  ON public.medical_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical history"
  ON public.medical_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create allergies table
CREATE TABLE public.allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  severity text NOT NULL,
  reaction text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own allergies"
  ON public.allergies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allergies"
  ON public.allergies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allergies"
  ON public.allergies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allergies"
  ON public.allergies FOR DELETE
  USING (auth.uid() = user_id);

-- Create medications table
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text,
  prescription_date date NOT NULL,
  image_url text NOT NULL,
  extracted_text text,
  analyzed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescriptions"
  ON public.prescriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create drug_interactions table
CREATE TABLE public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_1 text NOT NULL,
  medication_2 text NOT NULL,
  risk_level risk_level NOT NULL,
  risk_percentage numeric NOT NULL,
  description text NOT NULL,
  severity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drug interactions"
  ON public.drug_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drug interactions"
  ON public.drug_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drug interactions"
  ON public.drug_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false);

-- Create storage policies for prescription images
CREATE POLICY "Users can view their own prescription images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own prescription images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own prescription images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at
  BEFORE UPDATE ON public.medical_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();