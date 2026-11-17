module V1
  class DepartmentsController < ApplicationController
    DEPARTMENT_ATTRIBUTES = %i[id name location_id head_employee_id created_at updated_at].freeze
    LOCATION_ATTRIBUTES = %i[id city state_code country_code].freeze

    before_action :authenticate_user!
    before_action :set_department, only: [:show, :update]

    def index
      scope = Department.includes(:location)
      scope = apply_query_filters(scope, exact: %i[location_id], partial: %i[name])
      scope = scope.order(:name, :id)

      departments, meta = paginate(scope)
      render json: {
        departments: departments.map { |department| department_payload(department) },
        meta: meta
      }
    end

    def show
      render json: { department: department_payload(@department) }
    end

    def create
      department = Department.new(department_params)

      if department.save
        department = Department.includes(:location).find(department.id)
        render json: { department: department_payload(department) }, status: :created
      else
        render_errors(department.errors, status: :unprocessable_content)
      end
    end

    def update
      if @department.update(department_params)
        @department = Department.includes(:location).find(@department.id)
        render json: { department: department_payload(@department) }
      else
        render_errors(@department.errors, status: :unprocessable_content)
      end
    end

    private

    def set_department
      @department = Department.includes(:location).find_by(id: params[:id])
      render_not_found("Department") unless @department
    end

    def department_params
      params.require(:department).permit(:name, :location_id, :head_employee_id)
    end

    def department_payload(department)
      serialize_record(department, DEPARTMENT_ATTRIBUTES).merge(
        location: department.location ? serialize_record(department.location, LOCATION_ATTRIBUTES) : nil
      )
    end
  end
end
