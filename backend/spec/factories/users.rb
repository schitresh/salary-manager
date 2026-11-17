FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "hr#{n}@official.com" }
    password { 'Password123!' }
    password_confirmation { 'Password123!' }
    jti { SecureRandom.uuid }
  end
end
