# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

hr_email = "hr@official.com"
hr_password = if Rails.env.development?
  ENV.fetch("SEED_HR_PASSWORD", "Password123!")
else
  ENV.fetch("SEED_HR_PASSWORD")
end

user = User.find_or_initialize_by(email: hr_email)
if user.new_record?
  user.password = hr_password
  user.password_confirmation = hr_password
  user.save!
  puts "Seeded HR user: #{hr_email}"
else
  puts "HR user already exists: #{hr_email}"
end

