module V1
  class HealthController < ApplicationController
    def show
      render plain: '{"status":"ok"}', content_type: "application/json"
    end
  end
end
