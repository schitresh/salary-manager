FactoryBot.define do
  factory :department do
    sequence(:name) { |n| "Department #{n}" }
    association :location
  end
end
