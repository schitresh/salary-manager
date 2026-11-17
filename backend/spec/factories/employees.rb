FactoryBot.define do
  factory :employee do
    association :department
    sequence(:employee_code) { |n| "EMP#{n}" }
    first_name { 'John' }
    last_name { 'Doe' }
    sequence(:email) { |n| "employee#{n}@official.com" }
    sequence(:phone) { |n| "900000#{n.to_s.rjust(4, '0')}" }
    date_of_birth { 25.years.ago.to_date }
    date_of_joining { 2.years.ago.to_date }
    last_working_day { nil }
    job_title { 'Engineer' }
  end
end
