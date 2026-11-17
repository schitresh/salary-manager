module V1
  class HealthController < ApplicationController
    skip_before_action :authenticate_user_from_jwt!, only: [:show]

    def show
      render json: { status: "ok" }
    end
  end
end
