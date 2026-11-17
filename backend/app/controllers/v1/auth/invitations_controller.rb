module V1
  module Auth
    class InvitationsController < ApplicationController
      respond_to :json

      skip_before_action :authenticate_user_from_jwt!, only: [:update]

      # Accept invite / set initial password
      def update
        token = invitation_params[:invitation_token]
        user = User.with_reset_password_token(token)

        unless user&.reset_password_period_valid?
          return render_error("Invitation token is invalid or has expired", status: :unprocessable_content)
        end

        if user.reset_password(invitation_params[:password], invitation_params[:password_confirmation])
          render_message("Password set successfully. You can now sign in.")
        else
          render_errors(user.errors, status: :unprocessable_content)
        end
      end

      private

      def invitation_params
        params.require(:user).permit(:invitation_token, :password, :password_confirmation)
      end
    end
  end
end
