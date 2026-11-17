require 'rails_helper'

RSpec.describe 'Salaries API', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:location) { create(:location) }
  let(:department) { create(:department, location: location) }
  let(:employee) { create(:employee, department: department, date_of_joining: Date.new(2024, 1, 1), job_title: 'Engineer') }

  describe 'create/update and rules' do
    it 'creates salary with server-derived total and auto-closes previous open salary' do
      post '/v1/salaries', params: {
        salary: {
          employee_id: employee.id, department_id: department.id, job_title: 'Engineer', currency: 'INR',
          base_amount: 10000, hra_amount: 2000, bonus_amount: 500, deduction_amount: 300,
          applicable_from: '2024-01-01', applicable_till: nil, frequency: 'month'
        }
      }, headers: headers, as: :json
      expect(response).to have_http_status(:created)
      first_id = json_response.dig('salary', 'id')
      expect(json_response.dig('salary', 'total_amount').to_f).to eq(12200.0)
      expect(json_response.dig('salary', 'applicable_till')).to be_nil

      post '/v1/salaries', params: {
        salary: {
          employee_id: employee.id, department_id: department.id, job_title: 'Senior Engineer', currency: 'INR',
          base_amount: 15000, hra_amount: 2500, bonus_amount: 0, deduction_amount: 0,
          applicable_from: '2024-07-01', applicable_till: nil, frequency: 'month'
        }
      }, headers: headers, as: :json
      expect(response).to have_http_status(:created)

      get "/v1/salaries/#{first_id}", headers: headers
      expect(json_response.dig('salary', 'applicable_till')).to eq('2024-06-30')
    end

    it 'rejects overlapping/invalid salary' do
      create(:salary, employee: employee, department: department,
             applicable_from: Date.new(2024, 1, 1), applicable_till: Date.new(2024, 6, 30), currency: 'INR')
      post '/v1/salaries', params: {
        salary: {
          employee_id: employee.id, department_id: department.id, job_title: 'Engineer', currency: 'INR',
          base_amount: 10000, hra_amount: 0, bonus_amount: 0, deduction_amount: 0,
          applicable_from: '2024-06-01', applicable_till: '2024-12-31', frequency: 'month'
        }
      }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['errors']).to be_present
    end

    it 'lists salaries with pagination and filters' do
      create(:salary, employee: employee, department: department, applicable_from: Date.new(2024, 1, 1), applicable_till: Date.new(2024, 6, 30), currency: 'INR')
      create(:salary, employee: employee, department: department, applicable_from: Date.new(2024, 7, 1), applicable_till: nil, currency: 'INR', base_amount: 12000)

      get '/v1/salaries', params: { filter: { employee_id: employee.id }, page: { number: 1, size: 1 } }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response['salaries'].length).to eq(1)
      expect(json_response.dig('meta', 'total')).to eq(2)
      # recent first
      expect(json_response['salaries'].first['applicable_from']).to eq('2024-07-01')
    end
  end
end
