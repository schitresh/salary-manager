module V1
  class LocationsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_location, only: [:show, :update]

    def index
      scope = Location.all
      scope = apply_filters(scope)
      scope = scope.order(:country_code, :state_code, :city, :id)

      locations, meta = paginate(scope)
      render json: {
        locations: locations.map { |location| location_payload(location) },
        meta: meta
      }
    end

    def show
      render json: { location: location_payload(@location) }
    end

    def create
      location = Location.new(location_params)

      if location.save
        render json: { location: location_payload(location) }, status: :created
      else
        render_errors(location.errors, status: :unprocessable_content)
      end
    end

    def update
      if @location.update(location_params)
        render json: { location: location_payload(@location) }
      else
        render_errors(@location.errors, status: :unprocessable_content)
      end
    end

    private

    def set_location
      @location = Location.find_by(id: params[:id])
      return if @location

      render_error("Location not found", status: :not_found)
    end

    def location_params
      params.require(:location).permit(:city, :state_code, :country_code)
    end

    def location_payload(location)
      {
        id: location.id,
        city: location.city,
        state_code: location.state_code,
        country_code: location.country_code,
        created_at: location.created_at,
        updated_at: location.updated_at
      }
    end

    def apply_filters(scope)
      filters = params.fetch(:filter, {})
      if filters[:country_code].present?
        scope = scope.where(country_code: filters[:country_code].to_s.strip.upcase)
      end
      if filters[:state_code].present?
        scope = scope.where(state_code: filters[:state_code].to_s.strip.upcase)
      end
      if filters[:city].present?
        scope = scope.where("LOWER(city) LIKE ?", "%#{filters[:city].to_s.strip.downcase}%")
      end
      scope
    end
  end
end
