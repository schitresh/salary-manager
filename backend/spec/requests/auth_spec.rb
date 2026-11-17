require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  describe 'GET /v1/health' do
    it 'is publicly accessible' do
      get '/v1/health'
      expect(response).to have_http_status(:ok)
      expect(json_response).to include('status' => 'ok')
    end
  end

  describe 'POST /v1/auth/sign_in' do
    let!(:user) { create(:user, email: 'hr@official.com', password: 'Password123!') }

    it 'returns token and user for valid credentials' do
      post '/v1/auth/sign_in', params: { user: { email: 'hr@official.com', password: 'Password123!' } }, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_response['token']).to be_present
      expect(json_response.dig('user', 'email')).to eq('hr@official.com')
    end

    it 'rejects invalid credentials' do
      post '/v1/auth/sign_in', params: { user: { email: 'hr@official.com', password: 'wrong' } }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'protected endpoints' do
    it 'rejects unauthenticated access' do
      get '/v1/locations'
      expect(response).to have_http_status(:unauthorized)

      get '/v1/analytics'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
