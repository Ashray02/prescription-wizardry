-- Add extracted_medications column to prescriptions table to store the list of medications as JSON
ALTER TABLE prescriptions ADD COLUMN extracted_medications jsonb;