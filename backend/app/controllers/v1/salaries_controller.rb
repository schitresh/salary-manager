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

    def analytics
      scope = current_salary_scope
      scope = apply_analytics_filters(scope)

      currencies = scope.distinct.pluck(:currency).compact
      if currencies.length > 1
        return render_error(
          "Multiple currencies found in the filtered salaries. Please filter to a single currency.",
          status: :unprocessable_content
        )
      end

      if currencies.empty?
        return render json: {
          analytics: {
            currency: nil,
            count: 0,
            total: format_money_value(0),
            average: nil,
            median: nil
          }
        }
      end

      amounts = scope.order(:total_amount).pluck(:total_amount).map(&:to_d)
      count = amounts.length
      total = amounts.sum
      average = count.positive? ? (total / count) : nil
      median = compute_median(amounts)

      render json: {
        analytics: {
          currency: currencies.first,
          count: count,
          total: format_money_value(total),
          average: average.nil? ? nil : format_money_value(average),
          median: median.nil? ? nil : format_money_value(median)
        }
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

    def current_salary_scope
      today = Date.current
      Salary.where("salaries.applicable_from <= ? AND (salaries.applicable_till IS NULL OR salaries.applicable_till >= ?)", today, today)
    end

    def apply_analytics_filters(scope)
      filters = params.fetch(:filter, {})
      scoped = scope.joins(department: :location)

      if filters[:department_id].present?
        scoped = scoped.where(salaries: { department_id: filters[:department_id].to_s.strip })
      end

      if filters[:location_id].present?
        scoped = scoped.where(locations: { id: filters[:location_id].to_s.strip })
      end

      if filters[:state_code].present?
        scoped = scoped.where(locations: { state_code: filters[:state_code].to_s.strip.upcase })
      end

      if filters[:city].present?
        scoped = scoped.where("LOWER(locations.city) LIKE ?", "%#{filters[:city].to_s.strip.downcase}%")
      end

      if filters[:job_title].present?
        scoped = scoped.where("LOWER(salaries.job_title) LIKE ?", "%#{filters[:job_title].to_s.strip.downcase}%")
      end

      scoped
    end

    def compute_median(sorted_amounts)
      return nil if sorted_amounts.empty?

      mid = sorted_amounts.length / 2
      if sorted_amounts.length.odd?
        sorted_amounts[mid]
      else
        (sorted_amounts[mid - 1] + sorted_amounts[mid]) / 2
      end
    end

    def format_money_value(value)
      format("%.2f", value.to_d)
    end
  end
end
