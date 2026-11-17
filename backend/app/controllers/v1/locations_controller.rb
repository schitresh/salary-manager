module V1
  class LocationsController < ApplicationController
    LOCATION_ATTRIBUTES = %i[id city state_code country_code created_at updated_at].freeze

    before_action :authenticate_user!
    before_action :set_location, only: [:show, :update]

    def index
      scope = Location.all
      scope = apply_query_filters(scope, exact_upcase: %i[country_code state_code], partial: %i[city])
      scope = scope.order(:country_code, :state_code, :city, :id)

      locations, meta = paginate(scope)
      render json: {
        locations: serialize_collection(locations, LOCATION_ATTRIBUTES),
        meta: meta
      }
    end

    def show
      render json: { location: serialize_record(@location, LOCATION_ATTRIBUTES) }
    end

    def create
      location = Location.new(location_params)

      if location.save
        render json: { location: serialize_record(location, LOCATION_ATTRIBUTES) }, status: :created
      else
        render_errors(location.errors, status: :unprocessable_content)
      end
    end

    def update
      if @location.update(location_params)
        render json: { location: serialize_record(@location, LOCATION_ATTRIBUTES) }
      else
        render_errors(@location.errors, status: :unprocessable_content)
      end
    end

    private

    def set_location
      @location = Location.find_by(id: params[:id])
      render_not_found("Location") unless @location
    end

    def location_params
      params.require(:location).permit(:city, :state_code, :country_code)
    end
  end
end
