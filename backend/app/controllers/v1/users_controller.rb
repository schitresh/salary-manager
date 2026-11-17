module V1
  class UsersController < ApplicationController
    USER_ATTRIBUTES = %i[id email created_at updated_at].freeze

    before_action :authenticate_user!

    def index
      users, meta = paginate(User.order(created_at: :desc))

      render json: {
        users: serialize_collection(users, USER_ATTRIBUTES),
        meta: meta
      }
    end

    def create
      email = user_params[:email]&.downcase
      user = User.new(email: email, password: SecureRandom.hex(16))

      # Allow creation without requiring the random password to be known; invite flow will set it.
      if user.save
        raw_token, hashed = Devise.token_generator.generate(User, :reset_password_token)
        user.update_columns(
          reset_password_token: hashed,
          reset_password_sent_at: Time.current
        )
        UserMailer.with(user: user, token: raw_token).invitation_instructions.deliver_now
        render json: { user: serialize_record(user, USER_ATTRIBUTES) }, status: :created
      else
        render_errors(user.errors, status: :unprocessable_content)
      end
    end

    private

    def user_params
      params.require(:user).permit(:email)
    end
  end
end
