module V1
  class SalariesController < ApplicationController
    SALARY_ATTRIBUTES = %i[
      id employee_id department_id job_title currency
      base_amount hra_amount bonus_amount deduction_amount total_amount
      frequency applicable_from applicable_till created_at updated_at
    ].freeze
    EMPLOYEE_ATTRIBUTES = %i[id employee_code first_name last_name].freeze
    DEPARTMENT_ATTRIBUTES = %i[id name].freeze

    before_action :authenticate_user!
    before_action :set_salary, only: [:show, :update]

    def index
      scope = Salary.includes(:employee, :department)
      scope = apply_salary_filters(scope)
      scope = scope.order(applicable_from: :desc, id: :desc)

      salaries, meta = paginate(scope)
      render json: {
        salaries: salaries.map { |salary| salary_payload(salary) },
        meta: meta
      }
    end

    def show
      render json: { salary: salary_payload(@salary) }
    end

    def create
      salary = Salary.new(salary_params)

      if salary.save
        salary = Salary.includes(:employee, :department).find(salary.id)
        render json: { salary: salary_payload(salary) }, status: :created
      else
        render_errors(salary.errors, status: :unprocessable_content)
      end
    end

    def update
      if @salary.update(salary_params)
        @salary = Salary.includes(:employee, :department).find(@salary.id)
        render json: { salary: salary_payload(@salary) }
      else
        render_errors(@salary.errors, status: :unprocessable_content)
      end
    end

    private

    def set_salary
      @salary = Salary.includes(:employee, :department).find_by(id: params[:id])
      render_not_found("Salary") unless @salary
    end

    def salary_params
      params.require(:salary).permit(
        :employee_id, :department_id, :job_title, :currency,
        :base_amount, :hra_amount, :bonus_amount, :deduction_amount,
        :applicable_from, :applicable_till, :frequency
      )
    end

    def salary_payload(salary)
      serialize_record(salary, SALARY_ATTRIBUTES).merge(
        employee: salary.employee ? serialize_record(salary.employee, EMPLOYEE_ATTRIBUTES) : nil,
        department: salary.department ? serialize_record(salary.department, DEPARTMENT_ATTRIBUTES) : nil
      )
    end

    def apply_salary_filters(scope)
      filters = params.fetch(:filter, {})

      scope = scope.where(employee_id: filters[:employee_id].to_s.strip) if filters[:employee_id].present?
      scope = scope.where(department_id: filters[:department_id].to_s.strip) if filters[:department_id].present?

      if filters[:currency].present?
        scope = scope.where(currency: filters[:currency].to_s.strip.upcase)
      end

      if filters[:job_title].present?
        scope = scope.where("LOWER(salaries.job_title) LIKE ?", "%#{filters[:job_title].to_s.strip.downcase}%")
      end

      scope
    end
  end
end
