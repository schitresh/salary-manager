module V1
  module Auth
    class SessionsController < ApplicationController
      respond_to :json

      skip_before_action :authenticate_user_from_jwt!, only: [:create]

      def create
        user = User.find_for_database_authentication(email: sign_in_params[:email]&.downcase)
        unless user&.valid_password?(sign_in_params[:password])
          return render_error("Invalid email or password", status: :unauthorized)
        end

        sign_in(:user, user, store: false)
        token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
        request.env["warden-jwt_auth.token"] = token
        response.set_header("Authorization", "Bearer #{token}")
        render json: {
          user: { id: user.id, email: user.email },
          token: token
        }, status: :ok
      end

      def destroy
        return render_error("Unauthorized", status: :unauthorized) unless current_user

        # Revoke current token by rotating JTI (JTIMatcher strategy)
        current_user.update!(jti: SecureRandom.uuid)
        sign_out(:user)
        head :no_content
      end

      private

      def sign_in_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
