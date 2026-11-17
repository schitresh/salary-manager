require 'rails_helper'

RSpec.describe 'Departments API', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:location) { create(:location, city: 'Pune', state_code: 'MH', country_code: 'IN') }

  it 'creates, shows, updates and lists departments with filters' do
    post '/v1/departments', params: { department: { name: 'Engineering', location_id: location.id } }, headers: headers, as: :json
    expect(response).to have_http_status(:created)
    dept_id = json_response.dig('department', 'id')
    expect(json_response.dig('department', 'location', 'id')).to eq(location.id)

    get "/v1/departments/#{dept_id}", headers: headers
    expect(response).to have_http_status(:ok)

    patch "/v1/departments/#{dept_id}", params: { department: { name: 'Engineering 2' } }, headers: headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(json_response.dig('department', 'name')).to eq('Engineering 2')

    create(:department, name: 'HR', location: location)
    get '/v1/departments', params: { filter: { name: 'Eng' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(json_response['departments'].length).to eq(1)
    expect(json_response.dig('meta', 'total')).to eq(1)
  end

  it 'returns 422 for duplicate department in same location' do
    create(:department, name: 'Engineering', location: location)
    post '/v1/departments', params: { department: { name: 'Engineering', location_id: location.id } }, headers: headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end
end
