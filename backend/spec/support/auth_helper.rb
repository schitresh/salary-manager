module AuthHelper
  def auth_headers_for(user, password: 'Password123!')
    token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    { 'Authorization' => "Bearer #{token}" }
  end

  def json_response
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
