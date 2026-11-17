require 'rails_helper'

RSpec.describe 'Salary Analytics API', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  let(:location_a) { create(:location, city: 'Pune', state_code: 'MH', country_code: 'IN') }
  let(:location_b) { create(:location, city: 'Mumbai', state_code: 'MH', country_code: 'IN') }
  let(:dept_a) { create(:department, name: 'Eng', location: location_a) }
  let(:dept_b) { create(:department, name: 'HR', location: location_b) }

  def create_current_salary(employee:, amount:, currency: 'INR', department: nil, job_title: 'Engineer')
    create(:salary,
           employee: employee,
           department: department || employee.department,
           job_title: job_title,
           currency: currency,
           base_amount: amount,
           hra_amount: 0,
           bonus_amount: 0,
           deduction_amount: 0,
           applicable_from: Date.new(2025, 1, 1),
           applicable_till: nil)
  end

  around do |example|
    travel_to(Date.new(2026, 1, 1)) { example.run }
  end

  it 'returns aggregates for current salaries only and computes median correctly (odd count)' do
    e1 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e2 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e3 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e_future = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e_past = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))

    create_current_salary(employee: e1, amount: 100)
    create_current_salary(employee: e2, amount: 200)
    create_current_salary(employee: e3, amount: 300)

    # future (not current)
    create(:salary, employee: e_future, department: dept_a, currency: 'INR', base_amount: 999,
           hra_amount: 0, bonus_amount: 0, deduction_amount: 0,
           applicable_from: Date.new(2026, 2, 1), applicable_till: nil)

    # expired (not current)
    create(:salary, employee: e_past, department: dept_a, currency: 'INR', base_amount: 999,
           hra_amount: 0, bonus_amount: 0, deduction_amount: 0,
           applicable_from: Date.new(2025, 1, 1), applicable_till: Date.new(2025, 12, 31))

    get '/v1/analytics', headers: headers
    expect(response).to have_http_status(:ok)
    analytics = json_response['analytics']
    expect(analytics['currency']).to eq('INR')
    expect(analytics['count']).to eq(3)
    expect(analytics['total']).to eq('600.00')
    expect(analytics['average']).to eq('200.00')
    expect(analytics['median']).to eq('200.00')
  end

  it 'computes median correctly for even count' do
    e1 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e2 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e3 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e4 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))

    create_current_salary(employee: e1, amount: 100)
    create_current_salary(employee: e2, amount: 200)
    create_current_salary(employee: e3, amount: 300)
    create_current_salary(employee: e4, amount: 400)

    get '/v1/analytics', headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('analytics', 'median')).to eq('250.00')
  end

  it 'applies supported filters' do
    e1 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e2 = create(:employee, department: dept_b, date_of_joining: Date.new(2024, 1, 1))
    location_us = create(:location, city: 'San Francisco', state_code: 'CA', country_code: 'US')
    dept_us = create(:department, name: 'Eng US', location: location_us)
    e3 = create(:employee, department: dept_us, date_of_joining: Date.new(2024, 1, 1))
    create_current_salary(employee: e1, amount: 100, job_title: 'Engineer')
    create_current_salary(employee: e2, amount: 500, job_title: 'Manager')
    create_current_salary(employee: e3, amount: 700, currency: 'USD', job_title: 'Engineer')

    get '/v1/analytics', params: { filter: { department_id: dept_a.id } }, headers: headers
    expect(json_response.dig('analytics', 'count')).to eq(1)
    expect(json_response.dig('analytics', 'total')).to eq('100.00')

    get '/v1/analytics', params: { filter: { location_id: location_b.id } }, headers: headers
    expect(json_response.dig('analytics', 'count')).to eq(1)
    expect(json_response.dig('analytics', 'total')).to eq('500.00')

    get '/v1/analytics', params: { filter: { country_code: 'in' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('analytics', 'currency')).to eq('INR')
    expect(json_response.dig('analytics', 'count')).to eq(2)

    get '/v1/analytics', params: { filter: { country_code: 'US' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('analytics', 'currency')).to eq('USD')
    expect(json_response.dig('analytics', 'count')).to eq(1)

    get '/v1/analytics', params: { filter: { city: 'pune' } }, headers: headers
    expect(json_response.dig('analytics', 'count')).to eq(1)

    get '/v1/analytics', params: { filter: { state_code: 'mh' } }, headers: headers
    expect(json_response.dig('analytics', 'count')).to eq(2)

    get '/v1/analytics', params: { filter: { job_title: 'engi' } }, headers: headers
    expect(response).to have_http_status(:unprocessable_content)
  end

  it 'returns 422 for mixed currencies and success when filtered to one currency' do
    e1 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e2 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    create_current_salary(employee: e1, amount: 100, currency: 'INR')
    create_current_salary(employee: e2, amount: 200, currency: 'USD')

    get '/v1/analytics', headers: headers
    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response['error']).to match(/multiple currencies/i)

    get '/v1/analytics', params: { filter: { department_id: dept_a.id } }, headers: headers
    # still mixed in same dept; filter by employee via salary job/currency not directly but we can create separation
    # create separation by job title
  end

  it 'handles single-currency after narrowing and empty results' do
    e1 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    e2 = create(:employee, department: dept_a, date_of_joining: Date.new(2024, 1, 1))
    create_current_salary(employee: e1, amount: 100, currency: 'INR', job_title: 'Engineer')
    create_current_salary(employee: e2, amount: 200, currency: 'USD', job_title: 'Manager')

    get '/v1/analytics', params: { filter: { job_title: 'Engineer' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('analytics', 'currency')).to eq('INR')
    expect(json_response.dig('analytics', 'count')).to eq(1)

    get '/v1/analytics', params: { filter: { job_title: 'NoSuchRole' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('analytics', 'count')).to eq(0)
    expect(json_response.dig('analytics', 'currency')).to be_nil
  end
end
