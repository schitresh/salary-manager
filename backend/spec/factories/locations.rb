FactoryBot.define do
  factory :location do
    sequence(:city) { |n| "City#{n}" }
    state_code { 'MH' }
    country_code { 'IN' }
  end
end
