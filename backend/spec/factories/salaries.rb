FactoryBot.define do
  factory :salary do
    association :employee
    association :department
    applicable_from { employee.date_of_joining }
    applicable_till { nil }
    job_title { employee.job_title }
    currency { 'INR' }
    base_amount { 10000.00 }
    hra_amount { 2000.00 }
    bonus_amount { 500.00 }
    deduction_amount { 300.00 }
    frequency { 'month' }

    after(:build) do |salary|
      salary.department ||= salary.employee&.department
      salary.job_title ||= salary.employee&.job_title
    end
  end
end
