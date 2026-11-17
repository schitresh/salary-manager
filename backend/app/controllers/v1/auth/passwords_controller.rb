module V1
  module Auth
    class PasswordsController < ApplicationController
      respond_to :json

      skip_before_action :authenticate_user_from_jwt!, only: [:create, :update]

      # Request password reset
      def create
        email = password_request_params[:email]&.downcase
        user = User.find_by(email: email)
        if user
          raw_token, hashed = Devise.token_generator.generate(User, :reset_password_token)
          user.update_columns(reset_password_token: hashed, reset_password_sent_at: Time.current)
          UserMailer.with(user: user, token: raw_token).reset_password_instructions.deliver_now
        end
        # Generic response to avoid user enumeration
        render_message("If the email exists, password reset instructions have been sent.")
      end

      # Set new password via reset token
      def update
        user = User.reset_password_by_token(reset_password_params)
        if user.errors.empty?
          render_message("Password has been reset successfully.")
        else
          render_errors(user.errors, status: :unprocessable_content)
        end
      end

      private

      def password_request_params
        params.require(:user).permit(:email)
      end

      def reset_password_params
        params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
      end
    end
  end
end
