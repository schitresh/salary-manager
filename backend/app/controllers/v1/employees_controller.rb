module V1
  class EmployeesController < ApplicationController
    EMPLOYEE_ATTRIBUTES = %i[
      id employee_code first_name last_name email phone
      date_of_birth date_of_joining last_working_day job_title
      department_id created_at updated_at
    ].freeze
    DEPARTMENT_ATTRIBUTES = %i[id name location_id].freeze
    LOCATION_ATTRIBUTES = %i[id city state_code country_code].freeze

    before_action :authenticate_user!
    before_action :set_employee, only: [:show, :update]

    def index
      scope = Employee.includes(department: :location).references(:departments)
      scope = apply_employee_filters(scope)
      scope = scope.order(:last_name, :first_name, :id)

      employees, meta = paginate(scope)
      render json: {
        employees: employees.map { |employee| employee_payload(employee) },
        meta: meta
      }
    end

    def show
      render json: { employee: employee_payload(@employee) }
    end

    def create
      employee = Employee.new(employee_params)

      if employee.save
        employee = Employee.includes(department: :location).find(employee.id)
        render json: { employee: employee_payload(employee) }, status: :created
      else
        render_errors(employee.errors, status: :unprocessable_content)
      end
    end

    def update
      if @employee.update(employee_params)
        @employee = Employee.includes(department: :location).find(@employee.id)
        render json: { employee: employee_payload(@employee) }
      else
        render_errors(@employee.errors, status: :unprocessable_content)
      end
    end

    private

    def set_employee
      @employee = Employee.includes(department: :location).find_by(id: params[:id])
      render_not_found("Employee") unless @employee
    end

    def employee_params
      params.require(:employee).permit(
        :employee_code, :first_name, :last_name, :email, :phone,
        :date_of_birth, :date_of_joining, :last_working_day, :job_title, :department_id
      )
    end

    def employee_payload(employee)
      serialize_record(employee, EMPLOYEE_ATTRIBUTES).merge(
        department: department_payload(employee.department)
      )
    end

    def department_payload(department)
      return nil unless department

      serialize_record(department, DEPARTMENT_ATTRIBUTES).merge(
        location: department.location ? serialize_record(department.location, LOCATION_ATTRIBUTES) : nil
      )
    end

    def apply_employee_filters(scope)
      filters = params.fetch(:filter, {})

      if filters[:location_id].present?
        scope = scope.where(departments: { location_id: filters[:location_id] })
      end

      scope = scope.where(department_id: filters[:department_id].to_s.strip) if filters[:department_id].present?

      %i[job_title employee_code first_name last_name email].each do |field|
        value = filters[field]
        next if value.blank?

        scope = scope.where("LOWER(employees.#{field}) LIKE ?", "%#{value.to_s.strip.downcase}%")
      end

      scope
    end
  end
end
