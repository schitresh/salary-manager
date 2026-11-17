require 'rails_helper'

RSpec.describe 'Employees API', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:location) { create(:location) }
  let(:department) { create(:department, location: location) }

  it 'creates, shows, updates and lists employees with filters' do
    travel_to Date.new(2026, 1, 1) do
      payload = {
        employee: {
          employee_code: 'E100',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@official.com',
          phone: '9999999999',
          date_of_birth: '2000-01-01',
          date_of_joining: '2024-01-01',
          last_working_day: nil,
          job_title: 'Engineer',
          department_id: department.id
        }
      }

      post '/v1/employees', params: payload, headers: headers, as: :json
      expect(response).to have_http_status(:created)
      emp_id = json_response.dig('employee', 'id')
      expect(json_response.dig('employee', 'department', 'location', 'id')).to eq(location.id)

      get "/v1/employees/#{emp_id}", headers: headers
      expect(response).to have_http_status(:ok)

      patch "/v1/employees/#{emp_id}", params: { employee: { job_title: 'Senior Engineer' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_response.dig('employee', 'job_title')).to eq('Senior Engineer')

      get '/v1/employees', params: { filter: { department_id: department.id, job_title: 'Senior' } }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response['employees'].length).to eq(1)
      expect(json_response.dig('meta', 'total')).to eq(1)
    end
  end

  it 'returns 422 for invalid employee (underage/duplicate/date rule)' do
    travel_to Date.new(2026, 1, 1) do
      create(:employee, employee_code: 'E1', email: 'e1@official.com', phone: '1111111111', department: department)
      post '/v1/employees', params: {
        employee: {
          employee_code: 'E1', first_name: 'A', last_name: 'B', email: 'e1@official.com', phone: '1111111111',
          date_of_birth: '2015-01-01', date_of_joining: '2025-01-01', job_title: 'Dev', department_id: department.id
        }
      }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['errors']).to be_present
    end
  end
end
