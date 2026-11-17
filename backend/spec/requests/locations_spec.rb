require 'rails_helper'

RSpec.describe 'Locations API', type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe 'CRUD and filters' do
    it 'creates, shows, updates and lists locations with pagination/filters' do
      post '/v1/locations', params: { location: { city: 'Pune', state_code: 'MH', country_code: 'IN' } }, headers: headers, as: :json
      expect(response).to have_http_status(:created)
      location_id = json_response.dig('location', 'id')
      expect(json_response.dig('location', 'city')).to eq('Pune')

      get "/v1/locations/#{location_id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response.dig('location', 'id')).to eq(location_id)

      patch "/v1/locations/#{location_id}", params: { location: { city: 'Mumbai' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_response.dig('location', 'city')).to eq('Mumbai')

      create(:location, city: 'Nagpur', state_code: 'MH', country_code: 'IN')

      get '/v1/locations', params: { filter: { state_code: 'MH' }, page: { number: 1, size: 1 } }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response['locations'].length).to eq(1)
      expect(json_response.dig('meta', 'total')).to eq(2)
      expect(json_response.dig('meta', 'page', 'number')).to eq(1)
    end

    it 'returns validation errors for invalid/duplicate locations' do
      create(:location, city: 'Pune', state_code: 'MH', country_code: 'IN')
      post '/v1/locations', params: { location: { city: 'Pune', state_code: 'MH', country_code: 'IN' } }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['errors']).to be_present
    end
  end
end
